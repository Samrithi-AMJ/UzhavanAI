from __future__ import annotations

import json
import logging
import re
from typing import Any

from .config import settings
from .hosted_llm import generate_vision, is_llm_configured, HostedLLMError

logger = logging.getLogger(__name__)

CROP_ALIASES = {
    'paddy': 'rice',
    'rice': 'paddy',
    'maize': 'corn',
    'corn': 'maize',
    'groundnut': 'peanut',
    'peanut': 'groundnut',
    'chilli': 'chili',
    'chili': 'chilli',
}

LANGUAGE_CONFIG = {
    'en': {
        'name': 'English',
        'rate_limit': 'The free-tier vision analysis rate limit was reached. Please wait about 30 seconds before uploading another photo.',
        'setup_hint': 'Vision model not configured. Please add your free GROQ_API_KEY to your .env file.',
    },
    'ta': {
        'name': 'Tamil (தமிழ்)',
        'rate_limit': 'இலவச AI படப் பகுப்பாய்வுக்கான வரம்பு எட்டப்பட்டுள்ளது. அடுத்த புகைப்படத்தை பதிவேற்ற 30 வினாடிகள் காத்திருக்கவும்.',
        'setup_hint': 'படப் பகுப்பாய்வை இயக்க, .env கோப்பில் இலவச GROQ_API_KEY அமைக்கவும்.',
    },
    'hi': {
        'name': 'Hindi (हिंदी)',
        'rate_limit': 'मुफ्त AI छवि विश्लेषण की सीमा समाप्त हो गई है। कृपया दोबारा अपलोड करने से पहले 30 सेकंड प्रतीक्षा करें।',
        'setup_hint': 'छवि विश्लेषण सक्षम करने के लिए .env में मुफ्त GROQ_API_KEY जोड़ें।',
    },
    'te': {
        'name': 'Telugu (తెలుగు)',
        'rate_limit': 'ఉచిత AI ఫోటో విశ్లేషణ పరిమితి ముగిసింది. దయచేసి మళ్లీ అప్‌లోడ్ చేయడానికి ముందు 30 సెకన్లు వేచి ఉండండి.',
        'setup_hint': 'ఫోటో విశ్లేషణను ప్రారంభించడానికి .env లో ఉచిత GROQ_API_KEY ని జోడించండి.',
    },
    'bn': {
        'name': 'Bengali (বাংলা)',
        'rate_limit': 'বিনামূল্যে AI ছবি বিশ্লেষণের সীমা পৌঁছেছে। দয়া করে আবার আপলোড করার আগে ৩০ সেকেন্ড অপেক্ষা করুন।',
        'setup_hint': 'ছবি বিশ্লেষণ সক্ষম করতে .env ফাইলে বিনামূল্যে GROQ_API_KEY যোগ করুন।',
    },
    'mr': {
        'name': 'Marathi (मराठी)',
        'rate_limit': 'मोफत AI फोटो विश्लेषण मर्यादा संपली आहे. कृपया पुन्हा अपलोड करण्यापूर्वी ३० सेकंद प्रतीक्षा करा.',
        'setup_hint': 'फोटो विश्लेषण सुरू करण्यासाठी .env मध्ये मोफत GROQ_API_KEY जोडा.',
    },
}


def _crops_likely_match(selected: str | None, identified: str | None) -> bool:
    if not selected or not identified:
        return True
    a = selected.strip().lower()
    b = identified.strip().lower()
    if a == b or a in b or b in a:
        return True
    if CROP_ALIASES.get(a) == b or CROP_ALIASES.get(b) == a:
        return True
    return False


