-- Fix layout bounds for layouts where layout_bounds was calculated from plot sub-bounds instead of full canvas
UPDATE public.project_layouts
SET layout_bounds = jsonb_build_object(
  'minX', 0,
  'minY', 0,
  'maxX', 2122,
  'maxY', 1460,
  'width', 2122,
  'height', 1460
)
WHERE id = '53c5d0e3-31e2-498f-8781-1a05d5c0104a'
   OR (layout_bounds->>'width')::numeric < 1000;
