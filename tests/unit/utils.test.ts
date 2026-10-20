import { describe, it, expect } from 'vitest';
import {
  centsToSqft,
  sqftToCents,
  formatINR,
  formatPriceCompact,
  getStatusLabel,
  getStatusColor,
  calculatePolygonCentroid,
  calculateBoundingBox,
  isPointInPolygon,
  checkPolygonSelfIntersection,
  sanitizeSvg,
} from '../../src/lib/utils';

describe('Real Estate Utilities & Area Conversion', () => {
  it('converts cents to sqft accurately (1 cent = 435.6 sqft)', () => {
    expect(centsToSqft(1)).toBe(435.6);
    expect(centsToSqft(2.5)).toBe(1089);
    expect(centsToSqft(10)).toBe(4356);
    expect(centsToSqft(0)).toBe(0);
  });

  it('converts sqft to cents accurately', () => {
    expect(sqftToCents(435.6)).toBe(1);
    expect(sqftToCents(1089)).toBe(2.5);
    expect(sqftToCents(0)).toBe(0);
  });

  it('formats INR prices correctly', () => {
    expect(formatINR(null)).toBe('Price on Request');
    expect(formatINR(undefined)).toBe('Price on Request');
    const formatted = formatINR(2500000);
    expect(formatted).toContain('25,00,000');
  });

  it('formats compact prices', () => {
    expect(formatPriceCompact(2500000)).toBe('₹25.00 L');
    expect(formatPriceCompact(15000000)).toBe('₹1.50 Cr');
    expect(formatPriceCompact(null)).toBe('Contact Us');
  });

  it('provides consistent status labels and color codes', () => {
    expect(getStatusLabel('available')).toBe('Available');
    expect(getStatusLabel('booked')).toBe('Booked');
    expect(getStatusLabel('on_hold')).toBe('On Hold');
    expect(getStatusLabel('sold')).toBe('Sold / Registered');
    expect(getStatusLabel('blocked')).toBe('Blocked');

    const availColors = getStatusColor('available');
    expect(availColors.fill).toBe('#10b981');
    const soldColors = getStatusColor('sold');
    expect(soldColors.fill).toBe('#ef4444');
  });
});

describe('Polygon Geometry & CAD Math', () => {
  it('calculates polygon centroid correctly', () => {
    const square: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    const centroid = calculatePolygonCentroid(square);
    expect(centroid).toEqual([5, 5]);
  });

  it('calculates bounding box correctly', () => {
    const triangle: [number, number][] = [
      [10, 20],
      [50, 80],
      [20, 60],
    ];
    const bbox = calculateBoundingBox(triangle);
    expect(bbox.minX).toBe(10);
    expect(bbox.maxX).toBe(50);
    expect(bbox.minY).toBe(20);
    expect(bbox.maxY).toBe(80);
    expect(bbox.width).toBe(40);
    expect(bbox.height).toBe(60);
  });

  it('performs accurate ray-casting point-in-polygon checks', () => {
    const square: [number, number][] = [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ];
    expect(isPointInPolygon([50, 50], square)).toBe(true);
    expect(isPointInPolygon([150, 50], square)).toBe(false);
    expect(isPointInPolygon([-10, 50], square)).toBe(false);
  });

  it('detects self-intersecting invalid polygons (bowtie/hourglass)', () => {
    const normalSquare: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    expect(checkPolygonSelfIntersection(normalSquare)).toBe(false);

    // Self-intersecting figure-8 / bowtie polygon
    const bowtie: [number, number][] = [
      [0, 0],
      [10, 10],
      [10, 0],
      [0, 10],
    ];
    expect(checkPolygonSelfIntersection(bowtie)).toBe(true);
  });

  it('sanitizes SVG content to prevent XSS injection', () => {
    const maliciousSvg = `<svg><script>alert('xss')</script><circle cx="10" cy="10" r="5" onload="steal()" /></svg>`;
    const sanitized = sanitizeSvg(maliciousSvg);
    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('onload');
    expect(sanitized).toContain('<circle cx="10" cy="10" r="5"');
  });
});
