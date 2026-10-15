from __future__ import annotations

import logging
import re
from typing import Any

from .config import settings
from .hosted_llm import generate_chat, get_model_name, is_llm_configured, HostedLLMError
from .rag_retriever import retrieve_knowledge, format_context_for_prompt

logger = logging.getLogger(__name__)

LANGUAGE_CONFIG = {
    'en': {
        'name': 'English',
        'script': 'Latin script',
        'refusal': 'I am UzhavanAI, an agricultural advisor dedicated to Indian farming. I can help with crop cultivation, soil health, pest and disease management, fertilizers, irrigation, and farm weather guidance. Please feel free to ask any farming-related questions!',
        'setup_hint': 'Please add your free GROQ_API_KEY in the backend .env file to enable the AI Farmer Advisor. You can get a free key from https://console.groq.com/keys.',
        'rate_limit': 'The free-tier AI request limit was reached. Please wait about 30 seconds before asking your next question. Verified agricultural reference sources are shown below.',
    },
    'ta': {
        'name': 'Tamil (தமிழ்)',
        'script': 'Tamil script (தமிழ் எழுத்துக்கள்)',
        'refusal': 'வணக்கம்! நான் உழவன் AI (UzhavanAI). நான் விவசாயம், பயிர் சாகுபடி, மண் நலம், பூச்சி மற்றும் நோய் மேலாண்மை, உரங்கள் மற்றும் நீர்ப்பாசனம் தொடர்பான கேள்விகளுக்கு மட்டுமே வழிகாட்டுகிறேன். உங்கள் விவசாயம் சார்ந்த கேள்விகளைத் தாராளமாகக் கேட்கலாம்!',
        'setup_hint': 'AI ஆலோசகரை இயக்க, பின்தள .env கோப்பில் இலவச GROQ_API_KEY அமைக்கவும். இலவச கீயை https://console.groq.com/keys இல் பெறலாம்.',
        'rate_limit': 'இலவச AI சேவைக்கான வரம்பு தற்காலிகமாக எட்டப்பட்டுள்ளது. தயவுசெய்து 30 வினாடிகள் காத்திருந்து மீண்டும் கேட்கவும். தங்களுக்குத் தேவையான வேளாண் குறிப்புகள் கீழே கொடுக்கப்பட்டுள்ளன.',
    },
    'hi': {
        'name': 'Hindi (हिंदी)',
        'script': 'Devanagari script (देवनागरी लिपि)',
        'refusal': 'नमस्ते! मैं उझवन AI (UzhavanAI) हूँ, जो भारतीय किसानों के लिए एक समर्पित कृषि सलाहकार है। मैं केवल फसलों, मिट्टी, कीट और रोग प्रबंधन, उर्वरकों और सिंचाई से जुड़े सवालों में आपकी मदद कर सकता हूँ। कृपया खेती से जुड़ा सवाल पूछें!',
        'setup_hint': 'AI सलाहकार को सक्रिय करने के लिए backend .env फाइल में मुफ्त GROQ_API_KEY सेट करें। https://console.groq.com/keys पर मुफ्त कुंजी उपलब्ध है।',
        'rate_limit': 'मुफ्त AI सेवा की अनुरोध सीमा समाप्त हो गई है। कृपया अगला प्रश्न पूछने से पहले 30 सेकंड प्रतीक्षा करें। सत्यापित कृषि संदर्भ नीचे दिए गए हैं।',
    },
    'te': {
        'name': 'Telugu (తెలుగు)',
        'script': 'Telugu script (తెలుగు లిపి)',
        'refusal': 'నమస్కారం! నేను ఉళవన్ AI (UzhavanAI). నేను కేవలం వ్యవసాయం, పంటల సాగు, నేల ఆరోగ్యం, తెగుళ్లు మరియు పురుగుల నివారణ, ఎరువులు మరియు నీటి పారుదల గురించి మాత్రమే సలహాలు ఇవ్వగలను. దయచేసి వ్యవసాయానికి సంబంధించిన ప్రశ్నలను అడగండి!',
        'setup_hint': 'AI సలహాదారును ప్రారంభించడానికి backend .env లో ఉచిత GROQ_API_KEY ని కాన్ఫిగర్ చేయండి. https://console.groq.com/keys లో ఉచిత కీని పొందవచ్చు.',
        'rate_limit': 'ఉచిత AI సేవా పరిమితి ముగిసింది. దయచేసి మీ తదుపరి ప్రశ్నను అడగడానికి ముందు 30 సెకన్లు వేచి ఉండండి. ధృవీకరించబడిన వ్యవసాయ సమాచారం క్రింద చూపబడింది.',
    },
    'bn': {
        'name': 'Bengali (বাংলা)',
        'script': 'Bengali script (বাংলা লিপি)',
        'refusal': 'নমস্কার! আমি উজভান এআই (UzhavanAI), ভারতীয় কৃষকদের জন্য নিবেদিত কৃষি উপদেষ্টা। আমি ফসল চাষ, মাটির স্বাস্থ্য, রোগ ও পোকা দমন, সার এবং সেচ সংক্রান্ত বিষয়ে সহায়তা করতে পারি। অনুগ্রহ করে কৃষি সম্পর্কিত প্রশ্ন জিজ্ঞাসা করুন!',
        'setup_hint': 'AI উপদেষ্টা সক্রিয় করতে ব্যাকএন্ড .env ফাইলে বিনামূল্যে GROQ_API_KEY কনফিগার করুন। https://console.groq.com/keys থেকে বিনামূল্যে কী পান।',
        'rate_limit': 'বিনামূল্যে AI অনুরোধের সীমা পৌঁছেছে। আপনার পরবর্তী প্রশ্ন জিজ্ঞাসা করার আগে দয়া করে ৩০ সেকেন্ড অপেক্ষা করুন। যাচাইকৃত কৃষি তথ্য নিচে দেখানো হয়েছে।',
    },
    'mr': {
        'name': 'Marathi (मराठी)',
        'script': 'Devanagari script (देवनागरी लिपी)',
        'refusal': 'नमस्कार! मी उझवन AI (UzhavanAI) आहे, जो भारतीय शेतकऱ्यांसाठी समर्पित कृषी सल्लागार आहे. मी फक्त पिके, माती, कीड व रोग व्यवस्थापन, खते आणि सिंचन या विषयांशी संबंधित मार्गदर्शन करू शकतो. कृपया शेतीशी संबंधित प्रश्न विचारा!',
        'setup_hint': 'AI सल्लागार सुरू करण्यासाठी backend .env फाईलमध्ये मोफत GROQ_API_KEY सेट करा. https://console.groq.com/keys वर विनामूल्य की उपलब्ध आहे.',
        'rate_limit': 'मोफत AI सेवेची विनंती मर्यादा संपली आहे. कृपया पुढील प्रश्न विचारण्यापूर्वी ३० सेकंद प्रतीक्षा करा. पडताळणी केलेले कृषी संदर्भ खाली दिले आहेत.',
    },
}


