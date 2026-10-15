import type { Language } from './i18n';
import type { WeatherData } from './weather';

/**
 * Language-aware descriptions for Open-Meteo's WMO weather codes.
 * The WMO numeric code stays the single source of truth (see weather.ts);
 * this table only supplies the display string for the selected language.
 */
export const WMO_DESCRIPTIONS: Record<number, Record<Language, string>> = {
  0: { en: 'Clear sky', hi: 'साफ आसमान', mr: 'निरभ्र आकाश', ta: 'தெளிவான வானம்', te: 'నిర్మలమైన ఆకాశం', bn: 'পরিষ্কার আকাশ' },
  1: { en: 'Mainly clear', hi: 'ज़्यादातर साफ', mr: 'बहुतांश निरभ्र', ta: 'பெரும்பாலும் தெளிவானது', te: 'ఎక్కువగా నిర్మలం', bn: 'প্রায় পরিষ্কার' },
  2: { en: 'Partly cloudy', hi: 'आंशिक बादल', mr: 'अंशतः ढगाळ', ta: 'பகுதி மேகமூட்டம்', te: 'పాక్షిక మేఘావృతం', bn: 'আংশিক মেঘলা' },
  3: { en: 'Overcast', hi: 'घना बादल', mr: 'ढगाळ आकाश', ta: 'மேகமூடிய வானம்', te: 'మేఘావృత ఆకాశం', bn: 'মেঘলা আকাশ' },
  45: { en: 'Fog', hi: 'कोहरा', mr: 'धुके', ta: 'மூடுபனி', te: 'పొగమంచు', bn: 'কুয়াশা' },
  48: { en: 'Depositing rime fog', hi: 'पाला जमाने वाला कोहरा', mr: 'गोठणारे धुके', ta: 'உறைபனி மூடுபனி', te: 'మంచు నిక్షేపణ పొగమంచు', bn: 'তুষার-কুয়াশা' },
  51: { en: 'Light drizzle', hi: 'हल्की बूंदाबांदी', mr: 'हलकी रिमझिम', ta: 'லேசான தூறல்', te: 'తేలికపాటి జల్లులు', bn: 'হালকা গুঁড়ি বৃষ্টি' },
  53: { en: 'Moderate drizzle', hi: 'मध्यम बूंदाबांदी', mr: 'मध्यम रिमझिम', ta: 'மிதமான தூறல்', te: 'మధ్యస్థ జల్లులు', bn: 'মাঝারি গুঁড়ি বৃষ্টি' },
  55: { en: 'Dense drizzle', hi: 'घनी बूंदाबांदी', mr: 'दाट रिमझिम', ta: 'அடர்த்தியான தூறல்', te: 'దట్టమైన జల్లులు', bn: 'ঘন গুঁড়ি বৃষ্টি' },
  56: { en: 'Light freezing drizzle', hi: 'हल्की जमने वाली बूंदाबांदी', mr: 'हलकी गोठणारी रिमझिम', ta: 'லேசான உறை தூறல்', te: 'తేలికపాటి గడ్డకట్టే జల్లులు', bn: 'হালকা জমাট গুঁড়ি বৃষ্টি' },
  57: { en: 'Dense freezing drizzle', hi: 'घनी जमने वाली बूंदाबांदी', mr: 'दाट गोठणारी रिमझिम', ta: 'அடர்த்தியான உறை தூறல்', te: 'దట్టమైన గడ్డకట్టే జల్లులు', bn: 'ঘন জমাট গুঁড়ি বৃষ্টি' },
  61: { en: 'Slight rain', hi: 'हल्की बारिश', mr: 'हलका पाऊस', ta: 'லேசான மழை', te: 'తేలికపాటి వర్షం', bn: 'হালকা বৃষ্টি' },
  63: { en: 'Moderate rain', hi: 'मध्यम बारिश', mr: 'मध्यम पाऊस', ta: 'மிதமான மழை', te: 'మధ్యస్థ వర్షం', bn: 'মাঝারি বৃষ্টি' },
  65: { en: 'Heavy rain', hi: 'भारी बारिश', mr: 'मुसळधार पाऊस', ta: 'கனமழை', te: 'భారీ వర్షం', bn: 'ভারী বৃষ্টি' },
  66: { en: 'Light freezing rain', hi: 'हल्की जमने वाली बारिश', mr: 'हलका गोठणारा पाऊस', ta: 'லேசான உறை மழை', te: 'తేలికపాటి గడ్డకట్టే వర్షం', bn: 'হালকা জমাট বৃষ্টি' },
  67: { en: 'Heavy freezing rain', hi: 'भारी जमने वाली बारिश', mr: 'मुसळधार गोठणारा पाऊस', ta: 'கனமான உறை மழை', te: 'భారీ గడ్డకట్టే వర్షం', bn: 'ভারী জমাট বৃষ্টি' },
  71: { en: 'Slight snow', hi: 'हल्की बर्फबारी', mr: 'हलकी बर्फवृष्टी', ta: 'லேசான பனிப்பொழிவு', te: 'తేలికపాటి మంచు', bn: 'হালকা তুষারপাত' },
  73: { en: 'Moderate snow', hi: 'मध्यम बर्फबारी', mr: 'मध्यम बर्फवृष्टी', ta: 'மிதமான பனிப்பொழிவு', te: 'మధ్యస్థ మంచు', bn: 'মাঝারি তুষারপাত' },
  75: { en: 'Heavy snow', hi: 'भारी बर्फबारी', mr: 'जोरदार बर्फवृष्टी', ta: 'கனமான பனிப்பொழிவு', te: 'భారీ మంచు', bn: 'ভারী তুষারপাত' },
  77: { en: 'Snow grains', hi: 'बर्फ के कण', mr: 'बर्फाचे कण', ta: 'பனித் துகள்கள்', te: 'మంచు రేణువులు', bn: 'তুষার কণা' },
  80: { en: 'Slight rain showers', hi: 'हल्की बौछारें', mr: 'हलक्या सरी', ta: 'லேசான மழை தூறல்கள்', te: 'తేలికపాటి వర్ష జల్లులు', bn: 'হালকা বৃষ্টির ঝাপটা' },
  81: { en: 'Moderate rain showers', hi: 'मध्यम बौछारें', mr: 'मध्यम सरी', ta: 'மிதமான மழை தூறல்கள்', te: 'మధ్యస్థ వర్ష జల్లులు', bn: 'মাঝারি বৃষ্টির ঝাপটা' },
  82: { en: 'Violent rain showers', hi: 'तेज़ बौछारें', mr: 'जोरदार सरी', ta: 'கடுமையான மழை தூறல்கள்', te: 'తీవ్రమైన వర్ష జల్లులు', bn: 'প্রবল বৃষ্টির ঝাপটা' },
  85: { en: 'Slight snow showers', hi: 'हल्की बर्फ की बौछारें', mr: 'हलक्या बर्फाच्या सरी', ta: 'லேசான பனி தூறல்கள்', te: 'తేలికపాటి మంచు జల్లులు', bn: 'হালকা তুষার ঝাপটা' },
  86: { en: 'Heavy snow showers', hi: 'भारी बर्फ की बौछारें', mr: 'जोरदार बर्फाच्या सरी', ta: 'கனமான பனி தூறல்கள்', te: 'భారీ మంచు జల్లులు', bn: 'ভারী তুষার ঝাপটা' },
  95: { en: 'Thunderstorm', hi: 'आंधी-तूफान', mr: 'गडगडाटी वादळ', ta: 'இடிமின்னலுடன் புயல்', te: 'ఉరుములతో కూడిన తుఫాను', bn: 'বজ্রঝড়' },
  96: { en: 'Thunderstorm with slight hail', hi: 'हल्के ओलों के साथ तूफान', mr: 'हलक्या गारांसह वादळ', ta: 'லேசான ஆலங்கட்டியுடன் இடிமின்னல்', te: 'తేలికపాటి వడగళ్లతో తుఫాను', bn: 'হালকা শিলাসহ বজ্রঝড়' },
  99: { en: 'Thunderstorm with heavy hail', hi: 'भारी ओलों के साथ तूफान', mr: 'जोरदार गारांसह वादळ', ta: 'கனமான ஆலங்கட்டியுடன் இடிமின்னல்', te: 'భారీ వడగళ్లతో తుఫాను', bn: 'ভারী শিলাসহ বজ্রঝড়' },
};

