#!/usr/bin/env node
// Loads knowledge/agri_knowledge.json, chunks each document, embeds every
// chunk with the local FastAPI embedding model, and upserts the results into
// Supabase's agri_knowledge_chunks table (pgvector).
//
// Run this once after applying supabase/migrations/*_agri_knowledge_rag.sql,
// and again any time knowledge/agri_knowledge.json changes.
//
// Requires (in your .env, NOT committed):
//   VITE_SUPABASE_URL              - already used by the frontend
//   SUPABASE_SERVICE_ROLE_KEY      - Supabase dashboard -> Project Settings -> API
//                                     (service role key; needed here ONLY to
//                                     bypass RLS for writing. Never expose
//                                     this key to the frontend/browser.)
//   AI_SERVICE_URL (optional, default http://127.0.0.1:8001)
//   EMBEDDING_MODEL (optional, default sentence-transformers/paraphrase-multilingual-mpnet-base-v2)
//
// Usage:
//   npm run ingest:knowledge

import '../server/loadEnv.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { chunkText } from '../server/chunking.js';
import { embedText, isEmbeddingModelReady, getEmbeddingModel } from '../server/embeddings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fail(message) {
  console.error(`\n[ingest_knowledge] ERROR: ${message}\n`);
  process.exit(1);
}

async function main() {
  console.log('[ingest_knowledge] Starting knowledge base ingestion...\n');

  // --- 1. Load the knowledge base file ---------------------------------
  const knowledgePath = path.join(__dirname, '..', 'knowledge', 'agri_knowledge.json');
  if (!fs.existsSync(knowledgePath)) {
    fail(`Knowledge base file not found at ${knowledgePath}`);
  }

  let documents;
  try {
    documents = JSON.parse(fs.readFileSync(knowledgePath, 'utf-8'));
  } catch (err) {
    fail(`Could not parse ${knowledgePath} as JSON: ${err.message}`);
  }

  if (!Array.isArray(documents) || documents.length === 0) {
    fail('Knowledge base file is empty or malformed (expected a non-empty JSON array).');
  }

  const REQUIRED_FIELDS = ['id', 'title', 'category', 'crop', 'source', 'url', 'content'];
  for (const doc of documents) {
    const missing = REQUIRED_FIELDS.filter((f) => !doc[f] && doc[f] !== '');
    if (missing.length > 0) {
      fail(`Document "${doc.id ?? '(no id)'}" is missing required field(s): ${missing.join(', ')}`);
    }
  }
  console.log(`[ingest_knowledge] Loaded ${documents.length} documents from knowledge/agri_knowledge.json`);

  // --- 2. Verify the embedding model is available ------------------------
  const { installed, model, installedModels, error } = await isEmbeddingModelReady();
  if (!installed) {
    fail(
      `Embedding model "${model}" is not available in the local AI service.\n` +
        (error ? `  (${error})\n` : `  Installed models: ${installedModels.join(', ') || '(none)'}\n`) +
        `  Fix: start the FastAPI service with the configured model, then re-run this script.`
    );
  }
  console.log(`[ingest_knowledge] Embedding model "${getEmbeddingModel()}" is installed.`);

  // --- 3. Connect to Supabase with the service role key -----------------
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) fail('VITE_SUPABASE_URL is not set in your .env file.');
  if (!serviceKey) {
    fail(
      'SUPABASE_SERVICE_ROLE_KEY is not set in your .env file.\n' +
        '  Find it in the Supabase dashboard under Project Settings -> API -> service_role key.\n' +
        '  Add it to .env as SUPABASE_SERVICE_ROLE_KEY=... (this key must never be committed or sent to the frontend).'
    );
  }
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Sanity-check the target table exists (i.e. the migration has been run).
  const { error: probeError } = await supabase.from('agri_knowledge_chunks').select('id').limit(1);
  if (probeError) {
    fail(
      `Could not query "agri_knowledge_chunks" (${probeError.message}).\n` +
        '  Have you run supabase/migrations/20260909120000_agri_knowledge_rag.sql against this project yet?'
    );
  }

  // --- 4. Chunk + embed + upsert every document --------------------------
  let totalChunks = 0;
  for (const doc of documents) {
    const chunks = chunkText(doc.content);
    console.log(`[ingest_knowledge] "${doc.id}" -> ${chunks.length} chunk(s)`);

    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = chunks[i];
      let embedding;
      try {
        embedding = await embedText(chunkContent);
      } catch (err) {
        fail(`Failed to embed chunk ${i} of "${doc.id}": ${err.message}`);
      }

      const { error: upsertError } = await supabase.from('agri_knowledge_chunks').upsert(
        {
          doc_id: doc.id,
          chunk_index: i,
          content: chunkContent,
          title: doc.title,
          category: doc.category,
          crop: doc.crop,
          source: doc.source,
          url: doc.url,
          embedding,
        },
        { onConflict: 'doc_id,chunk_index' }
      );

      if (upsertError) {
        fail(`Failed to upsert chunk ${i} of "${doc.id}": ${upsertError.message}`);
      }
      totalChunks += 1;
    }
  }

  console.log(
    `\n[ingest_knowledge] Done. Ingested ${totalChunks} chunk(s) from ${documents.length} document(s) into Supabase.\n`
  );
}

main().catch((err) => {
  console.error('[ingest_knowledge] Unexpected failure:', err);
  process.exit(1);
});
