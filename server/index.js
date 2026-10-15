// UzhavanAI Backend Gateway (Node.js)
//
// Proxies frontend API requests from Vite (port 5173) to the
// UzhavanAI FastAPI inference service (port 8001).
// Completely free of Ollama, agent frameworks, or heavy local model dependencies.

import './loadEnv.js';
import http from 'node:http';

const PORT = Number(process.env.BACKEND_PORT || 8787);
const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001').replace(/\/+$/, '');
const AI_SERVICE_TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS || 60000);

const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(payload);
}

async function readBody(req, maxSize = 25_000_000) {
  return new Promise((resolve, reject) => {
    let raw = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxSize) {
        reject(new Error('REQUEST_BODY_TOO_LARGE'));
        req.destroy();
        return;
      }
      raw += chunk;
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

async function proxyToFastApi(req, res, targetPath) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_SERVICE_TIMEOUT_MS);

  try {
    let bodyData = null;
    if (req.method === 'POST') {
      bodyData = await readBody(req);
    }

    const headers = {
      'Content-Type': 'application/json',
    };

    const targetUrl = `${AI_SERVICE_URL}${targetPath}`;
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: bodyData,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);
    sendJson(res, response.status, data || { status: response.status });
  } catch (err) {
    if (err?.name === 'AbortError') {
      return sendJson(res, 504, {
        error: 'TIMEOUT',
        message: 'The AI service timed out while processing your request.',
      });
    }

    console.error(`[UzhavanAI Gateway] Error proxying to ${targetPath}:`, err.message);
    return sendJson(res, 502, {
      error: 'AI_SERVICE_UNREACHABLE',
      message: `Could not reach UzhavanAI FastAPI service at ${AI_SERVICE_URL}. Please ensure 'npm run ai:service' is running.`,
    });
  } finally {
    clearTimeout(timer);
  }
}

const server = http.createServer(async (req, res) => {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  try {
    if (url.pathname === '/api/health' || url.pathname === '/health') {
      return await proxyToFastApi(req, res, '/api/health');
    }
    if (url.pathname === '/api/chat' || url.pathname === '/chat') {
      return await proxyToFastApi(req, res, '/api/chat');
    }
    if (url.pathname === '/api/image-diagnosis' || url.pathname === '/image-diagnosis') {
      return await proxyToFastApi(req, res, '/api/image-diagnosis');
    }
    return sendJson(res, 404, { error: 'NOT_FOUND', message: `Unknown endpoint: ${url.pathname}` });
  } catch (err) {
    console.error('[UzhavanAI Gateway] Unhandled error:', err);
    return sendJson(res, 500, { error: 'INTERNAL_ERROR', message: 'Internal server error.' });
  }
});

server.listen(PORT, () => {
  console.log(`[UzhavanAI Gateway] Server listening on http://localhost:${PORT}`);
  console.log(`[UzhavanAI Gateway] Forwarding AI requests to FastAPI service at ${AI_SERVICE_URL}`);
});
