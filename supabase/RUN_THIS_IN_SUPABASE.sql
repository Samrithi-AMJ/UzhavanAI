-- ============================================================
-- UzhavanAI - COMPLETE DATABASE SETUP
-- Profiles + Farm Boundaries
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  farm_name text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  farm_size_acres numeric,
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;

CREATE POLICY "select_own_profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;

CREATE POLICY "insert_own_profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;

CREATE POLICY "update_own_profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON public.profiles;

CREATE POLICY "delete_own_profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);


-- ============================================================
-- 2. AUTO CREATE PROFILE FOR NEW USERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 3. FARM BOUNDARIES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.farm_boundaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL UNIQUE
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,

  boundary jsonb NOT NULL DEFAULT '[]'::jsonb,

  center_latitude double precision,

  center_longitude double precision,

  area_acres numeric,

  area_hectares numeric,

  created_at timestamptz NOT NULL DEFAULT now(),

  updated_at timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 4. ENABLE SECURITY
-- ============================================================

ALTER TABLE public.farm_boundaries
ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 5. FARM BOUNDARY POLICIES
-- ============================================================

DROP POLICY IF EXISTS "select_own_farm_boundary"
ON public.farm_boundaries;

CREATE POLICY "select_own_farm_boundary"
ON public.farm_boundaries
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);


DROP POLICY IF EXISTS "insert_own_farm_boundary"
ON public.farm_boundaries;

CREATE POLICY "insert_own_farm_boundary"
ON public.farm_boundaries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);


DROP POLICY IF EXISTS "update_own_farm_boundary"
ON public.farm_boundaries;

CREATE POLICY "update_own_farm_boundary"
ON public.farm_boundaries
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


DROP POLICY IF EXISTS "delete_own_farm_boundary"
ON public.farm_boundaries;

CREATE POLICY "delete_own_farm_boundary"
ON public.farm_boundaries
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- ============================================================
-- 6. INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS farm_boundaries_user_id_idx
ON public.farm_boundaries(user_id);


-- ============================================================
-- 7. RELOAD SUPABASE SCHEMA CACHE
-- ============================================================

NOTIFY pgrst, 'reload schema';


-- ============================================================
-- 8. VERIFY
-- ============================================================

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'farm_boundaries');

SELECT count(*) AS farm_boundary_policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'farm_boundaries';