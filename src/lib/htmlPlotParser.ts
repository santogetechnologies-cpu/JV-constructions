export interface ParsedPlot {
  plotNumber: string;
  points: [number, number][];
  title?: string;
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
 * Universally parses any interactive plot blueprint HTML file containing:
 * - <svg viewBox="0 0 W H"> or JavaScript viewBox arrays let vb=[0, 0, W, H]
 * - Background <image href="..." width="W" height="H">
 * - Clickable plot shapes: <g class="plot" data-n="X"> <polygon points="..." /> </g>
 * - Embedded plot metadata dictionaries: const D = { "1-1": { title: "Phase 1 - Plot 1", lines: [...] } }
 * - Supports any number of plots, multi-phase naming (e.g. 1-1, 2-12, Park), and any canvas dimensions
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

    // 1. Extract Dimensions from SVG or JavaScript constants
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

    // Check script viewBox: let vb=[0,0,5265,3720]; or const vb=[...];
    const jsVbMatch = htmlContent.match(/(?:let|const|var)\s+vb\s*=\s*\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]/i);
    if (jsVbMatch && parseFloat(jsVbMatch[3]) > 0 && parseFloat(jsVbMatch[4]) > 0) {
      width = parseFloat(jsVbMatch[3]);
      height = parseFloat(jsVbMatch[4]);
    }

    // Check JS constants like: const W = 1820, H = 2576
    const dimMatch =
      htmlContent.match(/const\s+W\s*=\s*(\d+)\s*,\s*H\s*=\s*(\d+)/i) ||
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
      const imgUrlMatch =
        htmlContent.match(/(?:const|let|var)\s+imgUrl\s*=\s*['"]([^'"]+)['"]/i) ||
        htmlContent.match(/getPublicUrl\(['"]([^'"]+)['"]\)/i) ||
        htmlContent.match(/<image[^>]+(?:href|xlink:href)=["']([^"']+)["']/i);
      if (imgUrlMatch) imageUrl = imgUrlMatch[1];
    }

    // 3. Extract metadata from JS dictionary D (e.g. const D = { "1-1": { title: "Phase 1 - Plot 1", lines: [...] } })
    let dictD: Record<string, { title?: string; lines?: string[] }> = {};
    const dMatch = htmlContent.match(/(?:const|let|var)\s+D\s*=\s*(\{[\s\S]*?\});/);
    if (dMatch) {
      try {
        dictD = JSON.parse(dMatch[1]);
      } catch {
        try {
          const sanitized = dMatch[1]
            .replace(/(['"])?([a-zA-Z0-9_-]+)(['"])?\s*:/g, '"$2":')
            .replace(/'/g, '"');
          dictD = JSON.parse(sanitized);
        } catch {}
      }
    }

    // 4. Extract plot elements (<g class="plot" data-n="..."> <polygon points="..." /> </g>)
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

      // Determine plot identifier
      const rawPlotId =
        el.getAttribute('data-n') ||
        el.getAttribute('data-plot') ||
        polyEl.getAttribute('data-n') ||
        polyEl.getAttribute('data-plot') ||
        el.id?.replace(/^plot[-_]?/i, '') ||
        polyEl.id?.replace(/^plot[-_]?/i, '') ||
        el.querySelector('text')?.textContent?.trim() ||
        String(i + 1);

      const trimmedId = rawPlotId.trim();
      if (!trimmedId) continue;

      // Format clean plot number
      let cleanPlotNumber = trimmedId;
      if (/^[0-9]+-park$/i.test(trimmedId) || /^park$/i.test(trimmedId)) {
        cleanPlotNumber = 'Park';
      }

      // Check D dictionary for title and table area
      const dInfo = dictD[trimmedId] || dictD[cleanPlotNumber];
      let plotTitle = dInfo?.title || `Plot #${cleanPlotNumber}`;
      let areaCents = 32.0;

      if (dInfo && Array.isArray(dInfo.lines)) {
        for (const line of dInfo.lines) {
          const areaMatch = line.match(/Table area:\s*([0-9.]+)\s*cents/i) || line.match(/([0-9.]+)\s*cents/i);
          if (areaMatch) {
            areaCents = parseFloat(areaMatch[1]);
            break;
          }
        }
      }

      // If not in D, check DOM attributes
      if (areaCents === 32.0) {
        const areaAttr = el.getAttribute('data-area') || el.getAttribute('data-cents') || polyEl.getAttribute('data-area');
        if (areaAttr && !isNaN(parseFloat(areaAttr))) {
          areaCents = parseFloat(areaAttr);
        } else if (LAYOUT_63_TABLE_AREAS[cleanPlotNumber]) {
          areaCents = LAYOUT_63_TABLE_AREAS[cleanPlotNumber];
        }
      }

      // Facing
      const facingAttr = el.getAttribute('data-facing') || 'East';
      // Price
      const priceAttr = Math.round(areaCents * 75000);
      // Status
      let statusAttr: 'available' | 'booked' | 'on_hold' | 'sold' = 'available';
      const classStr = (el.getAttribute('class') || '') + ' ' + (polyEl.getAttribute('class') || '');
      if (classStr.includes('sold')) statusAttr = 'sold';
      else if (classStr.includes('booked')) statusAttr = 'booked';
      else if (classStr.includes('on_hold') || classStr.includes('warning') || classStr.includes('needs_review')) {
        // warning/needs_review in CAD means available with review notes
        statusAttr = 'available';
      }

      // Avoid duplicates
      const existing = plots.find((p) => p.plotNumber === cleanPlotNumber);
      if (!existing) {
        plots.push({
          plotNumber: cleanPlotNumber,
          points: pts,
          title: plotTitle,
          areaCentsTable: areaCents,
          facing: facingAttr,
          priceInr: priceAttr,
          status: statusAttr,
        });
      }
    }

    // Fallback: If querySelector did not find elements (e.g. strict XML namespace), use regex
    if (plots.length === 0) {
      const gRegex = /<g[^>]+class=["'][^"']*plot[^"']*["'][^>]*data-n=["']([^"']+)["'][^>]*>([\s\S]*?)<\/g>/gi;
      let match: RegExpExecArray | null;
      while ((match = gRegex.exec(htmlContent)) !== null) {
        const rawDataN = match[1].trim();
        const body = match[2];
        const polyMatch = body.match(/<polygon[^>]+points=["']([^"']+)["']/i);
        if (!polyMatch) continue;

        const pts = parsePointsString(polyMatch[1]);
        if (pts.length < 3) continue;

        let cleanPlotNumber = rawDataN;
        if (/^[0-9]+-park$/i.test(rawDataN) || /^park$/i.test(rawDataN)) {
          cleanPlotNumber = 'Park';
        }

        const dInfo = dictD[rawDataN] || dictD[cleanPlotNumber];
        let plotTitle = dInfo?.title || `Plot #${cleanPlotNumber}`;
        let areaCents = 32.0;

        if (dInfo && Array.isArray(dInfo.lines)) {
          for (const line of dInfo.lines) {
            const areaM = line.match(/Table area:\s*([0-9.]+)\s*cents/i) || line.match(/([0-9.]+)\s*cents/i);
            if (areaM) {
              areaCents = parseFloat(areaM[1]);
              break;
            }
          }
        } else if (LAYOUT_63_TABLE_AREAS[cleanPlotNumber]) {
          areaCents = LAYOUT_63_TABLE_AREAS[cleanPlotNumber];
        }

        const existing = plots.find((p) => p.plotNumber === cleanPlotNumber);
        if (!existing) {
          plots.push({
            plotNumber: cleanPlotNumber,
            points: pts,
            title: plotTitle,
            areaCentsTable: areaCents,
            facing: 'East',
            priceInr: Math.round(areaCents * 75000),
            status: 'available',
          });
        }
      }
    }

    if (plots.length === 0) {
      errors.push('No polygon plot elements (<g class="plot" data-n="...">) found in HTML blueprint.');
      return { success: false, width, height, plots: [], errors };
    }

    // Natural sort: sorts 1, 2, 10, 1-1, 1-2, 2-1, 2-12, Park logically
    plots.sort((a, b) =>
      a.plotNumber.localeCompare(b.plotNumber, undefined, { numeric: true, sensitivity: 'base' })
    );

    return {
      success: true,
      imageUrl,
      width,
      height,
      plots,
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
