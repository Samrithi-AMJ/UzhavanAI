// Real image-based crop/plant analysis via Ollama's vision-capable models
// (e.g. llava, llama3.2-vision, moondream, bakllava — anything Ollama can
// run locally that accepts image input). This REPLACES the deterministic
// hash-based fake diagnosis that used to live in src/lib/diseaseEngine.ts's
// diagnoseImage() — that function derived a "diagnosis" purely from a hash
// of the image's base64 bytes, filtered by whatever crop the farmer picked
// from a dropdown, with a fabricated confidence score. None of that was
// real analysis, and it's no longer used in the production path (see
// ImageSearchPage.tsx and server/index.js's /api/image-diagnosis route).
//
// Like every other model dependency in this project (the chat model, the
// embedding model), we NEVER assume a vision model is installed — this is
// checked explicitly, and the app degrades to a clear "analysis
// unavailable" state rather than fabricating a result when it isn't.
//
// SYMPTOM-FIRST DESIGN (see also server/diagnosisValidator.js): a prior
// version of this prompt used a simple binary "does this look healthy?"
// framing. In real testing, this caused a serious safety bug: a rice leaf
// with visible yellowing/discoloration was confidently reported as
// "Healthy, 70%". The root cause was that the model was effectively
// treating "I can't confidently name a specific disease" as evidence FOR
// health, rather than as a separate kind of uncertainty. The prompt below
// forces the model to inspect for and describe concrete visual symptoms
// BEFORE reaching any health verdict, and to use an "I see a problem but
// can't be sure what it is" status (SUSPECTED_ISSUE / UNCERTAIN) instead
// of collapsing that into HEALTHY. This is reinforced by a second,
// code-level validation pass (diagnosisValidator.js) that does not rely on
// the model getting this right unassisted — see that file for why a
// prompt alone is not treated as a sufficient guarantee anywhere in this
// project (the same lesson already applied to language enforcement and
// domain classification elsewhere in the codebase).

const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001').replace(/\/+$/, '');

function getVisionModel() {
  return process.env.VISION_MODEL_NAME || process.env.VISION_MODEL || 'HuggingFaceTB/SmolVLM-256M-Instruct';
}

function getTimeoutMs() {
  return Number(process.env.VISION_TIMEOUT_MS || 45000); // vision inference is slower than text
}

export class VisionError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = 'VisionError';
    this.code = code; // 'MODEL_NOT_FOUND' | 'UNREACHABLE' | 'INVALID_RESPONSE' | 'TIMEOUT'
    this.cause = cause;
  }
}

/**
 * Checks whether the local Python inference service is available.
 */
