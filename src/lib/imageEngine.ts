// Client for the backend's real, vision-model-based image analysis
// endpoint (server/index.js's /api/image-diagnosis, server/visionModel.js,
// server/diagnosisValidator.js). This REPLACES the old client-side
// diagnoseImage() from diseaseEngine.ts, which derived a fake "diagnosis"
// from a hash of the image bytes filtered by the dropdown-selected crop —
// no actual image content was ever examined. Every result here comes from
// a real backend call; on any failure this throws rather than returning a
// fabricated result.
//
// Status contract (symptom-first, see server/diagnosisValidator.js):
// HEALTHY is only ever returned when the vision model reported no visible
// abnormalities AND the backend's validator didn't find contradicting
// evidence in the model's own reported symptoms. SUSPECTED_ISSUE and
// UNCERTAIN both mean "something may be wrong, but we're not certain
// exactly what" — the difference is whether a specific cause could be
// identified from the visual evidence.

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787';

export type ImageDiagnosisStatus =
  | 'HEALTHY'
  | 'SUSPECTED_ISSUE'
  | 'UNCERTAIN'
  | 'NOT_A_PLANT'
  | 'UNKNOWN_CROP'
  | 'CROP_MISMATCH'
  | 'DISEASE_DETECTED'
  | 'PEST_DETECTED'
  | 'ANALYSIS_FAILED'
  | 'VISION_MODEL_UNAVAILABLE';

export type DiagnosisSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

export type ImageDiagnosisResult = {
  status: ImageDiagnosisStatus;
  identifiedCrop: string | null;
  suspectedIssueName: string | null;
  observedSymptoms: string[];
  affectedParts: string[];
  visualEvidence: string[];
  possibleCauses: string[];
  severity: DiagnosisSeverity;
  recommendation: string;
  confidence: number; // 0-1, validated server-side — never fabricated client-side
};

export class ImageAnalysisError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'ImageAnalysisError';
    this.code = code;
  }
}

/**
 * Sends an uploaded image (base64, with or without the data: URL prefix)
 * plus the farmer's selected crop and language to the backend for real
 * analysis. Throws ImageAnalysisError on any failure (network, backend
 * error, vision model unavailable) — never returns a fabricated diagnosis.
 */
export async function analyzeCropImage(base64Image: string, crop: string, language: string): Promise<ImageDiagnosisResult> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/api/image-diagnosis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image, crop, language }),
    });
  } catch (err) {
    console.error('[UzhavanAI] Could not reach backend for image analysis:', err);
    throw new ImageAnalysisError('BACKEND_UNREACHABLE', 'Could not reach the local backend server.');
  }

  let body: Partial<ImageDiagnosisResult> & { error?: string; message?: string } | null = null;
  try {
    body = await res.json();
  } catch (err) {
    console.error('[UzhavanAI] Backend returned invalid JSON for image analysis:', err);
    throw new ImageAnalysisError('INVALID_RESPONSE', 'Backend returned an unreadable response.');
  }

  if (!res.ok) {
    const code = body?.error || 'ANALYSIS_FAILED';
    console.error('[UzhavanAI] Image analysis request failed:', code, body?.message);
    if (code === 'VISION_MODEL_NOT_FOUND') {
      throw new ImageAnalysisError('VISION_MODEL_UNAVAILABLE', body?.message || 'Image analysis model is not available.');
    }
    throw new ImageAnalysisError(code, body?.message || 'Image analysis failed.');
  }

  if (!body?.status) {
    throw new ImageAnalysisError('INVALID_RESPONSE', 'Backend returned no analysis status.');
  }

  return {
    status: body.status as ImageDiagnosisStatus,
    identifiedCrop: body.identifiedCrop ?? null,
    suspectedIssueName: body.suspectedIssueName ?? null,
    observedSymptoms: Array.isArray(body.observedSymptoms) ? body.observedSymptoms : [],
    affectedParts: Array.isArray(body.affectedParts) ? body.affectedParts : [],
    visualEvidence: Array.isArray(body.visualEvidence) ? body.visualEvidence : [],
    possibleCauses: Array.isArray(body.possibleCauses) ? body.possibleCauses : [],
    severity: (body.severity as DiagnosisSeverity) ?? 'UNKNOWN',
    recommendation: body.recommendation ?? '',
    confidence: typeof body.confidence === 'number' ? body.confidence : 0,
  };
}