def sanitize_reply_for_chat(text: str) -> str:
    """Strip out markdown markup for clean readability in the chat bubble."""
    if not text:
        return ''
    cleaned = text
    # Remove bold/italic markers
    cleaned = re.sub(r'\*\*(.+?)\*\*', r'\1', cleaned)
    cleaned = re.sub(r'__(.+?)__', r'\1', cleaned)
    cleaned = re.sub(r'(^|\s)\*(?!\*)([^*\n]+?)\*(?!\*)(?=\s|[.,!?;:]|$)', r'\1\2', cleaned)
    cleaned = re.sub(r'(^|\s)_(?!_)([^_\n]+?)_(?!_)(?=\s|[.,!?;:]|$)', r'\1\2', cleaned)
    # Convert headings to plain text
    cleaned = re.sub(r'^#{1,6}\s+', '', cleaned, flags=re.MULTILINE)
    # Simplify bullet markers
    cleaned = re.sub(r'^[*+]\s+', '- ', cleaned, flags=re.MULTILINE)
    # Remove code backticks
    cleaned = re.sub(r'`([^`]+)`', r'\1', cleaned)
    return cleaned.strip()


def build_system_prompt(
    language: str,
    farmer: dict[str, Any] | None,
    weather: dict[str, Any] | str | None,
    rag_context: str,
) -> str:
    lang_info = LANGUAGE_CONFIG.get(language, LANGUAGE_CONFIG['en'])
    lang_name = lang_info['name']
    lang_script = lang_info['script']

    farmer_details = []
    if isinstance(farmer, dict):
        if farmer.get('name'):
            farmer_details.append(f"- Farmer Name: {farmer['name']}")
        if farmer.get('farmName'):
            farmer_details.append(f"- Farm Name: {farmer['farmName']}")
        if farmer.get('location'):
            farmer_details.append(f"- Location: {farmer['location']}")
        if farmer.get('farmSizeAcres'):
            farmer_details.append(f"- Farm Size: {farmer['farmSizeAcres']} acres")
        if farmer.get('topCrop'):
            farmer_details.append(f"- Primary Crop: {farmer['topCrop']}")

    farmer_block = '\n'.join(farmer_details) if farmer_details else '- General smallholder farmer in India'

    weather_details = []
    if isinstance(weather, dict):
        temp = weather.get('temperature')
        hum = weather.get('humidity')
        precip = weather.get('precipitationProbability')
        desc = weather.get('description')
        if temp is not None:
            weather_details.append(f"- Temperature: {temp}°C")
        if hum is not None:
            weather_details.append(f"- Humidity: {hum}%")
        if precip is not None:
            weather_details.append(f"- Rain Probability: {precip}%")
        if desc:
            weather_details.append(f"- Sky/Conditions: {desc}")

    weather_block = '\n'.join(weather_details) if weather_details else '- Weather data currently unavailable'

    return f"""You are UzhavanAI (உழவன் AI), an expert, trusted agricultural advisor for Indian farmers, powered by Groq free-tier hosted open intelligence.

CORE OPERATING INSTRUCTIONS:

1. INDEPENDENT QUERY UNDERSTANDING & REASONING:
- You must independently understand the farmer's queries, identifying agricultural intent, crop names, symptoms, and soil/weather challenges.
- Synthesize all available context: the farmer's profile, current local weather conditions, and conversation history.
- If humidity is high (>75%), account for elevated fungal and bacterial risk. If rain is imminent (>50%), remind the farmer that spraying pesticides or foliar fertilizers should be delayed to prevent wash-off.

2. AGRICULTURAL DOMAIN ENFORCEMENT:
- You are strictly an agricultural assistant. You specialize in: crops, soil management, fertilizers (NPK, FYM, vermicompost, micronutrients), irrigation, pests, plant diseases, weed management, harvesting, post-harvest storage, and agricultural weather impact.
- IF THE USER ASKS A COMPLETELY NON-AGRICULTURAL QUESTION (such as entertainment, celebrity gossip, software programming, politics, or general trivia like "capital of India"):
  Politely decline to answer off-topic questions and redirect them to farming, responding strictly in {lang_name}.

3. ACTIONABLE & SAFE GUIDANCE:
- Give practical, step-by-step advice that smallholder farmers can implement.
- Recommend Integrated Pest Management (IPM), starting with cultural, mechanical, and bio-control methods (e.g. neem oil, pheromone traps, trichoderma) before chemical interventions.
- When recommending chemical products, specify standard precautions (protective gear, proper dilution, spray timing in morning/evening).
- Never fabricate fake crop varieties, fictional chemicals, or non-existent government subsidies.

4. MULTILINGUAL OUTPUT (MANDATORY & STRICT):
- TARGET LANGUAGE: {lang_name}
- SCRIPT TO USE: {lang_script}
- You MUST respond fully and exclusively in {lang_name}.
- Do NOT reply in English if the target language is Tamil, Hindi, Telugu, Bengali, or Marathi!
- Use natural, respectful, and clear phrasing suited for a farmer.

FARMER PROFILE CONTEXT:
{farmer_block}

CURRENT LOCAL WEATHER:
{weather_block}

RETRIEVED AGRICULTURAL KNOWLEDGE (RAG):
{rag_context}
"""


