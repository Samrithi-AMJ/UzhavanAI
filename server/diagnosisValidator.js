// Second-stage diagnosis validation.
//
// This is the actual fix for the reported bug: a rice leaf with visible
// yellowing/discoloration was reported as "Healthy, 70%". The vision
// model's own JSON said status: HEALTHY despite (in cases like this)
// reporting symptoms, or simply being wrong that there were none. A
// prompt instruction telling the model "don't do that" (see
// visionModel.js's STEP 6) is necessary but not sufficient — this project
// treats a prompt as a strong hint, never a guarantee, everywhere it
// matters (see server/languageGuard.js and server/domainGate.js for the
// same principle applied to language enforcement and topic classification).
//
// This module is the code-level backstop that doesn't depend on the model
// getting it right: it re-checks the model's own reported evidence
// (observedSymptoms, visualEvidence) against a known list of abnormality
// keywords, and refuses to let a HEALTHY verdict stand if that evidence
// contradicts it — regardless of what confidence number came back.
//
// What this module does NOT do: it never invents a symptom, disease name,
// or evidence that wasn't in the model's own output. It only downgrades an
// unsafe HEALTHY claim to a more honest uncertain/suspected status, and
// clamps confidence to reasonable bounds for that status. It never
// upgrades UNCERTAIN/SUSPECTED_ISSUE into a specific disease name, and
// never fabricates a HEALTHY verdict either.

// Keyword list mirrors the abnormality categories the vision prompt is
// told to inspect for (visionModel.js STEP 3). Matched as case-insensitive
// substrings against the model's own observedSymptoms/visualEvidence
// phrases — these are the model's own words, never invented here.
const ABNORMALITY_KEYWORDS = [
  'yellow', 'chlorosis', 'brown spot', 'black spot', 'spot', 'lesion', 'streak', 'patch',
  'curl', 'dry', 'drying', 'necrosis', 'hole', 'chew', 'wilt', 'discolor',
  'powdery', 'fungal', 'fungus', 'rust', 'mold', 'mould', 'unusual texture',
  'stem damage', 'panicle damage', 'fruit damage', 'insect', 'webbing', 'egg',
  'pest', 'deficien', 'stress', 'blight', 'rot', 'mildew', 'gall', 'canker',
];

// Words that, when they appear in the SAME phrase as a color-change
// keyword like "yellow"/"discolor", indicate the model is describing
// normal ripening/maturity rather than a disease symptom (e.g. "golden
// ripening panicle") — matches visionModel.js's STEP 3 ripening guidance.
// This is a safety net for when the model still uses "yellow" loosely
// despite that prompt guidance; it only suppresses the specific
// color-change keywords, not the full abnormality list (a phrase like
// "ripening panicle with brown spots" still correctly counts as a symptom
// via "spot").
const RIPENING_CONTEXT_WORDS = ['ripe', 'ripening', 'ripened', 'matur', 'golden', 'harvest'];
const COLOR_CHANGE_KEYWORDS = ['yellow', 'discolor'];

function textHasAbnormalitySignal(strings) {
  return strings.some((phrase) => {
    const lower = phrase.toLowerCase();
    const isRipeningContext = RIPENING_CONTEXT_WORDS.some((w) => lower.includes(w));
    return ABNORMALITY_KEYWORDS.some((kw) => {
      if (!lower.includes(kw)) return false;
      if (isRipeningContext && COLOR_CHANGE_KEYWORDS.includes(kw)) return false; // suppressed: likely normal ripening, not a symptom
      return true;
    });
  });
}

const VALID_STATUSES = [
  'HEALTHY', 'SUSPECTED_ISSUE', 'UNCERTAIN', 'NOT_A_PLANT',
  'UNKNOWN_CROP', 'CROP_MISMATCH', 'DISEASE_DETECTED', 'PEST_DETECTED',
];

/**
 * @param {object} analysis - the raw, already-shape-validated output of visionModel.js's analyzeImage()
 * @returns {{ status: string, confidence: number, downgraded: boolean, downgradeReason: string|null }}
 */
export function validateDiagnosis(analysis) {
  let status = VALID_STATUSES.includes(analysis.status) ? analysis.status : 'UNCERTAIN';
  let confidence = analysis.confidence;
  let downgraded = false;
  let downgradeReason = null;

  if (status === 'NOT_A_PLANT' || status === 'UNKNOWN_CROP' || status === 'CROP_MISMATCH') {
    // Nothing to cross-check against symptom evidence — the model's own
    // NOT_A_PLANT call is accepted as-is (it's already the conservative
    // option relative to the failure mode this module exists to catch).
    return { status, confidence, downgraded, downgradeReason };
  }

  const hasSymptomEvidence = textHasAbnormalitySignal([...analysis.observedSymptoms, ...analysis.visualEvidence]);

  // THE CORE FIX: a HEALTHY verdict is not allowed to stand if the
  // model's own reported evidence contains abnormality language. This
  // catches exactly the reported bug — the model doesn't get to say
  // "yellowing/discoloration visible" in observedSymptoms and "HEALTHY"
  // in status at the same time.
  if (status === 'HEALTHY' && hasSymptomEvidence) {
    status = analysis.suspectedIssueName || analysis.possibleCauses.length > 0 ? 'SUSPECTED_ISSUE' : 'UNCERTAIN';
    confidence = Math.min(confidence, 0.6);
    downgraded = true;
    downgradeReason = 'MODEL_REPORTED_HEALTHY_WITH_SYMPTOMS';
  }

  // A model that can't even identify a specific crop has no real basis
  // for a confident HEALTHY verdict about it — carried over from the
  // guardrail added after an earlier false-"Healthy" incident on a
  // non-agricultural image with no identified crop.
  if (status === 'HEALTHY' && !analysis.identifiedCrop) {
    status = 'UNKNOWN_CROP';
    confidence = Math.min(confidence, 0.5);
    downgraded = true;
    downgradeReason = downgradeReason ?? 'NO_IDENTIFIED_CROP';
  }

  // Confidence sanity bounds per status — these are hard clamps, not
  // suggestions, so a model can't undermine them just by reporting a
  // high number.
  if (status === 'UNCERTAIN') {
    confidence = Math.min(confidence, 0.5);
  }
  if (status === 'SUSPECTED_ISSUE' && !analysis.suspectedIssueName && analysis.possibleCauses.length === 0) {
    // Symptoms observed but no specific cause identifiable at all —
    // don't let this present as more certain than "something to check."
    confidence = Math.min(confidence, 0.7);
  }

  return { status, confidence, downgraded, downgradeReason };
}

export { ABNORMALITY_KEYWORDS };
