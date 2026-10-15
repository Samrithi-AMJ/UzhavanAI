// Client for the self-hosted Python inference service.

const BASE_URL = (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001').replace(/\/+$/, '');
const TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS || 60000);

export class AiServiceError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = 'AiServiceError';
    this.code = code;
    this.cause = cause;
  }
}

async function post(path, payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new AiServiceError('AI_SERVICE_ERROR', body?.detail || body?.message || `AI service returned ${response.status}`);
    }
    return body;
  } catch (err) {
    if (err instanceof AiServiceError) throw err;
    if (err?.name === 'AbortError') throw new AiServiceError('TIMEOUT', 'The local AI service timed out.', err);
    throw new AiServiceError('UNREACHABLE', 'Could not reach the local Python AI service.', err);
  } finally {
    clearTimeout(timer);
  }
}

export async function complete(messages, options = {}) {
  const body = await post('/complete', {
    messages,
    temperature: options.temperature,
    response_format: options.format === 'json' ? 'json' : 'text',
  });
  if (typeof body?.text !== 'string' || !body.text.trim()) {
    throw new AiServiceError('INVALID_RESPONSE', 'The local AI service returned empty text.');
  }
  return body.text.trim();
}

export async function checkAiServiceHealth() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${BASE_URL}/health`, { signal: controller.signal });
    const body = await response.json().catch(() => null);
    return response.ok ? body : { ok: false, error: body?.detail || `status ${response.status}` };
  } catch (err) {
    return { ok: false, error: err?.message || 'unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

