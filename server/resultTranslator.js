// Translates the farmer-facing, free-text fields of an image diagnosis
// (observedSymptoms, possibleCauses, recommendation, and suspectedIssueName
// when it didn't match a curated database entry) into the selected
// language.
//
// Why this exists as a real translation pass rather than just asking the
// vision model nicely in its own prompt: that was tried first (see
// visionModel.js's languageNote), and — exactly like the chat advisor's
// language enforcement before it (see server/languageGuard.js) — a local
// model asked to produce mostly-English structured JSON with one
// non-English field is unreliable about actually doing it. The reported
// symptom was real: recommendation text kept coming back in English even
// with Tamil selected. This module makes translation a guaranteed,
// checked step instead of a hope.
//
// What this does NOT do: it never invents new symptoms, causes, or
// recommendations — it only translates the exact text the vision model
// already produced. If the translation call fails for any reason, the
// original English text is returned unchanged (a farmer seeing English
// text is better than losing the content entirely).

import { complete as localComplete } from './localAiService.js';
import { languageName } from './promptBuilder.js';

/**
 * @param {object} fields
 * @param {string|null} fields.suspectedIssueName
 * @param {string[]} fields.observedSymptoms
 * @param {string[]} fields.possibleCauses
 * @param {string} fields.recommendation
 * @param {string} language - target language code (e.g. 'ta', 'hi'). If 'en' or falsy, returns fields unchanged (no call made).
 */
export async function translateDiagnosisFields(fields, language) {
  if (!language || language === 'en') {
    return fields;
  }

  const hasContent =
    (fields.suspectedIssueName && fields.suspectedIssueName.trim()) ||
    fields.observedSymptoms.length > 0 ||
    fields.possibleCauses.length > 0 ||
    (fields.recommendation && fields.recommendation.trim());

  if (!hasContent) {
    return fields; // nothing to translate
  }

  const targetName = languageName(language);

  const payload = {
    suspectedIssueName: fields.suspectedIssueName || null,
    observedSymptoms: fields.observedSymptoms,
    possibleCauses: fields.possibleCauses,
    recommendation: fields.recommendation || '',
  };

  const systemPrompt = `Translate the text values in this JSON object into natural, everyday ${targetName}, the way a farmer would actually speak — not a stiff literal translation. Keep the exact same JSON structure and keys. Keep array lengths the same (translate each array item, don't add/remove/merge items). If a value is null or an empty string/array, leave it as-is. Do not add any new information, symptoms, causes, or advice beyond what's already there — only translate what's given. Respond with ONLY the translated JSON object, nothing else.`;

  let raw;
  try {
    raw = await localComplete(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(payload) },
      ],
      { temperature: 0.2, format: 'json' }
    );
  } catch (err) {
    console.error('[UzhavanAI image-diagnosis] Translation pass failed, returning original English text:', err.message);
    return fields;
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

  if (!parsed || typeof parsed !== 'object') {
    console.error('[UzhavanAI image-diagnosis] Unparseable translation output, returning original English text:', raw?.slice(0, 200));
    return fields;
  }

  // Defensive per-field validation: only accept translated values that are
  // shape-compatible with the original (same array length, right types) —
  // otherwise keep the original English for that specific field rather
  // than risk a garbled or truncated translation reaching the farmer.
  const translated = { ...fields };

  if (fields.suspectedIssueName) {
    if (typeof parsed.suspectedIssueName === 'string' && parsed.suspectedIssueName.trim()) {
      translated.suspectedIssueName = parsed.suspectedIssueName.trim();
    }
  }

  if (fields.observedSymptoms.length > 0 && Array.isArray(parsed.observedSymptoms) && parsed.observedSymptoms.length === fields.observedSymptoms.length) {
    translated.observedSymptoms = parsed.observedSymptoms.map((s, i) => (typeof s === 'string' && s.trim() ? s.trim() : fields.observedSymptoms[i]));
  }

  if (fields.possibleCauses.length > 0 && Array.isArray(parsed.possibleCauses) && parsed.possibleCauses.length === fields.possibleCauses.length) {
    translated.possibleCauses = parsed.possibleCauses.map((s, i) => (typeof s === 'string' && s.trim() ? s.trim() : fields.possibleCauses[i]));
  }

  if (fields.recommendation && typeof parsed.recommendation === 'string' && parsed.recommendation.trim()) {
    translated.recommendation = parsed.recommendation.trim();
  }

  return translated;
}
