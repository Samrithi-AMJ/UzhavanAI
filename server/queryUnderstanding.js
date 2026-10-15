// Turns the farmer's raw question into a distilled retrieval query, in
// English, that preserves the actual agricultural problem instead of
// diluting it with conversational wrapper text.
//
// Why this exists: embedding a question like "Give one short farming
// advice for clay soil with poor water infiltration" AS-IS mixes real
// agricultural signal (clay soil, water infiltration) with request-framing
// noise ("give one short advice for") that has no counterpart in the
// knowledge base. That noise pulls the embedding toward generic
// "irrigation/watering" documents (e.g. drip irrigation) instead of the
// specific "clay soil structure / infiltration" document — exactly the
// wrong-answer failure mode reported. Distilling the question to its core
// concepts before embedding fixes this at the retrieval stage, which is
// more reliable than trying to fix it after the fact by reranking alone.
//
// This single call also replaces the old "translate to English for
// retrieval" step (server/rag.js's previous englishGlossForRetrieval) —
// one Ollama call now does both translation AND concept distillation,
// for every language including English (an English question benefits from
// distillation too, not just non-English ones).

import { complete as localComplete } from './localAiService.js';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'i', 'you', 'we', 'they', 'he', 'she', 'it', 'my', 'your', 'our', 'their', 'me', 'him', 'her', 'us', 'them',
  'give', 'please', 'one', 'short', 'advice', 'need', 'want', 'know', 'what', 'when', 'where', 'why', 'how',
  'can', 'could', 'should', 'would', 'do', 'does', 'did', 'for', 'with', 'without', 'about', 'into', 'from',
  'my', 'as', 'of', 'on', 'in', 'at', 'to', 'and', 'or', 'but', 'if', 'then', 'after', 'before', 'also', 'just',
  'farm', 'farming', 'agriculture', 'agricultural', 'help', 'advisory', 'answer', 'question', 'problem',
  'kind', 'type', 'details', 'info', 'information', 'issue', 'problem', 'symptom', 'crop', 'plant', 'soil',
]);

function extractFallbackTerms(raw) {
  const candidates = raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token && token.length > 2 && !STOP_WORDS.has(token));

  const seen = new Set();
  const keyTerms = [];
  for (const token of candidates) {
    if (seen.has(token)) continue;
    seen.add(token);
    keyTerms.push(token);
    if (keyTerms.length >= 5) break;
  }

  const lower = raw.toLowerCase();
  const intentGroups = {
    harvesting: ['harvest', 'harvesting', 'maturity', 'mature', 'ripening', 'threshing'],
    irrigation: ['irrigation', 'watering', 'water demand', 'wetting', 'flooding'],
    fertilizer: ['fertilizer', 'fertilization', 'nitrogen', 'nutrient', 'manure'],
    pest: ['pest', 'insect', 'hopper', 'borer', 'infestation'],
    disease: ['disease', 'blight', 'rust', 'virus', 'symptom'],
    soil: ['soil', 'clay', 'drainage', 'infiltration', 'sodic', 'salinity'],
    sowing: ['sowing', 'planting', 'seed', 'transplanting'],
    'weed management': ['weed', 'weeding', 'herbicide'],
    'post-harvest': ['post-harvest', 'storage', 'stored', 'drying grain'],
  };
  const intentTerms = Object.entries(intentGroups)
    .filter(([, terms]) => terms.some((term) => lower.includes(term)))
    .map(([intent]) => intent);
  const retrievalQuery = [...keyTerms, ...intentTerms].join(' ');
  return { retrievalQuery, keyTerms: [...keyTerms, ...intentTerms], intentTerms };
}

const SYSTEM_PROMPT = `You help build a search query for an agricultural knowledge base. Given a farmer's question (in any language), extract the core agricultural search intent.

Ignore conversational/instruction wrapper phrases like "give me", "please", "one short tip", "what should I do", "I want to know" — they carry no search signal. Focus only on the actual agricultural subject: crop, soil type, symptom, problem, cause, or the specific practice being asked about.

Respond with ONLY a JSON object, nothing else, in this exact shape:
{"retrievalQuery": "<a short English phrase (5-12 words) capturing the actual agricultural topic/problem, suitable for semantic document search>", "keyTerms": ["term1", "term2", ...]}

keyTerms should be 2-5 short, concrete English words/phrases from the question that a relevant document should plausibly mention (e.g. crop name, soil type, symptom, specific practice). Do not include generic words like "farming", "advice", "help".

Example input: "Give one short farming advice for clay soil with poor water infiltration"
Example output: {"retrievalQuery": "clay soil poor water infiltration soil structure drainage", "keyTerms": ["clay soil", "water infiltration", "soil structure", "drainage"]}

Example input: "என் மிளகாய் செடியில் பூச்சி தாக்குதல் இருக்கிறது. என்ன செய்யலாம்?"
Example output: {"retrievalQuery": "chilli plant pest attack management", "keyTerms": ["chilli", "pest attack", "pest management"]}`;

/**
 * @returns {Promise<{ retrievalQuery: string, keyTerms: string[] }>}
 */
export async function understandQuery(question) {
  const trimmed = (question || '').trim();
  if (!trimmed) {
    return { retrievalQuery: '', keyTerms: [], intentTerms: [] };
  }

  let raw;
  try {
    raw = await localComplete(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: trimmed },
      ],
      { temperature: 0, format: 'json' }
    );
  } catch (err) {
    console.error('[UzhavanAI query-understanding] Call failed, falling back to raw question:', err.message);
    const fallback = extractFallbackTerms(trimmed);
    return { retrievalQuery: fallback.retrievalQuery || trimmed, keyTerms: fallback.keyTerms, intentTerms: fallback.intentTerms };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        parsed = null;
      }
    }
  }

  if (!parsed || typeof parsed.retrievalQuery !== 'string' || !parsed.retrievalQuery.trim()) {
    console.error('[UzhavanAI query-understanding] Unparseable output, falling back to raw question:', raw);
    const fallback = extractFallbackTerms(trimmed);
    return { retrievalQuery: fallback.retrievalQuery || trimmed, keyTerms: fallback.keyTerms, intentTerms: fallback.intentTerms };
  }

  const keyTerms = Array.isArray(parsed.keyTerms)
    ? parsed.keyTerms.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim())
    : [];

  if (keyTerms.length === 0) {
    const fallback = extractFallbackTerms(trimmed);
    return { retrievalQuery: parsed.retrievalQuery.trim() || fallback.retrievalQuery || trimmed, keyTerms: fallback.keyTerms, intentTerms: fallback.intentTerms };
  }

  const fallback = extractFallbackTerms(`${trimmed} ${parsed.retrievalQuery}`);
  return {
    retrievalQuery: `${parsed.retrievalQuery.trim()} ${fallback.intentTerms.join(' ')}`.trim(),
    keyTerms,
    intentTerms: fallback.intentTerms,
  };
}
