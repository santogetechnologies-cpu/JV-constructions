// Vector PDF extractor using PDF.js
// Extracts real vector paths and text objects directly from the PDF document stream

import { ensurePdfJs } from './pdfToImage';
import { isPointInPolygon, calculatePolygonCentroid, calculatePolygonArea } from './utils';

export interface ExtractedVectorPlot {
  plotNumber: string;
  points: [number, number][];
  labelPt: [number, number];
  areaSqft?: number;
  confidence: number;
}

export interface ExtractedVectorResult {
  isVector: boolean;
  width: number;
  height: number;
  plots: ExtractedVectorPlot[];
  warnings: {
    missing: number[];
    duplicates: number[];
    count: number;
  };
}

/**
 * Extracts true vector paths and numbers from PDF Page 1
 */
export async function extractVectorPdf(
  pdfSource: File | ArrayBuffer | string
): Promise<ExtractedVectorResult> {
  const pdfjs = await ensurePdfJs();

  let loadingTask: any;
  if (pdfSource instanceof File) {
    const arrayBuffer = await pdfSource.arrayBuffer();
    loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  } else if (pdfSource instanceof ArrayBuffer) {
    loadingTask = pdfjs.getDocument({ data: pdfSource });
  } else {
    loadingTask = pdfjs.getDocument({ url: pdfSource, withCredentials: false });
  }

  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.0 });
  const W = Math.round(viewport.width);
  const H = Math.round(viewport.height);

  // 1. Extract real text objects and their positions
  const textContent = await page.getTextContent();
  const textItems: { text: string; x: number; y: number; size: number }[] = [];

  for (const item of textContent.items) {
    if (!('str' in item)) continue;
    const rawText = (item.str || '').trim();
    if (!rawText) continue;

    // Check if it's an integer plot number (e.g. "1", "12", "63")
    if (/^\d{1,3}[A-Za-z]?$/.test(rawText)) {
      // transform: [scaleX, skewY, skewX, scaleY, tx, ty]
      // PDF Y is bottom-up, convert to SVG top-down Y: H - ty
      const tx = item.transform[4];
      const ty = item.transform[5];
      const svgY = H - ty;
      const fontSize = Math.hypot(item.transform[0], item.transform[1]) || 12;

      textItems.push({
        text: rawText,
        x: Math.round(tx),
        y: Math.round(svgY),
        size: fontSize,
      });
    }
  }

  // 2. Extract vector path lines from the operator list
  const opList = await page.getOperatorList();
  const rawSegments: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const OPS = pdfjs.OPS;

  let curX = 0;
  let curY = 0;
  let subpathStart = [0, 0];

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    const args = opList.argsArray[i];

    if (fn === OPS.moveTo) {
      curX = args[0];
      curY = H - args[1];
      subpathStart = [curX, curY];
    } else if (fn === OPS.lineTo) {
      const nextX = args[0];
      const nextY = H - args[1];
      if (Math.hypot(nextX - curX, nextY - curY) > 2) {
        rawSegments.push({ x1: curX, y1: curY, x2: nextX, y2: nextY });
      }
      curX = nextX;
      curY = nextY;
    } else if (fn === OPS.closePath) {
      if (Math.hypot(subpathStart[0] - curX, subpathStart[1] - curY) > 2) {
        rawSegments.push({ x1: curX, y1: curY, x2: subpathStart[0], y2: subpathStart[1] });
      }
      curX = subpathStart[0];
      curY = subpathStart[1];
    } else if (fn === OPS.constructPath) {
      const pathOps = args[0];
      const pathArgs = args[1];
      let argIdx = 0;
      for (const pOp of pathOps) {
        if (pOp === OPS.moveTo) {
          curX = pathArgs[argIdx];
          curY = H - pathArgs[argIdx + 1];
          subpathStart = [curX, curY];
          argIdx += 2;
        } else if (pOp === OPS.lineTo) {
          const nextX = pathArgs[argIdx];
          const nextY = H - pathArgs[argIdx + 1];
          if (Math.hypot(nextX - curX, nextY - curY) > 2) {
            rawSegments.push({ x1: curX, y1: curY, x2: nextX, y2: nextY });
          }
          curX = nextX;
          curY = nextY;
          argIdx += 2;
        } else if (pOp === OPS.closePath) {
          if (Math.hypot(subpathStart[0] - curX, subpathStart[1] - curY) > 2) {
            rawSegments.push({ x1: curX, y1: curY, x2: subpathStart[0], y2: subpathStart[1] });
          }
          curX = subpathStart[0];
          curY = subpathStart[1];
        } else if (pOp === OPS.curveTo) {
          // Bezier curve: sample endpoint
          const nextX = pathArgs[argIdx + 4];
          const nextY = H - pathArgs[argIdx + 5];
          rawSegments.push({ x1: curX, y1: curY, x2: nextX, y2: nextY });
          curX = nextX;
          curY = nextY;
          argIdx += 6;
        }
      }
    }
  }

  // 3. Build closed polygons around text labels using ray-casting on vector segments
  const plots: ExtractedVectorPlot[] = [];
  const assignedNumbers: number[] = [];

  for (const lbl of textItems) {
    const numVal = parseInt(lbl.text, 10);
    // Ray-cast 32 directions outward from label center to find nearest path intersection
    const numRays = 32;
    const hitPoints: [number, number][] = [];
    const maxRayDist = Math.max(80, Math.min(W, H) * 0.12);

    for (let r = 0; r < numRays; r++) {
      const angle = (r * 2 * Math.PI) / numRays;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);

      let closestHitDist = maxRayDist;
      // Ray segment from lbl.x, lbl.y to max dist
      const rx2 = lbl.x + dx * maxRayDist;
      const ry2 = lbl.y + dy * maxRayDist;

      for (const seg of rawSegments) {
        // Line intersection check between ray and seg
        const hit = intersectSegments(lbl.x, lbl.y, rx2, ry2, seg.x1, seg.y1, seg.x2, seg.y2);
        if (hit) {
          const d = Math.hypot(hit[0] - lbl.x, hit[1] - lbl.y);
          if (d > 4 && d < closestHitDist) {
            closestHitDist = d;
          }
        }
      }

      hitPoints.push([
        Math.round(lbl.x + dx * closestHitDist),
        Math.round(lbl.y + dy * closestHitDist),
      ]);
    }

    // Convex hull of hit points forms the parcel polygon
    const polygon = convexHull(hitPoints);
    if (polygon.length >= 3 && calculatePolygonArea(polygon) > 100) {
      plots.push({
        plotNumber: lbl.text,
        points: polygon,
        labelPt: [lbl.x, lbl.y],
        confidence: 0.95,
      });
      if (!isNaN(numVal)) assignedNumbers.push(numVal);
    }
  }

  // Deduplicate and compute sequence diagnostics
  assignedNumbers.sort((a, b) => a - b);
  const duplicates = assignedNumbers.filter((n, idx) => assignedNumbers.indexOf(n) !== idx);
  const maxNum = assignedNumbers.length > 0 ? Math.max(...assignedNumbers) : 0;
  const missing: number[] = [];
  for (let n = 1; n <= maxNum; n++) {
    if (!assignedNumbers.includes(n)) missing.push(n);
  }

  return {
    isVector: rawSegments.length > 20 && textItems.length > 0,
    width: W,
    height: H,
    plots,
    warnings: {
      count: plots.length,
      duplicates: Array.from(new Set(duplicates)),
      missing,
    },
  };
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
