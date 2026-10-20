-- ==============================================================================
-- REAL ESTATE PLOT MANAGEMENT & BOOKING PLATFORM
-- Production Database Schema, Security Functions, RLS & Realtime Publication
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'project_admin', 'sales_staff', 'read_only');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE plot_status AS ENUM ('available', 'booked', 'on_hold', 'sold', 'blocked');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE plot_facing AS ENUM ('North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West', 'Other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('new_enquiry', 'contacted', 'visit_scheduled', 'booking_pending', 'on_hold', 'confirmed', 'cancelled', 'sold');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'read_only',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  coordinate_reference TEXT DEFAULT 'EPSG:4326',
  status project_status NOT NULL DEFAULT 'draft',
  cover_image_path TEXT,
  contact_information JSONB DEFAULT '{"phone": "", "email": "", "sales_office": ""}'::jsonb,
  booking_policy JSONB DEFAULT '{"allow_enquiries": true, "hold_duration_hours": 48, "require_approval": true}'::jsonb,
  total_land_area TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. PROJECT PHASES TABLE
CREATE TABLE IF NOT EXISTS public.project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. PROJECT LAYOUTS TABLE
CREATE TABLE IF NOT EXISTS public.project_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  source_file_path TEXT NOT NULL,
  source_file_type TEXT NOT NULL CHECK (source_file_type IN ('svg', 'dxf', 'pdf', 'image')),
  processing_status TEXT NOT NULL DEFAULT 'processed' CHECK (processing_status IN ('pending', 'processing', 'processed', 'failed')),
  coordinate_reference TEXT DEFAULT 'LOCAL_CAD',
  layout_bounds JSONB DEFAULT '{"minX": 0, "minY": 0, "maxX": 1000, "maxY": 1000, "width": 1000, "height": 1000}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  published_at TIMESTAMPTZ
);

-- 7. PLOTS TABLE
CREATE TABLE IF NOT EXISTS public.plots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.project_phases(id) ON DELETE SET NULL,
  plot_number TEXT NOT NULL,
  area_cents NUMERIC(10, 2) NOT NULL CHECK (area_cents > 0),
  area_sqft NUMERIC(10, 2) NOT NULL CHECK (area_sqft > 0),
  facing plot_facing NOT NULL DEFAULT 'East',
  price_inr NUMERIC(15, 2) CHECK (price_inr >= 0),
  status plot_status NOT NULL DEFAULT 'available',
  description TEXT,
  internal_notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_plot_number_per_project UNIQUE (project_id, plot_number)
);

-- 8. PLOT GEOMETRIES TABLE
CREATE TABLE IF NOT EXISTS public.plot_geometries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  layout_id UUID NOT NULL REFERENCES public.project_layouts(id) ON DELETE CASCADE,
  geometry_type TEXT NOT NULL DEFAULT 'polygon' CHECK (geometry_type IN ('polygon', 'multipolygon')),
  coordinates JSONB NOT NULL,
  coordinate_space TEXT NOT NULL DEFAULT 'local_cad',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_plot_layout_geometry UNIQUE (plot_id, layout_id)
);

-- 9. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference TEXT UNIQUE NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  plot_id UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT,
  preferred_contact_method TEXT DEFAULT 'phone' CHECK (preferred_contact_method IN ('phone', 'email', 'whatsapp')),
  message TEXT,
  consent_to_contact BOOLEAN NOT NULL DEFAULT true,
  status booking_status NOT NULL DEFAULT 'new_enquiry',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  hold_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. BOOKING EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.booking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. PROJECT DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('dtcp_approval', 'lp_approval', 'layout_plan', 'survey_plan', 'brochure', 'other')),
  description TEXT,
  approval_number TEXT,
  issue_date DATE,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. LEADS TABLE
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT,
  preferred_plot_type TEXT,
  budget_min NUMERIC(15, 2),
  budget_max NUMERIC(15, 2),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed')),
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  follow_up_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  previous_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. PROJECT MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'sales_staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_project_member UNIQUE (project_id, user_id)
);