export function getWeatherDescription(code: number, lang: Language): string {
  const entry = WMO_DESCRIPTIONS[code];
  if (!entry) return WMO_DESCRIPTIONS[0][lang];
  return entry[lang] ?? entry.en;
}

export type AdvisoryKey =
  | 'heavyRain'
  | 'lightRain'
  | 'noRain'
  | 'highTemperature'
  | 'lowTemperature'
  | 'highHumidity'
  | 'lowHumidity'
  | 'strongWind'
  | 'heavyRainTomorrow';

export const ADVISORY_TEXT: Record<AdvisoryKey, Record<Language, string>> = {
  heavyRain: {
    en: 'Heavy rain detected — avoid pesticide spraying and fertilizer application today.',
    hi: 'भारी बारिश हो रही है — आज कीटनाशक छिड़काव और उर्वरक का प्रयोग न करें।',
    mr: 'मुसळधार पाऊस — आज कीटकनाशक फवारणी आणि खत वापर टाळा.',
    ta: 'கனமழை பெய்து வருகிறது — இன்று பூச்சிக்கொல்லி தெளித்தல் மற்றும் உரமிடுவதைத் தவிர்க்கவும்.',
    te: 'భారీ వర్షం కురుస్తోంది — ఈరోజు పురుగుమందుల పిచికారీ మరియు ఎరువుల వాడకాన్ని నివారించండి.',
    bn: 'ভারী বৃষ্টি হচ্ছে — আজ কীটনাশক স্প্রে এবং সার প্রয়োগ এড়িয়ে চলুন।',
  },
  lightRain: {
    en: 'Light rain — good time for transplanting seedlings or sowing seeds.',
    hi: 'हल्की बारिश — पौध रोपाई या बीज बोने के लिए अच्छा समय है।',
    mr: 'हलका पाऊस — रोपांची पुनर्लागवड किंवा बियाणे पेरणीसाठी चांगली वेळ.',
    ta: 'லேசான மழை — நாற்று நடவு அல்லது விதை விதைப்புக்கு ஏற்ற நேரம்.',
    te: 'తేలికపాటి వర్షం — నారు నాటడానికి లేదా విత్తనాలు వేయడానికి మంచి సమయం.',
    bn: 'হালকা বৃষ্টি — চারা রোপণ বা বীজ বপনের জন্য ভালো সময়।',
  },
  noRain: {
    en: 'No rain — ensure adequate irrigation for standing crops, especially at critical growth stages.',
    hi: 'बारिश नहीं — खड़ी फसलों के लिए, विशेष रूप से महत्वपूर्ण वृद्धि चरणों में, पर्याप्त सिंचाई सुनिश्चित करें।',
    mr: 'पाऊस नाही — उभ्या पिकांसाठी, विशेषतः महत्त्वाच्या वाढीच्या टप्प्यांवर, पुरेसे सिंचन सुनिश्चित करा.',
    ta: 'மழை இல்லை — நிற்கும் பயிர்களுக்கு, குறிப்பாக முக்கியமான வளர்ச்சி கட்டங்களில், போதுமான நீர்ப்பாசனத்தை உறுதி செய்யவும்.',
    te: 'వర్షం లేదు — నిలబడి ఉన్న పంటలకు, ముఖ్యంగా కీలక పెరుగుదల దశలలో, తగినంత నీటిపారుదల నిర్ధారించండి.',
    bn: 'বৃষ্টি নেই — দাঁড়িয়ে থাকা ফসলের জন্য, বিশেষ করে গুরুত্বপূর্ণ বৃদ্ধির পর্যায়ে, পর্যাপ্ত সেচ নিশ্চিত করুন।',
  },
  highTemperature: {
    en: 'High temperature — provide shade for vegetables and increase irrigation frequency.',
    hi: 'उच्च तापमान — सब्जियों को छाया प्रदान करें और सिंचाई की आवृत्ति बढ़ाएं।',
    mr: 'जास्त तापमान — भाजीपाल्याला सावली द्या आणि सिंचनाची वारंवारता वाढवा.',
    ta: 'அதிக வெப்பநிலை — காய்கறிகளுக்கு நிழல் அளித்து நீர்ப்பாசன அதிர்வெண்ணை அதிகரிக்கவும்.',
    te: 'అధిక ఉష్ణోగ్రత — కూరగాయలకు నీడ కల్పించి నీటిపారుదల తరచుదనాన్ని పెంచండి.',
    bn: 'উচ্চ তাপমাত্রা — সবজির জন্য ছায়া দিন এবং সেচের ঘনত্ব বাড়ান।',
  },
  lowTemperature: {
    en: 'Cold conditions — protect sensitive crops with mulching or row covers.',
    hi: 'ठंडी स्थिति — मल्चिंग या रो कवर से संवेदनशील फसलों की सुरक्षा करें।',
    mr: 'थंड परिस्थिती — आच्छादन किंवा रो कव्हरने संवेदनशील पिकांचे संरक्षण करा.',
    ta: 'குளிர் காலநிலை — மல்ச்சிங் அல்லது மறைப்பு மூலம் உணர்திறன் பயிர்களைப் பாதுகாக்கவும்.',
    te: 'చల్లని పరిస్థితులు — మల్చింగ్ లేదా రో కవర్లతో సున్నితమైన పంటలను రక్షించండి.',
    bn: 'ঠান্ডা পরিস্থিতি — মালচিং বা রো কভার দিয়ে সংবেদনশীল ফসল রক্ষা করুন।',
  },
  highHumidity: {
    en: 'High humidity increases fungal disease risk — monitor crops for blight and mildew.',
    hi: 'उच्च आर्द्रता से फफूंद रोग का खतरा बढ़ता है — झुलसा और फफूंदी के लिए फसलों की निगरानी करें।',
    mr: 'जास्त आर्द्रतेमुळे बुरशीजन्य रोगांचा धोका वाढतो — करपा व बुरशीसाठी पिकांवर लक्ष ठेवा.',
    ta: 'அதிக ஈரப்பதம் பூஞ்சை நோய் அபாயத்தை அதிகரிக்கிறது — கருகல் மற்றும் பூஞ்சைக்காக பயிர்களை கண்காணிக்கவும்.',
    te: 'అధిక తేమ శిలీంద్ర వ్యాధుల ప్రమాదాన్ని పెంచుతుంది — ఎండు తెగులు మరియు బూజు కోసం పంటలను పరిశీలించండి.',
    bn: 'উচ্চ আর্দ্রতা ছত্রাকজনিত রোগের ঝুঁকি বাড়ায় — ব্লাইট ও মিলডিউর জন্য ফসল পর্যবেক্ষণ করুন।',
  },
  lowHumidity: {
    en: 'Low humidity — crops may experience water stress, increase irrigation.',
    hi: 'कम आर्द्रता — फसलों में जल तनाव हो सकता है, सिंचाई बढ़ाएं।',
    mr: 'कमी आर्द्रता — पिकांना पाण्याचा ताण जाणवू शकतो, सिंचन वाढवा.',
    ta: 'குறைந்த ஈரப்பதம் — பயிர்கள் நீர் அழுத்தத்தை அனுபவிக்கலாம், நீர்ப்பாசனத்தை அதிகரிக்கவும்.',
    te: 'తక్కువ తేమ — పంటలు నీటి ఒత్తిడిని ఎదుర్కోవచ్చు, నీటిపారుదల పెంచండి.',
    bn: 'কম আর্দ্রতা — ফসলে জলের চাপ হতে পারে, সেচ বাড়ান।',
  },
  strongWind: {
    en: 'Strong winds — delay spraying operations and stake tall crops to prevent lodging.',
    hi: 'तेज़ हवाएं — छिड़काव कार्य स्थगित करें और लंबी फसलों को गिरने से बचाने के लिए सहारा दें।',
    mr: 'जोरदार वारे — फवारणी पुढे ढकला आणि उंच पिके कोसळू नयेत म्हणून आधार द्या.',
    ta: 'பலத்த காற்று — தெளிப்பு பணிகளை தாமதப்படுத்தி, உயரமான பயிர்கள் சாயாமல் இருக்க தூண் கொடுக்கவும்.',
    te: 'బలమైన గాలులు — పిచికారీ పనులను వాయిదా వేసి, ఎత్తైన పంటలు వాలిపోకుండా కర్రలు కట్టండి.',
    bn: 'প্রবল বাতাস — স্প্রে করার কাজ পিছিয়ে দিন এবং লম্বা ফসল হেলে পড়া রোধে খুঁটি দিন।',
  },
  heavyRainTomorrow: {
    en: 'Heavy rain forecast tomorrow — harvest mature crops now to avoid damage.',
    hi: 'कल भारी बारिश का पूर्वानुमान — नुकसान से बचने के लिए अभी पकी फसलों की कटाई करें।',
    mr: 'उद्या मुसळधार पावसाचा अंदाज — नुकसान टाळण्यासाठी पिकलेली पिके आताच काढा.',
    ta: 'நாளை கனமழை பெய்யும் என முன்னறிவிப்பு — சேதத்தைத் தவிர்க்க முதிர்ந்த பயிர்களை இப்போதே அறுவடை செய்யவும்.',
    te: 'రేపు భారీ వర్షం అంచనా — నష్టం నివారించడానికి పండిన పంటలను ఇప్పుడే కోయండి.',
    bn: 'আগামীকাল ভারী বৃষ্টির পূর্বাভাস — ক্ষতি এড়াতে পাকা ফসল এখনই কাটুন।',
  },
};

