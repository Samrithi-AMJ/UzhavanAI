// Shared Supabase client for the Node backend.
//
// This reuses the SAME Supabase project the frontend already uses (no new
// database is introduced). The backend only ever needs to READ the public
// agri_knowledge_chunks table (see supabase/migrations/*_agri_knowledge_rag.sql),
// which is intentionally readable by the anon/authenticated roles via RLS —
// so the existing anon key is enough here. Writing embeddings (ingestion)
// is a separate, explicitly-run script (scripts/ingest_knowledge.js) that
// uses the service role key instead, since it needs to bypass RLS to insert.

import './loadEnv.js';
import { createClient } from '@supabase/supabase-js';

let cachedClient = null;

export function getSupabaseClient() {
  if (cachedClient) return cachedClient;

  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  cachedClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}
