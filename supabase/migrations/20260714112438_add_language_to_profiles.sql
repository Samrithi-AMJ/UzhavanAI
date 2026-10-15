/*
# Add language preference to profiles

## Overview
Adds a `language` column to the `profiles` table so the farmer advisory
app can deliver AI advice and UI text in the user's local language.

## Modified Tables
1. `profiles`
   - New column: `language` (text, NOT NULL, default 'en')
   - Stores a language code: 'en', 'hi', 'mr', 'ta', 'te', 'bn'

## Security
- No changes to existing RLS policies (the column is covered by the
  existing owner-scoped policies on `profiles`).

## Notes
1. Uses `ADD COLUMN IF NOT EXISTS` for idempotency.
2. Default is 'en' (English) so existing profiles get a valid value.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';

-- Backfill any nulls (shouldn't be any due to NOT NULL DEFAULT, but safe)
UPDATE profiles SET language = 'en' WHERE language IS NULL;
