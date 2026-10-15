// Lightweight final-answer relevance check.
//
// This is the last line of defense against the exact failure mode
// reported: a question about "clay soil, poor water infiltration"
// getting answered with "use drip irrigation" — topically agricultural,
// but not actually addressing what was asked.
//
// Deliberately cheap: this is a plain substring/term-overlap check against
// the key concepts already extracted by server/queryUnderstanding.js, NOT
// another LLM call. It only escalates to an LLM call (one regeneration,
// maximum) when the check fails — most answers pass this for free.
//
// This is a heuristic, not a semantic judge — it can still have false
// negatives (a genuinely relevant answer that happens to paraphrase every
// key concept away) and false positives (an answer that coincidentally
// contains every word of a concept without really addressing it). Given
// the specific bug this exists to catch — a topically-adjacent-but-off-
// target answer — it intentionally requires an answer to contain ALL the
// significant words of a concept (not just one generic word shared with
// unrelated advice, like "water" alone matching both "water infiltration"
// and ordinary "water your plants" advice) before it's accepted as
// relevant. The cost of an unnecessary retry (one extra local Ollama call)
// is small; silently shipping the reported failure mode is not.

/**
 * @param {string} answer
 * @param {string[]} keyTerms
 * @returns {boolean} true if the answer appears to engage with at least one
 *   of the question's key concepts, or if there are no key terms to check
 *   against (nothing to validate — assume relevant).
 */
const TERM_SYNONYMS = {
  clay: ['clay', 'clayey', 'heavy soil', 'black soil', 'vertisol', 'soil structure', 'slow infiltration'],
  'water infiltration': ['water infiltration', 'infiltration', 'water logging', 'drainage', 'poor drainage', 'water not soaking', 'ponding', 'runoff'],
  drainage: ['drainage', 'drain', 'waterlogging', 'ponding', 'runoff', 'water logging'],
  'soil structure': ['soil structure', 'structure', 'compaction', 'aggregation', 'tilth'],
  disease: ['disease', 'infection', 'fungal', 'viral', 'bacterial', 'pest attack', 'symptoms'],
  pest: ['pest', 'insect', 'bug', 'infestation', 'thrips', 'aphid', 'borer', 'hopper'],
  irrigation: ['irrigation', 'watering', 'moisture', 'water schedule', 'drip', 'furrow'],
  fertilizer: ['fertilizer', 'nutrient', 'nitrogen', 'phosphorus', 'potassium', 'manure'],
};

function normalizeForMatch(value) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesTerm(answer, term) {
  const normalizedAnswer = normalizeForMatch(answer);
  const variants = new Set([
    ...((TERM_SYNONYMS[term] || [term]).map(normalizeForMatch)),
    ...normalizeForMatch(term).split(/\s+/),
  ]);

  return [...variants].some((variant) => {
    if (!variant || variant.length < 3) return false;
    if (variant.includes(' ')) {
      return normalizedAnswer.includes(variant);
    }
    const words = normalizedAnswer.split(/\s+/);
    return words.includes(variant) || normalizedAnswer.includes(variant);
  });
}

export function looksRelevant(answer, keyTerms, intentTerms = []) {
  if (!Array.isArray(keyTerms) || keyTerms.length === 0) return true;
  if (!answer || typeof answer !== 'string') return false;

  const lowerAnswer = normalizeForMatch(answer);
  const intentRelevant = intentTerms.length === 0 || intentTerms.some((intent) => {
    const variants = TERM_SYNONYMS[intent] || [intent];
    const matches = variants.filter((variant) => lowerAnswer.includes(normalizeForMatch(variant)));
    if (intent === 'harvesting') {
      const harvestSignal = matches.some((variant) => ['harvest', 'harvesting', 'threshing'].includes(variant));
      const stageOrMethodSignal = matches.some((variant) => ['maturity', 'mature', 'ripening', 'threshing'].includes(variant));
      return harvestSignal && stageOrMethodSignal;
    }
    return matches.length > 0;
  });
  if (!intentRelevant) return false;
  return keyTerms.some((term) => {
    const normalizedTerm = normalizeForMatch(term);
    if (!normalizedTerm) return false;
    const words = normalizedTerm.split(/\s+/).filter((w) => w.length >= 3);
    if (words.length === 0) return false;

    const conceptMatches = words.every((word) => lowerAnswer.includes(word) || matchesTerm(answer, word));
    if (conceptMatches) return true;

    const exactVariantMatch = matchesTerm(answer, normalizedTerm) || matchesTerm(answer, term);
    return exactVariantMatch;
  });
}