async def analyze_crop_image(
    image_base64: str,
    selected_crop: str | None = None,
    language: str = 'en',
) -> dict[str, Any]:
    """
    Performs real multimodal crop disease diagnosis using Groq's free-tier vision model
    (Llama 3.2 11B Vision Preview). Validates irrelevant images (NOT_A_PLANT) and
    strictly prevents classifying unknown or ambiguous images as HEALTHY.
    """
    lang = language.lower() if language else 'en'
    lang_info = LANGUAGE_CONFIG.get(lang, LANGUAGE_CONFIG['en'])
    lang_name = lang_info['name']

    if not is_llm_configured():
        return {
            'status': 'VISION_MODEL_UNAVAILABLE',
            'identifiedCrop': None,
            'suspectedIssueName': None,
            'observedSymptoms': [],
            'affectedParts': [],
            'visualEvidence': [],
            'possibleCauses': [],
            'severity': 'UNKNOWN',
            'recommendation': lang_info['setup_hint'],
            'confidence': 0.0,
        }

    system_prompt = f"""You are an expert plant pathologist and diagnostic AI for agricultural crops, operating on Groq's free-tier vision model.
You will inspect an uploaded photograph to evaluate plant health and detect diseases or pests.

TARGET OUTPUT LANGUAGE: {lang_name}
All descriptive fields (recommendation, observedSymptoms, visualEvidence, possibleCauses, suspectedIssueName) MUST be written in {lang_name}.

STEP 1 — IMAGE RELEVANCE & SUBJECT VALIDATION:
- Check whether this image is genuinely a close-up or clear photograph of a plant, agricultural crop, leaf, stem, fruit, or vegetable.
- If the image shows a person, face, animal, vehicle, building, electronics, indoor room, household item, cartoon, document, or general scenery without a dominant plant subject:
  You MUST return:
  "status": "NOT_A_PLANT"
  "identifiedCrop": null
  "suspectedIssueName": null
  "observedSymptoms": []
  "possibleCauses": []
  "severity": "UNKNOWN"
  "recommendation": A clear message in {lang_name} explaining that the uploaded photo is not a plant or crop, and requesting a clear photo of an affected plant or leaf.
  "confidence": 0.95
  Do not proceed to diagnosing disease on non-plant images.

STEP 2 — CROP IDENTIFICATION:
- Identify the crop species (e.g., Rice, Wheat, Tomato, Corn, Cotton, Sugarcane, Chilli, Potato, Groundnut, etc.).
- Expected crop selected by farmer: "{selected_crop or 'None specified'}".

STEP 3 — SYMPTOM-FIRST DIAGNOSIS:
- Carefully inspect visible plant tissue for lesions, brown/black spots, yellowing, chlorosis, wilting, curling, powdery growth, rust, mold, rot, or pest chewing.
- If symptoms are clearly identified:
  * Use "DISEASE_DETECTED" for plant diseases (bacterial, fungal, viral).
  * Use "PEST_DETECTED" for insect damage, mites, or visible larvae.
  * Use "SUSPECTED_ISSUE" if abnormality is visible but disease name is uncertain.
  Provide actionable organic and cultural remedies, followed by chemical precautions in "recommendation".

STEP 4 — STRICT HEALTH SAFETY RULE (CRITICAL):
- NEVER automatically classify an unknown, blurry, ambiguous, or poorly lit image as "HEALTHY".
- Only set "status": "HEALTHY" if the plant tissue is clearly in focus, well-lit, and demonstrably healthy with zero spots, zero lesions, zero wilting, and zero abnormalities.
- If the image is blurry, distant, or ambiguous, you MUST return "status": "UNCERTAIN" and explain what needs to be photographed closer in "recommendation".

RESPONSE FORMAT:
Return STRICT JSON ONLY conforming to:
{{
  "status": "HEALTHY" | "DISEASE_DETECTED" | "PEST_DETECTED" | "SUSPECTED_ISSUE" | "UNCERTAIN" | "NOT_A_PLANT" | "UNKNOWN_CROP",
  "identifiedCrop": string or null,
  "suspectedIssueName": string or null,
  "observedSymptoms": [string],
  "affectedParts": [string],
  "visualEvidence": [string],
  "possibleCauses": [string],
  "severity": "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN",
  "recommendation": string,
  "confidence": float between 0.0 and 1.0
}}
"""

    user_prompt = f"Please inspect this crop photo. Farmer selected crop: {selected_crop or 'Not specified'}. Output language: {lang_name}."

    try:
        raw_output = await generate_vision(
            image_base64=image_base64,
            prompt=user_prompt,
            system_instruction=system_prompt,
            response_json=True,
        )
    except HostedLLMError as exc:
        if exc.code == 'RATE_LIMIT_EXCEEDED':
            logger.warning('Handled vision rate limit gracefully for language %s', lang)
            return {
                'status': 'UNCERTAIN',
                'identifiedCrop': selected_crop,
                'suspectedIssueName': None,
                'observedSymptoms': [],
                'affectedParts': [],
                'visualEvidence': [],
                'possibleCauses': [],
                'severity': 'UNKNOWN',
                'recommendation': lang_info['rate_limit'],
                'confidence': 0.0,
            }
        logger.error('Vision analysis error: %s (%s)', exc.message, exc.code)
        raise

    # Parse response JSON
    parsed = None
    try:
        parsed = json.loads(raw_output)
    except Exception:
        match = re.search(r'\{[\s\S]*\}', raw_output)
        if match:
            try:
                parsed = json.loads(match.group(0))
            except Exception:
                pass

    if not isinstance(parsed, dict):
        logger.warning('Could not parse vision response as JSON: %s', raw_output)
        return {
            'status': 'UNCERTAIN',
            'identifiedCrop': selected_crop,
            'suspectedIssueName': None,
            'observedSymptoms': [],
            'affectedParts': [],
            'visualEvidence': [],
            'possibleCauses': [],
            'severity': 'UNKNOWN',
            'recommendation': 'Could not obtain a conclusive visual diagnosis. Please upload a clearer close-up photo of the affected leaf.',
            'confidence': 0.3,
        }

    status = parsed.get('status', 'UNCERTAIN')
    identified_crop = parsed.get('identifiedCrop')
    confidence = float(parsed.get('confidence', 0.5))

    # Verify Crop Mismatch
    if (
        status not in ('NOT_A_PLANT', 'UNKNOWN_CROP')
        and selected_crop
        and identified_crop
        and not _crops_likely_match(selected_crop, identified_crop)
    ):
        status = 'CROP_MISMATCH'

    # Fallback safety enforcement:
    # If status is HEALTHY but the model reported visible symptoms, reject HEALTHY!
    observed_symptoms = parsed.get('observedSymptoms', [])
    if status == 'HEALTHY' and len(observed_symptoms) > 0:
        status = 'SUSPECTED_ISSUE'

    # Low confidence threshold guard
    if (status in ('HEALTHY', 'SUSPECTED_ISSUE')) and confidence < 0.4:
        status = 'UNCERTAIN'

    return {
        'status': status,
        'identifiedCrop': identified_crop,
        'suspectedIssueName': parsed.get('suspectedIssueName'),
        'observedSymptoms': observed_symptoms if isinstance(observed_symptoms, list) else [],
        'affectedParts': parsed.get('affectedParts', []) if isinstance(parsed.get('affectedParts'), list) else [],
        'visualEvidence': parsed.get('visualEvidence', []) if isinstance(parsed.get('visualEvidence'), list) else [],
        'possibleCauses': parsed.get('possibleCauses', []) if isinstance(parsed.get('possibleCauses'), list) else [],
        'severity': parsed.get('severity', 'UNKNOWN'),
        'recommendation': parsed.get('recommendation', ''),
        'confidence': max(0.0, min(1.0, confidence)),
    }
