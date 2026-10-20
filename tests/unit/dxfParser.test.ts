import { describe, it, expect } from 'vitest';
import { parseDxfFile } from '../../src/lib/dxfParser';

describe('CAD DXF Parser Engine', () => {
  it('handles empty or malformed DXF strings gracefully without crashing', () => {
    const result = parseDxfFile('');
    expect(result.success).toBe(false);
    expect(result.plots).toEqual([]);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('reports entity counts and layout bounds accurately', () => {
    // Basic DXF mock structure
    const mockDxf = `0
SECTION
2
ENTITIES
0
ENDSEC
0
EOF`;
    const result = parseDxfFile(mockDxf);
    expect(result.entityCounts).toBeDefined();
    expect(result.entityCounts.lwpolylines).toBe(0);
    expect(result.layoutBounds.width).toBeGreaterThanOrEqual(1000);
  });
});
