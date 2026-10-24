-- Add map_link column to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS map_link TEXT;

-- Comment for documentation
COMMENT ON COLUMN public.projects.map_link IS 'Direct Google Maps or live map link configured for public site navigation and satellite modal';
