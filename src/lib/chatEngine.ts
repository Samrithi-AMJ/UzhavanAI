// Client for UzhavanAI's local AI Farmer Advisor.
//
// This talks to our own small backend (server/index.js), which in turn
// talks to the local UzhavanAI Python inference service. There is no
// cloud/paid AI API involved anywhere in this file — if the backend or model is not
// running, askAdvisor() throws an AdvisorError with a farmer-friendly
// message instead of crashing the UI.
import type { Language } from './i18n';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export type FarmerContext = {
  name?: string | null;
  farmName?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  farmSizeAcres?: number | null;
  topCrop?: string | null;
};

export type WeatherContext =
  | {
      temperature?: number;
      humidity?: number;
      precipitationProbability?: number;
      description?: string;
    }
  | 'unavailable';

export type AdvisorErrorCode =
  | 'BACKEND_UNREACHABLE'
  | 'AI_SERVICE_UNREACHABLE'
  | 'MODEL_NOT_FOUND'
  | 'TIMEOUT'
  | 'EMPTY_MESSAGE'
  | 'MESSAGE_TOO_LONG'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN';

export class AdvisorError extends Error {
  code: AdvisorErrorCode;
  constructor(code: AdvisorErrorCode, message: string) {
    super(message);
    this.name = 'AdvisorError';
    this.code = code;
  }
}

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787').replace(/\/+$/, '');

