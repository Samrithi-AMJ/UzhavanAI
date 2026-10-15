/*
# Farm Boundaries — GPS Farm Mapping

## Overview
Adds storage for a farmer's mapped field boundary (drawn on the interactive
map) and its computed area. This is kept separate from `profiles` because a
boundary is a polygon (an array of coordinates), not a single point — the
existing `profiles.latitude` / `profiles.longitude` / `profiles.farm_size_acres`
columns continue to hold the single "farm location" point and the
farmer-facing size, and are still updated (from the drawn boundary, when
available) rather than duplicated here.

## New Tables
1. `farm_boundaries`
   - One row per farmer (their most recent/active boundary).
   - `id` (uuid, PK)
   - `user_id` (uuid, references profiles, CASCADE, UNIQUE — one boundary per farmer)
   - `boundary` (jsonb — array of `{ lat, lng }` points outlining the field)
   - `center_latitude` (double precision — centroid of the boundary, or the
     GPS point if no boundary was drawn)
   - `center_longitude` (double precision)
   - `area_acres` (numeric)
   - `area_hectares` (numeric)
   - `created_at` (timestamptz, default now())
   - `updated_at` (timestamptz, default now())

## Security
- RLS enabled.
- 4 CRUD policies, owner-scoped via `user_id = auth.uid()`, TO authenticated.
- No farmer can read, insert, update, or delete another farmer's boundary.
*/

CREATE TABLE IF NOT EXISTS farm_boundaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  boundary jsonb NOT NULL DEFAULT '[]'::jsonb,
  center_latitude double precision,
  center_longitude double precision,
  area_acres numeric,
  area_hectares numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE farm_boundaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_farm_boundary" ON farm_boundaries;
CREATE POLICY "select_own_farm_boundary" ON farm_boundaries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_farm_boundary" ON farm_boundaries;
CREATE POLICY "insert_own_farm_boundary" ON farm_boundaries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_farm_boundary" ON farm_boundaries;
CREATE POLICY "update_own_farm_boundary" ON farm_boundaries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_farm_boundary" ON farm_boundaries;
CREATE POLICY "delete_own_farm_boundary" ON farm_boundaries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS farm_boundaries_user_id_idx ON farm_boundaries(user_id);
