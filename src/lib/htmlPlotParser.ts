export interface ParsedPlot {
  plotNumber: string;
  points: [number, number][];
  areaCentsTable?: number;
  facing?: string;
  priceInr?: number;
  status?: 'available' | 'booked' | 'on_hold' | 'sold';
}

export interface ParsedHtmlBlueprint {
  success: boolean;
  imageUrl?: string;
  width: number;
  height: number;
  plots: ParsedPlot[];
  errors: string[];
}

export const LAYOUT_63_TABLE_AREAS: Record<string, number> = {
  '1': 32.00, '2': 32.00, '3': 30.50, '4': 28.00, '5': 26.70, '6': 33.12, '7': 50.40,
  '8': 35.00, '9': 35.00, '10': 35.00, '11': 35.00, '12': 33.90, '13': 31.50, '14': 31.50,
  '15': 31.50, '16': 31.50, '17': 31.50, '18': 31.50, '19': 31.50, '20': 31.50, '21': 31.50,
  '22': 31.50, '23': 31.50, '24': 31.50, '25': 31.50, '26': 31.50, '27': 31.50, '28': 32.60,
  '29': 32.60, '30': 32.60, '31': 32.60, '32': 32.60, '33': 32.60, '34': 32.60, '35': 31.50,
  '36': 31.50, '37': 31.50, '38': 31.50, '39': 31.50, '40': 31.50, '41': 31.50, '42': 31.50,
  '43': 27.50, '44': 27.50, '45': 27.50, '46': 27.50, '47': 30.85, '48': 34.50, '49': 34.50,
  '50': 34.50, '51': 34.50, '52': 34.50, '53': 34.50, '54': 38.75, '55': 35.60, '56': 25.50,
  '57': 25.50, '58': 25.50, '59': 25.50, '60': 25.50, '61': 30.00, '62': 29.50, '63': 28.50,
};

/**
 * Parses SVG polygon points string format: "x1,y1 x2,y2 ..." or "x1 y1 x2 y2 ..."
 * Uses universal numeric regex to handle any whitespace, commas, or line breaks.
 */
export function parsePointsString(pointsStr: string): [number, number][] {
  if (!pointsStr) return [];
  const matches = pointsStr.match(/[-+]?[0-9]*\.?[0-9]+/g);
  if (!matches) return [];
  const nums = matches.map(Number).filter((n) => !isNaN(n));
  const result: [number, number][] = [];
  for (let i = 0; i < nums.length - 1; i += 2) {
    result.push([nums[i], nums[i + 1]]);
  }
  return result;
}

/**
 * Parses an interactive plot viewer HTML file (e.g. plot_viewer (1).html) containing:
 * - <image href="..." width="W" height="H">
 * - <g class="plot" data-n="..."> <polygon points="x,y x,y..." /> ... </g>
 * - Embedded JavaScript data objects or arrays with plot details
 * - Strictly parses plots 1 to 63 only (never 64)
 */
