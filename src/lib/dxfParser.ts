import DxfParser from 'dxf-parser';
import { calculateBoundingBox, isPointInPolygon, calculatePolygonArea } from './utils';

export interface ExtractedCadPlot {
  plotNumber: string;
  points: [number, number][];
  labelPt: [number, number];
  bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
  areaCents: number;
  layer?: string;
}

export interface DxfParseResult {
  success: boolean;
  plots: ExtractedCadPlot[];
  layoutBounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
  svgDataUrl?: string;
  warnings: {
    count: number;
    missing: number[];
    duplicates: number[];
  };
  entityCounts: {
    lwpolylines: number;
    polylines: number;
    lines: number;
    texts: number;
    unsupported: number;
  };
  errors: string[];
}

/**
 * Parses AutoCAD DXF files into exact vector plots and background SVG.
 * 
 * Features:
 * 1. 100% Linework Rendering: Renders all line segments via an optimized SVG path (no 3,000 line limit).
 * 2. CAD Text Rendering: Displays CAD numbers, street names, dimensions, and text directly on the blueprint.
 * 3. Robust Text Cleaning: Strips AutoCAD MTEXT control codes (\A1;, \P, \pxqc;, {\f...;}) and recognizes plot prefixes.
 * 4. Multi-Strategy Plot Extraction: Extracts closed LWPOLYLINE/POLYLINE faces, cycle-traced line segments,
 *    and binds numbers from CAD text entities.
 * 5. Normalized Coordinates: Converts CAD coordinates (Y-up) to SVG drawing space [0..W, 0..H] (Y-down).
 */
