-- ==============================================================================
-- LEADS TABLE FULL MANAGE RLS POLICY
-- Allows lead status updates and management from admin portal without permission blocks
-- ==============================================================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leads_manage ON public.leads;

CREATE POLICY leads_manage ON public.leads FOR ALL 
TO authenticated, anon, service_role 
USING (true)
WITH CHECK (true);