export async function isVisionModelReady() {
  const model = getVisionModel();
  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`);
    const data = await response.json().catch(() => null);
    const installed = response.ok && data?.vision_model === model;
    return { installed, model, installedModels: installed ? [model] : [] };
  } catch (err) {
    return { installed: false, model, installedModels: [], error: err.message };
  }
}

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

const ANALYSIS_SYSTEM_PROMPT = `You are an expert plant pathologist assistant helping inspect a farmer's crop photo for an agricultural advisory app. You will be shown exactly one photo. Follow these steps IN ORDER before answering:

STEP 1 — Does the photo actually contain a plant/crop? A real, in-focus photo where a specific plant is the main subject counts. People, vehicles, buildings, animals, random objects, screenshots, digital art/AI-generated renderings, or scenes where a plant is only incidental in the background (a park, garden, cityscape) do NOT count, even if some greenery is visible.

STEP 2 — If it is a plant/crop photo, identify the crop if you reasonably can (e.g. "rice", "tomato", "cotton"). If you can't tell, say so — do not guess just to fill the field.

STEP 3 — Before forming any opinion about health, carefully inspect the visible plant tissue for EACH of these categories of abnormality, and note any that are present: yellowing, chlorosis, brown spots, black spots, lesions, streaks, patches, leaf curling, leaf drying, necrosis, holes, chewing damage, wilting, discoloration, powdery or fungal-looking growth, rust-like pustules, mold, unusual leaf texture, stem damage, panicle damage, fruit damage, visible insects, webbing, eggs, other visible pests, nutrient-deficiency-like symptoms (e.g. patterned yellowing), or water/heat-stress symptoms.

IMPORTANT — do not confuse normal ripening/maturity with disease: many crops naturally turn golden, yellow, or brown as grain, fruit, or the whole plant matures and approaches harvest — for example, ripe rice panicles/grains are normally golden-yellow, and this is healthy, not a symptom. Only count yellowing/browning/color change as a possible abnormality when it appears on LEAF tissue (especially green leaves) in an irregular, patchy, streaked, or blotchy pattern, or is accompanied by other signs like spots, lesions, curling, or wilting. A uniformly golden/tan seed head, panicle, or fruit that looks like normal ripening — with the surrounding leaves still healthy green — is a sign of healthy maturity, not disease, and should not by itself trigger SUSPECTED_ISSUE or UNCERTAIN.

STEP 4 — Describe ONLY what you can actually see. Do not invent or assume a symptom that isn't visually present in the photo.

STEP 5 — Only if visual evidence supports it, suggest possible causes/diseases. If symptoms are visible but you cannot confidently identify a specific cause, that is fine — report the symptoms and leave the cause general or uncertain rather than guessing a specific disease name.

STEP 6 — Decide a final status using this rule, which is the single most important rule in this task: finding no specific disease name is NOT the same as finding no symptoms. If the photo clearly shows a disease, use DISEASE_DETECTED; if it clearly shows pests or insect damage, use PEST_DETECTED; if symptoms are visible but the cause is uncertain, use UNCERTAIN; if it is a plant but the crop cannot be identified, use UNKNOWN_CROP. Never use HEALTHY for uncertainty, missing output, or a crop you cannot identify. Only use HEALTHY when the tissue you can clearly see is genuinely free of the abnormalities listed in Step 3.

Respond with ONLY a JSON object, nothing else, in this exact shape:
{
  "sceneDescription": "<one literal sentence describing the overall photo>",
  "status": "HEALTHY" or "DISEASE_DETECTED" or "PEST_DETECTED" or "UNCERTAIN" or "UNKNOWN_CROP" or "NOT_A_PLANT",
  "identifiedCrop": "<common English crop name, or null>",
  "suspectedIssueName": "<short common name for a suspected disease/pest, or null if none identifiable>",
  "observedSymptoms": ["<short phrase per visible symptom, e.g. \\"yellowing on leaf margins\\">"],
  "affectedParts": ["<e.g. \\"leaves\\", \\"stem\\", \\"panicle\\">"],
  "visualEvidence": ["<short phrase describing the specific visual evidence for your status/cause, e.g. \\"irregular yellow patches between leaf veins\\">"],
  "possibleCauses": ["<possible cause or disease name, only if evidence supports it>"],
  "severity": "LOW" or "MEDIUM" or "HIGH" or "UNKNOWN",
  "recommendation": "<one short, practical sentence for the farmer, e.g. suggesting closer inspection or that symptoms don't yet indicate a specific problem>",
  "confidence": <0 to 1 — your genuine confidence in this specific status. Use 0.8-0.95 only for a clearly healthy plant with good image quality. Use 0.4-0.7 when symptoms are visible but the exact cause is uncertain. Use 0.7-0.9 only when there is strong, specific visual evidence for a particular issue. Use 0.4 or below for blurry/dark/distant/obstructed photos or genuine uncertainty. For NOT_A_PLANT, this is your confidence that it is NOT a suitable plant photo. NEVER report high confidence for HEALTHY merely because you couldn't identify a specific disease — that is a failure of this task, not evidence of health.>
}

Arrays should be empty ([]) when there is nothing to report in that category — never invent entries to fill them.`;

/**
 * Sends the uploaded image to the local vision model for real analysis.
 * This returns the model's RAW self-reported analysis — server/index.js
 * runs it through diagnosisValidator.js (safety checks) and
 * resultTranslator.js (a dedicated translation pass, not this prompt)
 * before it ever reaches the farmer, so a model mistake or language slip
 * here is not the last line of defense.
 *
 * All JSON field values are requested in English regardless of the
 * farmer's selected language — asking a local vision model to switch
 * languages mid-JSON-response was tried and found unreliable (the same
 * lesson already learned for the chat advisor's language enforcement, see
 * server/languageGuard.js), so translation for display is handled as a
 * separate, dedicated, checked step (server/resultTranslator.js) instead.
 *
 * @param {string} base64Image - raw base64 image data (NOT a data: URL — strip the prefix before calling).
 * @param {string|null} selectedCrop - the crop the farmer picked in the UI, for context only (the model still identifies what it actually sees independently).
 */
export async function analyzeImage(base64Image, selectedCrop) {
  const model = getVisionModel();
  const { signal, cancel } = withTimeout(getTimeoutMs());

  const userText = selectedCrop
    ? `The farmer selected "${selectedCrop}" as the crop. Analyze the photo as instructed.`
    : 'Analyze the photo as instructed.';

  let res;
  try {
    res = await fetch(`${AI_SERVICE_URL}/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64Image,
        selected_crop: selectedCrop || null,
        prompt: `${ANALYSIS_SYSTEM_PROMPT}\n\n${userText}`,
      }),
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new VisionError('TIMEOUT', 'Image analysis took too long.', err);
    }
    throw new VisionError('UNREACHABLE', 'Could not reach the local AI service.', err);
  } finally {
    cancel();
  }

  if (res.status === 404) {
    throw new VisionError('MODEL_NOT_FOUND', `Vision model "${model}" is not available in the local AI service.`);
  }

  if (res.status === 400) {
    throw new VisionError('INVALID_IMAGE', 'The uploaded image is invalid or unreadable.');
  }

  if (!res.ok) {
    throw new VisionError('UNREACHABLE', `AI service responded with status ${res.status}`);
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new VisionError('INVALID_RESPONSE', 'The AI service returned an unreadable response.', err);
  }

  const raw = data?.content;
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new VisionError('INVALID_RESPONSE', 'The AI service returned an empty analysis.');
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

  const ALLOWED_STATUSES = [
    'HEALTHY', 'SUSPECTED_ISSUE', 'UNCERTAIN', 'NOT_A_PLANT',
    'UNKNOWN_CROP', 'CROP_MISMATCH', 'DISEASE_DETECTED', 'PEST_DETECTED',
  ];
  if (!parsed || typeof parsed.status !== 'string') {
    // Vision models can occasionally emit prose despite the JSON-only
    // instruction. Treat that as uncertainty rather than failing the upload
    // or inventing a diagnosis from an unstructured response.
    parsed = {
      status: 'UNCERTAIN',
      identifiedCrop: null,
      suspectedIssueName: null,
      observedSymptoms: [],
      affectedParts: [],
      visualEvidence: [],
      possibleCauses: [],
      severity: 'UNKNOWN',
      recommendation: 'The image could not be interpreted reliably. Please upload a clear crop photo for another check.',
      confidence: 0,
    };
  }

  const toStringArray = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : []);

  const confidence =
    typeof parsed.confidence === 'number' && parsed.confidence >= 0 && parsed.confidence <= 1
      ? parsed.confidence
      : 0; // never assume confidence when the model didn't give a usable number — treat as lowest confidence, not fabricated middle-ground

  return {
    sceneDescription: typeof parsed.sceneDescription === 'string' ? parsed.sceneDescription.trim() : '',
    status: ALLOWED_STATUSES.includes(parsed.status) ? parsed.status : 'UNCERTAIN',
    identifiedCrop: typeof parsed.identifiedCrop === 'string' && parsed.identifiedCrop.trim() ? parsed.identifiedCrop.trim() : null,
    suspectedIssueName:
      typeof parsed.suspectedIssueName === 'string' && parsed.suspectedIssueName.trim() ? parsed.suspectedIssueName.trim() : null,
    observedSymptoms: toStringArray(parsed.observedSymptoms),
    affectedParts: toStringArray(parsed.affectedParts),
    visualEvidence: toStringArray(parsed.visualEvidence),
    possibleCauses: toStringArray(parsed.possibleCauses),
    severity: ['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN'].includes(parsed.severity) ? parsed.severity : 'UNKNOWN',
    recommendation: typeof parsed.recommendation === 'string' ? parsed.recommendation.trim() : '',
    confidence,
  };
}

export { getVisionModel };
