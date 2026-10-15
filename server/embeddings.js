// Thin client around the local FastAPI embedding service.
//
// This never talks to any paid/cloud API. Nothing here assumes an embedding
// model is installed: callers should use isEmbeddingModelReady() (or the
// /health response) before relying on embeddings, and every function here
// throws a typed EmbeddingError instead of crashing so the rest of the app can
// fall back gracefully.

const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001').replace(/\/+$/, '');

function getEmbeddingModel() {
  return process.env.EMBEDDING_MODEL || 'sentence-transformers/paraphrase-multilingual-mpnet-base-v2';
}

function getTimeoutMs() {
  return Number(process.env.EMBEDDING_TIMEOUT_MS || 60000);
}

export class EmbeddingError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = 'EmbeddingError';
    this.code = code; // 'MODEL_NOT_FOUND' | 'UNREACHABLE' | 'INVALID_RESPONSE' | 'TIMEOUT'
    this.cause = cause;
  }
}

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

/**
 * Checks whether the configured embedding model is actually available in
 * the local FastAPI service. We never assume an embedding model exists —
 * this is called before the RAG pipeline attempts to use one.
 */
export async function isEmbeddingModelReady() {
  const model = getEmbeddingModel();
  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`);
    const data = await response.json().catch(() => null);
    const installed = response.ok && data?.embedding_model === model;
    return { installed, model, installedModels: installed ? [model] : [] };
  } catch (err) {
    return { installed: false, model, installedModels: [], error: err.message };
  }
}

/**
 * Embeds a single piece of text using the FastAPI /embed endpoint.
 * Returns a plain number[] vector, or throws EmbeddingError.
 */
export async function embedText(text) {
  const model = getEmbeddingModel();
  const { signal, cancel } = withTimeout(getTimeoutMs());

  let res;
  try {
    res = await fetch(`${AI_SERVICE_URL}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new EmbeddingError('TIMEOUT', 'The local AI service took too long to generate an embedding.', err);
    }
    throw new EmbeddingError('UNREACHABLE', 'Could not reach the local AI service.', err);
  } finally {
    cancel();
  }

  if (res.status === 404) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error || '';
    } catch {
      /* ignore parse failure */
    }
    throw new EmbeddingError(
      'MODEL_NOT_FOUND',
      detail || `Embedding model "${model}" is not available in the local AI service.`
    );
  }

  if (!res.ok) {
    throw new EmbeddingError('UNREACHABLE', `AI service responded with status ${res.status}`);
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new EmbeddingError('INVALID_RESPONSE', 'The AI service returned an unreadable embedding response.', err);
  }

  const embedding = data?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new EmbeddingError('INVALID_RESPONSE', 'The AI service returned an empty embedding.');
  }

  return embedding;
}

/**
 * Embeds many texts sequentially (the embedding endpoint accepts one text per
 * call). Used by the ingestion script, not by the live chat request.
 */
export async function embedMany(texts, { onProgress } = {}) {
  const vectors = [];
  for (let i = 0; i < texts.length; i++) {
    const vec = await embedText(texts[i]);
    vectors.push(vec);
    if (onProgress) onProgress(i + 1, texts.length);
  }
  return vectors;
}

export { getEmbeddingModel };
