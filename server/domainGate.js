// Agriculture domain gate.
//
// Runs BEFORE retrieval/generation and decides whether the farmer's
// question is actually about agriculture/farming. This is a real
// classification step (a dedicated Ollama call constrained to JSON output),
// not a keyword filter — keyword matching ("includes('crop')") would miss
// a huge share of real farmer questions (symptom descriptions, "3 days of
// rain, what should I do", etc.) and was explicitly ruled out.
//
// Design choices that matter for correctness:
//   - Classification is done on the farmer's ORIGINAL text (whatever
//     language they typed in), not a translated gloss — Llama 3 can reason
//     about Tamil/Hindi/Telugu/Malayalam/Kannada agricultural questions
//     directly, and translating first would just add another failure point.
//   - The prompt explicitly lists the breadth of what counts as
//     agriculture (soil, pests, disease symptoms, machinery, government
//     schemes, market/selling of produce, livestock-adjacent farming
//     questions, weather-impact-on-crops, etc.) so vague-but-real farmer
//     questions ("leaves are turning yellow, what should I do?") are
//     recognized as agricultural.
//   - Fails OPEN: if the classifier call fails, times out, or returns
//     something unparseable, we treat the question as agricultural rather
//     than silently rejecting a real farmer. The one-sided risk here is
//     intentional — wrongly refusing a farmer is worse than occasionally
//     answering a borderline/off-topic message.
//   - Low-confidence "not agriculture" verdicts are also treated as
//     agricultural (see CONFIDENCE_REJECT_THRESHOLD below), per the
//     requirement to prefer letting a potentially-agricultural question
//     through over incorrectly rejecting a farmer.

import { complete as localComplete } from './localAiService.js';

// Only reject when the model is this confident the question is NOT
// agricultural. Anything less confident is allowed through as agriculture.
const CONFIDENCE_REJECT_THRESHOLD = Number(process.env.DOMAIN_GATE_REJECT_CONFIDENCE || 0.75);

const CLASSIFIER_SYSTEM_PROMPT = `You are a strict binary classifier. Decide whether the FARMER'S MESSAGE below is related to agriculture/farming, in ANY language (English, Tamil, Hindi, Telugu, Malayalam, Kannada, or a mix).

Agriculture/farming includes (not limited to): crop cultivation and selection, soil and soil testing, fertilizers and manure, irrigation and water management, seeds and sowing, harvesting, weeds, pests and pesticides, plant diseases and symptoms (even vague ones like "leaves turning yellow"), fungicides, crop nutrition, weather's effect on crops or farm work, farming practices and techniques, agricultural machinery/equipment, organic farming, livestock/dairy/poultry farming, selling or market prices for farm produce, government agricultural schemes/subsidies, and general farm management. A short or vague message about a plant/crop/field/farm problem should be treated as agriculture even without full detail.

NOT agriculture: general knowledge trivia (capitals, history, geography not about farming), programming/coding requests, entertainment, unrelated technology, politics unrelated to farming, or any other topic with no farming connection.

Respond with ONLY a JSON object, nothing else, in this exact shape:
{"isAgriculture": true or false, "confidence": a number from 0 to 1}`;

/**
 * @returns {Promise<{ isAgriculture: boolean, confidence: number, source: 'classifier' | 'fallback-open' }>}
 */
export async function classifyAgricultureDomain(question) {
  const trimmed = (question || '').trim();
  if (!trimmed) {
    // Empty messages are rejected earlier in index.js anyway; nothing to
    // gate here.
    return { isAgriculture: true, confidence: 0, source: 'fallback-open' };
  }

  let raw;
  try {
    raw = await localComplete(
      [
        { role: 'system', content: CLASSIFIER_SYSTEM_PROMPT },
        { role: 'user', content: `FARMER'S MESSAGE:\n${trimmed}` },
      ],
      { temperature: 0, format: 'json' }
    );
  } catch (err) {
    // Local model down/timeout/missing — fail OPEN. If the model is genuinely
    // unavailable the chat call right after this will fail anyway and the
    // farmer gets a clear "advisor unavailable" error instead of a wrong
    // "off-topic" refusal.
    console.error('[UzhavanAI domain-gate] Classifier call failed, failing open:', err.message);
    return { isAgriculture: true, confidence: 0, source: 'fallback-open' };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Some local models still wrap JSON in prose even in JSON mode; try to
    // salvage a {...} block before giving up and failing open.
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        parsed = null;
      }
    }
  }

  if (!parsed || typeof parsed.isAgriculture !== 'boolean') {
    console.error('[UzhavanAI domain-gate] Unparseable classifier output, failing open:', raw);
    return { isAgriculture: true, confidence: 0, source: 'fallback-open' };
  }

  const confidence = typeof parsed.confidence === 'number' && parsed.confidence >= 0 && parsed.confidence <= 1
    ? parsed.confidence
    : 0.5;

  // A confident "not agriculture" verdict rejects; anything else (including
  // an uncertain "not agriculture") is allowed through as agriculture.
  const isAgriculture = parsed.isAgriculture === true || confidence < CONFIDENCE_REJECT_THRESHOLD;

  return { isAgriculture, confidence, source: 'classifier' };
}