export function parseHtmlBlueprint(htmlContent: string): ParsedHtmlBlueprint {
  const errors: string[] = [];
  let width = 1820;
  let height = 2576;
  let imageUrl: string | undefined;
  const plots: ParsedPlot[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // 1. Extract Dimensions
    const svgEl = doc.querySelector('svg');
    if (svgEl) {
      const vb = svgEl.getAttribute('viewBox');
      if (vb) {
        const parts = vb.trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          width = parts[2];
          height = parts[3];
        }
      }
    }

    // Check JS constants like: const W = 1820, H = 2576
    const dimMatch = htmlContent.match(/const\s+W\s*=\s*(\d+)\s*,\s*H\s*=\s*(\d+)/i) ||
      htmlContent.match(/let\s+W\s*=\s*(\d+)\s*,\s*H\s*=\s*(\d+)/i) ||
      htmlContent.match(/var\s+W\s*=\s*(\d+)\s*,\s*H\s*=\s*(\d+)/i);
    if (dimMatch) {
      width = parseInt(dimMatch[1], 10);
      height = parseInt(dimMatch[2], 10);
    }

    // 2. Extract Background Image URL
    const imageEl = doc.querySelector('svg image, image');
    if (imageEl) {
      const href = imageEl.getAttribute('href') || imageEl.getAttribute('xlink:href');
      if (href) imageUrl = href;
      const imgW = parseFloat(imageEl.getAttribute('width') || '');
      const imgH = parseFloat(imageEl.getAttribute('height') || '');
      if (imgW > 0 && imgH > 0) {
        width = imgW;
        height = imgH;
      }
    }

    if (!imageUrl) {
      const imgTag = doc.querySelector('img');
      if (imgTag && imgTag.getAttribute('src')) {
        imageUrl = imgTag.getAttribute('src') || undefined;
      }
    }

    if (!imageUrl) {
      const imgUrlMatch = htmlContent.match(/(?:const|let|var)\s+imgUrl\s*=\s*['"]([^'"]+)['"]/i) ||
        htmlContent.match(/getPublicUrl\(['"]([^'"]+)['"]\)/i);
      if (imgUrlMatch) imageUrl = imgUrlMatch[1];
    }

    // 3. Extract metadata from JS script objects (e.g. data = { "1": { table: 32, ... }, "63": { table: 28.5 } })
    const metadataByPlotNum: Record<string, { area?: number; facing?: string; price?: number; status?: string }> = {};

    // Collect all script text
    const scriptTags = doc.querySelectorAll('script');
    let allScriptText = htmlContent;
    if (scriptTags.length > 0) {
      allScriptText = Array.from(scriptTags).map((s) => s.textContent || '').join('\n') + '\n' + htmlContent;
    }

    const entryRegex = /(?:["']?(\d{1,2})["']?\s*:\s*\{([^}]+)\})/g;
    let match: RegExpExecArray | null;
    while ((match = entryRegex.exec(allScriptText)) !== null) {
      const plotNo = match[1];
      const num = parseInt(plotNo, 10);
      // Strictly 1 to 63
      if (isNaN(num) || num < 1 || num > 63) continue;
      const propsStr = match[2];

      const areaMatch = propsStr.match(/(?:table_area|table|area_cents|area|cents)\s*:\s*([0-9.]+)/i);
      const facingMatch = propsStr.match(/(?:facing|direction)\s*:\s*['"]([^'"]+)['"]/i);
      const priceMatch = propsStr.match(/(?:price|price_inr|rate)\s*:\s*([0-9.]+)/i);
      const statusMatch = propsStr.match(/(?:status|state)\s*:\s*['"]([^'"]+)['"]/i);

      metadataByPlotNum[plotNo] = {
        area: areaMatch ? parseFloat(areaMatch[1]) : metadataByPlotNum[plotNo]?.area,
        facing: facingMatch ? facingMatch[1] : metadataByPlotNum[plotNo]?.facing,
        price: priceMatch ? parseFloat(priceMatch[1]) : metadataByPlotNum[plotNo]?.price,
        status: statusMatch ? statusMatch[1] : metadataByPlotNum[plotNo]?.status,
      };
    }

    // 4. Strategy A: Check for JS plot array: plots = [{ plot_no: 1, points: [[x,y],...], area_cents_table: 32 }, ...]
    const scriptPlotsMatch = htmlContent.match(/(?:plots|plotData)\s*=\s*(\[\s*\{[\s\S]*?\}\s*\])/i);
    if (scriptPlotsMatch) {
      try {
        const rawJson = scriptPlotsMatch[1];
        const sanitizedJson = rawJson
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
          .replace(/'/g, '"');
        const parsedData = JSON.parse(sanitizedJson);

        if (Array.isArray(parsedData) && parsedData.length > 0) {
          for (const item of parsedData) {
            const plotNum = String(item.plot_no || item.plot_number || item.id || '');
            const num = parseInt(plotNum, 10);
            // Strictly allow only plots 1 to 63 (never 64)
            if (isNaN(num) || num < 1 || num > 63) continue;

            let pts: [number, number][] = [];
            if (Array.isArray(item.points)) {
              pts = item.points.map((p: any) => [Number(p[0] || p.x || 0), Number(p[1] || p.y || 0)]);
            } else if (typeof item.points === 'string') {
              pts = parsePointsString(item.points);
            }

            if (pts.length >= 3) {
              const meta = metadataByPlotNum[plotNum];
              const defaultArea = LAYOUT_63_TABLE_AREAS[plotNum] || 32.0;
              plots.push({
                plotNumber: plotNum,
                points: pts,
                areaCentsTable: meta?.area || parseFloat(item.area_cents_table || item.area_cents || item.area || String(defaultArea)) || defaultArea,
                facing: meta?.facing || item.facing || (num % 2 === 0 ? 'East' : 'West'),
                priceInr: meta?.price || parseFloat(item.price_inr || item.price || '2500000') || 2500000,
                status: (item.status === 'booked' || item.status === 'on_hold' || item.status === 'sold') ? item.status : 'available',
              });
            }
          }
        }
      } catch (scriptErr) {
        // Fallback to DOM parsing
      }
    }

    // 5. Strategy B: Extract from SVG elements in the DOM
    // Matches: <g class="plot" data-n="1"> <polygon points="..." /> </g>
    if (plots.length === 0) {
      const plotElements = doc.querySelectorAll('.plot, g[data-n], [data-n], g[data-plot], [id^="plot-"], [id^="plot_"]');

      for (let i = 0; i < plotElements.length; i++) {
        const el = plotElements[i];

        // Find polygon element
        const polyEl = el.tagName.toLowerCase() === 'polygon' ? el : el.querySelector('polygon');
        if (!polyEl) continue;

        const pointsAttr = polyEl.getAttribute('points');
        if (!pointsAttr) continue;

        const pts = parsePointsString(pointsAttr);
        if (pts.length < 3) continue;

        // Determine plot number
        const plotNumStr =
          el.getAttribute('data-n') ||
          el.getAttribute('data-plot') ||
          polyEl.getAttribute('data-n') ||
          polyEl.getAttribute('data-plot') ||
          el.id?.replace(/^plot[-_]?/i, '') ||
          polyEl.id?.replace(/^plot[-_]?/i, '') ||
          el.querySelector('text')?.textContent?.trim() || '';

        const num = parseInt(plotNumStr, 10);
        // Strictly only allow plots 1 to 63 (no 64, no non-plot shapes)
        if (isNaN(num) || num < 1 || num > 63) continue;
        const plotNum = String(num);

        // Check if table area is provided in attributes or metadata
        const areaAttr = el.getAttribute('data-area') || el.getAttribute('data-cents') || polyEl.getAttribute('data-area');
        const meta = metadataByPlotNum[plotNum];
        const defaultArea = LAYOUT_63_TABLE_AREAS[plotNum] || 32.0;
        const parsedArea = areaAttr ? parseFloat(areaAttr) : (meta?.area || defaultArea);

        // Facing
        const facingAttr = el.getAttribute('data-facing') || meta?.facing || (num % 2 === 0 ? 'East' : 'West');
        // Price
        const priceAttr = meta?.price || 2500000;
        // Status
        const statusAttr = (meta?.status === 'booked' || meta?.status === 'on_hold' || meta?.status === 'sold') ? (meta.status as any) : 'available';

        // Avoid duplicate plot numbers from multiple matching selectors
        const existing = plots.find((p) => p.plotNumber === plotNum);
        if (!existing) {
          plots.push({
            plotNumber: plotNum,
            points: pts,
            areaCentsTable: isNaN(parsedArea) ? defaultArea : parsedArea,
            facing: facingAttr,
            priceInr: priceAttr,
            status: statusAttr,
          });
        }
      }
    }

    // Filter to strictly plots 1 through 63
    const finalPlots = plots
      .filter((p) => {
        const n = parseInt(p.plotNumber, 10);
        return !isNaN(n) && n >= 1 && n <= 63;
      })
      .slice(0, 63);

    if (finalPlots.length === 0) {
      errors.push('No polygon plot elements (<g class="plot" data-n="1">) found in HTML.');
      return { success: false, width, height, plots: [], errors };
    }

    // Sort plots strictly 1 to 63
    finalPlots.sort((a, b) => {
      const na = parseInt(a.plotNumber, 10);
      const nb = parseInt(b.plotNumber, 10);
      return na - nb;
    });

    return {
      success: true,
      imageUrl,
      width,
      height,
      plots: finalPlots,
      errors: [],
    };
  } catch (err: any) {
    errors.push(err.message || 'Failed to parse HTML blueprint file.');
    return {
      success: false,
      width,
      height,
      plots: [],
      errors,
    };
  }
}
