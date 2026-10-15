// The actual retrieval half of "Retrieval-Augmented Generation".
//
//   farmer question (any language)
//     -> query understanding: distill to a concept-preserving English
//        retrieval query + key terms (server/queryUnderstanding.js)
//     -> embed the distilled query with the local FastAPI embedding model
//     -> pgvector similarity search against agri_knowledge_chunks (Supabase),
//        fetching a wider candidate pool than we'll actually use
//     -> relevance reranking: a second-stage check of which candidates
//        actually address the SPECIFIC question, not just the general
//        topic (server/rerank.js)
//     -> final top-K relevant chunks, each with its source/title/url
//
// Every step here is defensive: if the embedding model or Supabase
// is unavailable, retrieveKnowledge() returns an empty result with a reason
// instead of throwing — the chatbot must still answer (without retrieved
// grounding, and saying so) rather than crash. This module never invents
// chunks or fake similarity scores: RAG_UNAVAILABLE / NO_MATCH always mean
// "nothing was retrieved", and every similarity number returned is a real
// value from pgvector's cosine distance.

import { embedText, isEmbeddingModelReady } from './embeddings.js';
import { getSupabaseClient } from './supabaseClient.js';
import { understandQuery } from './queryUnderstanding.js';
import { rerankChunks } from './rerank.js';

// How many candidates to pull from pgvector before reranking. Wider than
// what we'll actually use (RAG_FINAL_COUNT, see rerank.js) so the
// relevance step has real alternatives to choose between — e.g. a
// "drip irrigation" doc and a "clay soil structure" doc can both clear
// the similarity threshold for a water-infiltration question, and only
// the reranker can tell which one actually answers it.
const CANDIDATE_COUNT = Number(process.env.RAG_CANDIDATE_COUNT || 8);
// Vector similarity floor. Kept configurable rather than raised blindly —
// 0.35 (up from an earlier 0.3 default) reduces how often a merely
// topically-adjacent document ("water" for an "infiltration" question)
// clears the bar at all, while the reranking step is what actually decides
// which of the documents that DO clear it are used in the final answer.
const MATCH_THRESHOLD = Number(process.env.RAG_MATCH_THRESHOLD || 0.35);

/**
 * @returns {Promise<{
 *   chunks: Array<{ id: string, doc_id: string, chunk_index: number, content: string, title: string, category: string, crop: string, language: string, source: string, url: string, similarity: number }>,
 *   status: 'OK' | 'EMPTY_QUERY' | 'EMBEDDING_UNAVAILABLE' | 'SUPABASE_UNAVAILABLE' | 'NO_MATCH',
 *   debug: { retrievalQuery: string, keyTerms: string[], candidates: Array<{title: string, similarity: number}>, rerankApplied: boolean, rerankLabels: Array },
 * }>}
 */
export async function retrieveKnowledge(question, language) {
  const trimmed = (question || '').trim();
  if (!trimmed) {
    return { chunks: [], status: 'EMPTY_QUERY', debug: {} };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { chunks: [], status: 'SUPABASE_UNAVAILABLE', debug: {} };
  }

  const { installed } = await isEmbeddingModelReady();
  if (!installed) {
    return { chunks: [], status: 'EMBEDDING_UNAVAILABLE', debug: {} };
  }

  // Distill the question to its core agricultural concepts (in English,
  // regardless of the farmer's own language) before embedding it — see
  // queryUnderstanding.js for why this matters for retrieval quality.
  const { retrievalQuery, keyTerms, intentTerms = [] } = await understandQuery(trimmed);
  const queryText = retrievalQuery || trimmed;

  let queryEmbedding;
  try {
    queryEmbedding = await embedText(queryText);
  } catch (err) {
    console.error('[UzhavanAI RAG] Embedding failed:', err.code ?? '', err.message);
    return { chunks: [], status: 'EMBEDDING_UNAVAILABLE', debug: { retrievalQuery: queryText, keyTerms } };
  }

  let data, error;
  try {
    ({ data, error } = await supabase.rpc('match_agri_knowledge', {
      query_embedding: queryEmbedding,
      match_count: CANDIDATE_COUNT,
      match_threshold: MATCH_THRESHOLD,
    }));
  } catch (err) {
    console.error('[UzhavanAI RAG] Supabase RPC threw:', err);
    return { chunks: [], status: 'SUPABASE_UNAVAILABLE', debug: { retrievalQuery: queryText, keyTerms } };
  }

  if (error) {
    console.error('[UzhavanAI RAG] Supabase RPC error:', error.message);
    return { chunks: [], status: 'SUPABASE_UNAVAILABLE', debug: { retrievalQuery: queryText, keyTerms } };
  }

  if (!Array.isArray(data) || data.length === 0) {
    return { chunks: [], status: 'NO_MATCH', debug: { retrievalQuery: queryText, keyTerms, candidates: [] } };
  }

  // Older deployments may still expose the previous RPC return shape. Fetch
  // only missing metadata for those rows while the RPC migration propagates;
  // this does not change the pgvector ranking or candidate set.
  let rows = data;
  if (data.some((row) => row.title === undefined || row.doc_id === undefined || row.url === undefined)) {
    const ids = data.map((row) => row.id).filter((id) => id !== undefined && id !== null);
    if (ids.length > 0) {
      const { data: metadataRows, error: metadataError } = await supabase
        .from('agri_knowledge_chunks')
        .select('id,doc_id,chunk_index,title,category,crop,language,source,url')
        .in('id', ids);
      if (!metadataError && Array.isArray(metadataRows)) {
        const metadataById = new Map(metadataRows.map((row) => [String(row.id), row]));
        rows = data.map((row) => ({ ...row, ...metadataById.get(String(row.id)) }));
      }
    }
  }

  const candidates = rows.map((row) => ({
    id: row.id,
    doc_id: row.doc_id,
    chunk_index: row.chunk_index,
    content: row.content,
    title: row.title ?? '',
    language: row.language,
    source: row.source,
    url: row.url,
    category: row.category,
    crop: row.crop,
    similarity: row.similarity, // real pgvector cosine similarity — never fabricated
  }));

  // Second-stage relevance evaluation: which of these topically-similar
  // candidates actually address the farmer's SPECIFIC question? See
  // rerank.js — this never invents a new similarity score, it only
  // decides which real candidates are worth sending to the final prompt.
  const { chunks: rerankedChunks, rerankApplied, labels } = await rerankChunks(trimmed, keyTerms, candidates, intentTerms);

  const debug = {
    retrievalQuery: queryText,
    keyTerms,
    intentTerms,
    candidates: candidates.map((c) => ({ title: c.title, similarity: c.similarity })),
    rerankApplied,
    rerankLabels: labels,
  };

  if (rerankedChunks.length === 0) {
    // Every candidate that cleared the similarity threshold was judged
    // not actually relevant to this specific question — treat this the
    // same as no match at all, rather than forcing an off-topic document
    // into the answer just because something scored above the threshold.
    return { chunks: [], status: 'NO_MATCH', debug };
  }

  return { chunks: rerankedChunks, status: 'OK', debug };
}
