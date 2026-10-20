-- ==============================================================================
-- STORAGE BUCKET POLICIES & EXTENDED LAYOUT PERMISSIONS
-- Fixes "new row violates row-level security policy" on file uploads
-- ==============================================================================

-- 1. Ensure storage buckets exist and are public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('layout-source-files', 'layout-source-files', true, 52428800, null),
  ('project-documents', 'project-documents', true, 52428800, null),
  ('project-assets', 'project-assets', true, 52428800, null),
  ('layout-previews', 'layout-previews', true, 52428800, null)
ON CONFLICT (id) DO UPDATE 
SET public = true, 
    file_size_limit = 52428800;

-- 2. Storage Objects RLS Policies
-- (RLS is already enabled on storage.objects by Supabase system role)

-- Allow Public/Anon/Authenticated Reads from all project buckets
DROP POLICY IF EXISTS "Public Bucket Reads" ON storage.objects;
CREATE POLICY "Public Bucket Reads"
ON storage.objects FOR SELECT
TO public, anon, authenticated, service_role
USING (bucket_id IN ('layout-source-files', 'project-documents', 'project-assets', 'layout-previews'));

-- Allow File Uploads (INSERT) to project buckets
DROP POLICY IF EXISTS "Allow Uploads to Buckets" ON storage.objects;
CREATE POLICY "Allow Uploads to Buckets"
ON storage.objects FOR INSERT
TO public, anon, authenticated, service_role
WITH CHECK (bucket_id IN ('layout-source-files', 'project-documents', 'project-assets', 'layout-previews'));

-- Allow File Updates (UPDATE/OVERWRITE) in project buckets
DROP POLICY IF EXISTS "Allow Updates to Buckets" ON storage.objects;
CREATE POLICY "Allow Updates to Buckets"
ON storage.objects FOR UPDATE
TO public, anon, authenticated, service_role
USING (bucket_id IN ('layout-source-files', 'project-documents', 'project-assets', 'layout-previews'))
WITH CHECK (bucket_id IN ('layout-source-files', 'project-documents', 'project-assets', 'layout-previews'));

-- Allow File Deletes (DELETE) in project buckets
DROP POLICY IF EXISTS "Allow Deletes in Buckets" ON storage.objects;
CREATE POLICY "Allow Deletes in Buckets"
ON storage.objects FOR DELETE
TO public, anon, authenticated, service_role
USING (bucket_id IN ('layout-source-files', 'project-documents', 'project-assets', 'layout-previews'));

-- 3. Ensure public.project_layouts RLS permits inserts & updates
ALTER TABLE public.project_layouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS layouts_select ON public.project_layouts;
CREATE POLICY layouts_select ON public.project_layouts FOR SELECT 
TO public, anon, authenticated, service_role 
USING (true);

DROP POLICY IF EXISTS layouts_manage ON public.project_layouts;
CREATE POLICY layouts_manage ON public.project_layouts FOR ALL 
TO authenticated, service_role 
USING (true)
WITH CHECK (true);

-- 4. Ensure public.project_documents RLS permits inserts & updates
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS documents_select ON public.project_documents;
CREATE POLICY documents_select ON public.project_documents FOR SELECT 
TO public, anon, authenticated, service_role 
USING (true);

DROP POLICY IF EXISTS documents_manage ON public.project_documents;
CREATE POLICY documents_manage ON public.project_documents FOR ALL 
TO authenticated, service_role 
USING (true)
WITH CHECK (true);

-- 5. Ensure public.plots and plot_geometries permit staff and admin management
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plots_select ON public.plots;
CREATE POLICY plots_select ON public.plots FOR SELECT 
TO public, anon, authenticated, service_role 
USING (true);

DROP POLICY IF EXISTS plots_manage ON public.plots;
CREATE POLICY plots_manage ON public.plots FOR ALL 
TO authenticated, service_role 
USING (true)
WITH CHECK (true);

ALTER TABLE public.plot_geometries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS geometries_select ON public.plot_geometries;
CREATE POLICY geometries_select ON public.plot_geometries FOR SELECT 
TO public, anon, authenticated, service_role 
USING (true);

DROP POLICY IF EXISTS geometries_manage ON public.plot_geometries;
CREATE POLICY geometries_manage ON public.plot_geometries FOR ALL 
TO authenticated, service_role 
USING (true)
WITH CHECK (true);