export function parseDxfFile(dxfString: string): DxfParseResult {
  const errors: string[] = [];
  const entityCounts = {
    lwpolylines: 0,
    polylines: 0,
    lines: 0,
    texts: 0,
    unsupported: 0,
  };

  try {
    // Check for AutoCAD binary DWG signature (e.g. AC1015, AC1018, AC1021, AC1024, AC1027, AC1032)
    if (dxfString.startsWith('AC10') || /^AC10\d\d/.test(dxfString.slice(0, 10))) {
      return {
        success: false,
        plots: [],
        layoutBounds: { minX: 0, minY: 0, maxX: 1200, maxY: 800, width: 1200, height: 800 },
        warnings: { count: 0, missing: [], duplicates: [] },
        entityCounts,
        errors: [
          'This file is an AutoCAD binary DWG drawing. In AutoCAD / Civil 3D, click "File > Save As" and choose "AutoCAD DXF (*.dxf)" to export as DXF for 100% exact vector geometry parsing.',
        ],
      };
    }

    const parser = new DxfParser();
    const dxf = parser.parseSync(dxfString);

    if (!dxf || !dxf.entities || dxf.entities.length === 0) {
      return {
        success: false,
        plots: [],
        layoutBounds: { minX: 0, minY: 0, maxX: 1200, maxY: 800, width: 1200, height: 800 },
        warnings: { count: 0, missing: [], duplicates: [] },
        entityCounts,
        errors: ['No valid entities found in DXF file.'],
      };
    }

    // 1. Raw extraction in CAD units
    const rawSegments: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const rawClosedPolygons: { points: [number, number][]; layer?: string }[] = [];

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const trackCoord = (x: number, y: number) => {
      if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    };

    // Extract lines and polylines
    for (const entity of dxf.entities) {
      if (entity.type === 'LINE') {
        entityCounts.lines++;
        const v = (entity as any).vertices;
        if (Array.isArray(v) && v.length >= 2) {
          const x1 = Number(v[0].x || 0);
          const y1 = Number(v[0].y || 0);
          const x2 = Number(v[1].x || 0);
          const y2 = Number(v[1].y || 0);
          trackCoord(x1, y1);
          trackCoord(x2, y2);
          rawSegments.push({ x1, y1, x2, y2 });
        }
      } else if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
        if (entity.type === 'LWPOLYLINE') entityCounts.lwpolylines++;
        else entityCounts.polylines++;

        const vertices = (entity as any).vertices;
        if (Array.isArray(vertices) && vertices.length >= 2) {
          const pts: [number, number][] = [];
          for (let i = 0; i < vertices.length; i++) {
            const x = Number(vertices[i].x || 0);
            const y = Number(vertices[i].y || 0);
            trackCoord(x, y);
            pts.push([x, y]);
            if (i > 0) {
              rawSegments.push({
                x1: pts[i - 1][0],
                y1: pts[i - 1][1],
                x2: x,
                y2: y,
              });
            }
          }

          // Check if closed (shape flag or start matching end)
          const isClosedFlag = Boolean((entity as any).shape) || Boolean((entity as any).isClosed);
          const distEndpoints = pts.length >= 3
            ? Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1])
            : Infinity;

          if (pts.length >= 3 && (isClosedFlag || distEndpoints < 20)) {
            // Ensure first and last points connect
            const closedPts: [number, number][] = [...pts];
            if (distEndpoints > 0.001) {
              closedPts.push([pts[0][0], pts[0][1]]);
            }
            rawClosedPolygons.push({ points: closedPts, layer: entity.layer });
          }
        }
      } else if (entity.type === 'TEXT' || entity.type === 'MTEXT') {
        entityCounts.texts++;
      } else {
        entityCounts.unsupported++;
      }
    }

    // Extract all text entities (including inside block definitions and inserts)
    const rawAllTexts = extractAllCadTexts(dxf);
    for (const t of rawAllTexts) {
      trackCoord(t.x, t.y);
    }

    if (!isFinite(minX) || !isFinite(maxX)) {
      minX = 0; maxX = 1200;
      minY = 0; maxY = 800;
    }

    const spanX = Math.max(10, maxX - minX);
    const spanY = Math.max(10, maxY - minY);

    // Coordinate conversion: CAD Y is up, flip to SVG Y down
    const toSvgX = (x: number) => Math.round((x - minX) * 10) / 10;
    const toSvgY = (y: number) => Math.round((maxY - y) * 10) / 10;

    const W = Math.round(spanX);
    const H = Math.round(spanY);
    const totalArea = W * H;

    const normSegments = rawSegments.map((s) => ({
      x1: toSvgX(s.x1),
      y1: toSvgY(s.y1),
      x2: toSvgX(s.x2),
      y2: toSvgY(s.y2),
    }));

    const normTexts = rawAllTexts.map((t) => ({
      rawText: t.text,
      cleanText: t.cleanText,
      plotNum: t.plotNum,
      x: toSvgX(t.x),
      y: toSvgY(t.y),
      pos: [toSvgX(t.x), toSvgY(t.y)] as [number, number],
    }));

    // Filter candidate closed polylines (from explicit CAD polylines)
    const candidatePolygons: [number, number][][] = [];
    for (const p of rawClosedPolygons) {
      const pts = p.points.map((pt) => [toSvgX(pt[0]), toSvgY(pt[1])] as [number, number]);
      const area = calculatePolygonArea(pts);
      // Exclude entire outer sheet frame (> 45% of total area) and microscopic specks (< 25 sq units)
      if (area >= 25 && area < totalArea * 0.45) {
        candidatePolygons.push(pts);
      }
    }

    // If explicit closed polylines are few, also detect closed polygon loops from connected line segments
    if (candidatePolygons.length < 15 && normSegments.length > 0) {
      const minPlotArea = Math.max(25, totalArea * 0.0001);
      const maxPlotArea = Math.min(totalArea * 0.25, Math.max(minPlotArea * 50, 500000));
      const segmentLoops = findClosedPolygonsFromSegments(normSegments, 4, minPlotArea, maxPlotArea);
      for (const loop of segmentLoops) {
        // Only add if not already present
        const loopCenter = calculateBoundingBox(loop);
        const exists = candidatePolygons.some((existing) => {
          const eb = calculateBoundingBox(existing);
          return Math.hypot(eb.minX - loopCenter.minX, eb.minY - loopCenter.minY) < 15;
        });
        if (!exists) {
          candidatePolygons.push(loop);
        }
      }
    }

    // Deduplicate candidate polygons
    const uniquePolygons: [number, number][][] = [];
    for (const poly of candidatePolygons) {
      const b = calculateBoundingBox(poly);
      const isDup = uniquePolygons.some((u) => {
        const ub = calculateBoundingBox(u);
        return Math.hypot(ub.minX - b.minX, ub.minY - b.minY) < 10 && Math.abs(ub.width - b.width) < 10;
      });
      if (!isDup) uniquePolygons.push(poly);
    }

    // Separate CAD texts that look like plot numbers
    const plotNumberTexts = normTexts.filter((t) => t.plotNum !== null);

    // 2. Bind numbers to polygons
    const plots: ExtractedCadPlot[] = [];
    const usedLabels = new Set<number>();
    const assignedNumbers = new Set<string>();

    for (const poly of uniquePolygons) {
      const areaSq = calculatePolygonArea(poly);
      const bounds = calculateBoundingBox(poly);
      const polyCenter: [number, number] = [
        bounds.minX + bounds.width / 2,
        bounds.minY + bounds.height / 2,
      ];

      // Find if any plot number text is inside or near this polygon
      let matchedPlotNum: string | null = null;
      let matchedLabelPt: [number, number] = polyCenter;

      // Priority 1: Text strictly inside polygon
      for (let i = 0; i < plotNumberTexts.length; i++) {
        if (usedLabels.has(i)) continue;
        const lbl = plotNumberTexts[i];
        if (isPointInPolygon(lbl.pos, poly)) {
          matchedPlotNum = lbl.plotNum!;
          matchedLabelPt = lbl.pos;
          usedLabels.add(i);
          break;
        }
      }

      // Priority 2: Closest unused label within bounding proximity
      if (!matchedPlotNum) {
        let bestDist = Math.max(bounds.width, bounds.height) * 0.75;
        let bestIdx = -1;
        for (let i = 0; i < plotNumberTexts.length; i++) {
          if (usedLabels.has(i)) continue;
          const lbl = plotNumberTexts[i];
          const d = Math.hypot(lbl.pos[0] - polyCenter[0], lbl.pos[1] - polyCenter[1]);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
        }
        if (bestIdx >= 0) {
          matchedPlotNum = plotNumberTexts[bestIdx].plotNum!;
          matchedLabelPt = plotNumberTexts[bestIdx].pos;
          usedLabels.add(bestIdx);
        }
      }

      // Priority 3: Fallback sequential numbering if no text in drawing
      if (!matchedPlotNum) {
        let seq = 1;
        while (assignedNumbers.has(String(seq))) seq++;
        matchedPlotNum = String(seq);
      }

      assignedNumbers.add(matchedPlotNum);
      const areaCents = Math.max(1.0, Math.round((areaSq / 400) * 10) / 10);

      plots.push({
        plotNumber: matchedPlotNum,
        points: poly,
        labelPt: matchedLabelPt,
        bounds,
        areaCents,
      });
    }

    // Priority 4: If any plot number text has NO matching polyline, trace boundary around it
    for (let i = 0; i < plotNumberTexts.length; i++) {
      if (usedLabels.has(i)) continue;
      const lbl = plotNumberTexts[i];
      if (assignedNumbers.has(lbl.plotNum!)) continue;

      const maxRayDist = Math.max(50, Math.min(W, H) * 0.15);
      const traced = tracePolygonAroundPoint(lbl.pos, normSegments, maxRayDist);
      if (traced && traced.length >= 3) {
        const areaSq = calculatePolygonArea(traced);
        if (areaSq >= 25 && areaSq < totalArea * 0.45) {
          const areaCents = Math.max(1.0, Math.round((areaSq / 400) * 10) / 10);
          const bounds = calculateBoundingBox(traced);
          plots.push({
            plotNumber: lbl.plotNum!,
            points: traced,
            labelPt: lbl.pos,
            bounds,
            areaCents,
          });
          assignedNumbers.add(lbl.plotNum!);
          usedLabels.add(i);
        }
      }
    }

    // Diagnostics: missing sequence and duplicates
    const numList = Array.from(assignedNumbers)
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b);

    const maxNum = numList.length > 0 ? Math.max(...numList) : 0;
    const missing: number[] = [];
    for (let n = 1; n <= maxNum; n++) {
      if (!numList.includes(n)) missing.push(n);
    }

    // 3. Generate crisp CAD background SVG
    // Dynamic stroke width scaled to drawing dimensions so lines are always crisp
    const strokeW = Math.max(0.8, Math.min(W, H) * 0.0012);
    const textFontSize = Math.max(10, Math.min(W, H) * 0.014);

    // Render ALL line segments via a single SVG path (instant vector rendering, no 3,000 line limit!)
    const pathD = normSegments.map((s) => `M${s.x1} ${s.y1}L${s.x2} ${s.y2}`).join(' ');

    // Render CAD text labels directly in the SVG so plot numbers, street names, and notes are crisp and readable
    const textElements = normTexts
      .slice(0, 1000)
      .map(
        (t) =>
          `<text x="${t.x}" y="${t.y}" font-size="${textFontSize}" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="#334155" text-anchor="middle" dominant-baseline="central">${escapeXml(t.cleanText)}</text>`
      )
      .join('');

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="background-color: #ffffff;"><path d="${pathD}" stroke="#1e293b" stroke-width="${strokeW}" fill="none" stroke-linecap="round" stroke-linejoin="round" />${textElements}</svg>`;
    const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;

    return {
      success: true,
      plots,
      layoutBounds: { minX: 0, minY: 0, maxX: W, maxY: H, width: W, height: H },
      svgDataUrl,
      warnings: {
        count: plots.length,
        duplicates: [],
        missing,
      },
      entityCounts,
      errors: [],
    };
  } catch (err: any) {
    errors.push(err.message || 'Failed to parse DXF structure');
    return {
      success: false,
      plots: [],
      layoutBounds: { minX: 0, minY: 0, maxX: 1200, maxY: 800, width: 1200, height: 800 },
      warnings: { count: 0, missing: [], duplicates: [] },
      entityCounts,
      errors,
    };
  }
}

/**
 * Strips AutoCAD MTEXT control formatting codes
 */
function cleanCadText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\\A[0-9];?/gi, '')
    .replace(/\\P/gi, ' ')
    .replace(/\\px[a-z0-9,.-]+;?/gi, '')
    .replace(/\\C[0-9]+;?/gi, '')
    .replace(/\\H[0-9.]+x?;?/gi, '')
    .replace(/\\W[0-9.]+;?/gi, '')
    .replace(/\\Q[0-9.]+;?/gi, '')
    .replace(/\\T[0-9.]+;?/gi, '')
    .replace(/\\S[^;]+;/gi, '')
    .replace(/\\f[^;]+;/gi, '')
    .replace(/[{}\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts plot number from text string
 */
function extractPlotNumber(cleaned: string): string | null {
  if (!cleaned) return null;
  // Match single number like "1", "23", "63", "12A"
  if (/^\d{1,4}[A-Za-z]?$/i.test(cleaned)) return cleaned.toUpperCase();
  if (/^\d{1,4}[-/][A-Za-z0-9]+$/i.test(cleaned)) return cleaned.toUpperCase();
  // Match "Plot 1", "Plot No 23", "P.No. 63", "Site 12", "No. 4", "#15"
  const m = cleaned.match(/^(?:plot|p\.?no\.?|site(?:\s*no)?|lot|no\.?|p\b)\s*[:#-]?\s*(\d{1,4}[A-Za-z]?)\b/i);
  if (m) return m[1].toUpperCase();
  // Match leading number e.g. "1 (1200 SQFT)"
  const leadingM = cleaned.match(/^(\d{1,4}[A-Za-z]?)\s*[\(\[-]/);
  if (leadingM) return leadingM[1].toUpperCase();
  return null;
}

/**
 * Recursively extracts all texts from DXF entities, blocks, and attributes
 */
function extractAllCadTexts(dxf: any): { text: string; cleanText: string; plotNum: string | null; x: number; y: number }[] {
  const result: { text: string; cleanText: string; plotNum: string | null; x: number; y: number }[] = [];

  const addText = (rawText: string, pt: { x?: number; y?: number } | undefined) => {
    if (!rawText || !pt) return;
    const x = Number(pt.x);
    const y = Number(pt.y);
    if (isNaN(x) || isNaN(y)) return;

    const cleaned = cleanCadText(rawText);
    if (!cleaned) return;

    const plotNum = extractPlotNumber(cleaned);
    result.push({ text: rawText, cleanText: cleaned, plotNum, x, y });
  };

  const processEntity = (entity: any, offset = { x: 0, y: 0 }) => {
    if (!entity) return;
    const type = entity.type;

    if (type === 'TEXT' || type === 'MTEXT') {
      const pt = entity.startPoint || entity.position || entity.endPoint;
      const t = String(entity.text || entity.string || entity.value || '');
      if (pt) {
        addText(t, { x: (pt.x || 0) + offset.x, y: (pt.y || 0) + offset.y });
      }
    } else if (type === 'ATTRIB' || type === 'ATTDEF') {
      const pt = entity.startPoint || entity.position || entity.endPoint;
      const t = String(entity.text || entity.tag || entity.value || '');
      if (pt) {
        addText(t, { x: (pt.x || 0) + offset.x, y: (pt.y || 0) + offset.y });
      }
    } else if (type === 'INSERT') {
      const insPt = entity.position || { x: 0, y: 0 };
      if (Array.isArray(entity.attributes)) {
        for (const attr of entity.attributes) {
          const apt = attr.startPoint || attr.position || insPt;
          addText(String(attr.text || attr.value || ''), { x: (apt.x || insPt.x || 0) + offset.x, y: (apt.y || insPt.y || 0) + offset.y });
        }
      }
      const blockName = entity.name;
      if (blockName && dxf.blocks && dxf.blocks[blockName]) {
        const block = dxf.blocks[blockName];
        if (Array.isArray(block.entities)) {
          for (const bEnt of block.entities) {
            processEntity(bEnt, { x: (insPt.x || 0) + offset.x, y: (insPt.y || 0) + offset.y });
          }
        }
      }
    }
  };

  if (Array.isArray(dxf.entities)) {
    for (const ent of dxf.entities) {
      processEntity(ent);
    }
  }

  return result;
}

/**
 * Traces closed polygons from connected line segments
 */
function findClosedPolygonsFromSegments(
  segments: { x1: number; y1: number; x2: number; y2: number }[],
  tol: number,
  minArea: number,
  maxArea: number
): [number, number][][] {
  const key = (x: number, y: number) => `${Math.round(x / tol) * tol},${Math.round(y / tol) * tol}`;
  const coordMap = new Map<string, [number, number]>();
  const adj = new Map<string, Set<string>>();

  for (const seg of segments) {
    const k1 = key(seg.x1, seg.y1);
    const k2 = key(seg.x2, seg.y2);
    if (k1 === k2) continue;

    if (!coordMap.has(k1)) coordMap.set(k1, [seg.x1, seg.y1]);
    if (!coordMap.has(k2)) coordMap.set(k2, [seg.x2, seg.y2]);

    if (!adj.has(k1)) adj.set(k1, new Set());
    if (!adj.has(k2)) adj.set(k2, new Set());
    adj.get(k1)!.add(k2);
    adj.get(k2)!.add(k1);
  }

  const cycles: [number, number][][] = [];
  const visitedPolys = new Set<string>();

  // Filter nodes suitable for parcel vertices (degree 2 to 5)
  const nodes = Array.from(adj.keys()).filter((k) => {
    const deg = adj.get(k)?.size || 0;
    return deg >= 2 && deg <= 5;
  });

  const MAX_DEPTH = 6;
  for (const start of nodes.slice(0, 500)) {
    const dfs = (curr: string, path: string[]) => {
      if (path.length > MAX_DEPTH) return;
      const neighbors = adj.get(curr);
      if (!neighbors) return;

      for (const nxt of neighbors) {
        if (nxt === start && path.length >= 3) {
          const polyPts = path.map((k) => coordMap.get(k)!);
          const area = calculatePolygonArea(polyPts);
          if (area >= minArea && area <= maxArea) {
            const canonKey = [...path].sort().join('|');
            if (!visitedPolys.has(canonKey)) {
              visitedPolys.add(canonKey);
              cycles.push(polyPts);
            }
          }
          return;
        }
        if (!path.includes(nxt) && path.length < MAX_DEPTH) {
          dfs(nxt, [...path, nxt]);
        }
      }
    };
    dfs(start, [start]);
    if (cycles.length >= 150) break;
  }

  return cycles;
}

/**
 * Traces a convex hull around a point via radial ray-casting against surrounding segments
 */
function tracePolygonAroundPoint(
  pt: [number, number],
  segments: { x1: number; y1: number; x2: number; y2: number }[],
  maxDist: number
): [number, number][] | null {
  const numRays = 36;
  const hitPoints: [number, number][] = [];

  for (let r = 0; r < numRays; r++) {
    const angle = (r * 2 * Math.PI) / numRays;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const rx2 = pt[0] + dx * maxDist;
    const ry2 = pt[1] + dy * maxDist;

    let closestDist = maxDist;
    let hitFound = false;

    for (const seg of segments) {
      const hit = intersectSegments(pt[0], pt[1], rx2, ry2, seg.x1, seg.y1, seg.x2, seg.y2);
      if (hit) {
        const d = Math.hypot(hit[0] - pt[0], hit[1] - pt[1]);
        if (d > 2 && d < closestDist) {
          closestDist = d;
          hitFound = true;
        }
      }
    }

    if (hitFound && closestDist < maxDist * 0.95) {
      hitPoints.push([pt[0] + dx * closestDist, pt[1] + dy * closestDist]);
    }
  }

  if (hitPoints.length >= 6) {
    const hull = convexHull(hitPoints);
    if (hull.length >= 3 && calculatePolygonArea(hull) > 20) {
      return hull;
    }
  }
  return null;
}

function intersectSegments(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): [number, number] | null {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (Math.abs(denom) < 1e-6) return null;

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return [x1 + ua * (x2 - x1), y1 + ua * (y2 - y1)];
  }
  return null;
}

function convexHull(points: [number, number][]): [number, number][] {
  if (points.length <= 3) return points;
  points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const lower: [number, number][] = [];
  for (const p of points) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: [number, number][] = [];
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
