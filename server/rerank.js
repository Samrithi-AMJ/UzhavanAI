// Lightweight second-stage relevance evaluation for RAG candidates.
//
// Vector similarity (from server/rag.js's pgvector search) is still the
// PRIMARY retrieval signal — this never overrides or fabricates a
// similarity score. What it adds: pgvector's cosine similarity measures
// general topical closeness ("this is about water/soil"), which is not
// the same as "this document actually answers the farmer's specific
// question." A document about drip irrigation and a document about clay
// soil structure can both score reasonably on "water infiltration" by
// embedding similarity alone, but only one of them actually answers "how
// do I improve infiltration in clay soil?" This step asks the model to
// judge relevance to the SPECIFIC question, categorically (HIGH /
// MEDIUM / LOW) — not a numeric confidence it could hallucinate — and
// only HIGH/MEDIUM candidates are kept, up to a small final count.
//
// Fails open toward the pre-rerank behavior: if this call errors or
// returns something unparseable, we fall back to simply taking the
// top-N candidates by similarity (the previous behavior), rather than
// blocking the whole request on a reranking failure.

import { complete as localComplete } from './localAiService.js';

const FINAL_COUNT = Number(process.env.RAG_FINAL_COUNT || 3);

function buildCandidateList(candidates) {
  return candidates
    .map((c, i) => {
      const snippet = c.content.length > 220 ? c.content.slice(0, 220) + '...' : c.content;
      const cropLine = c.crop && c.crop !== 'general' ? ` | crop: ${c.crop}` : '';
      return `[${i}] title: "${c.title}" | category: ${c.category}${cropLine}\n    content: ${snippet}`;
    })
    .join('\n');
}

const INTENT_VARIANTS = {
    harvesting: ['harvest', 'harvesting', 'maturity', 'mature', 'ripening', 'threshing'],
    irrigation: ['irrigation', 'watering', 'wetting', 'flooding'],
    fertilizer: ['fertilizer', 'fertilization', 'nitrogen', 'nutrient'],
    pest: ['pest', 'insect', 'hopper', 'borer', 'infestation'],
    disease: ['disease', 'blight', 'rust', 'virus', 'symptom'],
    soil: ['soil', 'clay', 'drainage', 'infiltration', 'sodic', 'salinity'],
    sowing: ['sowing', 'planting', 'seed', 'transplanting'],
    'weed management': ['weed', 'weeding', 'herbicide'],
    'post-harvest': ['post-harvest', 'storage', 'stored', 'drying grain'],
};

function hasIntentEvidence(candidate, intentTerms) {
  if (!Array.isArray(intentTerms) || intentTerms.length === 0) return true;
  const text = `${candidate.title || ''} ${candidate.content || ''}`.toLowerCase();
  return intentTerms.some((intent) => {
    const matches = (INTENT_VARIANTS[intent] || [intent]).filter((term) => text.includes(term));
    if (intent === 'harvesting') {
      const harvestSignal = matches.some((term) => ['harvest', 'harvesting', 'threshing'].includes(term));
      const stageOrMethodSignal = matches.some((term) => ['maturity', 'mature', 'ripening', 'threshing'].includes(term));
      return harvestSignal && stageOrMethodSignal;
    }
    return matches.length >= (intent === 'post-harvest' ? 2 : 1);
  });
}

/**
 * @param {string} question - the farmer's original question (any language OK;
 *   the model can reason about relevance across languages reasonably well
 *   even though candidate content is in English).
 * @param {string[]} keyTerms - concepts extracted by queryUnderstanding.js.
 * @param {Array} candidates - chunks from server/rag.js's pgvector search,
 *   already sorted by similarity (real cosine similarity, unchanged here).
 * @returns {Promise<{ chunks: Array, rerankApplied: boolean, labels: Array<{index:number,label:string}> }>}
 */
export async function rerankChunks(question, keyTerms, candidates, intentTerms = []) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { chunks: [], rerankApplied: false, labels: [] };
  }

  // Nothing to rerank among — just cap to the final count by similarity.
  if (candidates.length <= FINAL_COUNT) {
    return { chunks: candidates.filter((candidate) => hasIntentEvidence(candidate, intentTerms)), rerankApplied: false, labels: [] };
  }

  const keyTermsLine = keyTerms.length > 0 ? `\nKey concepts in the question: ${keyTerms.join(', ')}` : '';

  const systemPrompt = `You are judging how relevant each retrieved document is to a farmer's SPECIFIC question — not just whether it's about agriculture in general.

Classify each document as:
HIGH - directly addresses the specific problem/topic asked about.
MEDIUM - agriculturally related to the question but doesn't directly solve/address it.
LOW - agriculture-related in general but not actually relevant to this specific question (e.g. a different topic that merely shares a vague theme like "water" or "crops").

Respond with ONLY a JSON object, nothing else, in this exact shape:
{"relevance": [{"index": 0, "label": "HIGH"}, {"index": 1, "label": "LOW"}, ...]}
Include every document index exactly once.`;

  const userPrompt = `FARMER'S QUESTION: ${question}${keyTermsLine}

CANDIDATE DOCUMENTS:
${buildCandidateList(candidates)}`;

  let raw;
  try {
    raw = await localComplete(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0, format: 'json' }
    );
  } catch (err) {
    console.error('[UzhavanAI rerank] Call failed; refusing to use unverified candidates:', err.message);
    return { chunks: [], rerankApplied: true, labels: [] };
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

  const relevanceList = parsed?.relevance;
  if (!Array.isArray(relevanceList) || relevanceList.length === 0) {
    console.error('[UzhavanAI rerank] Unparseable output; refusing to use unverified candidates:', raw);
    return { chunks: [], rerankApplied: true, labels: [] };
  }

  const labelByIndex = new Map();
  for (const item of relevanceList) {
    if (typeof item?.index === 'number' && typeof item?.label === 'string') {
      labelByIndex.set(item.index, item.label.toUpperCase());
    }
  }

  const high = [];
  const medium = [];
  candidates.forEach((c, i) => {
    const label = labelByIndex.get(i);
    if (label === 'HIGH') high.push(c);
    else if (label === 'MEDIUM') medium.push(c);
    // LOW (or unlabeled, treated conservatively as not-relevant) is dropped.
  });

  const selected = [...high, ...medium]
    .filter((candidate) => hasIntentEvidence(candidate, intentTerms))
    .slice(0, FINAL_COUNT);

  return {
    chunks: selected,
    rerankApplied: true,
    labels: candidates.map((c, i) => ({ index: i, title: c.title, label: labelByIndex.get(i) || 'UNLABELED' })),
  };
}