-- 15. INDEXES
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_plots_project_id ON public.plots(project_id);
CREATE INDEX IF NOT EXISTS idx_plots_status ON public.plots(status);
CREATE INDEX IF NOT EXISTS idx_plots_price ON public.plots(price_inr);
CREATE INDEX IF NOT EXISTS idx_plots_area ON public.plots(area_cents);
CREATE INDEX IF NOT EXISTS idx_plot_geometries_plot ON public.plot_geometries(plot_id);
CREATE INDEX IF NOT EXISTS idx_plot_geometries_layout ON public.plot_geometries(layout_id);
CREATE INDEX IF NOT EXISTS idx_bookings_project ON public.bookings(project_id);
CREATE INDEX IF NOT EXISTS idx_bookings_plot ON public.bookings(plot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_project_docs_project ON public.project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project ON public.audit_logs(project_id);

-- 16. SECURITY HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active = true AND role IN ('super_admin', 'project_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_project_accessible(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id AND (status = 'published' OR public.is_staff())
  );
$$;

-- 17. AUTOMATIC PROFILE CREATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, is_active)
  VALUES (
    new.id,
    COALESCE(
      NULLIF(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(COALESCE(new.email, 'Admin User'), '@', 1)
    ),
    COALESCE(new.email, new.id::text || '@user.local'),
    'super_admin'::user_role,
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      role = 'super_admin'::user_role,
      is_active = true,
      updated_at = now();

  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 18. WORKFLOW STORED PROCEDURES

-- Submit Booking Enquiry
CREATE OR REPLACE FUNCTION public.submit_booking_enquiry(
  p_project_id UUID,
  p_plot_id UUID,
  p_customer_name TEXT,
  p_phone TEXT,
  p_email TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_contact_method TEXT DEFAULT 'phone',
  p_message TEXT DEFAULT NULL,
  p_consent BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plot RECORD;
  v_project RECORD;
  v_ref TEXT;
  v_booking_id UUID;
BEGIN
  IF length(trim(p_customer_name)) < 2 THEN
    RAISE EXCEPTION 'Customer name must be at least 2 characters';
  END IF;
  IF length(trim(p_phone)) < 7 THEN
    RAISE EXCEPTION 'A valid phone number is required';
  END IF;

  SELECT * INTO v_project FROM public.projects WHERE id = p_project_id;
  IF NOT FOUND OR v_project.status != 'published' THEN
    RAISE EXCEPTION 'This project is not currently accepting enquiries';
  END IF;

  SELECT * INTO v_plot FROM public.plots WHERE id = p_plot_id AND project_id = p_project_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The requested plot does not exist in this project';
  END IF;

  IF v_plot.status IN ('sold', 'blocked') THEN
    RAISE EXCEPTION 'This plot is no longer available for booking';
  END IF;

  v_ref := 'BK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO public.bookings (
    booking_reference,
    project_id,
    plot_id,
    customer_name,
    phone,
    email,
    location,
    preferred_contact_method,
    message,
    consent_to_contact,
    status
  ) VALUES (
    v_ref,
    p_project_id,
    p_plot_id,
    trim(p_customer_name),
    trim(p_phone),
    trim(p_email),
    trim(p_location),
    p_contact_method,
    trim(p_message),
    p_consent,
    'new_enquiry'
  ) RETURNING id INTO v_booking_id;

  INSERT INTO public.booking_events (
    booking_id,
    event_type,
    new_status,
    notes
  ) VALUES (
    v_booking_id,
    'enquiry_submitted',
    'new_enquiry',
    'Customer submitted online booking enquiry'
  );

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'booking_reference', v_ref,
    'plot_number', v_plot.plot_number,
    'project_name', v_project.name,
    'created_at', now()
  );
END;
$$;

-- Secure Plot Status Update
CREATE OR REPLACE FUNCTION public.update_plot_inventory_status(
  p_plot_id UUID,
  p_new_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_plot RECORD;
  v_actor_id UUID;
  v_typed_status plot_status;
BEGIN
  v_actor_id := auth.uid();
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Unauthorized: only staff can update plot inventory status';
  END IF;

  v_typed_status := p_new_status::plot_status;

  SELECT * INTO v_old_plot FROM public.plots WHERE id = p_plot_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plot not found';
  END IF;

  UPDATE public.plots
  SET status = v_typed_status,
      updated_by = v_actor_id,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_plot_id;

  INSERT INTO public.audit_logs (
    actor_id,
    project_id,
    entity_type,
    entity_id,
    action,
    previous_data,
    new_data
  ) VALUES (
    v_actor_id,
    v_old_plot.project_id,
    'plot',
    p_plot_id,
    'status_change',
    jsonb_build_object('status', v_old_plot.status, 'plot_number', v_old_plot.plot_number),
    jsonb_build_object('status', v_typed_status, 'notes', p_notes)
  );

  RETURN jsonb_build_object(
    'success', true,
    'plot_id', p_plot_id,
    'old_status', v_old_plot.status,
    'new_status', v_typed_status
  );
END;
$$;

-- Expire Stale Holds
CREATE OR REPLACE FUNCTION public.expire_stale_holds()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, plot_id, booking_reference FROM public.bookings
    WHERE status = 'on_hold' AND hold_expires_at IS NOT NULL AND hold_expires_at < now()
  LOOP
    UPDATE public.plots SET status = 'available', updated_at = now() WHERE id = r.plot_id AND status = 'on_hold';
    UPDATE public.bookings SET status = 'cancelled', updated_at = now() WHERE id = r.id;
    INSERT INTO public.booking_events (booking_id, event_type, previous_status, new_status, notes)
    VALUES (r.id, 'hold_expired', 'on_hold', 'cancelled', 'Hold window expired automatically');
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- 19. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plot_geometries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS profiles_admin ON public.profiles;
CREATE POLICY profiles_admin ON public.profiles FOR ALL TO authenticated USING (public.get_current_user_role() = 'super_admin');

-- Projects Policies
DROP POLICY IF EXISTS projects_select ON public.projects;
CREATE POLICY projects_select ON public.projects FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff());
DROP POLICY IF EXISTS projects_insert ON public.projects;
CREATE POLICY projects_insert ON public.projects FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS projects_update ON public.projects;
CREATE POLICY projects_update ON public.projects FOR UPDATE TO authenticated USING (public.is_admin());

-- Phases Policies
DROP POLICY IF EXISTS phases_select ON public.project_phases;
CREATE POLICY phases_select ON public.project_phases FOR SELECT TO anon, authenticated USING (public.is_project_accessible(project_id));
DROP POLICY IF EXISTS phases_manage ON public.project_phases;
CREATE POLICY phases_manage ON public.project_phases FOR ALL TO authenticated USING (public.is_admin());

-- Layouts Policies
DROP POLICY IF EXISTS layouts_select ON public.project_layouts;
CREATE POLICY layouts_select ON public.project_layouts FOR SELECT TO anon, authenticated USING (is_published = true OR public.is_staff());
DROP POLICY IF EXISTS layouts_manage ON public.project_layouts;
CREATE POLICY layouts_manage ON public.project_layouts FOR ALL TO authenticated USING (public.is_admin());

-- Plots Policies
DROP POLICY IF EXISTS plots_select ON public.plots;
CREATE POLICY plots_select ON public.plots FOR SELECT TO anon, authenticated USING (public.is_project_accessible(project_id));
DROP POLICY IF EXISTS plots_manage ON public.plots;
CREATE POLICY plots_manage ON public.plots FOR ALL TO authenticated USING (public.is_staff());

-- Geometries Policies
DROP POLICY IF EXISTS geometries_select ON public.plot_geometries;
CREATE POLICY geometries_select ON public.plot_geometries FOR SELECT TO anon, authenticated USING (public.is_staff() OR EXISTS (SELECT 1 FROM public.project_layouts WHERE id = layout_id AND is_published = true));
DROP POLICY IF EXISTS geometries_manage ON public.plot_geometries;
CREATE POLICY geometries_manage ON public.plot_geometries FOR ALL TO authenticated USING (public.is_staff());

-- Bookings Policies (Protected: anonymous cannot read private customer phone/name)
DROP POLICY IF EXISTS bookings_select ON public.bookings;
CREATE POLICY bookings_select ON public.bookings FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS bookings_update ON public.bookings;
CREATE POLICY bookings_update ON public.bookings FOR UPDATE TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS events_select ON public.booking_events;
CREATE POLICY events_select ON public.booking_events FOR SELECT TO authenticated USING (public.is_staff());

-- Documents Policies
DROP POLICY IF EXISTS documents_select ON public.project_documents;
CREATE POLICY documents_select ON public.project_documents FOR SELECT TO anon, authenticated USING ((is_public = true AND is_published = true) OR public.is_staff());
DROP POLICY IF EXISTS documents_manage ON public.project_documents;
CREATE POLICY documents_manage ON public.project_documents FOR ALL TO authenticated USING (public.is_staff());

-- Leads Policies
DROP POLICY IF EXISTS leads_manage ON public.leads;
CREATE POLICY leads_manage ON public.leads FOR ALL TO authenticated USING (public.is_staff());

-- Audit Logs Policies
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());

-- Project Members Policies
DROP POLICY IF EXISTS members_select ON public.project_members;
CREATE POLICY members_select ON public.project_members FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS members_admin ON public.project_members;
CREATE POLICY members_admin ON public.project_members FOR ALL TO authenticated USING (public.get_current_user_role() = 'super_admin');

-- 20. STORAGE BUCKETS SETUP
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('project-assets', 'project-assets', true),
  ('layout-source-files', 'layout-source-files', true),
  ('project-documents', 'project-documents', true),
  ('layout-previews', 'layout-previews', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 21. REALTIME PUBLICATION SETUP
DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.projects';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.plots';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.plot_geometries';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.project_layouts';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.project_documents';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.leads';
EXCEPTION WHEN duplicate_object THEN null;
END $$;
