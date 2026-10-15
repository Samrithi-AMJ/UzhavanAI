import type { Language } from './i18n';
import type { CropResult } from './cropEngine';

type CropTextFields = {
  name: string;
  season: string;
  waterRequirement: string;
  growingPeriod: string;
  expectedYield: string;
  reason: string;
};

/**
 * Fully pre-translated text for every crop the engine can recommend, in
 * every supported language. Digits/units inside these strings (e.g. the
 * "1200–1500 mm" range) are copied identically across languages — only the
 * surrounding words are translated — so numeric values are never altered.
 */
const CROP_TEXT: Record<string, Record<Language, CropTextFields>> = {
  rice: {
    en: { name: 'Rice', season: 'Kharif (Monsoon)', waterRequirement: 'High (1200–1500 mm)', growingPeriod: '110–150 days', expectedYield: '2.5–4.5 t/ha', reason: 'Thrives in flooded or waterlogged conditions with warm humid climate.' },
    hi: { name: 'चावल', season: 'खरीफ (मानसून)', waterRequirement: 'उच्च (1200–1500 मिमी)', growingPeriod: '110–150 दिन', expectedYield: '2.5–4.5 टन/हेक्टेयर', reason: 'गर्म आर्द्र जलवायु में जलभराव वाली स्थितियों में अच्छी तरह उगता है।' },
    mr: { name: 'भात', season: 'खरीप (मान्सून)', waterRequirement: 'जास्त (1200–1500 मिमी)', growingPeriod: '110–150 दिवस', expectedYield: '2.5–4.5 टन/हेक्टर', reason: 'उष्ण दमट हवामानात पाणी साचलेल्या जमिनीत चांगले वाढते.' },
    ta: { name: 'நெல்', season: 'காரிப் பருவம் (பருவமழை)', waterRequirement: 'அதிகம் (1200–1500 மிமீ)', growingPeriod: '110–150 நாட்கள்', expectedYield: '2.5–4.5 டன்/ஹெக்டேர்', reason: 'சூடான ஈரப்பதமான காலநிலையில் நீர் தேங்கிய நிலையில் நன்கு வளரும்.' },
    te: { name: 'వరి', season: 'ఖరీఫ్ (వర్షాకాలం)', waterRequirement: 'అధికం (1200–1500 మిమీ)', growingPeriod: '110–150 రోజులు', expectedYield: '2.5–4.5 టన్నులు/హెక్టారు', reason: 'వెచ్చని తేమతో కూడిన వాతావరణంలో నీరు నిలిచిన నేలలో బాగా పెరుగుతుంది.' },
    bn: { name: 'ধান', season: 'খরিফ (বর্ষা)', waterRequirement: 'বেশি (1200–1500 মিমি)', growingPeriod: '110–150 দিন', expectedYield: '2.5–4.5 টন/হেক্টর', reason: 'উষ্ণ আর্দ্র জলবায়ুতে জলাবদ্ধ অবস্থায় ভালো জন্মায়।' },
  },
  wheat: {
    en: { name: 'Wheat', season: 'Rabi (Winter)', waterRequirement: 'Medium (450–650 mm)', growingPeriod: '110–130 days', expectedYield: '2.5–4.0 t/ha', reason: 'Cool-season cereal, prefers well-drained loamy soils.' },
    hi: { name: 'गेहूं', season: 'रबी (सर्दी)', waterRequirement: 'मध्यम (450–650 मिमी)', growingPeriod: '110–130 दिन', expectedYield: '2.5–4.0 टन/हेक्टेयर', reason: 'ठंडे मौसम की फसल, अच्छी जल निकासी वाली दोमट मिट्टी पसंद करती है।' },
    mr: { name: 'गहू', season: 'रब्बी (हिवाळा)', waterRequirement: 'मध्यम (450–650 मिमी)', growingPeriod: '110–130 दिवस', expectedYield: '2.5–4.0 टन/हेक्टर', reason: 'थंड हंगामातील पीक, चांगला निचरा होणारी पोयट्याची जमीन आवडते.' },
    ta: { name: 'கோதுமை', season: 'ரபி (குளிர்காலம்)', waterRequirement: 'மிதமானது (450–650 மிமீ)', growingPeriod: '110–130 நாட்கள்', expectedYield: '2.5–4.0 டன்/ஹெக்டேர்', reason: 'குளிர் பருவப் பயிர், நல்ல வடிகால் உள்ள வண்டல் மண்ணை விரும்பும்.' },
    te: { name: 'గోధుమ', season: 'రబీ (శీతాకాలం)', waterRequirement: 'మధ్యస్థం (450–650 మిమీ)', growingPeriod: '110–130 రోజులు', expectedYield: '2.5–4.0 టన్నులు/హెక్టారు', reason: 'చల్లని కాలపు పంట, మంచి నీటి బహిర్గమనం ఉన్న గోడు నేలలను ఇష్టపడుతుంది.' },
    bn: { name: 'গম', season: 'রবি (শীত)', waterRequirement: 'মাঝারি (450–650 মিমি)', growingPeriod: '110–130 দিন', expectedYield: '2.5–4.0 টন/হেক্টর', reason: 'শীতল মৌসুমের শস্য, ভালো নিষ্কাশনযুক্ত দোআঁশ মাটি পছন্দ করে।' },
  },
  maize: {
    en: { name: 'Maize', season: 'Kharif / Spring', waterRequirement: 'Medium (500–800 mm)', growingPeriod: '90–120 days', expectedYield: '3.0–5.5 t/ha', reason: 'Versatile cereal grows across diverse climates; sensitive to waterlogging.' },
    hi: { name: 'मक्का', season: 'खरीफ / वसंत', waterRequirement: 'मध्यम (500–800 मिमी)', growingPeriod: '90–120 दिन', expectedYield: '3.0–5.5 टन/हेक्टेयर', reason: 'विविध जलवायु में उगने वाली बहुमुखी फसल; जलभराव के प्रति संवेदनशील।' },
    mr: { name: 'मका', season: 'खरीप / वसंत', waterRequirement: 'मध्यम (500–800 मिमी)', growingPeriod: '90–120 दिवस', expectedYield: '3.0–5.5 टन/हेक्टर', reason: 'विविध हवामानात वाढणारे बहुउपयोगी पीक; पाणी साचण्यास संवेदनशील.' },
    ta: { name: 'சோளம்', season: 'காரிப் / வசந்தம்', waterRequirement: 'மிதமானது (500–800 மிமீ)', growingPeriod: '90–120 நாட்கள்', expectedYield: '3.0–5.5 டன்/ஹெக்டேர்', reason: 'பல்வேறு காலநிலைகளில் வளரும் பயிர்; நீர் தேங்குதலுக்கு உணர்திறன் கொண்டது.' },
    te: { name: 'మొక్కజొన్న', season: 'ఖరీఫ్ / వసంతం', waterRequirement: 'మధ్యస్థం (500–800 మిమీ)', growingPeriod: '90–120 రోజులు', expectedYield: '3.0–5.5 టన్నులు/హెక్టారు', reason: 'విభిన్న వాతావరణాలలో పెరిగే బహుముఖ పంట; నీరు నిలిచిపోవడానికి సున్నితం.' },
    bn: { name: 'ভুট্টা', season: 'খরিফ / বসন্ত', waterRequirement: 'মাঝারি (500–800 মিমি)', growingPeriod: '90–120 দিন', expectedYield: '3.0–5.5 টন/হেক্টর', reason: 'বিভিন্ন জলবায়ুতে জন্মানো বহুমুখী শস্য; জলাবদ্ধতার প্রতি সংবেদনশীল।' },
  },
  cotton: {
    en: { name: 'Cotton', season: 'Kharif', waterRequirement: 'Medium (500–900 mm)', growingPeriod: '150–180 days', expectedYield: '1.5–2.5 t/ha (lint)', reason: 'Needs warm climate with sunny days; sensitive to frost.' },
    hi: { name: 'कपास', season: 'खरीफ', waterRequirement: 'मध्यम (500–900 मिमी)', growingPeriod: '150–180 दिन', expectedYield: '1.5–2.5 टन/हेक्टेयर (रुई)', reason: 'धूप वाले दिनों के साथ गर्म जलवायु चाहिए; पाले के प्रति संवेदनशील।' },
    mr: { name: 'कापूस', season: 'खरीप', waterRequirement: 'मध्यम (500–900 मिमी)', growingPeriod: '150–180 दिवस', expectedYield: '1.5–2.5 टन/हेक्टर (रुई)', reason: 'सूर्यप्रकाश असलेले उष्ण हवामान आवश्यक; दंवाला संवेदनशील.' },
    ta: { name: 'பருத்தி', season: 'காரிப்', waterRequirement: 'மிதமானது (500–900 மிமீ)', growingPeriod: '150–180 நாட்கள்', expectedYield: '1.5–2.5 டன்/ஹெக்டேர் (பஞ்சு)', reason: 'வெயில் நாட்களுடன் சூடான காலநிலை தேவை; உறைபனிக்கு உணர்திறன் கொண்டது.' },
    te: { name: 'పత్తి', season: 'ఖరీఫ్', waterRequirement: 'మధ్యస్థం (500–900 మిమీ)', growingPeriod: '150–180 రోజులు', expectedYield: '1.5–2.5 టన్నులు/హెక్టారు (దూది)', reason: 'ఎండ రోజులతో వెచ్చని వాతావరణం అవసరం; మంచుకు సున్నితం.' },
    bn: { name: 'তুলা', season: 'খরিফ', waterRequirement: 'মাঝারি (500–900 মিমি)', growingPeriod: '150–180 দিন', expectedYield: '1.5–2.5 টন/হেক্টর (তুলা)', reason: 'রৌদ্রোজ্জ্বল দিনসহ উষ্ণ জলবায়ু প্রয়োজন; তুষারপাতের প্রতি সংবেদনশীল।' },
  },
  sugarcane: {
    en: { name: 'Sugarcane', season: 'Annual (year-round planting)', waterRequirement: 'High (1500–2500 mm)', growingPeriod: '10–18 months', expectedYield: '60–80 t/ha', reason: 'Long-duration crop requiring abundant water and fertile soil.' },
    hi: { name: 'गन्ना', season: 'वार्षिक (साल भर रोपण)', waterRequirement: 'उच्च (1500–2500 मिमी)', growingPeriod: '10–18 महीने', expectedYield: '60–80 टन/हेक्टेयर', reason: 'लंबी अवधि की फसल जिसे प्रचुर पानी और उपजाऊ मिट्टी चाहिए।' },
    mr: { name: 'ऊस', season: 'वार्षिक (वर्षभर लागवड)', waterRequirement: 'जास्त (1500–2500 मिमी)', growingPeriod: '10–18 महिने', expectedYield: '60–80 टन/हेक्टर', reason: 'दीर्घकालीन पीक ज्याला भरपूर पाणी आणि सुपीक जमीन लागते.' },
    ta: { name: 'கரும்பு', season: 'வருடாந்திரம் (ஆண்டு முழுவதும் நடவு)', waterRequirement: 'அதிகம் (1500–2500 மிமீ)', growingPeriod: '10–18 மாதங்கள்', expectedYield: '60–80 டன்/ஹெக்டேர்', reason: 'நீண்ட கால பயிர், அதிக நீர் மற்றும் வளமான மண் தேவை.' },
    te: { name: 'చెరకు', season: 'వార్షికం (ఏడాది పొడవునా నాటడం)', waterRequirement: 'అధికం (1500–2500 మిమీ)', growingPeriod: '10–18 నెలలు', expectedYield: '60–80 టన్నులు/హెక్టారు', reason: 'ఎక్కువ నీరు మరియు సారవంతమైన నేల అవసరమయ్యే దీర్ఘకాలిక పంట.' },
    bn: { name: 'আখ', season: 'বার্ষিক (সারা বছর রোপণ)', waterRequirement: 'বেশি (1500–2500 মিমি)', growingPeriod: '10–18 মাস', expectedYield: '60–80 টন/হেক্টর', reason: 'দীর্ঘমেয়াদী শস্য যার প্রচুর পানি ও উর্বর মাটি প্রয়োজন।' },
  },
  soybean: {
    en: { name: 'Soybean', season: 'Kharif', waterRequirement: 'Medium (450–700 mm)', growingPeriod: '90–120 days', expectedYield: '1.5–3.0 t/ha', reason: 'Nitrogen-fixing legume improves soil fertility; good for rotation.' },
    hi: { name: 'सोयाबीन', season: 'खरीफ', waterRequirement: 'मध्यम (450–700 मिमी)', growingPeriod: '90–120 दिन', expectedYield: '1.5–3.0 टन/हेक्टेयर', reason: 'नाइट्रोजन स्थिर करने वाली फलीदार फसल मिट्टी की उर्वरता बढ़ाती है; फसल चक्र के लिए अच्छी।' },
    mr: { name: 'सोयाबीन', season: 'खरीप', waterRequirement: 'मध्यम (450–700 मिमी)', growingPeriod: '90–120 दिवस', expectedYield: '1.5–3.0 टन/हेक्टर', reason: 'नत्र स्थिर करणारे कडधान्य पीक जमिनीची सुपीकता वाढवते; पीक फेरपालटीसाठी चांगले.' },
    ta: { name: 'சோயாபீன்', season: 'காரிப்', waterRequirement: 'மிதமானது (450–700 மிமீ)', growingPeriod: '90–120 நாட்கள்', expectedYield: '1.5–3.0 டன்/ஹெக்டேர்', reason: 'நைட்ரஜனை நிலைப்படுத்தும் பயறு வகை மண் வளத்தை மேம்படுத்தும்; சுழற்சி பயிருக்கு ஏற்றது.' },
    te: { name: 'సోయాబీన్', season: 'ఖరీఫ్', waterRequirement: 'మధ్యస్థం (450–700 మిమీ)', growingPeriod: '90–120 రోజులు', expectedYield: '1.5–3.0 టన్నులు/హెక్టారు', reason: 'నత్రజనిని స్థిరీకరించే పప్పుధాన్యం నేల సారాన్ని మెరుగుపరుస్తుంది; పంట మార్పిడికి మంచిది.' },
    bn: { name: 'সয়াবিন', season: 'খরিফ', waterRequirement: 'মাঝারি (450–700 মিমি)', growingPeriod: '90–120 দিন', expectedYield: '1.5–3.0 টন/হেক্টর', reason: 'নাইট্রোজেন স্থিরকারী ডালশস্য মাটির উর্বরতা বাড়ায়; শস্য আবর্তনের জন্য ভালো।' },
  },
  groundnut: {
    en: { name: 'Groundnut', season: 'Kharif / Summer', waterRequirement: 'Low–Medium (300–500 mm)', growingPeriod: '100–130 days', expectedYield: '1.0–2.0 t/ha', reason: 'Drought-tolerant oilseed; thrives in sandy loam soils.' },
    hi: { name: 'मूंगफली', season: 'खरीफ / गर्मी', waterRequirement: 'कम–मध्यम (300–500 मिमी)', growingPeriod: '100–130 दिन', expectedYield: '1.0–2.0 टन/हेक्टेयर', reason: 'सूखा सहनशील तिलहन; बलुई दोमट मिट्टी में अच्छी तरह उगती है।' },
    mr: { name: 'भुईमूग', season: 'खरीप / उन्हाळा', waterRequirement: 'कमी–मध्यम (300–500 मिमी)', growingPeriod: '100–130 दिवस', expectedYield: '1.0–2.0 टन/हेक्टर', reason: 'दुष्काळ सहनशील तेलबिया पीक; वाळूमिश्रित पोयट्याच्या जमिनीत चांगले वाढते.' },
    ta: { name: 'நிலக்கடலை', season: 'காரிப் / கோடை', waterRequirement: 'குறைவு–மிதமானது (300–500 மிமீ)', growingPeriod: '100–130 நாட்கள்', expectedYield: '1.0–2.0 டன்/ஹெக்டேர்', reason: 'வறட்சியைத் தாங்கும் எண்ணெய் வித்து; மணல் கலந்த வண்டல் மண்ணில் நன்கு வளரும்.' },
    te: { name: 'వేరుశనగ', season: 'ఖరీఫ్ / వేసవి', waterRequirement: 'తక్కువ–మధ్యస్థం (300–500 మిమీ)', growingPeriod: '100–130 రోజులు', expectedYield: '1.0–2.0 టన్నులు/హెక్టారు', reason: 'కరువును తట్టుకునే నూనెగింజ పంట; ఇసుక గోడు నేలల్లో బాగా పెరుగుతుంది.' },
    bn: { name: 'চীনাবাদাম', season: 'খরিফ / গ্রীষ্ম', waterRequirement: 'কম–মাঝারি (300–500 মিমি)', growingPeriod: '100–130 দিন', expectedYield: '1.0–2.0 টন/হেক্টর', reason: 'খরা-সহনশীল তৈলবীজ; বেলে দোআঁশ মাটিতে ভালো জন্মায়।' },
  },
  mustard: {
    en: { name: 'Mustard', season: 'Rabi', waterRequirement: 'Low (250–400 mm)', growingPeriod: '110–140 days', expectedYield: '1.0–1.8 t/ha', reason: 'Cool-season oilseed; tolerates light frost and dry conditions.' },
    hi: { name: 'सरसों', season: 'रबी', waterRequirement: 'कम (250–400 मिमी)', growingPeriod: '110–140 दिन', expectedYield: '1.0–1.8 टन/हेक्टेयर', reason: 'ठंडे मौसम का तिलहन; हल्के पाले और सूखी स्थितियों को सहन करता है।' },
    mr: { name: 'मोहरी', season: 'रब्बी', waterRequirement: 'कमी (250–400 मिमी)', growingPeriod: '110–140 दिवस', expectedYield: '1.0–1.8 टन/हेक्टर', reason: 'थंड हंगामातील तेलबिया; सौम्य दंव आणि कोरड्या परिस्थितीला सहन करते.' },
    ta: { name: 'கடுகு', season: 'ரபி', waterRequirement: 'குறைவு (250–400 மிமீ)', growingPeriod: '110–140 நாட்கள்', expectedYield: '1.0–1.8 டன்/ஹெக்டேர்', reason: 'குளிர் பருவ எண்ணெய் வித்து; இலேசான உறைபனி மற்றும் வறண்ட நிலைமைகளைத் தாங்கும்.' },
    te: { name: 'ఆవాలు', season: 'రబీ', waterRequirement: 'తక్కువ (250–400 మిమీ)', growingPeriod: '110–140 రోజులు', expectedYield: '1.0–1.8 టన్నులు/హెక్టారు', reason: 'చల్లని కాలపు నూనెగింజ; తేలికపాటి మంచు మరియు పొడి పరిస్థితులను తట్టుకుంటుంది.' },
    bn: { name: 'সরিষা', season: 'রবি', waterRequirement: 'কম (250–400 মিমি)', growingPeriod: '110–140 দিন', expectedYield: '1.0–1.8 টন/হেক্টর', reason: 'শীতল মৌসুমের তৈলবীজ; হালকা তুষারপাত ও শুষ্ক পরিস্থিতি সহ্য করে।' },
  },
  tomato: {
    en: { name: 'Tomato', season: 'Year-round (Rabi preferred)', waterRequirement: 'Medium (500–700 mm)', growingPeriod: '90–120 days', expectedYield: '25–40 t/ha', reason: 'High-value vegetable; sensitive to extreme heat and waterlogging.' },
    hi: { name: 'टमाटर', season: 'साल भर (रबी में सर्वोत्तम)', waterRequirement: 'मध्यम (500–700 मिमी)', growingPeriod: '90–120 दिन', expectedYield: '25–40 टन/हेक्टेयर', reason: 'उच्च मूल्य वाली सब्जी; अत्यधिक गर्मी और जलभराव के प्रति संवेदनशील।' },
    mr: { name: 'टोमॅटो', season: 'वर्षभर (रब्बीत उत्तम)', waterRequirement: 'मध्यम (500–700 मिमी)', growingPeriod: '90–120 दिवस', expectedYield: '25–40 टन/हेक्टर', reason: 'उच्च मूल्याची भाजी; अति उष्णता आणि पाणी साचण्यास संवेदनशील.' },
    ta: { name: 'தக்காளி', season: 'ஆண்டு முழுவதும் (ரபி சிறந்தது)', waterRequirement: 'மிதமானது (500–700 மிமீ)', growingPeriod: '90–120 நாட்கள்', expectedYield: '25–40 டன்/ஹெக்டேர்', reason: 'அதிக மதிப்புள்ள காய்கறி; கடுமையான வெப்பம் மற்றும் நீர் தேங்குதலுக்கு உணர்திறன் கொண்டது.' },
    te: { name: 'టమాటా', season: 'ఏడాది పొడవునా (రబీ ఉత్తమం)', waterRequirement: 'మధ్యస్థం (500–700 మిమీ)', growingPeriod: '90–120 రోజులు', expectedYield: '25–40 టన్నులు/హెక్టారు', reason: 'అధిక విలువ కలిగిన కూరగాయ; తీవ్రమైన వేడి మరియు నీరు నిలిచిపోవడానికి సున్నితం.' },
    bn: { name: 'টমেটো', season: 'সারা বছর (রবি সেরা)', waterRequirement: 'মাঝারি (500–700 মিমি)', growingPeriod: '90–120 দিন', expectedYield: '25–40 টন/হেক্টর', reason: 'উচ্চমূল্যের সবজি; চরম তাপ ও জলাবদ্ধতার প্রতি সংবেদনশীল।' },
  },
  banana: {
    en: { name: 'Banana', season: 'Year-round', waterRequirement: 'High (1200–2000 mm)', growingPeriod: '11–16 months', expectedYield: '40–60 t/ha', reason: 'Heavy potassium feeder; requires warm humid climate and irrigation.' },
    hi: { name: 'केला', season: 'साल भर', waterRequirement: 'उच्च (1200–2000 मिमी)', growingPeriod: '11–16 महीने', expectedYield: '40–60 टन/हेक्टेयर', reason: 'भारी पोटेशियम उपभोक्ता; गर्म आर्द्र जलवायु और सिंचाई की आवश्यकता।' },
    mr: { name: 'केळी', season: 'वर्षभर', waterRequirement: 'जास्त (1200–2000 मिमी)', growingPeriod: '11–16 महिने', expectedYield: '40–60 टन/हेक्टर', reason: 'भरपूर पालाश लागणारे पीक; उष्ण दमट हवामान आणि सिंचन आवश्यक.' },
    ta: { name: 'வாழை', season: 'ஆண்டு முழுவதும்', waterRequirement: 'அதிகம் (1200–2000 மிமீ)', growingPeriod: '11–16 மாதங்கள்', expectedYield: '40–60 டன்/ஹெக்டேர்', reason: 'அதிக பொட்டாசியம் தேவைப்படும் பயிர்; சூடான ஈரப்பதமான காலநிலையும் நீர்ப்பாசனமும் தேவை.' },
    te: { name: 'అరటి', season: 'ఏడాది పొడవునా', waterRequirement: 'అధికం (1200–2000 మిమీ)', growingPeriod: '11–16 నెలలు', expectedYield: '40–60 టన్నులు/హెక్టారు', reason: 'ఎక్కువ పొటాషియం అవసరమయ్యే పంట; వెచ్చని తేమతో కూడిన వాతావరణం మరియు నీటిపారుదల అవసరం.' },
    bn: { name: 'কলা', season: 'সারা বছর', waterRequirement: 'বেশি (1200–2000 মিমি)', growingPeriod: '11–16 মাস', expectedYield: '40–60 টন/হেক্টর', reason: 'অধিক পটাশিয়াম গ্রহণকারী; উষ্ণ আর্দ্র জলবায়ু ও সেচ প্রয়োজন।' },
  },
  millet: {
    en: { name: 'Millet (Bajra)', season: 'Kharif', waterRequirement: 'Low (300–500 mm)', growingPeriod: '70–90 days', expectedYield: '1.0–2.0 t/ha', reason: 'Highly drought-tolerant; ideal for arid and semi-arid regions.' },
    hi: { name: 'बाजरा', season: 'खरीफ', waterRequirement: 'कम (300–500 मिमी)', growingPeriod: '70–90 दिन', expectedYield: '1.0–2.0 टन/हेक्टेयर', reason: 'अत्यधिक सूखा सहनशील; शुष्क और अर्ध-शुष्क क्षेत्रों के लिए आदर्श।' },
    mr: { name: 'बाजरी', season: 'खरीप', waterRequirement: 'कमी (300–500 मिमी)', growingPeriod: '70–90 दिवस', expectedYield: '1.0–2.0 टन/हेक्टर', reason: 'अत्यंत दुष्काळ सहनशील; रखरखीत व अर्धरखरखीत भागांसाठी आदर्श.' },
    ta: { name: 'கம்பு', season: 'காரிப்', waterRequirement: 'குறைவு (300–500 மிமீ)', growingPeriod: '70–90 நாட்கள்', expectedYield: '1.0–2.0 டன்/ஹெக்டேர்', reason: 'மிகவும் வறட்சியைத் தாங்கும்; வறண்ட மற்றும் அரை வறண்ட பகுதிகளுக்கு ஏற்றது.' },
    te: { name: 'సజ్జ', season: 'ఖరీఫ్', waterRequirement: 'తక్కువ (300–500 మిమీ)', growingPeriod: '70–90 రోజులు', expectedYield: '1.0–2.0 టన్నులు/హెక్టారు', reason: 'అత్యధిక కరువు తట్టుకునేది; శుష్క మరియు అర్ధ-శుష్క ప్రాంతాలకు అనువైనది.' },
    bn: { name: 'বাজরা', season: 'খরিফ', waterRequirement: 'কম (300–500 মিমি)', growingPeriod: '70–90 দিন', expectedYield: '1.0–2.0 টন/হেক্টর', reason: 'অত্যন্ত খরা-সহনশীল; শুষ্ক ও অর্ধ-শুষ্ক অঞ্চলের জন্য আদর্শ।' },
  },
  chickpea: {
    en: { name: 'Chickpea (Gram)', season: 'Rabi', waterRequirement: 'Low (250–400 mm)', growingPeriod: '95–115 days', expectedYield: '1.0–1.8 t/ha', reason: 'Cool-season legume; nitrogen-fixing and drought-tolerant.' },
    hi: { name: 'चना', season: 'रबी', waterRequirement: 'कम (250–400 मिमी)', growingPeriod: '95–115 दिन', expectedYield: '1.0–1.8 टन/हेक्टेयर', reason: 'ठंडे मौसम की फलीदार फसल; नाइट्रोजन स्थिर करने वाली और सूखा सहनशील।' },
    mr: { name: 'हरभरा', season: 'रब्बी', waterRequirement: 'कमी (250–400 मिमी)', growingPeriod: '95–115 दिवस', expectedYield: '1.0–1.8 टन/हेक्टर', reason: 'थंड हंगामातील कडधान्य; नत्र स्थिर करणारे आणि दुष्काळ सहनशील.' },
    ta: { name: 'கொண்டைக்கடலை', season: 'ரபி', waterRequirement: 'குறைவு (250–400 மிமீ)', growingPeriod: '95–115 நாட்கள்', expectedYield: '1.0–1.8 டன்/ஹெக்டேர்', reason: 'குளிர் பருவ பயறு வகை; நைட்ரஜனை நிலைப்படுத்தும் மற்றும் வறட்சியைத் தாங்கும்.' },
    te: { name: 'శనగలు', season: 'రబీ', waterRequirement: 'తక్కువ (250–400 మిమీ)', growingPeriod: '95–115 రోజులు', expectedYield: '1.0–1.8 టన్నులు/హెక్టారు', reason: 'చల్లని కాలపు పప్పుధాన్యం; నత్రజనిని స్థిరీకరించేది మరియు కరువును తట్టుకునేది.' },
    bn: { name: 'ছোলা', season: 'রবি', waterRequirement: 'কম (250–400 মিমি)', growingPeriod: '95–115 দিন', expectedYield: '1.0–1.8 টন/হেক্টর', reason: 'শীতল মৌসুমের ডালশস্য; নাইট্রোজেন স্থিরকারী ও খরা-সহনশীল।' },
  },
  pigeonpeas: {
    en: { name: 'Pigeon Pea (Tur/Arhar)', season: 'Kharif', waterRequirement: 'Low–Medium (600–650 mm)', growingPeriod: '150–180 days', expectedYield: '0.8–1.5 t/ha', reason: 'Deep-rooted, drought-hardy legume; commonly intercropped with cereals.' },
    hi: { name: 'अरहर (तूर दाल)', season: 'खरीफ', waterRequirement: 'कम–मध्यम (600–650 मिमी)', growingPeriod: '150–180 दिन', expectedYield: '0.8–1.5 टन/हेक्टेयर', reason: 'गहरी जड़ों वाली, सूखा-सहनशील फलीदार फसल; अक्सर अनाज फसलों के साथ अंतर-फसल के रूप में उगाई जाती है।' },
    mr: { name: 'तूर (अरहर डाळ)', season: 'खरीप', waterRequirement: 'कमी–मध्यम (600–650 मिमी)', growingPeriod: '150–180 दिवस', expectedYield: '0.8–1.5 टन/हेक्टर', reason: 'खोल मुळे असलेले, दुष्काळ सहनशील कडधान्य पीक; सामान्यतः तृणधान्यांसोबत आंतरपीक म्हणून घेतले जाते.' },
    ta: { name: 'துவரம் பருப்பு', season: 'காரிப்', waterRequirement: 'குறைவு–மிதமானது (600–650 மிமீ)', growingPeriod: '150–180 நாட்கள்', expectedYield: '0.8–1.5 டன்/ஹெக்டேர்', reason: 'ஆழமான வேர் கொண்ட, வறட்சியைத் தாங்கும் பயறு வகை; பொதுவாக தானியப் பயிர்களுடன் இடைப்பயிராக பயிரிடப்படுகிறது.' },
    te: { name: 'కంది పప్పు', season: 'ఖరీఫ్', waterRequirement: 'తక్కువ–మధ్యస్థం (600–650 మిమీ)', growingPeriod: '150–180 రోజులు', expectedYield: '0.8–1.5 టన్నులు/హెక్టారు', reason: 'లోతైన వేర్లు కలిగిన, కరువును తట్టుకునే పప్పుధాన్యం; సాధారణంగా తృణధాన్యాలతో అంతర పంటగా వేస్తారు.' },
    bn: { name: 'অড়হর ডাল', season: 'খরিফ', waterRequirement: 'কম–মাঝারি (600–650 মিমি)', growingPeriod: '150–180 দিন', expectedYield: '0.8–1.5 টন/হেক্টর', reason: 'গভীর মূলযুক্ত, খরা-সহনশীল ডালশস্য; সাধারণত শস্যদানার সাথে আন্তঃফসল হিসেবে চাষ করা হয়।' },
  },
  mungbean: {
    en: { name: 'Green Gram (Mung Bean)', season: 'Kharif/summer', waterRequirement: 'Low (350–500 mm)', growingPeriod: '60–75 days', expectedYield: '0.6–1.0 t/ha', reason: 'Short-duration pulse; fits well between two main crops in rotation.' },
    hi: { name: 'मूंग', season: 'खरीफ/गर्मी', waterRequirement: 'कम (350–500 मिमी)', growingPeriod: '60–75 दिन', expectedYield: '0.6–1.0 टन/हेक्टेयर', reason: 'कम अवधि की दलहनी फसल; दो मुख्य फसलों के बीच फसल चक्र में अच्छी तरह फिट बैठती है।' },
    mr: { name: 'मूग', season: 'खरीप/उन्हाळा', waterRequirement: 'कमी (350–500 मिमी)', growingPeriod: '60–75 दिवस', expectedYield: '0.6–1.0 टन/हेक्टर', reason: 'कमी कालावधीचे कडधान्य पीक; दोन मुख्य पिकांमध्ये फेरपालटीत चांगले बसते.' },
    ta: { name: 'பாசிப்பயறு', season: 'காரிப்/கோடை', waterRequirement: 'குறைவு (350–500 மிமீ)', growingPeriod: '60–75 நாட்கள்', expectedYield: '0.6–1.0 டன்/ஹெக்டேர்', reason: 'குறுகிய கால பயறு வகை; இரண்டு முக்கிய பயிர்களுக்கு இடையே சுழற்சி பயிராக ஏற்றது.' },
    te: { name: 'పెసలు', season: 'ఖరీఫ్/వేసవి', waterRequirement: 'తక్కువ (350–500 మిమీ)', growingPeriod: '60–75 రోజులు', expectedYield: '0.6–1.0 టన్నులు/హెక్టారు', reason: 'తక్కువ కాలపు పప్పుధాన్యం; రెండు ప్రధాన పంటల మధ్య పంట మార్పిడికి బాగా సరిపోతుంది.' },
    bn: { name: 'মুগ ডাল', season: 'খরিফ/গ্রীষ্ম', waterRequirement: 'কম (350–500 মিমি)', growingPeriod: '60–75 দিন', expectedYield: '0.6–1.0 টন/হেক্টর', reason: 'স্বল্পমেয়াদী ডালশস্য; দুটি প্রধান ফসলের মাঝে শস্য আবর্তনে ভালোভাবে খাপ খায়।' },
  },
  blackgram: {
    en: { name: 'Black Gram (Urad)', season: 'Kharif/Rabi', waterRequirement: 'Low (350–500 mm)', growingPeriod: '70–90 days', expectedYield: '0.6–1.0 t/ha', reason: 'Short-duration pulse suited to residual soil moisture after rice.' },
    hi: { name: 'उड़द', season: 'खरीफ/रबी', waterRequirement: 'कम (350–500 मिमी)', growingPeriod: '70–90 दिन', expectedYield: '0.6–1.0 टन/हेक्टेयर', reason: 'कम अवधि की दलहनी फसल जो धान के बाद बची नमी में अच्छी तरह उगती है।' },
    mr: { name: 'उडीद', season: 'खरीप/रब्बी', waterRequirement: 'कमी (350–500 मिमी)', growingPeriod: '70–90 दिवस', expectedYield: '0.6–1.0 टन/हेक्टर', reason: 'भाताच्या पिकानंतर उरलेल्या ओलाव्यात चांगले येणारे कमी कालावधीचे कडधान्य पीक.' },
    ta: { name: 'உளுந்து', season: 'காரிப்/ரபி', waterRequirement: 'குறைவு (350–500 மிமீ)', growingPeriod: '70–90 நாட்கள்', expectedYield: '0.6–1.0 டன்/ஹெக்டேர்', reason: 'நெல் அறுவடைக்குப் பின் மீதமுள்ள ஈரப்பதத்தில் நன்கு வளரும் குறுகிய கால பயறு வகை.' },
    te: { name: 'మినుములు', season: 'ఖరీఫ్/రబీ', waterRequirement: 'తక్కువ (350–500 మిమీ)', growingPeriod: '70–90 రోజులు', expectedYield: '0.6–1.0 టన్నులు/హెక్టారు', reason: 'వరి తర్వాత మిగిలిన నేల తేమకు అనుకూలమైన తక్కువ కాలపు పప్పుధాన్యం.' },
    bn: { name: 'কলাই ডাল (উড়দ)', season: 'খরিফ/রবি', waterRequirement: 'কম (350–500 মিমি)', growingPeriod: '70–90 দিন', expectedYield: '0.6–1.0 টন/হেক্টর', reason: 'ধান কাটার পর অবশিষ্ট মাটির আর্দ্রতায় উপযুক্ত স্বল্পমেয়াদী ডালশস্য।' },
  },
  lentil: {
    en: { name: 'Lentil (Masoor)', season: 'Rabi', waterRequirement: 'Low (300–400 mm)', growingPeriod: '100–120 days', expectedYield: '0.8–1.2 t/ha', reason: 'Cool-season pulse; grown mostly on conserved soil moisture.' },
    hi: { name: 'मसूर', season: 'रबी', waterRequirement: 'कम (300–400 मिमी)', growingPeriod: '100–120 दिन', expectedYield: '0.8–1.2 टन/हेक्टेयर', reason: 'ठंडे मौसम की दलहनी फसल; अधिकतर संरक्षित मिट्टी की नमी पर उगाई जाती है।' },
    mr: { name: 'मसूर', season: 'रब्बी', waterRequirement: 'कमी (300–400 मिमी)', growingPeriod: '100–120 दिवस', expectedYield: '0.8–1.2 टन/हेक्टर', reason: 'थंड हंगामातील कडधान्य; बहुतांश साठवलेल्या जमिनीतील ओलाव्यावर घेतले जाते.' },
    ta: { name: 'மசூர் பருப்பு', season: 'ரபி', waterRequirement: 'குறைவு (300–400 மிமீ)', growingPeriod: '100–120 நாட்கள்', expectedYield: '0.8–1.2 டன்/ஹெக்டேர்', reason: 'குளிர் பருவ பயறு வகை; பெரும்பாலும் மண்ணில் சேமிக்கப்பட்ட ஈரப்பதத்தில் பயிரிடப்படுகிறது.' },
    te: { name: 'మసూర్ పప్పు', season: 'రబీ', waterRequirement: 'తక్కువ (300–400 మిమీ)', growingPeriod: '100–120 రోజులు', expectedYield: '0.8–1.2 టన్నులు/హెక్టారు', reason: 'చల్లని కాలపు పప్పుధాన్యం; ఎక్కువగా నేలలో నిల్వ ఉన్న తేమపై పండిస్తారు.' },
    bn: { name: 'মসুর ডাল', season: 'রবি', waterRequirement: 'কম (300–400 মিমি)', growingPeriod: '100–120 দিন', expectedYield: '0.8–1.2 টন/হেক্টর', reason: 'শীতল মৌসুমের ডালশস্য; বেশিরভাগ ক্ষেত্রে সংরক্ষিত মাটির আর্দ্রতায় চাষ করা হয়।' },
  },
  kidneybeans: {
    en: { name: 'Kidney Beans (Rajma)', season: 'Kharif (hills)/Rabi', waterRequirement: 'Medium (400–600 mm)', growingPeriod: '90–120 days', expectedYield: '1.2–2.0 t/ha', reason: 'Prefers cooler climates; common in hill and Rabi cultivation.' },
    hi: { name: 'राजमा', season: 'खरीफ (पहाड़ी)/रबी', waterRequirement: 'मध्यम (400–600 मिमी)', growingPeriod: '90–120 दिन', expectedYield: '1.2–2.0 टन/हेक्टेयर', reason: 'ठंडी जलवायु पसंद करता है; पहाड़ी क्षेत्रों और रबी की खेती में आम है।' },
    mr: { name: 'राजमा', season: 'खरीप (डोंगराळ)/रब्बी', waterRequirement: 'मध्यम (400–600 मिमी)', growingPeriod: '90–120 दिवस', expectedYield: '1.2–2.0 टन/हेक्टर', reason: 'थंड हवामान पसंद करते; डोंगराळ भाग आणि रब्बी लागवडीत सामान्य.' },
    ta: { name: 'ராஜ்மா', season: 'காரிப் (மலைப்பகுதி)/ரபி', waterRequirement: 'மிதமானது (400–600 மிமீ)', growingPeriod: '90–120 நாட்கள்', expectedYield: '1.2–2.0 டன்/ஹெக்டேர்', reason: 'குளிர்ந்த காலநிலையை விரும்பும்; மலைப் பகுதிகள் மற்றும் ரபி பயிரிடலில் பொதுவானது.' },
    te: { name: 'రాజ్మా', season: 'ఖరీఫ్ (కొండ ప్రాంతాలు)/రబీ', waterRequirement: 'మధ్యస్థం (400–600 మిమీ)', growingPeriod: '90–120 రోజులు', expectedYield: '1.2–2.0 టన్నులు/హెక్టారు', reason: 'చల్లని వాతావరణాన్ని ఇష్టపడుతుంది; కొండ ప్రాంతాలు మరియు రబీ సాగులో సాధారణం.' },
    bn: { name: 'রাজমা', season: 'খরিফ (পাহাড়ি)/রবি', waterRequirement: 'মাঝারি (400–600 মিমি)', growingPeriod: '90–120 দিন', expectedYield: '1.2–2.0 টন/হেক্টর', reason: 'ঠান্ডা জলবায়ু পছন্দ করে; পাহাড়ি ও রবি চাষে সাধারণ।' },
  },
  mothbeans: {
    en: { name: 'Moth Bean', season: 'Kharif', waterRequirement: 'Very Low (250–400 mm)', growingPeriod: '65–90 days', expectedYield: '0.4–0.8 t/ha', reason: 'Extremely drought-tolerant pulse suited to arid, sandy soils.' },
    hi: { name: 'मोठ', season: 'खरीफ', waterRequirement: 'बहुत कम (250–400 मिमी)', growingPeriod: '65–90 दिन', expectedYield: '0.4–0.8 टन/हेक्टेयर', reason: 'अत्यंत सूखा-सहनशील दलहन; शुष्क, बलुई मिट्टी के लिए उपयुक्त।' },
    mr: { name: 'मटकी', season: 'खरीप', waterRequirement: 'खूप कमी (250–400 मिमी)', growingPeriod: '65–90 दिवस', expectedYield: '0.4–0.8 टन/हेक्टर', reason: 'अत्यंत दुष्काळ सहनशील कडधान्य; रखरखीत, वाळूमिश्रित जमिनीसाठी योग्य.' },
    ta: { name: 'மோத் பீன்ஸ்', season: 'காரிப்', waterRequirement: 'மிக குறைவு (250–400 மிமீ)', growingPeriod: '65–90 நாட்கள்', expectedYield: '0.4–0.8 டன்/ஹெக்டேர்', reason: 'மிகவும் வறட்சியைத் தாங்கும் பயறு வகை; வறண்ட, மணல் மண்ணிற்கு ஏற்றது.' },
    te: { name: 'బొబ్బర్లు', season: 'ఖరీఫ్', waterRequirement: 'చాలా తక్కువ (250–400 మిమీ)', growingPeriod: '65–90 రోజులు', expectedYield: '0.4–0.8 టన్నులు/హెక్టారు', reason: 'అత్యంత కరువును తట్టుకునే పప్పుధాన్యం; శుష్క, ఇసుక నేలలకు అనుకూలం.' },
    bn: { name: 'মথ বিন', season: 'খরিফ', waterRequirement: 'খুব কম (250–400 মিমি)', growingPeriod: '65–90 দিন', expectedYield: '0.4–0.8 টন/হেক্টর', reason: 'অত্যন্ত খরা-সহনশীল ডালশস্য; শুষ্ক, বালুকাময় মাটির জন্য উপযুক্ত।' },
  },
  coconut: {
    en: { name: 'Coconut', season: 'Year-round (perennial)', waterRequirement: 'High (1500–2300 mm)', growingPeriod: 'Perennial (bearing from 5–7 yrs)', expectedYield: '80–120 nuts/palm/yr', reason: 'Tropical coastal-climate perennial; needs well-drained sandy/loamy soil.' },
    hi: { name: 'नारियल', season: 'साल भर (बारहमासी)', waterRequirement: 'उच्च (1500–2300 मिमी)', growingPeriod: 'बारहमासी (5–7 वर्ष में फल)', expectedYield: '80–120 नारियल/पेड़/वर्ष', reason: 'उष्णकटिबंधीय तटीय जलवायु का बारहमासी पेड़; अच्छी जल निकासी वाली बलुई/दोमट मिट्टी चाहिए।' },
    mr: { name: 'नारळ', season: 'वर्षभर (बहुवर्षीय)', waterRequirement: 'जास्त (1500–2300 मिमी)', growingPeriod: 'बहुवर्षीय (5–7 वर्षांत फळ)', expectedYield: '80–120 नारळ/झाड/वर्ष', reason: 'उष्णकटिबंधीय किनारपट्टी हवामानातील बहुवर्षीय झाड; चांगला निचरा होणारी वाळूमिश्रित/पोयट्याची जमीन आवश्यक.' },
    ta: { name: 'தென்னை', season: 'ஆண்டு முழுவதும் (பல்லாண்டு பயிர்)', waterRequirement: 'அதிகம் (1500–2300 மிமீ)', growingPeriod: 'பல்லாண்டு பயிர் (5–7 ஆண்டுகளில் காய்க்கும்)', expectedYield: '80–120 தேங்காய்/மரம்/ஆண்டு', reason: 'வெப்பமண்டல கடலோர காலநிலை பல்லாண்டு மரம்; நல்ல வடிகால் உள்ள மணல்/வண்டல் மண் தேவை.' },
    te: { name: 'కొబ్బరి', season: 'ఏడాది పొడవునా (శాశ్వత పంట)', waterRequirement: 'అధికం (1500–2300 మిమీ)', growingPeriod: 'శాశ్వత పంట (5–7 సంవత్సరాలలో కాపు)', expectedYield: '80–120 కాయలు/చెట్టు/సంవత్సరం', reason: 'ఉష్ణమండల తీర ప్రాంత శాశ్వత చెట్టు; మంచి నీటి బహిర్గమనం ఉన్న ఇసుక/గోడు నేల అవసరం.' },
    bn: { name: 'নারিকেল', season: 'সারা বছর (বহুবর্ষজীবী)', waterRequirement: 'বেশি (1500–2300 মিমি)', growingPeriod: 'বহুবর্ষজীবী (৫–৭ বছরে ফলন)', expectedYield: '৮০–১২০ নারিকেল/গাছ/বছর', reason: 'গ্রীষ্মমণ্ডলীয় উপকূলীয় জলবায়ুর বহুবর্ষজীবী গাছ; ভালো নিষ্কাশনযুক্ত বেলে/দোআঁশ মাটি প্রয়োজন।' },
  },
  papaya: {
    en: { name: 'Papaya', season: 'Year-round', waterRequirement: 'Medium–High (1200–1500 mm)', growingPeriod: '9–12 months to first harvest', expectedYield: '40–60 t/ha', reason: 'Fast-growing fruit crop; very sensitive to waterlogging, needs good drainage.' },
    hi: { name: 'पपीता', season: 'साल भर', waterRequirement: 'मध्यम–उच्च (1200–1500 मिमी)', growingPeriod: 'पहली फसल तक 9–12 महीने', expectedYield: '40–60 टन/हेक्टेयर', reason: 'तेजी से बढ़ने वाली फल फसल; जलभराव के प्रति अत्यधिक संवेदनशील, अच्छी जल निकासी चाहिए।' },
    mr: { name: 'पपई', season: 'वर्षभर', waterRequirement: 'मध्यम–जास्त (1200–1500 मिमी)', growingPeriod: 'पहिल्या काढणीपर्यंत 9–12 महिने', expectedYield: '40–60 टन/हेक्टर', reason: 'वेगाने वाढणारे फळपीक; पाणी साचण्यास अत्यंत संवेदनशील, चांगला निचरा आवश्यक.' },
    ta: { name: 'பப்பாளி', season: 'ஆண்டு முழுவதும்', waterRequirement: 'மிதமானது–அதிகம் (1200–1500 மிமீ)', growingPeriod: 'முதல் அறுவடைக்கு 9–12 மாதங்கள்', expectedYield: '40–60 டன்/ஹெக்டேர்', reason: 'வேகமாக வளரும் பழப் பயிர்; நீர் தேங்குதலுக்கு மிகவும் உணர்திறன் கொண்டது, நல்ல வடிகால் தேவை.' },
    te: { name: 'బొప్పాయి', season: 'ఏడాది పొడవునా', waterRequirement: 'మధ్యస్థం–అధికం (1200–1500 మిమీ)', growingPeriod: 'మొదటి కోతకు 9–12 నెలలు', expectedYield: '40–60 టన్నులు/హెక్టారు', reason: 'వేగంగా పెరిగే పండ్ల పంట; నీరు నిలిచిపోవడానికి చాలా సున్నితం, మంచి నీటి బహిర్గమనం అవసరం.' },
    bn: { name: 'পেঁপে', season: 'সারা বছর', waterRequirement: 'মাঝারি–বেশি (1200–1500 মিমি)', growingPeriod: 'প্রথম ফলনে ৯–১২ মাস', expectedYield: '৪০–৬০ টন/হেক্টর', reason: 'দ্রুত বর্ধনশীল ফল ফসল; জলাবদ্ধতার প্রতি অত্যন্ত সংবেদনশীল, ভালো নিষ্কাশন প্রয়োজন।' },
  },
  mango: {
    en: { name: 'Mango', season: 'Year-round (perennial)', waterRequirement: 'Medium (750–1200 mm)', growingPeriod: 'Perennial (bearing from 4–6 yrs)', expectedYield: '8–15 t/ha (mature orchard)', reason: 'Deep, well-drained soil preferred; needs a distinct dry spell before flowering.' },
    hi: { name: 'आम', season: 'साल भर (बारहमासी)', waterRequirement: 'मध्यम (750–1200 मिमी)', growingPeriod: 'बारहमासी (4–6 वर्ष में फल)', expectedYield: '8–15 टन/हेक्टेयर (परिपक्व बाग)', reason: 'गहरी, अच्छी जल निकासी वाली मिट्टी पसंद; फूल आने से पहले स्पष्ट शुष्क अवधि चाहिए।' },
    mr: { name: 'आंबा', season: 'वर्षभर (बहुवर्षीय)', waterRequirement: 'मध्यम (750–1200 मिमी)', growingPeriod: 'बहुवर्षीय (4–6 वर्षांत फळ)', expectedYield: '8–15 टन/हेक्टर (प्रौढ बाग)', reason: 'खोल, चांगला निचरा होणारी जमीन पसंद; फुलण्याआधी स्पष्ट कोरडा काळ आवश्यक.' },
    ta: { name: 'மாம்பழம்', season: 'ஆண்டு முழுவதும் (பல்லாண்டு பயிர்)', waterRequirement: 'மிதமானது (750–1200 மிமீ)', growingPeriod: 'பல்லாண்டு பயிர் (4–6 ஆண்டுகளில் காய்க்கும்)', expectedYield: '8–15 டன்/ஹெக்டேர் (முதிர்ந்த தோட்டம்)', reason: 'ஆழமான, நல்ல வடிகால் உள்ள மண் விரும்பப்படுகிறது; பூக்கும் முன் தெளிவான வறண்ட காலம் தேவை.' },
    te: { name: 'మామిడి', season: 'ఏడాది పొడవునా (శాశ్వత పంట)', waterRequirement: 'మధ్యస్థం (750–1200 మిమీ)', growingPeriod: 'శాశ్వత పంట (4–6 సంవత్సరాలలో కాపు)', expectedYield: '8–15 టన్నులు/హెక్టారు (పరిపక్వ తోట)', reason: 'లోతైన, మంచి నీటి బహిర్గమనం ఉన్న నేల ఇష్టపడుతుంది; పూత రాకముందు స్పష్టమైన పొడి కాలం అవసరం.' },
    bn: { name: 'আম', season: 'সারা বছর (বহুবর্ষজীবী)', waterRequirement: 'মাঝারি (750–1200 মিমি)', growingPeriod: 'বহুবর্ষজীবী (৪–৬ বছরে ফলন)', expectedYield: '৮–১৫ টন/হেক্টর (পরিণত বাগান)', reason: 'গভীর, ভালো নিষ্কাশনযুক্ত মাটি পছন্দনীয়; ফুল আসার আগে সুস্পষ্ট শুষ্ক সময় প্রয়োজন।' },
  },
  grapes: {
    en: { name: 'Grapes', season: 'Year-round (perennial, pruned cycles)', waterRequirement: 'Medium (500–800 mm, often irrigated)', growingPeriod: 'Perennial (2 crops/yr with pruning)', expectedYield: '15–25 t/ha', reason: 'Prefers dry climate with irrigation; sensitive to humidity-driven fungal disease.' },
    hi: { name: 'अंगूर', season: 'साल भर (बारहमासी, छंटाई चक्र)', waterRequirement: 'मध्यम (500–800 मिमी, प्रायः सिंचित)', growingPeriod: 'बारहमासी (छंटाई के साथ वर्ष में 2 फसल)', expectedYield: '15–25 टन/हेक्टेयर', reason: 'सिंचाई के साथ शुष्क जलवायु पसंद; नमी से होने वाले फफूंद रोगों के प्रति संवेदनशील।' },
    mr: { name: 'द्राक्ष', season: 'वर्षभर (बहुवर्षीय, छाटणी चक्र)', waterRequirement: 'मध्यम (500–800 मिमी, बहुधा सिंचित)', growingPeriod: 'बहुवर्षीय (छाटणीसह वर्षाला 2 पिके)', expectedYield: '15–25 टन/हेक्टर', reason: 'सिंचनासह कोरडे हवामान पसंद; आर्द्रतेमुळे होणाऱ्या बुरशीजन्य रोगांना संवेदनशील.' },
    ta: { name: 'திராட்சை', season: 'ஆண்டு முழுவதும் (பல்லாண்டு, கத்தரிப்பு சுழற்சி)', waterRequirement: 'மிதமானது (500–800 மிமீ, பெரும்பாலும் நீர்ப்பாசனம்)', growingPeriod: 'பல்லாண்டு பயிர் (கத்தரிப்புடன் ஆண்டுக்கு 2 அறுவடை)', expectedYield: '15–25 டன்/ஹெக்டேர்', reason: 'நீர்ப்பாசனத்துடன் வறண்ட காலநிலையை விரும்பும்; ஈரப்பதத்தால் ஏற்படும் பூஞ்சை நோய்களுக்கு உணர்திறன் கொண்டது.' },
    te: { name: 'ద్రాక్ష', season: 'ఏడాది పొడవునా (శాశ్వత పంట, కత్తిరింపు చక్రాలు)', waterRequirement: 'మధ్యస్థం (500–800 మిమీ, తరచుగా నీటిపారుదల)', growingPeriod: 'శాశ్వత పంట (కత్తిరింపుతో సంవత్సరానికి 2 పంటలు)', expectedYield: '15–25 టన్నులు/హెక్టారు', reason: 'నీటిపారుదలతో పొడి వాతావరణాన్ని ఇష్టపడుతుంది; తేమ వల్ల కలిగే శిలీంధ్ర వ్యాధులకు సున్నితం.' },
    bn: { name: 'আঙ্গুর', season: 'সারা বছর (বহুবর্ষজীবী, ছাঁটাই চক্র)', waterRequirement: 'মাঝারি (500–800 মিমি, প্রায়ই সেচযুক্ত)', growingPeriod: 'বহুবর্ষজীবী (ছাঁটাইসহ বছরে ২ ফলন)', expectedYield: '১৫–২৫ টন/হেক্টর', reason: 'সেচসহ শুষ্ক জলবায়ু পছন্দ করে; আর্দ্রতাজনিত ছত্রাক রোগের প্রতি সংবেদনশীল।' },
  },
  watermelon: {
    en: { name: 'Watermelon', season: 'Summer/Zaid', waterRequirement: 'Medium (400–600 mm)', growingPeriod: '80–100 days', expectedYield: '20–35 t/ha', reason: 'Warm-season vine crop; needs sandy loam with good drainage.' },
    hi: { name: 'तरबूज', season: 'गर्मी/जायद', waterRequirement: 'मध्यम (400–600 मिमी)', growingPeriod: '80–100 दिन', expectedYield: '20–35 टन/हेक्टेयर', reason: 'गर्म मौसम की बेल वाली फसल; अच्छी जल निकासी वाली बलुई दोमट मिट्टी चाहिए।' },
    mr: { name: 'कलिंगड', season: 'उन्हाळा/झैद', waterRequirement: 'मध्यम (400–600 मिमी)', growingPeriod: '80–100 दिवस', expectedYield: '20–35 टन/हेक्टर', reason: 'उष्ण हंगामातील वेलवर्गीय पीक; चांगला निचरा होणारी वाळूमिश्रित पोयट्याची जमीन आवश्यक.' },
    ta: { name: 'தர்பூசணி', season: 'கோடை/சாய்ட்', waterRequirement: 'மிதமானது (400–600 மிமீ)', growingPeriod: '80–100 நாட்கள்', expectedYield: '20–35 டன்/ஹெக்டேர்', reason: 'சூடான பருவ கொடி பயிர்; நல்ல வடிகால் உள்ள மணல் கலந்த வண்டல் மண் தேவை.' },
    te: { name: 'పుచ్చకాయ', season: 'వేసవి/జైద్', waterRequirement: 'మధ్యస్థం (400–600 మిమీ)', growingPeriod: '80–100 రోజులు', expectedYield: '20–35 టన్నులు/హెక్టారు', reason: 'వెచ్చని కాలపు తీగ పంట; మంచి నీటి బహిర్గమనం ఉన్న ఇసుక గోడు నేల అవసరం.' },
    bn: { name: 'তরমুজ', season: 'গ্রীষ্ম/জায়েদ', waterRequirement: 'মাঝারি (400–600 মিমি)', growingPeriod: '৮০–১০০ দিন', expectedYield: '২০–৩৫ টন/হেক্টর', reason: 'উষ্ণ মৌসুমের লতানো ফসল; ভালো নিষ্কাশনযুক্ত বেলে দোআঁশ মাটি প্রয়োজন।' },
  },
  muskmelon: {
    en: { name: 'Muskmelon', season: 'Summer/Zaid', waterRequirement: 'Medium (350–500 mm)', growingPeriod: '80–100 days', expectedYield: '15–25 t/ha', reason: 'Warm, dry climate preferred; vulnerable to fruit rot in excess humidity.' },
    hi: { name: 'खरबूजा', season: 'गर्मी/जायद', waterRequirement: 'मध्यम (350–500 मिमी)', growingPeriod: '80–100 दिन', expectedYield: '15–25 टन/हेक्टेयर', reason: 'गर्म, शुष्क जलवायु पसंद; अधिक नमी में फल सड़न के प्रति संवेदनशील।' },
    mr: { name: 'खरबूज', season: 'उन्हाळा/झैद', waterRequirement: 'मध्यम (350–500 मिमी)', growingPeriod: '80–100 दिवस', expectedYield: '15–25 टन/हेक्टर', reason: 'उष्ण, कोरडे हवामान पसंद; जास्त आर्द्रतेत फळ कुजण्यास संवेदनशील.' },
    ta: { name: 'முலாம்பழம்', season: 'கோடை/சாய்ட்', waterRequirement: 'மிதமானது (350–500 மிமீ)', growingPeriod: '80–100 நாட்கள்', expectedYield: '15–25 டன்/ஹெக்டேர்', reason: 'சூடான, வறண்ட காலநிலை விரும்பப்படுகிறது; அதிக ஈரப்பதத்தில் பழம் அழுகலுக்கு பாதிக்கப்படும்.' },
    te: { name: 'ఖర్బూజా', season: 'వేసవి/జైద్', waterRequirement: 'మధ్యస్థం (350–500 మిమీ)', growingPeriod: '80–100 రోజులు', expectedYield: '15–25 టన్నులు/హెక్టారు', reason: 'వెచ్చని, పొడి వాతావరణం ఇష్టపడుతుంది; అధిక తేమలో పండు కుళ్ళిపోవడానికి గురవుతుంది.' },
    bn: { name: 'বাঙ্গি', season: 'গ্রীষ্ম/জায়েদ', waterRequirement: 'মাঝারি (350–500 মিমি)', growingPeriod: '৮০–১০০ দিন', expectedYield: '১৫–২৫ টন/হেক্টর', reason: 'উষ্ণ, শুষ্ক জলবায়ু পছন্দনীয়; অতিরিক্ত আর্দ্রতায় ফল পচনের ঝুঁকি থাকে।' },
  },
  apple: {
    en: { name: 'Apple', season: 'Temperate (hill regions)', waterRequirement: 'Medium (1000–1250 mm)', growingPeriod: 'Perennial (bearing from 4–5 yrs)', expectedYield: '10–20 t/ha (mature orchard)', reason: 'Needs winter chilling; grown mainly in hill regions like Himachal Pradesh/Kashmir.' },
    hi: { name: 'सेब', season: 'समशीतोष्ण (पहाड़ी क्षेत्र)', waterRequirement: 'मध्यम (1000–1250 मिमी)', growingPeriod: 'बारहमासी (4–5 वर्ष में फल)', expectedYield: '10–20 टन/हेक्टेयर (परिपक्व बाग)', reason: 'शीतकालीन ठंड की आवश्यकता; मुख्यतः हिमाचल प्रदेश/कश्मीर जैसे पहाड़ी क्षेत्रों में उगाया जाता है।' },
    mr: { name: 'सफरचंद', season: 'समशीतोष्ण (डोंगराळ प्रदेश)', waterRequirement: 'मध्यम (1000–1250 मिमी)', growingPeriod: 'बहुवर्षीय (4–5 वर्षांत फळ)', expectedYield: '10–20 टन/हेक्टर (प्रौढ बाग)', reason: 'हिवाळी थंडीची गरज; प्रामुख्याने हिमाचल प्रदेश/काश्मीरसारख्या डोंगराळ भागात घेतले जाते.' },
    ta: { name: 'ஆப்பிள்', season: 'மிதவெப்ப மண்டலம் (மலைப் பகுதிகள்)', waterRequirement: 'மிதமானது (1000–1250 மிமீ)', growingPeriod: 'பல்லாண்டு பயிர் (4–5 ஆண்டுகளில் காய்க்கும்)', expectedYield: '10–20 டன்/ஹெக்டேர் (முதிர்ந்த தோட்டம்)', reason: 'குளிர்கால குளிர்ச்சி தேவை; முக்கியமாக இமாச்சல பிரதேசம்/காஷ்மீர் போன்ற மலைப் பகுதிகளில் பயிரிடப்படுகிறது.' },
    te: { name: 'ఆపిల్', season: 'సమశీతోష్ణ (కొండ ప్రాంతాలు)', waterRequirement: 'మధ్యస్థం (1000–1250 మిమీ)', growingPeriod: 'శాశ్వత పంట (4–5 సంవత్సరాలలో కాపు)', expectedYield: '10–20 టన్నులు/హెక్టారు (పరిపక్వ తోట)', reason: 'శీతాకాలపు చలి అవసరం; ప్రధానంగా హిమాచల్ ప్రదేశ్/కాశ్మీర్ వంటి కొండ ప్రాంతాలలో పండిస్తారు.' },
    bn: { name: 'আপেল', season: 'নাতিশীতোষ্ণ (পার্বত্য অঞ্চল)', waterRequirement: 'মাঝারি (1000–1250 মিমি)', growingPeriod: 'বহুবর্ষজীবী (৪–৫ বছরে ফলন)', expectedYield: '১০–২০ টন/হেক্টর (পরিণত বাগান)', reason: 'শীতকালীন ঠান্ডা প্রয়োজন; প্রধানত হিমাচল প্রদেশ/কাশ্মীরের মতো পার্বত্য অঞ্চলে চাষ হয়।' },
  },
  orange: {
    en: { name: 'Orange (Citrus)', season: 'Year-round (perennial)', waterRequirement: 'Medium (1000–1200 mm)', growingPeriod: 'Perennial (bearing from 3–5 yrs)', expectedYield: '10–20 t/ha', reason: 'Well-drained soil essential; sensitive to waterlogging and salinity.' },
    hi: { name: 'संतरा', season: 'साल भर (बारहमासी)', waterRequirement: 'मध्यम (1000–1200 मिमी)', growingPeriod: 'बारहमासी (3–5 वर्ष में फल)', expectedYield: '10–20 टन/हेक्टेयर', reason: 'अच्छी जल निकासी वाली मिट्टी आवश्यक; जलभराव और लवणता के प्रति संवेदनशील।' },
    mr: { name: 'संत्रा', season: 'वर्षभर (बहुवर्षीय)', waterRequirement: 'मध्यम (1000–1200 मिमी)', growingPeriod: 'बहुवर्षीय (3–5 वर्षांत फळ)', expectedYield: '10–20 टन/हेक्टर', reason: 'चांगला निचरा होणारी जमीन आवश्यक; पाणी साचणे आणि क्षारतेस संवेदनशील.' },
    ta: { name: 'ஆரஞ்சு', season: 'ஆண்டு முழுவதும் (பல்லாண்டு பயிர்)', waterRequirement: 'மிதமானது (1000–1200 மிமீ)', growingPeriod: 'பல்லாண்டு பயிர் (3–5 ஆண்டுகளில் காய்க்கும்)', expectedYield: '10–20 டன்/ஹெக்டேர்', reason: 'நல்ல வடிகால் உள்ள மண் அவசியம்; நீர் தேங்குதல் மற்றும் உப்புத்தன்மைக்கு உணர்திறன் கொண்டது.' },
    te: { name: 'నారింజ', season: 'ఏడాది పొడవునా (శాశ్వత పంట)', waterRequirement: 'మధ్యస్థం (1000–1200 మిమీ)', growingPeriod: 'శాశ్వత పంట (3–5 సంవత్సరాలలో కాపు)', expectedYield: '10–20 టన్నులు/హెక్టారు', reason: 'మంచి నీటి బహిర్గమనం ఉన్న నేల అవసరం; నీరు నిలిచిపోవడం మరియు లవణీయతకు సున్నితం.' },
    bn: { name: 'কমলা', season: 'সারা বছর (বহুবর্ষজীবী)', waterRequirement: 'মাঝারি (1000–1200 মিমি)', growingPeriod: 'বহুবর্ষজীবী (৩–৫ বছরে ফলন)', expectedYield: '১০–২০ টন/হেক্টর', reason: 'ভালো নিষ্কাশনযুক্ত মাটি অপরিহার্য; জলাবদ্ধতা ও লবণাক্ততার প্রতি সংবেদনশীল।' },
  },
  pomegranate: {
    en: { name: 'Pomegranate', season: 'Year-round (perennial)', waterRequirement: 'Low–Medium (500–800 mm)', growingPeriod: 'Perennial (bearing from 2–3 yrs)', expectedYield: '10–18 t/ha', reason: 'Hardy, drought-tolerant fruit crop; performs well in semi-arid climates.' },
    hi: { name: 'अनार', season: 'साल भर (बारहमासी)', waterRequirement: 'कम–मध्यम (500–800 मिमी)', growingPeriod: 'बारहमासी (2–3 वर्ष में फल)', expectedYield: '10–18 टन/हेक्टेयर', reason: 'मजबूत, सूखा-सहनशील फल फसल; अर्ध-शुष्क जलवायु में अच्छी तरह उगती है।' },
    mr: { name: 'डाळिंब', season: 'वर्षभर (बहुवर्षीय)', waterRequirement: 'कमी–मध्यम (500–800 मिमी)', growingPeriod: 'बहुवर्षीय (2–3 वर्षांत फळ)', expectedYield: '10–18 टन/हेक्टर', reason: 'काटक, दुष्काळ सहनशील फळपीक; अर्ध-रखरखीत हवामानात चांगले येते.' },
    ta: { name: 'மாதுளை', season: 'ஆண்டு முழுவதும் (பல்லாண்டு பயிர்)', waterRequirement: 'குறைவு–மிதமானது (500–800 மிமீ)', growingPeriod: 'பல்லாண்டு பயிர் (2–3 ஆண்டுகளில் காய்க்கும்)', expectedYield: '10–18 டன்/ஹெக்டேர்', reason: 'உறுதியான, வறட்சியைத் தாங்கும் பழப் பயிர்; அரை வறண்ட காலநிலையில் நன்கு வளரும்.' },
    te: { name: 'దానిమ్మ', season: 'ఏడాది పొడవునా (శాశ్వత పంట)', waterRequirement: 'తక్కువ–మధ్యస్థం (500–800 మిమీ)', growingPeriod: 'శాశ్వత పంట (2–3 సంవత్సరాలలో కాపు)', expectedYield: '10–18 టన్నులు/హెక్టారు', reason: 'దృఢమైన, కరువును తట్టుకునే పండ్ల పంట; అర్ధ-శుష్క వాతావరణంలో బాగా పండుతుంది.' },
    bn: { name: 'ডালিম', season: 'সারা বছর (বহুবর্ষজীবী)', waterRequirement: 'কম–মাঝারি (500–800 মিমি)', growingPeriod: 'বহুবর্ষজীবী (২–৩ বছরে ফলন)', expectedYield: '১০–১৮ টন/হেক্টর', reason: 'শক্তিশালী, খরা-সহনশীল ফল ফসল; অর্ধ-শুষ্ক জলবায়ুতে ভালো ফলন দেয়।' },
  },
  coffee: {
    en: { name: 'Coffee', season: 'Year-round (perennial)', waterRequirement: 'Medium–High (1500–2000 mm)', growingPeriod: 'Perennial (bearing from 3–4 yrs)', expectedYield: '0.8–1.5 t/ha (clean coffee)', reason: 'Shade-grown perennial; needs cool hill climate and well-distributed rainfall.' },
    hi: { name: 'कॉफी', season: 'साल भर (बारहमासी)', waterRequirement: 'मध्यम–उच्च (1500–2000 मिमी)', growingPeriod: 'बारहमासी (3–4 वर्ष में फल)', expectedYield: '0.8–1.5 टन/हेक्टेयर (स्वच्छ कॉफी)', reason: 'छाया में उगने वाला बारहमासी पौधा; ठंडी पहाड़ी जलवायु और अच्छी तरह वितरित वर्षा चाहिए।' },
    mr: { name: 'कॉफी', season: 'वर्षभर (बहुवर्षीय)', waterRequirement: 'मध्यम–जास्त (1500–2000 मिमी)', growingPeriod: 'बहुवर्षीय (3–4 वर्षांत फळ)', expectedYield: '0.8–1.5 टन/हेक्टर (शुद्ध कॉफी)', reason: 'सावलीत वाढणारे बहुवर्षीय झाड; थंड डोंगराळ हवामान आणि सुयोग्य पर्जन्यवितरण आवश्यक.' },
    ta: { name: 'காபி', season: 'ஆண்டு முழுவதும் (பல்லாண்டு பயிர்)', waterRequirement: 'மிதமானது–அதிகம் (1500–2000 மிமீ)', growingPeriod: 'பல்லாண்டு பயிர் (3–4 ஆண்டுகளில் காய்க்கும்)', expectedYield: '0.8–1.5 டன்/ஹெக்டேர் (சுத்த காபி)', reason: 'நிழலில் வளரும் பல்லாண்டு பயிர்; குளிர்ந்த மலை காலநிலையும் சீரான மழைப்பொழிவும் தேவை.' },
    te: { name: 'కాఫీ', season: 'ఏడాది పొడవునా (శాశ్వత పంట)', waterRequirement: 'మధ్యస్థం–అధికం (1500–2000 మిమీ)', growingPeriod: 'శాశ్వత పంట (3–4 సంవత్సరాలలో కాపు)', expectedYield: '0.8–1.5 టన్నులు/హెక్టారు (శుద్ధ కాఫీ)', reason: 'నీడలో పెరిగే శాశ్వత పంట; చల్లని కొండ వాతావరణం మరియు సమానంగా పంపిణీ చేయబడిన వర్షపాతం అవసరం.' },
    bn: { name: 'কফি', season: 'সারা বছর (বহুবর্ষজীবী)', waterRequirement: 'মাঝারি–বেশি (1500–2000 মিমি)', growingPeriod: 'বহুবর্ষজীবী (৩–৪ বছরে ফলন)', expectedYield: '০.৮–১.৫ টন/হেক্টর (বিশুদ্ধ কফি)', reason: 'ছায়ায় জন্মানো বহুবর্ষজীবী গাছ; ঠান্ডা পাহাড়ি জলবায়ু ও সুষম বৃষ্টিপাত প্রয়োজন।' },
  },
  jute: {
    en: { name: 'Jute', season: 'Kharif', waterRequirement: 'High (1200–1500 mm)', growingPeriod: '100–120 days', expectedYield: '2.0–2.8 t/ha (fibre)', reason: 'Needs warm humid climate with high rainfall; grown mainly in riverine alluvial soil.' },
    hi: { name: 'जूट (पटसन)', season: 'खरीफ', waterRequirement: 'उच्च (1200–1500 मिमी)', growingPeriod: '100–120 दिन', expectedYield: '2.0–2.8 टन/हेक्टेयर (रेशा)', reason: 'उच्च वर्षा के साथ गर्म आर्द्र जलवायु चाहिए; मुख्यतः नदी की जलोढ़ मिट्टी में उगाया जाता है।' },
    mr: { name: 'ताग', season: 'खरीप', waterRequirement: 'जास्त (1200–1500 मिमी)', growingPeriod: '100–120 दिवस', expectedYield: '2.0–2.8 टन/हेक्टर (धागा)', reason: 'जास्त पावसासह उष्ण दमट हवामान आवश्यक; प्रामुख्याने नदीकाठच्या गाळाच्या जमिनीत घेतले जाते.' },
    ta: { name: 'சணல்', season: 'காரிப்', waterRequirement: 'அதிகம் (1200–1500 மிமீ)', growingPeriod: '100–120 நாட்கள்', expectedYield: '2.0–2.8 டன்/ஹெக்டேர் (நார்)', reason: 'அதிக மழையுடன் சூடான ஈரப்பதமான காலநிலை தேவை; முக்கியமாக ஆற்றுப் படுகை வண்டல் மண்ணில் பயிரிடப்படுகிறது.' },
    te: { name: 'జనుము', season: 'ఖరీఫ్', waterRequirement: 'అధికం (1200–1500 మిమీ)', growingPeriod: '100–120 రోజులు', expectedYield: '2.0–2.8 టన్నులు/హెక్టారు (పీచు)', reason: 'అధిక వర్షపాతంతో వెచ్చని తేమతో కూడిన వాతావరణం అవసరం; ప్రధానంగా నదీ ఒండ్రు నేలలో పండిస్తారు.' },
    bn: { name: 'পাট', season: 'খরিফ', waterRequirement: 'বেশি (1200–1500 মিমি)', growingPeriod: '১০০–১২০ দিন', expectedYield: '২.০–২.৮ টন/হেক্টর (আঁশ)', reason: 'অধিক বৃষ্টিপাতসহ উষ্ণ আর্দ্র জলবায়ু প্রয়োজন; প্রধানত নদীবাহিত পলিমাটিতে চাষ হয়।' },
  },
};

