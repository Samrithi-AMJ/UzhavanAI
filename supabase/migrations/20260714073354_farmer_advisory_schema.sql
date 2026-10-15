/*
# Farmer Advisory App — Initial Schema

## Overview
Creates the database tables for an AI-based farmer advisory web application
with login, dashboard, chatbot, weather, and crop recommendation features.

## New Tables
1. `profiles`
   - Extends Supabase auth.users with farmer-specific metadata.
   - `id` (uuid, PK, references auth.users, CASCADE on delete)
   - `full_name` (text)
   - `farm_name` (text)
   - `location` (text — city/region name for weather lookups)
   - `latitude` (double precision, nullable)
   - `longitude` (double precision, nullable)
   - `farm_size_acres` (numeric, nullable)
   - `created_at` (timestamptz, default now())
   - `updated_at` (timestamptz, default now())

2. `chat_history`
   - Stores AI advisory chatbot conversations per user.
   - `id` (uuid, PK)
   - `user_id` (uuid, references profiles, CASCADE)
   - `role` (text: 'user' | 'assistant')
   - `content` (text)
   - `created_at` (timestamptz, default now())

3. `crop_recommendations`
   - Stores saved crop recommendation results per user.
   - `id` (uuid, PK)
   - `user_id` (uuid, references profiles, CASCADE)
   - `inputs` (jsonb — the soil/climate parameters used)
   - `results` (jsonb — the recommended crops array)
   - `created_at` (timestamptz, default now())

## Security
- RLS enabled on all tables.
- All tables are owner-scoped (user_id = auth.uid()).
- 4 CRUD policies per table, scoped TO authenticated.
- `profiles.id` doubles as the user_id reference to auth.users.

## Notes
1. A trigger auto-creates a profile row when a new auth user signs up.
2. `updated_at` on profiles is maintained by the frontend or a trigger.
*/

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  farm_name text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  latitude double precision,
  longitude double precision,
  farm_size_acres numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- chat_history
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_chats" ON chat_history;
CREATE POLICY "select_own_chats" ON chat_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_chats" ON chat_history;
CREATE POLICY "insert_own_chats" ON chat_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_chats" ON chat_history;
CREATE POLICY "update_own_chats" ON chat_history FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_chats" ON chat_history;
CREATE POLICY "delete_own_chats" ON chat_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chat_history_user_created
  ON chat_history (user_id, created_at);

-- ============================================================
-- crop_recommendations
-- ============================================================
CREATE TABLE IF NOT EXISTS crop_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE crop_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_recs" ON crop_recommendations;
CREATE POLICY "select_own_recs" ON crop_recommendations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_recs" ON crop_recommendations;
CREATE POLICY "insert_own_recs" ON crop_recommendations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_recs" ON crop_recommendations;
CREATE POLICY "update_own_recs" ON crop_recommendations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_recs" ON crop_recommendations;
CREATE POLICY "delete_own_recs" ON crop_recommendations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_crop_recs_user_created
  ON crop_recommendations (user_id, created_at);