/**
 * Pure decision logic (unchanged from the original English-only version) —
 * looks at current + forecast conditions and returns which advisory keys
 * apply. Kept separate from the text so it never needs to change per language.
 */
export function computeAdvisoryKeys(w: WeatherData): AdvisoryKey[] {
  const keys: AdvisoryKey[] = [];
  const c = w.current;

  if (c.precipitation > 5) {
    keys.push('heavyRain');
  } else if (c.precipitation > 0) {
    keys.push('lightRain');
  } else {
    keys.push('noRain');
  }

  if (c.temperature > 35) {
    keys.push('highTemperature');
  } else if (c.temperature < 10) {
    keys.push('lowTemperature');
  }

  if (c.humidity > 80) {
    keys.push('highHumidity');
  } else if (c.humidity < 30) {
    keys.push('lowHumidity');
  }

  if (c.windSpeed > 25) {
    keys.push('strongWind');
  }

  const rainTomorrow = w.forecast[1]?.precipitation ?? 0;
  if (rainTomorrow > 10) {
    keys.push('heavyRainTomorrow');
  }

  return keys;
}

export function translateAdvisory(keys: AdvisoryKey[], lang: Language): string[] {
  return keys.map((k) => ADVISORY_TEXT[k][lang] ?? ADVISORY_TEXT[k].en);
}

export function generateWeatherAdvisory(w: WeatherData, lang: Language): string[] {
  return translateAdvisory(computeAdvisoryKeys(w), lang);
}
