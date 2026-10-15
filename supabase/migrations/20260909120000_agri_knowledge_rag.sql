-- UzhavanAI RAG knowledge base: pgvector storage + similarity search.
--
-- This migration ONLY adds new objects (extension, one new table, one new
-- function, new policies scoped to that table). It does not touch any
-- existing table (profiles, farm_details, chat_history, crop_recommendations,
-- weather_cache, etc.) and does not change any existing RLS policy.
--
-- Run this once against your existing Supabase project (SQL Editor, or
-- `supabase db push` if you use the CLI) before running
-- `npm run ingest:knowledge`.

-- 1. Enable pgvector (Supabase ships this extension; it just needs enabling).
create extension if not exists vector with schema extensions;

-- 2. Knowledge chunk storage.
--    embedding dimension = 768 to match Ollama's "nomic-embed-text" model
--    (the default EMBEDDING_MODEL — see server/embeddings.js). If you
--    configure a different embedding model with a different output size,
--    change the vector(768) dimension below to match before ingesting.
create table if not exists public.agri_knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  doc_id text not null,               -- stable id from knowledge/agri_knowledge.json, e.g. "clay-soil-water-infiltration-drainage"
  chunk_index int not null default 0, -- position of this chunk within its source document
  content text not null,
  title text not null,
  category text not null,             -- soil | irrigation | pest | disease | fertilizer | general
  crop text not null default 'general',
  source text not null,               -- e.g. "TNAU Agritech Portal"
  url text,
  embedding extensions.vector(768) not null,
  created_at timestamptz not null default now(),
  unique (doc_id, chunk_index)
);

comment on table public.agri_knowledge_chunks is
  'RAG knowledge base for the AI Farmer Advisor chatbot. Populated by scripts/ingest_knowledge.js from knowledge/agri_knowledge.json. Read-only from the app; write access is service-role only.';

-- 3. Similarity search index (cosine distance, matches the query in
--    match_agri_knowledge below). ivfflat needs at least a little data to
--    build well; with ~24 documents / a few dozen chunks this is more than
--    enough, and the index still works correctly (just not meaningfully
--    faster than a full scan) at this small scale.
create index if not exists agri_knowledge_chunks_embedding_idx
  on public.agri_knowledge_chunks
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 10);

create index if not exists agri_knowledge_chunks_category_idx on public.agri_knowledge_chunks (category);
create index if not exists agri_knowledge_chunks_crop_idx on public.agri_knowledge_chunks (crop);

-- 4. Row Level Security.
--    This table holds general agricultural knowledge, not farmer-specific
--    data, so read access is intentionally open to any signed-in (or
--    anonymous, since the chatbot's RAG retrieval runs from the backend
--    using the project's anon key) client. There is deliberately NO
--    insert/update/delete policy for anon/authenticated — only the
--    service role (used solely by scripts/ingest_knowledge.js) can write,
--    because service_role bypasses RLS entirely.
alter table public.agri_knowledge_chunks enable row level security;

drop policy if exists "Agri knowledge is readable by anyone" on public.agri_knowledge_chunks;
create policy "Agri knowledge is readable by anyone"
  on public.agri_knowledge_chunks
  for select
  to anon, authenticated
  using (true);

-- 5. Similarity search RPC used by server/rag.js.
--    Returns the top `match_count` chunks whose cosine similarity to
--    `query_embedding` is at least `match_threshold` (0..1, higher = more
--    similar; we convert pgvector's cosine *distance* with `1 - distance`).
create or replace function public.match_agri_knowledge(
  query_embedding extensions.vector(768),
  match_count int default 5,
  match_threshold float default 0.3
)
returns table (
  id uuid,
  content text,
  title text,
  category text,
  crop text,
  source text,
  url text,
  similarity float
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    c.id,
    c.content,
    c.title,
    c.category,
    c.crop,
    c.source,
    c.url,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.agri_knowledge_chunks c
  where 1 - (c.embedding <=> query_embedding) >= match_threshold
  order by c.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 20);
$$;

-- Only expose the RPC to roles that can already read the table.
revoke all on function public.match_agri_knowledge(extensions.vector, int, float) from public;
grant execute on function public.match_agri_knowledge(extensions.vector, int, float) to anon, authenticated;