const FRIENDLY_MESSAGES: Record<AdvisorErrorCode, Record<Language, string>> = {
  BACKEND_UNREACHABLE: {
    en: 'AI Advisor is currently unavailable. Please make sure the UzhavanAI backend server is running ("npm run server").',
    hi: 'AI सलाहकार अभी उपलब्ध नहीं है। कृपया सुनिश्चित करें कि UzhavanAI बैकएंड सर्वर चल रहा है ("npm run server")।',
    mr: 'AI सल्लागार सध्या उपलब्ध नाही. कृपया खात्री करा की UzhavanAI बॅकएंड सर्व्हर सुरू आहे ("npm run server").',
    ta: 'AI ஆலோசகர் தற்போது கிடைக்கவில்லை. UzhavanAI பின்தள சேவையகம் இயங்குகிறதா என உறுதிப்படுத்தவும் ("npm run server").',
    te: 'AI సలహాదారు ప్రస్తుతం అందుబాటులో లేరు. UzhavanAI బ్యాకెండ్ సర్వర్ నడుస్తుందో లేదో నిర్ధారించుకోండి ("npm run server").',
    bn: 'AI উপদেষ্টা বর্তমানে অনুপলব্ধ। অনুগ্রহ করে নিশ্চিত করুন UzhavanAI ব্যাকএন্ড সার্ভার চালু আছে ("npm run server")।',
  },
  AI_SERVICE_UNREACHABLE: {
    en: 'AI Advisor is currently unavailable. Please make sure the local UzhavanAI service is running.',
    hi: 'AI सलाहकार अभी उपलब्ध नहीं है। कृपया सुनिश्चित करें कि स्थानीय UzhavanAI सेवा चल रही है।',
    mr: 'AI सल्लागार सध्या उपलब्ध नाही. स्थानिक UzhavanAI सेवा सुरू आहे याची खात्री करा.',
    ta: 'AI ஆலோசகர் தற்போது கிடைக்கவில்லை. உள்ளூர் UzhavanAI சேவை இயங்குகிறதா என்பதை உறுதிப்படுத்தவும்.',
    te: 'AI సలహాదారు ప్రస్తుతం అందుబాటులో లేరు. స్థానిక UzhavanAI సేవ నడుస్తోందని నిర్ధారించుకోండి.',
    bn: 'AI উপদেষ্টা বর্তমানে অনুপলব্ধ। স্থানীয় UzhavanAI পরিষেবা চালু আছে কিনা নিশ্চিত করুন।',
  },
  MODEL_NOT_FOUND: {
    en: 'The local AI model is not available. Configure MODEL_NAME or MODEL_PATH for the Python service.',
    hi: 'स्थानीय AI मॉडल उपलब्ध नहीं है। Python सेवा के लिए MODEL_NAME या MODEL_PATH कॉन्फ़िगर करें।',
    mr: 'स्थानिक AI मॉडेल उपलब्ध नाही. Python सेवेसाठी MODEL_NAME किंवा MODEL_PATH कॉन्फिगर करा.',
    ta: 'உள்ளூர் AI மாடல் கிடைக்கவில்லை. Python சேவைக்கு MODEL_NAME அல்லது MODEL_PATH அமைக்கவும்.',
    te: 'స్థానిక AI మోడల్ అందుబాటులో లేదు. Python సేవ కోసం MODEL_NAME లేదా MODEL_PATH కాన్ఫిగర్ చేయండి.',
    bn: 'স্থানীয় AI মডেল পাওয়া যাচ্ছে না। Python পরিষেবার জন্য MODEL_NAME বা MODEL_PATH কনফিগার করুন।',
  },
  TIMEOUT: {
    en: 'The AI Advisor took too long to respond. Please try again.',
    hi: 'AI सलाहकार को जवाब देने में बहुत समय लगा। कृपया पुनः प्रयास करें।',
    mr: 'AI सल्लागाराला उत्तर द्यायला खूप वेळ लागला. कृपया पुन्हा प्रयत्न करा.',
    ta: 'AI ஆலோசகர் பதிலளிக்க அதிக நேரம் எடுத்தது. மீண்டும் முயற்சிக்கவும்.',
    te: 'AI సలహాదారు స్పందించడానికి ఎక్కువ సమయం తీసుకుంది. దయచేసి మళ్లీ ప్రయత్నించండి.',
    bn: 'AI উপদেষ্টা উত্তর দিতে অনেক সময় নিয়েছে। আবার চেষ্টা করুন।',
  },
  EMPTY_MESSAGE: {
    en: 'Please type a question before sending.',
    hi: 'भेजने से पहले कृपया एक प्रश्न लिखें।',
    mr: 'पाठवण्यापूर्वी कृपया प्रश्न टाइप करा.',
    ta: 'அனுப்பும் முன் ஒரு கேள்வியை தட்டச்சு செய்யவும்.',
    te: 'పంపే ముందు దయచేసి ఒక ప్రశ్న టైప్ చేయండి.',
    bn: 'পাঠানোর আগে একটি প্রশ্ন টাইপ করুন।',
  },
  MESSAGE_TOO_LONG: {
    en: 'Your message is too long. Please shorten it and try again.',
    hi: 'आपका संदेश बहुत लंबा है। कृपया इसे छोटा करें और पुनः प्रयास करें।',
    mr: 'तुमचा संदेश खूप मोठा आहे. कृपया तो लहान करा आणि पुन्हा प्रयत्न करा.',
    ta: 'உங்கள் செய்தி மிக நீளமானது. குறைத்து மீண்டும் முயற்சிக்கவும்.',
    te: 'మీ సందేశం చాలా పొడవుగా ఉంది. దయచేసి తగ్గించి మళ్లీ ప్రయత్నించండి.',
    bn: 'আপনার বার্তাটি অনেক দীর্ঘ। এটি ছোট করে আবার চেষ্টা করুন।',
  },
  INVALID_RESPONSE: {
    en: 'AI Advisor gave an unexpected response. Please try again.',
    hi: 'AI सलाहकार ने एक अप्रत्याशित उत्तर दिया। कृपया पुनः प्रयास करें।',
    mr: 'AI सल्लागाराने अनपेक्षित उत्तर दिले. कृपया पुन्हा प्रयत्न करा.',
    ta: 'AI ஆலோசகர் எதிர்பாராத பதிலை அளித்தார். மீண்டும் முயற்சிக்கவும்.',
    te: 'AI సలహాదారు ఊహించని స్పందన ఇచ్చారు. దయచేసి మళ్లీ ప్రయత్నించండి.',
    bn: 'AI উপদেষ্টা একটি অপ্রত্যাশিত উত্তর দিয়েছে। আবার চেষ্টা করুন।',
  },
  UNKNOWN: {
    en: 'Something went wrong while reaching the AI Advisor. Please try again.',
    hi: 'AI सलाहकार से संपर्क करते समय कुछ गड़बड़ हो गई। कृपया पुनः प्रयास करें।',
    mr: 'AI सल्लागाराशी संपर्क साधताना काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.',
    ta: 'AI ஆலோசகரை அணுகும்போது ஏதோ தவறு ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.',
    te: 'AI సలహాదారుని సంప్రదించేటప్పుడు ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.',
    bn: 'AI উপদেষ্টার সাথে যোগাযোগ করার সময় কিছু ভুল হয়েছে। আবার চেষ্টা করুন।',
  },
};