const CONFIDENCE_WORD: Record<string, Record<Language, string>> = {
  High: { en: 'High', hi: 'उच्च', mr: 'उच्च', ta: 'அதிகம்', te: 'అధికం', bn: 'উচ্চ' },
  Moderate: { en: 'Moderate', hi: 'मध्यम', mr: 'मध्यम', ta: 'மிதமானது', te: 'మధ్యస్థం', bn: 'মাঝারি' },
  Low: { en: 'Low', hi: 'कम', mr: 'कमी', ta: 'குறைவு', te: 'తక్కువ', bn: 'কম' },
};

/**
 * Returns a copy of a CropResult with every text field translated into the
 * given language. Numeric values embedded in the strings are unchanged.
 * If a crop key isn't found (shouldn't happen for engine output), the
 * original (English) result is returned untouched.
 */
export function translateCropResult(result: CropResult, lang: Language): CropResult {
  const text = CROP_TEXT[result.key]?.[lang];
  const confidence = CONFIDENCE_WORD[result.confidence]?.[lang] ?? result.confidence;
  if (!text) return { ...result, confidence };
  return {
    ...result,
    name: text.name,
    season: text.season,
    waterRequirement: text.waterRequirement,
    growingPeriod: text.growingPeriod,
    expectedYield: text.expectedYield,
    reason: text.reason,
    confidence,
  };
}

export function translateCropResults(results: CropResult[], lang: Language): CropResult[] {
  return results.map((r) => translateCropResult(r, lang));
}

// A few common alternate spellings the vision model or a farmer might use
// for the same crop key in CROP_TEXT above.
const CROP_NAME_ALIASES: Record<string, string> = {
  paddy: 'rice',
  corn: 'maize',
  peanut: 'groundnut',
  groundnuts: 'groundnut',
};

/**
 * Translates a free-text crop name (e.g. from the vision model's
 * identifiedCrop field) into the selected language, using the same
 * stable-key lookup as crop recommendation results. Internal identity
 * stays the English name — this only affects what's displayed. Falls
 * back to the original (English) name when it doesn't match a known
 * crop key or alias, rather than guessing a translation.
 */
export function translateCropName(name: string, lang: Language): string {
  const key = name.trim().toLowerCase();
  const canonicalKey = CROP_NAME_ALIASES[key] ?? key;
  return CROP_TEXT[canonicalKey]?.[lang]?.name ?? name;
}
