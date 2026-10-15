// Hard guarantee for output language.
//
// Why this exists: the system prompt tells Llama 3 to answer only in the
// selected language (see promptBuilder.js's "OUTPUT LANGUAGE (STRICT)"
// section), but a local 8B instruction-following model does not reliably
// obey that instruction on every turn — especially in a multi-turn
// conversation where earlier turns were in English, or when the model
// simply defaults to English. A prompt is a strong hint, not a guarantee.
// This module makes it an actual guarantee: after generation, we check
// whether the reply is actually written in the target script, and if it
// isn't, we do one corrective pass — translating the already-generated
// answer into the target language — before it ever reaches the farmer.
//
// This is deliberately cheap for the common case: languageMatches() is a
// simple Unicode-range check, so a compliant reply (the normal case) pays
// no extra latency at all. Only a genuinely non-compliant reply pays for
// one extra local Ollama call.

import { complete as localComplete } from './localAiService.js';

// Unicode block covering each language's script. English/Latin-script
// languages have no dedicated block to check against — any reply "counts"
// as English, since farmer answers are expected to be plain prose, not
// code-switched into some other script.
const SCRIPT_RANGES = {
  ta: /[\u0B80-\u0BFF]/, // Tamil
  hi: /[\u0900-\u097F]/, // Devanagari (Hindi)
  mr: /[\u0900-\u097F]/, // Devanagari (Marathi)
  te: /[\u0C00-\u0C7F]/, // Telugu
  bn: /[\u0980-\u09FF]/, // Bengali
  ml: /[\u0D00-\u0D7F]/, // Malayalam
  kn: /[\u0C80-\u0CFF]/, // Kannada
};

const LANGUAGE_NAMES_FOR_TRANSLATION = {
  ta: 'Tamil',
  hi: 'Hindi',
  mr: 'Marathi',
  te: 'Telugu',
  bn: 'Bengali',
  ml: 'Malayalam',
  kn: 'Kannada',
};

const SAFE_UNCERTAINTY = {
  en: 'I could not generate a reliable answer for this question. Please share the crop, growth stage, and what you observe so I can answer more safely.',
  hi: 'मैं इस प्रश्न का विश्वसनीय उत्तर नहीं बना सका। कृपया फसल, विकास अवस्था और दिखाई देने वाले लक्षण बताएं।',
  mr: 'या प्रश्नाचे विश्वसनीय उत्तर देता आले नाही. कृपया पीक, वाढीची अवस्था आणि दिसणारी लक्षणे सांगा.',
  ta: 'இந்த கேள்விக்கு நம்பகமான பதிலை உருவாக்க முடியவில்லை. பயிர், வளர்ச்சி நிலை மற்றும் நீங்கள் காணும் அறிகுறிகளைப் பகிரவும்.',
  te: 'ఈ ప్రశ్నకు నమ్మకమైన సమాధానం ఇవ్వలేకపోయాను. పంట, పెరుగుదల దశ, కనిపిస్తున్న లక్షణాలను చెప్పండి.',
  bn: 'এই প্রশ্নের নির্ভরযোগ্য উত্তর তৈরি করা যায়নি। ফসল, বৃদ্ধির পর্যায় এবং দেখা লক্ষণগুলি জানান।',
};

/**
 * Returns true if `text` contains at least one character from the
 * language's expected script (or if the language is English / unknown,
 * in which case there's nothing script-specific to check).
 */
function looksLikeLanguage(text, language) {
  const range = SCRIPT_RANGES[language];
  if (!range) return true; // English or an unrecognized code — nothing to check.
  // Ignore trivial/very short replies (e.g. a lone number) where a script
  // check isn't meaningful either way.
  if (!text || text.trim().length < 8) return true;
  return range.test(text);
}

function looksDegenerate(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length < 12) return false;
  const midpoint = Math.floor(words.length / 2);
  const firstHalf = words.slice(0, midpoint).join(' ');
  const secondHalf = words.slice(midpoint).join(' ');
  return firstHalf === secondHalf || /(\S+(?:\s+\S+){2,})\s+\1/i.test(text);
}

/**
 * Ensures `reply` is actually written in `language`. If it already is,
 * returns it unchanged (no extra cost). If not, asks the local model to
 * translate the existing reply into the target language and returns that
 * instead — preserving the content that was already generated rather than
 * regenerating it from scratch. If even the translation attempt fails or
 * still isn't in-script, the original reply is returned as-is (a reply in
 * the wrong language is still better than no reply at all), and the
 * mismatch is logged so it's visible in server logs.
 */
export async function enforceLanguage(reply, language) {
  if (looksLikeLanguage(reply, language) && !looksDegenerate(reply)) {
    return reply;
  }

  const targetName = LANGUAGE_NAMES_FOR_TRANSLATION[language];
  if (!targetName) return reply; // Nothing we know how to translate to.

  console.warn(
    `[UzhavanAI language-guard] Reply was not in ${targetName} as instructed — running a corrective translation pass.`
  );

  try {
    const translated = await localComplete(
      [
        {
          role: 'system',
          content: `Rewrite the following farming advice as natural, concise, everyday ${targetName}, the way a farmer would actually speak. Remove repetition and any garbled text. Keep only the practical meaning; do not add new advice. Output ONLY the ${targetName} answer, nothing else (no notes, no English, no quotes around it).`,
        },
        { role: 'user', content: reply },
      ],
      { temperature: 0.2 }
    );

    if (looksLikeLanguage(translated, language) && !looksDegenerate(translated)) {
      return translated.trim();
    }

    console.warn(
      `[UzhavanAI language-guard] Corrective translation pass also did not produce ${targetName} text — returning the original reply.`
    );
    return looksDegenerate(reply) ? (SAFE_UNCERTAINTY[language] || SAFE_UNCERTAINTY.en) : reply;
  } catch (err) {
    console.error('[UzhavanAI language-guard] Corrective translation pass failed:', err.message);
    return looksDegenerate(reply) ? (SAFE_UNCERTAINTY[language] || SAFE_UNCERTAINTY.en) : reply;
  }
}

export { looksLikeLanguage };