export function friendlyAdvisorMessage(error: AdvisorError, lang: Language = 'en'): string {
  return FRIENDLY_MESSAGES[error.code]?.[lang] ?? FRIENDLY_MESSAGES.UNKNOWN[lang] ?? FRIENDLY_MESSAGES.UNKNOWN.en;
}

type AskAdvisorParams = {
  history: ChatTurn[]; // recent conversation, most recent message last (includes the new user message)
  language: Language;
  farmer?: FarmerContext | null;
  weather?: WeatherContext;
};

export type KnowledgeSource = { title: string; source: string; url?: string | null };

export type GroundingType = 'rag' | 'general' | 'refused';

export type AdvisorReply = { reply: string; sources: KnowledgeSource[]; grounding: GroundingType };

/**
 * Sends the conversation to the local backend (which proxies to the Python
 * after first checking the question is agriculture-related and then
 * retrieving grounded agricultural knowledge from Supabase — see
 * server/domainGate.js and server/rag.js) and returns the assistant's
 * reply plus any knowledge sources that were actually retrieved and used
 * for this answer. Throws AdvisorError on any failure — never returns a
 * fake/canned answer for a real backend failure (a polite agriculture-only
 * refusal for an off-topic question is a normal 200 response, not an
 * error).
 */
export async function askAdvisor({ history, language, farmer, weather }: AskAdvisorParams): Promise<AdvisorReply> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: history,
        language,
        farmer: farmer ?? null,
        weather: weather ?? 'unavailable',
      }),
    });
  } catch (err) {
    console.error('[UzhavanAI] Could not reach backend:', err);
    throw new AdvisorError('BACKEND_UNREACHABLE', 'Could not reach the local backend server.');
  }

  let body: {
    reply?: string;
    error?: string;
    message?: string;
    sources?: KnowledgeSource[];
    retrieval?: string;
    grounding?: GroundingType;
  } | null = null;
  try {
    body = await res.json();
  } catch (err) {
    console.error('[UzhavanAI] Backend returned invalid JSON:', err);
    throw new AdvisorError('INVALID_RESPONSE', 'Backend returned an unreadable response.');
  }

  if (!res.ok) {
    const code = (body?.error as AdvisorErrorCode) || 'UNKNOWN';
    console.error('[UzhavanAI] Advisor request failed:', code, body?.message);
    const knownCode: AdvisorErrorCode = FRIENDLY_MESSAGES[code] ? code : 'UNKNOWN';
    throw new AdvisorError(knownCode, body?.message || 'Advisor request failed.');
  }

  if (!body?.reply || typeof body.reply !== 'string') {
    throw new AdvisorError('INVALID_RESPONSE', 'Backend returned no reply.');
  }

  const grounding: GroundingType =
    body.retrieval === 'SKIPPED_NON_AGRICULTURE' ? 'refused' : body.grounding === 'rag' ? 'rag' : 'general';

  return { reply: body.reply, sources: Array.isArray(body.sources) ? body.sources : [], grounding };
}

export type AdvisorHealth = {
  aiServiceReachable: boolean;
  model: string;
  modelInstalled: boolean;
  state: 'CHECKING' | 'ONLINE' | 'OFFLINE';
};

/**
 * Lightweight health check used to show an "AI Advisor: Ready/Offline"
 * indicator in the UI. Never throws — returns an "offline" shape instead.
 */
export async function checkAdvisorHealth(): Promise<AdvisorHealth> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    return {
      aiServiceReachable: !!data.aiServiceReachable,
      model: data.model || 'UzhavanAI',
      modelInstalled: !!data.modelInstalled,
      state: data.aiServiceReachable ? 'ONLINE' : 'OFFLINE',
    };
  } catch (err) {
    console.error('[UzhavanAI] Health check failed:', err);
    return { aiServiceReachable: false, model: 'UzhavanAI', modelInstalled: false, state: 'OFFLINE' };
  }
}
