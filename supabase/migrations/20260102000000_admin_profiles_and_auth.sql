-- ==============================================================================
-- FIX AUTH USER CREATION & GRANT AUTH ADMIN PERMISSIONS
-- Ensures supabase_auth_admin can execute trigger and write to public.profiles
-- Every new user created is automatically granted 'super_admin' role
-- ==============================================================================

-- 1. Grant schema and table permissions to supabase_auth_admin & postgres
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;

-- 2. Configure RLS policies on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO anon, authenticated, service_role USING (true);

DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated, service_role USING (true);

DROP POLICY IF EXISTS profiles_admin ON public.profiles;
CREATE POLICY profiles_admin ON public.profiles FOR ALL TO authenticated, service_role USING (true);

-- 3. Bulletproof trigger function with full qualification and grants
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_name TEXT;
  v_email TEXT;
BEGIN
  v_name := COALESCE(
    NULLIF(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(COALESCE(new.email, 'Admin'), '@', 1),
    'Admin'
  );

  v_email := COALESCE(new.email, new.id::text || '@user.local');

  INSERT INTO public.profiles (id, full_name, email, role, is_active)
  VALUES (
    new.id,
    v_name,
    v_email,
    'super_admin'::public.user_role,
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      role = 'super_admin'::public.user_role,
      is_active = true,
      updated_at = now();

  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'handle_new_user trigger notice: %', SQLERRM;
    RETURN new;
END;
$$;

-- 4. Grant execute on the trigger function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, supabase_auth_admin, anon, authenticated, service_role;

-- 5. Re-create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Elevate all existing profiles to super_admin
UPDATE public.profiles
SET role = 'super_admin'::public.user_role, is_active = true;
