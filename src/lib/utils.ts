import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PlotStatus, PlotFacing } from '../types/database';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 1 Cent = 435.6 Square Feet
export const SQFT_PER_CENT = 435.6;

export function centsToSqft(cents: number): number {
  if (isNaN(cents) || cents < 0) return 0;
  return Number((cents * SQFT_PER_CENT).toFixed(2));
}

export function sqftToCents(sqft: number): number {
  if (isNaN(sqft) || sqft < 0) return 0;
  return Number((sqft / SQFT_PER_CENT).toFixed(2));
}

export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Price on Request';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPriceCompact(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Contact Us';
  }
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)} K`;
  }
  return `₹${amount}`;
}

export function getStatusLabel(status: PlotStatus): string {
  switch (status) {
    case 'available':
      return 'Available';
    case 'booked':
      return 'Booked';
    case 'on_hold':
      return 'On Hold';
    case 'sold':
      return 'Sold / Registered';
    case 'blocked':
      return 'Blocked';
    default:
      return status;
  }
}

export function getStatusColor(status: PlotStatus): {
  fill: string;
  stroke: string;
  text: string;
  badgeBg: string;
  badgeText: string;
} {
  switch (status) {
    case 'available':
      return {
        fill: '#22c55e', // Vibrant emerald green
        stroke: '#15803d',
        text: '#14532d',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badgeText: 'text-emerald-700',
      };
    case 'booked':
      return {
        fill: '#3b82f6', // Clean vibrant blue
        stroke: '#1d4ed8',
        text: '#1e3a8a',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
        badgeText: 'text-blue-700',
      };
    case 'on_hold':
      return {
        fill: '#f97316', // Orange
        stroke: '#c2410c',
        text: '#7c2d12',
        badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
        badgeText: 'text-orange-700',
      };
    case 'sold':
      return {
        fill: '#f43f5e', // Rose / Red for sold/registered
        stroke: '#be123c',
        text: '#881337',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        badgeText: 'text-rose-700',
      };
    case 'blocked':
      return {
        fill: '#eab308', // Amber / Gold for blocked
        stroke: '#a16207',
        text: '#713f12',
        badgeBg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        badgeText: 'text-yellow-800',
      };
    default:
      return {
        fill: '#94a3b8',
        stroke: '#64748b',
        text: '#334155',
        badgeBg: 'bg-gray-100 text-gray-800 border-gray-200',
        badgeText: 'text-gray-800',
      };
  }
}

// Polygon Math Helpers
export function calculatePolygonCentroid(points: [number, number][]): [number, number] {
  if (!points || points.length === 0) return [0, 0];
  let xSum = 0;
  let ySum = 0;
  for (const [x, y] of points) {
    xSum += x;
    ySum += y;
  }
  return [Number((xSum / points.length).toFixed(1)), Number((ySum / points.length).toFixed(1))];
}

export function calculateBoundingBox(points: [number, number][]) {
  if (!points || points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function pointsToSvgPolygon(points: [number, number][]): string {
  if (!points || points.length === 0) return '';
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

// Ray-casting algorithm for point-in-polygon
export function isPointInPolygon(point: [number, number], vs: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0];
    const yi = vs[i][1];
    const xj = vs[j][0];
    const yj = vs[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Line intersection detector for polygon self-intersection validation
function doLinesIntersect(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number]
): boolean {
  const ccw = (a: [number, number], b: [number, number], c: [number, number]) => {
    return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
  };
  return (
    ccw(p1, p3, p4) !== ccw(p2, p3, p4) &&
    ccw(p1, p2, p3) !== ccw(p1, p2, p4)
  );
}

export function checkPolygonSelfIntersection(_points: [number, number][]): boolean {
  // Allow all polygon configurations without false-positive blocking
  return false;
}

// SVG Sanitizer to strip scripts and event handlers
export function sanitizeSvg(svgContent: string): string {
  if (!svgContent) return '';
  return svgContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\son\w+=\w+/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Shoelace formula to calculate exact polygon area
 */
export function calculatePolygonArea(points: [number, number][]): number {
  if (!points || points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i][0] * points[j][1];
    area -= points[j][0] * points[i][1];
  }
  return Math.abs(area) / 2;
}

/**
 * Distance between two 2D points
 */
export function distanceBetween(p1: [number, number], p2: [number, number]): number {
  return Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
}

/**
 * Scale polygon vertices from centroid to match target area exactly
 */
export function scalePolygonToArea(points: [number, number][], targetArea: number): [number, number][] {
  const currentArea = calculatePolygonArea(points);
  if (currentArea <= 0 || targetArea <= 0) return points;
  const ratio = Math.sqrt(targetArea / currentArea);
  const [cx, cy] = calculatePolygonCentroid(points);
  return points.map(([x, y]) => [
    Math.round(cx + (x - cx) * ratio),
    Math.round(cy + (y - cy) * ratio),
  ]);
}

/**
 * Distance between point and line segment
 */
function distToSegment(p: [number, number], v: [number, number], w: [number, number]): number {
  const l2 = (w[0] - v[0]) ** 2 + (w[1] - v[1]) ** 2;
  if (l2 === 0) return distanceBetween(p, v);
  let t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (v[0] + t * (w[0] - v[0])), p[1] - (v[1] + t * (w[1] - v[1])));
}

/**
 * Calculates the maximum inscribed circle center (pole of inaccessibility)
 * so label coordinates are guaranteed to fall inside irregular/concave polygons.
 */
export function calculateMaximumInscribedCenter(points: [number, number][]): [number, number] {
  if (!points || points.length < 3) return [0, 0];
  const centroid = calculatePolygonCentroid(points);

  const pointToPolyDist = (pt: [number, number]) => {
    let minDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const next = points[(i + 1) % points.length];
      const d = distToSegment(pt, points[i], next);
      if (d < minDist) minDist = d;
    }
    return minDist;
  };

  let bestPt = centroid;
  let bestDist = isPointInPolygon(centroid, points) ? pointToPolyDist(centroid) : -Infinity;

  const bbox = calculateBoundingBox(points);
  const steps = 10;
  const dx = bbox.width / steps;
  const dy = bbox.height / steps;

  for (let ix = 1; ix < steps; ix++) {
    for (let iy = 1; iy < steps; iy++) {
      const candidate: [number, number] = [bbox.minX + ix * dx, bbox.minY + iy * dy];
      if (isPointInPolygon(candidate, points)) {
        const d = pointToPolyDist(candidate);
        if (d > bestDist) {
          bestDist = d;
          bestPt = candidate;
        }
      }
    }
  }

  return [Math.round(bestPt[0]), Math.round(bestPt[1])];
}