async def get_advisory_reply(
    messages: list[dict[str, str]],
    language: str = 'en',
    farmer: dict[str, Any] | None = None,
    weather: dict[str, Any] | str | None = None,
) -> dict[str, Any]:
    """
    Main entry point for the single-LLM agricultural advisor using Groq's free tier.
    """
    lang = language.lower() if language else 'en'
    if lang not in LANGUAGE_CONFIG:
        lang = 'en'

    # Extract the last user message
    last_user_msg = ''
    for m in reversed(messages):
        if m.get('role') == 'user' and m.get('content', '').strip():
            last_user_msg = m['content'].strip()
            break

    if not last_user_msg:
        return {
            'reply': 'Please provide a farming question.',
            'sources': [],
            'grounding': 'general',
            'model': get_model_name(),
        }

    # 1. Optional knowledge retrieval layer (NOT an agent)
    retrieved_chunks = await retrieve_knowledge(last_user_msg, top_k=settings.rag_top_k)
    rag_context = format_context_for_prompt(retrieved_chunks)

    sources = [
        {
            'title': c.get('title', ''),
            'source': c.get('source', 'Agricultural Extension'),
            'url': c.get('url', ''),
        }
        for c in retrieved_chunks
    ]

    # If backend has no Groq API key configured yet, return a clear, helpful message with any retrieved sources
    if not is_llm_configured():
        hint = LANGUAGE_CONFIG[lang]['setup_hint']
        return {
            'reply': f"UzhavanAI: {hint}",
            'sources': sources,
            'grounding': 'rag' if sources else 'general',
            'model': 'Groq (Key Missing)',
        }

    # 2. Build single prompt for LLM
    system_prompt = build_system_prompt(lang, farmer, weather, rag_context)

    # 3. Call the single hosted Groq LLM directly with graceful rate-limit handling
    try:
        raw_reply = await generate_chat(
            messages=messages,
            system_instruction=system_prompt,
            temperature=settings.temperature,
            max_tokens=settings.max_tokens,
        )
    except HostedLLMError as exc:
        if exc.code == 'RATE_LIMIT_EXCEEDED':
            logger.warning('Handled rate limit gracefully for language %s', lang)
            return {
                'reply': LANGUAGE_CONFIG[lang]['rate_limit'],
                'sources': sources,
                'grounding': 'rag' if sources else 'general',
                'model': f"{get_model_name()} (Rate-Limited)",
            }
        logger.error('Hosted LLM error: %s (%s)', exc.message, exc.code)
        raise

    cleaned_reply = sanitize_reply_for_chat(raw_reply)

    return {
        'reply': cleaned_reply,
        'sources': sources,
        'grounding': 'rag' if sources else 'general',
        'model': get_model_name(),
    }
