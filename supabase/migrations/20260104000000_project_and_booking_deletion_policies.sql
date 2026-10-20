-- ==============================================================================
-- PROJECT & BOOKING DELETION RLS POLICIES
-- Enables deletion of projects, bookings, and dependent records without RLS blockage
-- ==============================================================================

-- 1. Ensure public.projects has full ALL/DELETE permissions
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS projects_delete ON public.projects;
DROP POLICY IF EXISTS projects_manage ON public.projects;

CREATE POLICY projects_manage ON public.projects FOR ALL 
TO authenticated, anon, service_role 
USING (true)
WITH CHECK (true);

-- 2. Ensure public.bookings has full ALL/DELETE permissions
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bookings_delete ON public.bookings;
DROP POLICY IF EXISTS bookings_manage ON public.bookings;

CREATE POLICY bookings_manage ON public.bookings FOR ALL 
TO authenticated, anon, service_role 
USING (true)
WITH CHECK (true);

-- 3. Ensure public.booking_events has full ALL/DELETE permissions
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS events_delete ON public.booking_events;
DROP POLICY IF EXISTS events_manage ON public.booking_events;

CREATE POLICY events_manage ON public.booking_events FOR ALL 
TO authenticated, anon, service_role 
USING (true)
WITH CHECK (true);

-- 4. Ensure public.project_phases has full ALL/DELETE permissions
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS phases_delete ON public.project_phases;
DROP POLICY IF EXISTS phases_manage ON public.project_phases;

CREATE POLICY phases_manage ON public.project_phases FOR ALL 
TO authenticated, anon, service_role 
USING (true)
WITH CHECK (true);
