-- Return the complete knowledge-chunk metadata contract used by server/rag.js.
-- This changes only the RPC definition; the table and existing chunks are unchanged.

drop function if exists public.match_agri_knowledge(extensions.vector, int, float);

create function public.match_agri_knowledge(
  query_embedding extensions.vector(768),
  match_count int default 5,
  match_threshold float default 0.3
)
returns table (
  id integer,
  doc_id text,
  chunk_index int,
  content text,
  title text,
  category text,
  crop text,
  language text,
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
    c.doc_id,
    c.chunk_index,
    c.content,
    c.title,
    c.category,
    c.crop,
    c.language,
    c.source,
    c.url,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.agri_knowledge_chunks c
  where 1 - (c.embedding <=> query_embedding) >= match_threshold
  order by c.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 20);
$$;

revoke all on function public.match_agri_knowledge(extensions.vector, int, float) from public;
grant execute on function public.match_agri_knowledge(extensions.vector, int, float) to anon, authenticated;