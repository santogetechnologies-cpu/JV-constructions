// Multi-format export utilities for CAD blueprints & digitized plot layouts
// Exports SVG, DXF (AutoCAD), PNG, and GeoJSON formats

import { Plot, ProjectLayout } from '../types/database';
import { calculatePolygonCentroid, getStatusColor } from './utils';

/**
 * Generate standard AutoCAD ASCII DXF file content from plots
 */
export function generateDxfContent(plots: Plot[], layout: ProjectLayout): string {
  const lines: string[] = [];

  // DXF Header
  lines.push('0', 'SECTION', '2', 'HEADER');
  lines.push('9', '$ACADVER', '1', 'AC1018'); // AutoCAD 2004+ format
  lines.push('9', '$INSUNITS', '70', '4');    // Unit: 4 = Millimeters, 1 = Inches, 6 = Meters
  lines.push('0', 'ENDSEC');

  // DXF Tables & Layers
  lines.push('0', 'SECTION', '2', 'TABLES');
  lines.push('0', 'TABLE', '2', 'LAYER', '70', '2');
  
  // Layer: PLOTS (Cyan/Blue boundary lines)
  lines.push('0', 'LAYER', '2', 'PLOTS', '70', '0', '62', '4', '6', 'CONTINUOUS');
  // Layer: PLOT_NO (Yellow text labels)
  lines.push('0', 'LAYER', '2', 'PLOT_NO', '70', '0', '62', '2', '6', 'CONTINUOUS');
  // Layer: BOUNDARY (Green project perimeter)
  lines.push('0', 'LAYER', '2', 'BOUNDARY', '70', '0', '62', '3', '6', 'CONTINUOUS');
  
  lines.push('0', 'ENDTAB');
  lines.push('0', 'ENDSEC');

  // DXF Entities
  lines.push('0', 'SECTION', '2', 'ENTITIES');

  // Outer layout boundary (if available)
  const bounds = layout.layout_bounds;
  if (bounds) {
    lines.push('0', 'LWPOLYLINE');
    lines.push('8', 'BOUNDARY');
    lines.push('90', '4'); // 4 vertices
    lines.push('70', '1'); // 1 = Closed polyline
    lines.push('10', String(bounds.minX), '20', String(bounds.maxY));
    lines.push('10', String(bounds.maxX), '20', String(bounds.maxY));
    lines.push('10', String(bounds.maxX), '20', String(bounds.minY));
    lines.push('10', String(bounds.minX), '20', String(bounds.minY));
  }

  // Each plot as a closed LWPOLYLINE entity and TEXT label
  for (const plot of plots) {
    const coords = plot.geometry?.coordinates;
    if (!coords || coords.length < 3) continue;

    // LWPOLYLINE on layer PLOTS
    lines.push('0', 'LWPOLYLINE');
    lines.push('8', 'PLOTS');
    lines.push('90', String(coords.length));
    lines.push('70', '1'); // Closed

    // Write CAD vertices (CAD Y goes UP, invert Y from top-down raster if needed)
    for (const [x, y] of coords) {
      lines.push('10', String(Math.round(x * 100) / 100));
      lines.push('20', String(Math.round((bounds?.maxY ? bounds.maxY - y : y) * 100) / 100));
    }

    // TEXT entity for plot number inside the parcel
    const [cx, cy] = calculatePolygonCentroid(coords);
    const textCadY = bounds?.maxY ? bounds.maxY - cy : cy;
    lines.push('0', 'TEXT');
    lines.push('8', 'PLOT_NO');
    lines.push('10', String(Math.round(cx * 100) / 100));
    lines.push('20', String(Math.round(textCadY * 100) / 100));
    lines.push('40', '18.0'); // Text height
    lines.push('1', plot.plot_number);
    lines.push('72', '1'); // Center aligned
    lines.push('11', String(Math.round(cx * 100) / 100));
    lines.push('21', String(Math.round(textCadY * 100) / 100));
  }

  lines.push('0', 'ENDSEC');
  lines.push('0', 'EOF');

  return lines.join('\n');
}

/**
 * Generate clean standalone vector SVG file
 */
export function generateSvgContent(
  plots: Plot[],
  layout: ProjectLayout,
  includeBackground = true
): string {
  const bounds = layout.layout_bounds || { minX: 0, minY: 0, maxX: 1200, maxY: 800, width: 1200, height: 800 };
  const w = bounds.width || bounds.maxX - bounds.minX || 1200;
  const h = bounds.height || bounds.maxY - bounds.minY || 800;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.minX} ${bounds.minY} ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <style>
      .plot-boundary { stroke-width: 2.5; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
      .plot-label { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-weight: 800; text-anchor: middle; dominant-baseline: central; }
      .badge-bg { rx: 6px; fill: #ffffff; stroke: #334155; stroke-width: 1.5; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="${includeBackground ? '#ffffff' : 'none'}"/>
`;

  // Plot polygons
  for (const plot of plots) {
    const coords = plot.geometry?.coordinates;
    if (!coords || coords.length < 3) continue;

    const pointsStr = coords.map(([x, y]) => `${x},${y}`).join(' ');
    const colors = getStatusColor(plot.status);
    const [cx, cy] = calculatePolygonCentroid(coords);

    svg += `  <g id="plot-${plot.plot_number}">
    <polygon points="${pointsStr}" fill="${colors.fill}" fill-opacity="0.35" stroke="${colors.stroke}" stroke-width="1.5" class="plot-boundary" />
    <rect x="${cx - 18}" y="${cy - 14}" width="36" height="28" fill="#ffffff" fill-opacity="0.85" rx="4" class="badge-bg" />
    <text x="${cx}" y="${cy + 1}" font-size="16" font-weight="900" fill="#000000" text-anchor="middle" dominant-baseline="central" class="plot-label">${plot.plot_number}</text>
  </g>\n`;
  }

  svg += `</svg>`;
  return svg;
}

/**
 * Generate standard GeoJSON FeatureCollection
 */
export function generateGeoJsonContent(plots: Plot[], layout: ProjectLayout): string {
  const features = plots.map((p) => {
    const coords = p.geometry?.coordinates || [];
    // Closed ring for Polygon
    const ring = coords.length > 0 ? [...coords, coords[0]] : [];
    return {
      type: 'Feature',
      id: p.id,
      properties: {
        plot_number: p.plot_number,
        area_cents: p.area_cents,
        area_sqft: p.area_sqft,
        status: p.status,
        facing: p.facing,
        price_inr: p.price_inr,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [ring],
      },
    };
  });

  return JSON.stringify(
    {
      type: 'FeatureCollection',
      layout_id: layout.id,
      coordinate_reference: layout.coordinate_reference || 'local_cad',
      features,
    },
    null,
    2
  );
}

/**
 * Trigger browser file download
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
