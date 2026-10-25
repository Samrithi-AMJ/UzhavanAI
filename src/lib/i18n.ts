export type Language = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn';

export const LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
];

export function languageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.nativeLabel ?? 'English';
}

type UIStrings = {
  appName: string;
  dashboard: string;
  aiAdvisor: string;
  weather: string;
  cropAdvisor: string;
  imageSearch: string;
  myFarm: string;
  signOut: string;
  welcomeBack: string;
  createAccount: string;
  farmOverview: string;
  aiConversations: string;
  cropReports: string;
  currentTemp: string;
  humidity: string;
  weatherToday: string;
  viewDays: string;
  farmProfile: string;
  edit: string;
  save: string;
  cancel: string;
  fullName: string;
  farmName: string;
  location: string;
  farmSize: string;
  askAI: string;
  checkWeather: string;
  recommendCrops: string;
  typeQuestion: string;
  askAnything: string;
  clear: string;
  searchCity: string;
  sevenDayForecast: string;
  farmingAdvisory: string;
  soilClimate: string;
  getRecommendations: string;
  recommendedCrops: string;
  saveReport: string;
  savedReports: string;
  noRecommendations: string;
  matchScore: string;
  season: string;
  water: string;
  growing: string;
  yield: string;
  confidence: string;
  uploadImage: string;
  selectCrop: string;
  analyzeImage: string;
  diagnosis: string;
  treatment: string;
  severity: string;
  healthy: string;
  imageSearchDesc: string;
  dragDrop: string;
  analyzing: string;
  noImage: string;
  selectLanguage: string;
  language: string;

  // Weather page
  weatherForecastTitle: string;
  feelsLike: string;
  wind: string;
  soilTemp: string;
  rain: string;
  soilMoisture: string;
  day: string;
  night: string;
  uvIndex: string;
  sunrise: string;
  sunset: string;
  useMyFarmLocation: string;
  useMyCurrentLocation: string;
  noLocationSet: string;
  setLocationToSeeWeather: string;
  weatherFetchFailed: string;
  searchFailed: string;
  locatingYou: string;

  // Dashboard
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  setLocationPrompt: string;
  addLocation: string;
  profileSaved: string;
  askAIDesc: string;
  checkWeatherDesc: string;
  recommendCropsDesc: string;
  farmLocationTitle: string;
  farmArea: string;
  viewFarm: string;
  updateLocation: string;
  farmBoundarySaved: string;
  noFarmSet: string;
  soil: string;

  // My Farm page
  myFarmSubtitle: string;
  farmLocationLabel: string;
  gpsCoordinates: string;
  latitude: string;
  longitude: string;
  setCurrentLocation: string;
  drawFarmBoundary: string;
  stopDrawing: string;
  clearBoundary: string;
  calculatedArea: string;
  saveFarm: string;
  farmSaved: string;
  acres: string;
  hectares: string;
  tapMapToDraw: string;
  needMorePoints: string;
  noBoundaryYet: string;
  locatingLoading: string;
  notSet: string;

  // Errors (shared)
  gpsDenied: string;
  gpsUnavailable: string;
  gpsTimeout: string;
  gpsUnsupported: string;
  mapLoadFailure: string;
  invalidBoundary: string;
  saveFailure: string;
  noInternet: string;

  // Crop advisor extras
  fromWeatherData: string;
  manualEntry: string;
  useFarmWeatherData: string;
  delete: string;
  savedGeneric: string;
  farmer: string;
  savingFarm: string;
  pleaseSignIn: string;
  tableMissingError: string;

  // Crop advisor slider labels (previously hardcoded in English in the UI)
  nitrogenLabel: string;
  phosphorusLabel: string;
  potassiumLabel: string;
  temperatureLabel: string;
  humidityLabel: string;
  phLabel: string;
  rainfallLabel: string;
  saveFailedGeneric: string;
  deleteFailedGeneric: string;
  confirmDelete: string;

  // Image search result states (previously hardcoded in English in the UI)
  cause: string;
  prevention: string;
  otherConditions: string;
  scanningHint: string;
  uploadPromptHint: string;
  aiPoweredLabel: string;
  notAPlantTitle: string;
  notAPlantHint: string;
  cropMismatchTitle: string;
  cropMismatchHint: string;
  lowConfidenceTitle: string;
  lowConfidenceHint: string;
  analysisFailedTitle: string;
  analysisFailedHint: string;
  visionModelUnavailableTitle: string;
  visionModelUnavailableHint: string;
  retry: string;
  identifiedAs: string;

  // New symptom-first diagnosis fields (SUSPECTED_ISSUE / UNCERTAIN states)
  suspectedIssueTitle: string;
  diseaseDetectedTitle: string;
  pestDetectedTitle: string;
  unknownCropTitle: string;
  unknownIssueLabel: string;
  possibleCausesLabel: string;
  recommendationLabel: string;
  severityLow: string;
  severityMedium: string;
  severityHigh: string;
  severityUnknown: string;

  // Voice search & speech strings
  voiceSearch: string;
  listening: string;
  speakNow: string;
  stopListening: string;
  readAloud: string;
  stopSpeaking: string;
  autoSendIn: string;
  sendNow: string;
  keepEditing: string;
  autoSendToggle: string;
  spokenLanguage: string;
  transcribingVoice: string;
  voicePermissionDenied: string;
  voiceNotSupported: string;
  noSpeechDetected: string;
  trySaying: string;
  voiceInputTooltip: string;
};

export const UI: Record<Language, UIStrings> = {
  en: {
    appName: 'UzhavanAI', dashboard: 'Dashboard', aiAdvisor: 'AI Advisor',
    weather: 'Weather', cropAdvisor: 'Crop Advisor', imageSearch: 'Image Search',
    myFarm: 'My Farm',
    signOut: 'Sign Out', welcomeBack: 'Welcome back', createAccount: 'Create your account',
    farmOverview: "Here's your farm overview for today",
    aiConversations: 'AI Conversations', cropReports: 'Crop Reports',
    currentTemp: 'Current Temp', humidity: 'Humidity', weatherToday: 'Weather Today',
    viewDays: 'View 7-day →', farmProfile: 'Farm Profile', edit: 'Edit', save: 'Save',
    cancel: 'Cancel', fullName: 'Full Name', farmName: 'Farm Name', location: 'Location (city)',
    farmSize: 'Farm Size (acres)', askAI: 'Ask AI Advisor', checkWeather: 'Check Weather',
    recommendCrops: 'Recommend Crops', typeQuestion: 'Type your farming question...',
    askAnything: 'Ask me anything about farming', clear: 'Clear', searchCity: 'Search city...',
    sevenDayForecast: '7-Day Forecast', farmingAdvisory: 'Farming Advisory',
    soilClimate: 'Soil & Climate', getRecommendations: 'Get Recommendations',
    recommendedCrops: 'Recommended Crops', saveReport: 'Save Report', savedReports: 'Saved Reports',
    noRecommendations: 'No recommendations yet', matchScore: 'match score',
    season: 'Season', water: 'Water', growing: 'Growing', yield: 'Yield',
    confidence: 'confidence', uploadImage: 'Upload Image', selectCrop: 'Select Crop',
    analyzeImage: 'Analyze Image', diagnosis: 'Diagnosis', treatment: 'Treatment',
    severity: 'Severity', healthy: 'Healthy', imageSearchDesc: 'Upload a photo of your crop to detect diseases instantly',
    dragDrop: 'Click to upload or drag & drop', analyzing: 'Analyzing...', noImage: 'No image selected',
    selectLanguage: 'Select Language', language: 'Language',

    weatherForecastTitle: 'Weather Forecast', feelsLike: 'Feels like', wind: 'Wind',
    soilTemp: 'Soil Temp', rain: 'Rain', soilMoisture: 'Soil Moisture', day: 'Day', night: 'Night',
    uvIndex: 'UV', sunrise: 'Sunrise', sunset: 'Sunset',
    useMyFarmLocation: 'Use My Farm Location', useMyCurrentLocation: 'Use My Current Location',
    noLocationSet: 'No location set yet', setLocationToSeeWeather: 'Set your farm location or use your current GPS to see the weather',
    weatherFetchFailed: 'Failed to fetch weather. Please try again.', searchFailed: 'Search failed. Try again.',
    locatingYou: 'Locating you...',

    goodMorning: 'Good morning', goodAfternoon: 'Good afternoon', goodEvening: 'Good evening',
    setLocationPrompt: 'Set your farm location to see weather', addLocation: 'Add location →',
    profileSaved: 'Profile saved!', askAIDesc: 'Get instant farming guidance',
    checkWeatherDesc: '7-day forecast for your farm', recommendCropsDesc: 'Find the best crop for your soil',
    farmLocationTitle: 'Farm Location', farmArea: 'Farm Area', viewFarm: 'View Farm',
    updateLocation: 'Update Location', farmBoundarySaved: 'Farm Boundary Saved',
    noFarmSet: 'No farm location set', soil: 'Soil',

    myFarmSubtitle: 'Map your field boundary to power accurate weather and recommendations',
    farmLocationLabel: 'Farm Location', gpsCoordinates: 'GPS Coordinates', latitude: 'Latitude', longitude: 'Longitude',
    setCurrentLocation: 'Set Current Location', drawFarmBoundary: 'Draw Farm Boundary', stopDrawing: 'Stop Drawing',
    clearBoundary: 'Clear Boundary', calculatedArea: 'Calculated Area', saveFarm: 'Save Farm', farmSaved: 'Farm saved!',
    acres: 'acres', hectares: 'hectares', tapMapToDraw: 'Tap the map to add boundary points',
    needMorePoints: 'Add at least 3 points to calculate area', noBoundaryYet: 'No boundary drawn yet',
    locatingLoading: 'Getting your location...', notSet: 'Not set',

    gpsDenied: 'Location permission denied. Please allow location access in your browser settings.',
    gpsUnavailable: 'Could not determine your location. Please try again.',
    gpsTimeout: 'Location request timed out. Please try again.',
    gpsUnsupported: 'GPS is not supported on this device/browser.',
    mapLoadFailure: 'Map failed to load. Please refresh the page.',
    invalidBoundary: 'Draw at least 3 points to form a valid farm boundary.',
    saveFailure: 'Could not save. Please check your connection and try again.',
    noInternet: 'No internet connection. Please check your network and try again.',

    fromWeatherData: 'From weather data', manualEntry: 'Manual entry',
    useFarmWeatherData: 'Use Farm Weather Data', delete: 'Delete', savedGeneric: 'Saved!', farmer: 'Farmer', savingFarm: 'Saving Farm...', pleaseSignIn: 'Please sign in to save your farm.', tableMissingError: "The farm database table hasn't been set up yet. Ask whoever manages this project's Supabase account to run supabase/RUN_THIS_IN_SUPABASE.sql in the Supabase SQL Editor.",
    nitrogenLabel: 'Nitrogen (N)', phosphorusLabel: 'Phosphorus (P)', potassiumLabel: 'Potassium (K)', temperatureLabel: 'Temperature', humidityLabel: 'Humidity', phLabel: 'pH Level', rainfallLabel: 'Rainfall',
    saveFailedGeneric: 'Could not save. Please try again.', deleteFailedGeneric: 'Could not delete. Please try again.', confirmDelete: 'Delete this report?',
    cause: 'Cause', prevention: 'Prevention', otherConditions: 'Other possible conditions', scanningHint: 'Scanning image for disease symptoms...', uploadPromptHint: 'Upload a crop photo and select the crop type, then click "Analyze Image" to get a diagnosis.', aiPoweredLabel: 'AI-powered disease detection',
    notAPlantTitle: 'Not a plant image', notAPlantHint: 'This image does not appear to be suitable for crop disease analysis. Please upload a clear photo of a plant or crop.',
    cropMismatchTitle: 'Crop mismatch', cropMismatchHint: 'The uploaded image does not appear to match the selected crop. Please check your selection or upload a matching photo.',
    lowConfidenceTitle: 'Unable to determine', lowConfidenceHint: 'The analysis could not confidently determine the plant\'s condition from this photo. Try a clearer, closer photo in good light.',
    analysisFailedTitle: 'Analysis failed', analysisFailedHint: 'Something went wrong while analyzing the image. Please try again.',
    visionModelUnavailableTitle: 'Image analysis unavailable', visionModelUnavailableHint: 'The image analysis service is not available right now. Please try again later or contact support.',
    retry: 'Try Again', identifiedAs: 'Identified as',
    suspectedIssueTitle: 'Suspected issue', diseaseDetectedTitle: 'Disease detected', pestDetectedTitle: 'Pest detected', unknownCropTitle: 'Crop could not be identified', unknownIssueLabel: 'Unknown crop health issue — needs closer inspection', possibleCausesLabel: 'Possible causes', recommendationLabel: 'Recommendation',
    severityLow: 'Low', severityMedium: 'Medium', severityHigh: 'High', severityUnknown: 'Unknown',
    voiceSearch: 'Voice Search',
    listening: 'Listening...',
    speakNow: 'Speak now, asking your farming question...',
    stopListening: 'Stop Listening',
    readAloud: 'Read Aloud',
    stopSpeaking: 'Stop Audio',
    autoSendIn: 'Sending question in',
    sendNow: 'Send Now',
    keepEditing: 'Keep Editing',
    autoSendToggle: 'Auto-send on silence',
    spokenLanguage: 'Spoken Language',
    transcribingVoice: 'Transcribing voice...',
    voicePermissionDenied: 'Microphone permission was denied. Please allow microphone access in your browser settings.',
    voiceNotSupported: 'Speech recognition is not supported in this browser. Switching to audio recording.',
    noSpeechDetected: 'No speech detected. Please speak clearly into your microphone.',
    trySaying: 'Try saying:',
    voiceInputTooltip: 'Speak your farming question (Voice Search)',
  },
  hi: {
    appName: 'कृषि सलाहकार', dashboard: 'डैशबोर्ड', aiAdvisor: 'एआई सलाहकार',
    weather: 'मौसम', cropAdvisor: 'फसल सलाहकार', imageSearch: 'छवि खोज',
    myFarm: 'मेरा खेत',
    signOut: 'साइन आउट', welcomeBack: 'वापसी पर स्वागत है', createAccount: 'अपना खाता बनाएं',
    farmOverview: 'आज आपके खेत का अवलोकन',
    aiConversations: 'एआई वार्तालाप', cropReports: 'फसल रिपोर्ट',
    currentTemp: 'वर्तमान तापमान', humidity: 'आर्द्रता', weatherToday: 'आज का मौसम',
    viewDays: '7-दिन → देखें', farmProfile: 'खेत प्रोफ़ाइल', edit: 'संपादित करें', save: 'सहेजें',
    cancel: 'रद्द करें', fullName: 'पूरा नाम', farmName: 'खेत का नाम', location: 'स्थान (शहर)',
    farmSize: 'खेत का आकार (एकड़)', askAI: 'एआई सलाहकार से पूछें', checkWeather: 'मौसम जांचें',
    recommendCrops: 'फसल सुझाएं', typeQuestion: 'अपना खेती का सवाल लिखें...',
    askAnything: 'खेती के बारे में कुछ भी पूछें', clear: 'साफ़ करें', searchCity: 'शहर खोजें...',
    sevenDayForecast: '7-दिन का पूर्वानुमान', farmingAdvisory: 'कृषि सलाह',
    soilClimate: 'मिट्टी और जलवायु', getRecommendations: 'सुझाव पाएं',
    recommendedCrops: 'अनुशंसित फसलें', saveReport: 'रिपोर्ट सहेजें', savedReports: 'सहेजी गई रिपोर्ट',
    noRecommendations: 'अभी कोई सुझाव नहीं', matchScore: 'मैच स्कोर',
    season: 'ऋतु', water: 'जल', growing: 'वृद्धि', yield: 'उपज',
    confidence: 'विश्वास', uploadImage: 'छवि अपलोड करें', selectCrop: 'फसल चुनें',
    analyzeImage: 'छवि विश्लेषण करें', diagnosis: 'निदान', treatment: 'उपचार',
    severity: 'गंभीरता', healthy: 'स्वस्थ', imageSearchDesc: 'रोगों का पता लगाने के लिए अपनी फसल की फोटो अपलोड करें',
    dragDrop: 'अपलोड करने के लिए क्लिक करें', analyzing: 'विश्लेषण हो रहा है...', noImage: 'कोई छवि नहीं चुनी गई',
    selectLanguage: 'भाषा चुनें', language: 'भाषा',

    weatherForecastTitle: 'मौसम पूर्वानुमान', feelsLike: 'महसूस होता है', wind: 'हवा',
    soilTemp: 'मिट्टी का तापमान', rain: 'बारिश', soilMoisture: 'मिट्टी की नमी', day: 'दिन', night: 'रात',
    uvIndex: 'यूवी', sunrise: 'सूर्योदय', sunset: 'सूर्यास्त',
    useMyFarmLocation: 'मेरे खेत का स्थान उपयोग करें', useMyCurrentLocation: 'मेरा वर्तमान स्थान उपयोग करें',
    noLocationSet: 'अभी तक कोई स्थान सेट नहीं है',
    setLocationToSeeWeather: 'मौसम देखने के लिए अपने खेत का स्थान सेट करें या अपने वर्तमान GPS का उपयोग करें',
    weatherFetchFailed: 'मौसम प्राप्त करने में विफल। कृपया पुनः प्रयास करें।', searchFailed: 'खोज विफल। पुनः प्रयास करें।',
    locatingYou: 'आपका स्थान खोजा जा रहा है...',

    goodMorning: 'सुप्रभात', goodAfternoon: 'नमस्कार', goodEvening: 'शुभ संध्या',
    setLocationPrompt: 'मौसम देखने के लिए अपने खेत का स्थान सेट करें', addLocation: 'स्थान जोड़ें →',
    profileSaved: 'प्रोफ़ाइल सहेजी गई!', askAIDesc: 'तुरंत खेती मार्गदर्शन प्राप्त करें',
    checkWeatherDesc: 'आपके खेत के लिए 7-दिन का पूर्वानुमान', recommendCropsDesc: 'अपनी मिट्टी के लिए सबसे अच्छी फसल खोजें',
    farmLocationTitle: 'खेत का स्थान', farmArea: 'खेत का क्षेत्रफल', viewFarm: 'खेत देखें',
    updateLocation: 'स्थान अपडेट करें', farmBoundarySaved: 'खेत की सीमा सहेजी गई',
    noFarmSet: 'कोई खेत स्थान सेट नहीं है', soil: 'मिट्टी',

    myFarmSubtitle: 'सटीक मौसम और सुझावों के लिए अपने खेत की सीमा मैप करें',
    farmLocationLabel: 'खेत का स्थान', gpsCoordinates: 'जीपीएस निर्देशांक', latitude: 'अक्षांश', longitude: 'देशांतर',
    setCurrentLocation: 'वर्तमान स्थान सेट करें', drawFarmBoundary: 'खेत की सीमा बनाएं', stopDrawing: 'बनाना बंद करें',
    clearBoundary: 'सीमा साफ़ करें', calculatedArea: 'गणना किया गया क्षेत्रफल', saveFarm: 'खेत सहेजें', farmSaved: 'खेत सहेजा गया!',
    acres: 'एकड़', hectares: 'हेक्टेयर', tapMapToDraw: 'सीमा बिंदु जोड़ने के लिए मानचित्र पर टैप करें',
    needMorePoints: 'क्षेत्रफल की गणना के लिए कम से कम 3 बिंदु जोड़ें', noBoundaryYet: 'अभी तक कोई सीमा नहीं बनाई गई',
    locatingLoading: 'आपका स्थान प्राप्त किया जा रहा है...', notSet: 'सेट नहीं है',

    gpsDenied: 'स्थान की अनुमति अस्वीकृत। कृपया अपनी ब्राउज़र सेटिंग्स में स्थान की पहुंच की अनुमति दें।',
    gpsUnavailable: 'आपका स्थान निर्धारित नहीं किया जा सका। कृपया पुनः प्रयास करें।',
    gpsTimeout: 'स्थान अनुरोध का समय समाप्त हो गया। कृपया पुनः प्रयास करें।',
    gpsUnsupported: 'इस डिवाइस/ब्राउज़र पर GPS समर्थित नहीं है।',
    mapLoadFailure: 'मानचित्र लोड करने में विफल। कृपया पृष्ठ को रीफ़्रेश करें।',
    invalidBoundary: 'एक मान्य खेत सीमा बनाने के लिए कम से कम 3 बिंदु बनाएं।',
    saveFailure: 'सहेजा नहीं जा सका। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।',
    noInternet: 'इंटरनेट कनेक्शन नहीं है। कृपया अपना नेटवर्क जांचें और पुनः प्रयास करें।',

    fromWeatherData: 'मौसम डेटा से', manualEntry: 'मैन्युअल प्रविष्टि',
    useFarmWeatherData: 'खेत के मौसम डेटा का उपयोग करें', delete: 'हटाएं', savedGeneric: 'सहेजा गया!', farmer: 'किसान', savingFarm: 'खेत सहेजा जा रहा है...', pleaseSignIn: 'अपना खेत सहेजने के लिए कृपया साइन इन करें।', tableMissingError: 'फार्म डेटाबेस टेबल अभी तक सेट अप नहीं हुई है। इस प्रोजेक्ट के Supabase खाते का प्रबंधन करने वाले व्यक्ति से Supabase SQL Editor में supabase/RUN_THIS_IN_SUPABASE.sql चलाने के लिए कहें।',
    nitrogenLabel: 'नाइट्रोजन (N)', phosphorusLabel: 'फॉस्फोरस (P)', potassiumLabel: 'पोटैशियम (K)', temperatureLabel: 'तापमान', humidityLabel: 'आर्द्रता', phLabel: 'पीएच स्तर', rainfallLabel: 'वर्षा',
    saveFailedGeneric: 'सहेजा नहीं जा सका। कृपया फिर से प्रयास करें।', deleteFailedGeneric: 'हटाया नहीं जा सका। कृपया फिर से प्रयास करें।', confirmDelete: 'इस रिपोर्ट को हटाएं?',
    cause: 'कारण', prevention: 'रोकथाम', otherConditions: 'अन्य संभावित स्थितियां', scanningHint: 'रोग के लक्षणों के लिए छवि स्कैन की जा रही है...', uploadPromptHint: 'फसल की फोटो अपलोड करें और फसल का प्रकार चुनें, फिर निदान पाने के लिए "छवि विश्लेषण करें" पर क्लिक करें।', aiPoweredLabel: 'एआई-संचालित रोग पहचान',
    notAPlantTitle: 'पौधे की छवि नहीं', notAPlantHint: 'यह छवि फसल रोग विश्लेषण के लिए उपयुक्त प्रतीत नहीं होती। कृपया पौधे या फसल की स्पष्ट फोटो अपलोड करें।',
    cropMismatchTitle: 'फसल मेल नहीं खाती', cropMismatchHint: 'अपलोड की गई छवि चयनित फसल से मेल नहीं खाती प्रतीत होती। कृपया अपना चयन जांचें या मिलान वाली फोटो अपलोड करें।',
    lowConfidenceTitle: 'निर्धारित नहीं किया जा सका', lowConfidenceHint: 'इस फोटो से पौधे की स्थिति का विश्वसनीय रूप से पता नहीं लगाया जा सका। अच्छी रोशनी में स्पष्ट, नज़दीकी फोटो लें।',
    analysisFailedTitle: 'विश्लेषण विफल', analysisFailedHint: 'छवि का विश्लेषण करते समय कुछ गलत हो गया। कृपया फिर से प्रयास करें।',
    visionModelUnavailableTitle: 'छवि विश्लेषण अभी उपलब्ध नहीं', visionModelUnavailableHint: 'छवि विश्लेषण सेवा अभी उपलब्ध नहीं है। कृपया बाद में फिर से प्रयास करें या सहायता से संपर्क करें।',
    retry: 'फिर से प्रयास करें', identifiedAs: 'इस रूप में पहचाना गया',
    suspectedIssueTitle: 'संदिग्ध समस्या', diseaseDetectedTitle: 'रोग का पता चला', pestDetectedTitle: 'कीट का पता चला', unknownCropTitle: 'फसल की पहचान नहीं हो सकी', unknownIssueLabel: 'अज्ञात फसल स्वास्थ्य समस्या — करीब से जांच आवश्यक', possibleCausesLabel: 'संभावित कारण', recommendationLabel: 'सिफारिश',
    severityLow: 'कम', severityMedium: 'मध्यम', severityHigh: 'उच्च', severityUnknown: 'अज्ञात',
    voiceSearch: 'वॉयस सर्च',
    listening: 'सुन रहा हूँ...',
    speakNow: 'अब बोलें, अपनी खेती का सवाल पूछें...',
    stopListening: 'सुनना बंद करें',
    readAloud: 'बोलकर सुनाएं',
    stopSpeaking: 'आवाज बंद करें',
    autoSendIn: 'सवाल भेजा जा रहा है',
    sendNow: 'अभी भेजें',
    keepEditing: 'संपादित करें',
    autoSendToggle: 'बोलना रुकने पर स्वतः भेजें',
    spokenLanguage: 'बोली जाने वाली भाषा',
    transcribingVoice: 'आवाज ट्रांसक्राइब हो रही है...',
    voicePermissionDenied: 'माइक्रोफ़ोन की अनुमति अस्वीकृत कर दी गई। कृपया ब्राउज़र सेटिंग्स में माइक्रोफ़ोन की अनुमति दें।',
    voiceNotSupported: 'इस ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है। ऑडियो रिकॉर्डिंग मोड पर स्विच कर रहे हैं।',
    noSpeechDetected: 'कोई आवाज नहीं सुनी गई। कृपया माइक्रोफ़ोन में स्पष्ट रूप से बोलें।',
    trySaying: 'यह बोलकर देखें:',
    voiceInputTooltip: 'बोलकर खेती का सवाल पूछें (वॉयस सर्च)',
  },
  mr: {
    appName: 'कृषी सल्लागार', dashboard: 'डॅशबोर्ड', aiAdvisor: 'एआय सल्लागार',
    weather: 'हवामान', cropAdvisor: 'पीक सल्लागार', imageSearch: 'प्रतिमा शोध',
    myFarm: 'माझे शेत',
    signOut: 'साइन आउट', welcomeBack: 'परत स्वागत आहे', createAccount: 'तुमचे खाते तयार करा',
    farmOverview: 'आज तुमच्या शेताचा आढावा',
    aiConversations: 'एआय संभाषणे', cropReports: 'पीक अहवाल',
    currentTemp: 'सध्याचे तापमान', humidity: 'आर्द्रता', weatherToday: 'आजचे हवामान',
    viewDays: '7-दिवस → पहा', farmProfile: 'शेत प्रोफाइल', edit: 'संपादित करा', save: 'जतन करा',
    cancel: 'रद्द करा', fullName: 'पूर्ण नाव', farmName: 'शेताचे नाव', location: 'स्थान (शहर)',
    farmSize: 'शेताचा आकार (एकर)', askAI: 'एआय सल्लागाराला विचारा', checkWeather: 'हवामान तपासा',
    recommendCrops: 'पीक सुचवा', typeQuestion: 'तुमचा शेतीचा प्रश्न लिहा...',
    askAnything: 'शेतीबद्दल काहीही विचारा', clear: 'साफ करा', searchCity: 'शहर शोधा...',
    sevenDayForecast: '7-दिवसांचा अंदाज', farmingAdvisory: 'शेती सल्ला',
    soilClimate: 'माती आणि हवामान', getRecommendations: 'सुधारणा मिळवा',
    recommendedCrops: 'शिफारस केलेली पिके', saveReport: 'अहवाल जतन करा', savedReports: 'जतन केलेले अहवाल',
    noRecommendations: 'अद्याप कोणतीही शिफारस नाही', matchScore: 'जुळणी गुण',
    season: 'हंगाम', water: 'पाणी', growing: 'वाढ', yield: 'उत्पन्न',
    confidence: 'विश्वास', uploadImage: 'प्रतिमा अपलोड करा', selectCrop: 'पीक निवडा',
    analyzeImage: 'प्रतिमा विश्लेषण करा', diagnosis: 'निदान', treatment: 'उपचार',
    severity: 'गंभीरता', healthy: 'निरोगी', imageSearchDesc: 'रोग शोधण्यासाठी तुमच्या पिकाची फोटो अपलोड करा',
    dragDrop: 'अपलोड करण्यासाठी क्लिक करा', analyzing: 'विश्लेषण होत आहे...', noImage: 'कोणतीही प्रतिमा निवडली नाही',
    selectLanguage: 'भाषा निवडा', language: 'भाषा',

    weatherForecastTitle: 'हवामान अंदाज', feelsLike: 'असे वाटते', wind: 'वारा',
    soilTemp: 'मातीचे तापमान', rain: 'पाऊस', soilMoisture: 'मातीतील ओलावा', day: 'दिवस', night: 'रात्र',
    uvIndex: 'यूव्ही', sunrise: 'सूर्योदय', sunset: 'सूर्यास्त',
    useMyFarmLocation: 'माझ्या शेताचे स्थान वापरा', useMyCurrentLocation: 'माझे सध्याचे स्थान वापरा',
    noLocationSet: 'अद्याप कोणतेही स्थान सेट केलेले नाही',
    setLocationToSeeWeather: 'हवामान पाहण्यासाठी तुमच्या शेताचे स्थान सेट करा किंवा तुमचा सध्याचा GPS वापरा',
    weatherFetchFailed: 'हवामान मिळवण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.', searchFailed: 'शोध अयशस्वी. पुन्हा प्रयत्न करा.',
    locatingYou: 'तुमचे स्थान शोधले जात आहे...',

    goodMorning: 'शुभ सकाळ', goodAfternoon: 'शुभ दुपार', goodEvening: 'शुभ संध्याकाळ',
    setLocationPrompt: 'हवामान पाहण्यासाठी तुमच्या शेताचे स्थान सेट करा', addLocation: 'स्थान जोडा →',
    profileSaved: 'प्रोफाइल जतन केले!', askAIDesc: 'त्वरित शेती मार्गदर्शन मिळवा',
    checkWeatherDesc: 'तुमच्या शेतासाठी 7-दिवसांचा अंदाज', recommendCropsDesc: 'तुमच्या मातीसाठी सर्वोत्तम पीक शोधा',
    farmLocationTitle: 'शेताचे स्थान', farmArea: 'शेताचे क्षेत्रफळ', viewFarm: 'शेत पहा',
    updateLocation: 'स्थान अद्यतनित करा', farmBoundarySaved: 'शेताची सीमा जतन केली',
    noFarmSet: 'कोणतेही शेत स्थान सेट केलेले नाही', soil: 'माती',

    myFarmSubtitle: 'अचूक हवामान आणि शिफारशींसाठी तुमच्या शेताची सीमा नकाशावर आखा',
    farmLocationLabel: 'शेताचे स्थान', gpsCoordinates: 'जीपीएस निर्देशांक', latitude: 'अक्षांश', longitude: 'रेखांश',
    setCurrentLocation: 'सध्याचे स्थान सेट करा', drawFarmBoundary: 'शेताची सीमा आखा', stopDrawing: 'आखणे थांबवा',
    clearBoundary: 'सीमा साफ करा', calculatedArea: 'गणना केलेले क्षेत्रफळ', saveFarm: 'शेत जतन करा', farmSaved: 'शेत जतन केले!',
    acres: 'एकर', hectares: 'हेक्टर', tapMapToDraw: 'सीमा बिंदू जोडण्यासाठी नकाशावर टॅप करा',
    needMorePoints: 'क्षेत्रफळ मोजण्यासाठी किमान 3 बिंदू जोडा', noBoundaryYet: 'अद्याप कोणतीही सीमा आखलेली नाही',
    locatingLoading: 'तुमचे स्थान मिळवले जात आहे...', notSet: 'सेट केलेले नाही',

    gpsDenied: 'स्थान परवानगी नाकारली. कृपया तुमच्या ब्राउझर सेटिंग्जमध्ये स्थान प्रवेशास परवानगी द्या.',
    gpsUnavailable: 'तुमचे स्थान निश्चित करता आले नाही. कृपया पुन्हा प्रयत्न करा.',
    gpsTimeout: 'स्थान विनंतीची वेळ संपली. कृपया पुन्हा प्रयत्न करा.',
    gpsUnsupported: 'या डिव्हाइस/ब्राउझरवर GPS समर्थित नाही.',
    mapLoadFailure: 'नकाशा लोड होण्यात अयशस्वी. कृपया पान रीफ्रेश करा.',
    invalidBoundary: 'वैध शेत सीमा तयार करण्यासाठी किमान 3 बिंदू आखा.',
    saveFailure: 'जतन करता आले नाही. कृपया तुमचे कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.',
    noInternet: 'इंटरनेट कनेक्शन नाही. कृपया तुमचे नेटवर्क तपासा आणि पुन्हा प्रयत्न करा.',

    fromWeatherData: 'हवामान डेटावरून', manualEntry: 'मॅन्युअल नोंद',
    useFarmWeatherData: 'शेताचा हवामान डेटा वापरा', delete: 'हटवा', savedGeneric: 'जतन केले!', farmer: 'शेतकरी', savingFarm: 'शेत जतन होत आहे...', pleaseSignIn: 'तुमचे शेत जतन करण्यासाठी कृपया साइन इन करा.', tableMissingError: 'फार्म डेटाबेस टेबल अद्याप सेट केलेली नाही. या प्रकल्पाचे Supabase खाते सांभाळणाऱ्या व्यक्तीला Supabase SQL Editor मध्ये supabase/RUN_THIS_IN_SUPABASE.sql चालवण्यास सांगा.',
    nitrogenLabel: 'नत्र (N)', phosphorusLabel: 'स्फुरद (P)', potassiumLabel: 'पालाश (K)', temperatureLabel: 'तापमान', humidityLabel: 'आर्द्रता', phLabel: 'पीएच पातळी', rainfallLabel: 'पर्जन्यमान',
    saveFailedGeneric: 'जतन करता आले नाही. कृपया पुन्हा प्रयत्न करा.', deleteFailedGeneric: 'हटवता आले नाही. कृपया पुन्हा प्रयत्न करा.', confirmDelete: 'हा अहवाल हटवायचा?',
    cause: 'कारण', prevention: 'प्रतिबंध', otherConditions: 'इतर संभाव्य स्थिती', scanningHint: 'रोगाच्या लक्षणांसाठी प्रतिमा तपासली जात आहे...', uploadPromptHint: 'पिकाचा फोटो अपलोड करा आणि पिकाचा प्रकार निवडा, नंतर निदान मिळवण्यासाठी "प्रतिमा विश्लेषण करा" वर क्लिक करा.', aiPoweredLabel: 'एआय-चालित रोग ओळख',
    notAPlantTitle: 'वनस्पतीची प्रतिमा नाही', notAPlantHint: 'ही प्रतिमा पीक रोग विश्लेषणासाठी योग्य दिसत नाही. कृपया वनस्पती किंवा पिकाचा स्पष्ट फोटो अपलोड करा.',
    cropMismatchTitle: 'पीक जुळत नाही', cropMismatchHint: 'अपलोड केलेली प्रतिमा निवडलेल्या पिकाशी जुळत नाही असे दिसते. कृपया तुमची निवड तपासा किंवा जुळणारा फोटो अपलोड करा.',
    lowConfidenceTitle: 'निश्चित करता आले नाही', lowConfidenceHint: 'या फोटोवरून वनस्पतीची स्थिती विश्वासार्हपणे ठरवता आली नाही. चांगल्या प्रकाशात स्पष्ट, जवळचा फोटो घ्या.',
    analysisFailedTitle: 'विश्लेषण अयशस्वी', analysisFailedHint: 'प्रतिमेचे विश्लेषण करताना काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.',
    visionModelUnavailableTitle: 'प्रतिमा विश्लेषण सध्या उपलब्ध नाही', visionModelUnavailableHint: 'प्रतिमा विश्लेषण सेवा सध्या उपलब्ध नाही. कृपया नंतर पुन्हा प्रयत्न करा किंवा मदतीशी संपर्क साधा.',
    retry: 'पुन्हा प्रयत्न करा', identifiedAs: 'असे ओळखले गेले',
    suspectedIssueTitle: 'संशयित समस्या', diseaseDetectedTitle: 'रोग आढळला', pestDetectedTitle: 'कीड आढळली', unknownCropTitle: 'पिकाची ओळख पटली नाही', unknownIssueLabel: 'अज्ञात पीक आरोग्य समस्या — बारकाईने तपासणी आवश्यक', possibleCausesLabel: 'संभाव्य कारणे', recommendationLabel: 'शिफारस',
    severityLow: 'कमी', severityMedium: 'मध्यम', severityHigh: 'जास्त', severityUnknown: 'अज्ञात',
    voiceSearch: 'व्हॉइस सर्च',
    listening: 'ऐकत आहे...',
    speakNow: 'आता बोला, तुमचा शेतीविषयक प्रश्न विचारा...',
    stopListening: 'ऐकणे थांबवा',
    readAloud: 'वाचून दाखवा',
    stopSpeaking: 'आवाज थांबवा',
    autoSendIn: 'प्रश्न पाठवत आहे',
    sendNow: 'आत्ता पाठवा',
    keepEditing: 'संपादन करा',
    autoSendToggle: 'शांत झाल्यावर आपोआप पाठवा',
    spokenLanguage: 'बोलण्याची भाषा',
    transcribingVoice: 'आवाज रूपांतरित होत आहे...',
    voicePermissionDenied: 'मायक्रोफोन परवानगी नाकारली गेली. कृपया ब्राउझर सेटिंग्जमध्ये मायक्रोफोन सुरू करा.',
    voiceNotSupported: 'या ब्राउझरमध्ये स्पीच रेकग्निशन समर्थित नाही. ऑडिओ रेकॉर्डिंग मोडवर स्विच करत आहे.',
    noSpeechDetected: 'कोणताही आवाज ऐकू आला नाही. कृपया मायक्रोफोनमध्ये स्पष्टपणे बोला.',
    trySaying: 'हे बोलून पहा:',
    voiceInputTooltip: 'बोलून शेतीचा प्रश्न विचारा (व्हॉइस सर्च)',
  },
  ta: {
    appName: 'விவசாய ஆலோசகர்', dashboard: 'டாஷ்போர்டு', aiAdvisor: 'ஏஐ ஆலோசகர்',
    weather: 'வானிலை', cropAdvisor: 'பயிர் ஆலோசகர்', imageSearch: 'படம் தேடல்',
    myFarm: 'எனது வயல்',
    signOut: 'வெளியேறு', welcomeBack: 'மீண்டும் வரவேற்கிறோம்', createAccount: 'உங்கள் கணக்கை உருவாக்கவும்',
    farmOverview: 'இன்று உங்கள் வயலின் கண்ணோட்டம்',
    aiConversations: 'ஏஐ உரையாடல்கள்', cropReports: 'பயிர் அறிக்கைகள்',
    currentTemp: 'தற்போதைய வெப்பம்', humidity: 'ஈரப்பதம்', weatherToday: 'இன்றைய வானிலை',
    viewDays: '7-நாள் → பார்க்க', farmProfile: 'வயல் சுயவிவரம்', edit: 'திருத்து', save: 'சேமி',
    cancel: 'ரத்து', fullName: 'முழு பெயர்', farmName: 'வயலின் பெயர்', location: 'இடம் (நகரம்)',
    farmSize: 'வயலின் அளவு (ஏக்கர்)', askAI: 'ஏஐ ஆலோசகரிடம் கேளுங்கள்', checkWeather: 'வானிலை சரிபார்',
    recommendCrops: 'பயிர்களை பரிந்துரை', typeQuestion: 'உங்கள் விவசாய கேள்வியை தட்டச்சு செய்யவும்...',
    askAnything: 'விவசாயம் பற்றி எதையும் கேளுங்கள்', clear: 'அழி', searchCity: 'நகரம் தேடவும்...',
    sevenDayForecast: '7-நாள் முன்னறிவிப்பு', farmingAdvisory: 'விவசாய ஆலோசனை',
    soilClimate: 'மண் & காலநிலை', getRecommendations: 'பரிந்துரைகள் பெறு',
    recommendedCrops: 'பரிந்துரைக்கப்பட்ட பயிர்கள்', saveReport: 'அறிக்கை சேமி', savedReports: 'சேமித்த அறிக்கைகள்',
    noRecommendations: 'இன்னும் பரிந்துரைகள் இல்லை', matchScore: 'பொருத்த மதிப்பெண்',
    season: 'பருவம்', water: 'நீர்', growing: 'வளர்ச்சி', yield: 'மகச்சூடு',
    confidence: 'நம்பகத்தன்மை', uploadImage: 'படம் பதிவேற்று', selectCrop: 'பயிர் தேர்ந்தெடு',
    analyzeImage: 'படம் ஆய்வு செய்', diagnosis: 'நோயறிதல்', treatment: 'சிகிச்சை',
    severity: 'தீவிரம்', healthy: 'ஆரோக்கியமான', imageSearchDesc: 'நோய்களை கண்டறிய உங்கள் பயிரின் புகைப்படத்தை பதிவேற்றவும்',
    dragDrop: 'பதிவேற்ற கிளிக் செய்யவும்', analyzing: 'ஆய்வு செய்யப்படுகிறது...', noImage: 'படம் தேர்ந்தெடுக்கப்படவில்லை',
    selectLanguage: 'மொழி தேர்ந்தெடு', language: 'மொழி',

    weatherForecastTitle: 'வானிலை முன்னறிவிப்பு', feelsLike: 'உணரப்படும் வெப்பம்', wind: 'காற்று',
    soilTemp: 'மண் வெப்பநிலை', rain: 'மழை', soilMoisture: 'மண் ஈரப்பதம்', day: 'பகல்', night: 'இரவு',
    uvIndex: 'யூவி', sunrise: 'சூரிய உதயம்', sunset: 'சூரிய அஸ்தமனம்',
    useMyFarmLocation: 'எனது வயல் இடத்தைப் பயன்படுத்து', useMyCurrentLocation: 'எனது தற்போதைய இடத்தைப் பயன்படுத்து',
    noLocationSet: 'இதுவரை இடம் அமைக்கப்படவில்லை',
    setLocationToSeeWeather: 'வானிலையைப் பார்க்க உங்கள் வயல் இடத்தை அமைக்கவும் அல்லது உங்கள் தற்போதைய GPS ஐப் பயன்படுத்தவும்',
    weatherFetchFailed: 'வானிலையைப் பெற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', searchFailed: 'தேடல் தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.',
    locatingYou: 'உங்கள் இடம் கண்டறியப்படுகிறது...',

    goodMorning: 'காலை வணக்கம்', goodAfternoon: 'மதிய வணக்கம்', goodEvening: 'மாலை வணக்கம்',
    setLocationPrompt: 'வானிலையைப் பார்க்க உங்கள் வயல் இடத்தை அமைக்கவும்', addLocation: 'இடம் சேர் →',
    profileSaved: 'சுயவிவரம் சேமிக்கப்பட்டது!', askAIDesc: 'உடனடி விவசாய வழிகாட்டுதலைப் பெறுங்கள்',
    checkWeatherDesc: 'உங்கள் வயலுக்கான 7-நாள் முன்னறிவிப்பு', recommendCropsDesc: 'உங்கள் மண்ணுக்கு ஏற்ற சிறந்த பயிரைக் கண்டறியுங்கள்',
    farmLocationTitle: 'வயல் இடம்', farmArea: 'வயல் பரப்பளவு', viewFarm: 'வயலைக் காண்க',
    updateLocation: 'இடத்தைப் புதுப்பிக்கவும்', farmBoundarySaved: 'வயல் எல்லை சேமிக்கப்பட்டது',
    noFarmSet: 'வயல் இடம் அமைக்கப்படவில்லை', soil: 'மண்',

    myFarmSubtitle: 'துல்லியமான வானிலை மற்றும் பரிந்துரைகளுக்காக உங்கள் வயல் எல்லையை வரையவும்',
    farmLocationLabel: 'வயல் இடம்', gpsCoordinates: 'ஜிபிஎஸ் ஆயத்தொலைவுகள்', latitude: 'அட்சரேகை', longitude: 'தீர்க்கரேகை',
    setCurrentLocation: 'தற்போதைய இடத்தை அமைக்கவும்', drawFarmBoundary: 'வயல் எல்லையை வரையவும்', stopDrawing: 'வரைவதை நிறுத்து',
    clearBoundary: 'எல்லையை அழி', calculatedArea: 'கணக்கிடப்பட்ட பரப்பளவு', saveFarm: 'வயலை சேமிக்கவும்', farmSaved: 'வயல் சேமிக்கப்பட்டது!',
    acres: 'ஏக்கர்', hectares: 'ஹெக்டேர்', tapMapToDraw: 'எல்லைப் புள்ளிகளைச் சேர்க்க வரைபடத்தில் தட்டவும்',
    needMorePoints: 'பரப்பளவைக் கணக்கிட குறைந்தது 3 புள்ளிகளைச் சேர்க்கவும்', noBoundaryYet: 'இதுவரை எல்லை வரையப்படவில்லை',
    locatingLoading: 'உங்கள் இடம் பெறப்படுகிறது...', notSet: 'அமைக்கப்படவில்லை',

    gpsDenied: 'இட அனுமதி மறுக்கப்பட்டது. உங்கள் உலாவி அமைப்புகளில் இட அணுகலை அனுமதிக்கவும்.',
    gpsUnavailable: 'உங்கள் இடத்தைக் கண்டறிய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
    gpsTimeout: 'இடக் கோரிக்கையின் நேரம் முடிந்தது. மீண்டும் முயற்சிக்கவும்.',
    gpsUnsupported: 'இந்த சாதனம்/உலாவியில் GPS ஆதரிக்கப்படவில்லை.',
    mapLoadFailure: 'வரைபடத்தை ஏற்ற முடியவில்லை. பக்கத்தை புதுப்பிக்கவும்.',
    invalidBoundary: 'சரியான வயல் எல்லையை உருவாக்க குறைந்தது 3 புள்ளிகளை வரையவும்.',
    saveFailure: 'சேமிக்க முடியவில்லை. உங்கள் இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
    noInternet: 'இணைய இணைப்பு இல்லை. உங்கள் நெட்வொர்க்கைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',

    fromWeatherData: 'வானிலை தரவிலிருந்து', manualEntry: 'கைமுறை உள்ளீடு',
    useFarmWeatherData: 'வயல் வானிலை தரவைப் பயன்படுத்தவும்', delete: 'நீக்கு', savedGeneric: 'சேமிக்கப்பட்டது!', farmer: 'விவசாயி', savingFarm: 'வயல் சேமிக்கப்படுகிறது...', pleaseSignIn: 'உங்கள் வயலைச் சேமிக்க உள்நுழையவும்.', tableMissingError: 'பண்ணை தரவுத்தள அட்டவணை இன்னும் அமைக்கப்படவில்லை. இந்த திட்டத்தின் Supabase கணக்கை நிர்வகிப்பவரிடம் Supabase SQL Editor இல் supabase/RUN_THIS_IN_SUPABASE.sql இயக்கச் சொல்லுங்கள்.',
    nitrogenLabel: 'நைட்ரஜன் (N)', phosphorusLabel: 'பாஸ்பரஸ் (P)', potassiumLabel: 'பொட்டாசியம் (K)', temperatureLabel: 'வெப்பநிலை', humidityLabel: 'ஈரப்பதம்', phLabel: 'பிஎச் அளவு', rainfallLabel: 'மழைப்பொழிவு',
    saveFailedGeneric: 'சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', deleteFailedGeneric: 'நீக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', confirmDelete: 'இந்த அறிக்கையை நீக்கவா?',
    cause: 'காரணம்', prevention: 'தடுப்பு', otherConditions: 'மற்ற சாத்தியமான நிலைமைகள்', scanningHint: 'நோய் அறிகுறிகளுக்காக படம் ஸ்கேன் செய்யப்படுகிறது...', uploadPromptHint: 'பயிரின் புகைப்படத்தை பதிவேற்றி பயிர் வகையை தேர்ந்தெடுக்கவும், பின் நோயறிதலைப் பெற "படம் ஆய்வு செய்" என்பதைக் கிளிக் செய்யவும்.', aiPoweredLabel: 'AI-இயங்கும் நோய் கண்டறிதல்',
    notAPlantTitle: 'தாவரப் படம் அல்ல', notAPlantHint: 'இந்தப் படம் பயிர் நோய் கண்டறிதலுக்கு பொருத்தமானதாக இல்லை. தயவுசெய்து ஒரு தாவரம் அல்லது பயிரின் தெளிவான புகைப்படத்தை பதிவேற்றவும்.',
    cropMismatchTitle: 'பயிர் பொருந்தவில்லை', cropMismatchHint: 'இந்தப் படம் தேர்ந்தெடுக்கப்பட்ட பயிருடன் பொருந்தவில்லை. உங்கள் தேர்வை சரிபார்க்கவும் அல்லது பொருந்தும் புகைப்படத்தை பதிவேற்றவும்.',
    lowConfidenceTitle: 'உறுதிப்படுத்த முடியவில்லை', lowConfidenceHint: 'இந்த புகைப்படத்திலிருந்து தாவரத்தின் நிலையை நம்பகமாக தீர்மானிக்க முடியவில்லை. நல்ல வெளிச்சத்தில் தெளிவான, அருகிலிருந்து எடுத்த புகைப்படத்தை முயற்சிக்கவும்.',
    analysisFailedTitle: 'ஆய்வு தோல்வியடைந்தது', analysisFailedHint: 'படத்தை ஆய்வு செய்யும்போது ஏதோ தவறு ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.',
    visionModelUnavailableTitle: 'படப் பகுப்பாய்வு தற்போது கிடைக்கவில்லை', visionModelUnavailableHint: 'படப் பகுப்பாய்வு சேவை தற்போது கிடைக்கவில்லை. பின்னர் மீண்டும் முயற்சிக்கவும் அல்லது ஆதரவைத் தொடர்பு கொள்ளவும்.',
    retry: 'மீண்டும் முயற்சிக்கவும்', identifiedAs: 'இவ்வாறு அடையாளம் காணப்பட்டது',
    suspectedIssueTitle: 'சந்தேகிக்கப்படும் பிரச்சினை', diseaseDetectedTitle: 'நோய் கண்டறியப்பட்டது', pestDetectedTitle: 'பூச்சி கண்டறியப்பட்டது', unknownCropTitle: 'பயிரை அடையாளம் காண முடியவில்லை', unknownIssueLabel: 'அறியப்படாத பயிர் ஆரோக்கிய பிரச்சினை — நெருக்கமாக பரிசோதிக்க வேண்டும்', possibleCausesLabel: 'சாத்தியமான காரணங்கள்', recommendationLabel: 'பரிந்துரை',
    severityLow: 'குறைவு', severityMedium: 'மிதமானது', severityHigh: 'அதிகம்', severityUnknown: 'தெரியவில்லை',
    voiceSearch: 'குரல் தேடல்',
    listening: 'கேட்கிறது...',
    speakNow: 'இப்போது பேசுங்கள், உங்கள் விவசாயக் கேள்வியைக் கேளுங்கள்...',
    stopListening: 'பேச்சை நிறுத்து',
    readAloud: 'படித்துக் காட்டு',
    stopSpeaking: 'ஆடியோவை நிறுத்து',
    autoSendIn: 'கேள்வி அனுப்பப்படுகிறது',
    sendNow: 'உடனே அனுப்பு',
    keepEditing: 'திருத்துங்கள்',
    autoSendToggle: 'பேசி முடித்ததும் தானாக அனுப்பு',
    spokenLanguage: 'பேசும் மொழி',
    transcribingVoice: 'குரல் உரையாக மாற்றப்படுகிறது...',
    voicePermissionDenied: 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. உங்கள் உலாவி அமைப்புகளில் மைக்ரோஃபோன் அனுமதியை வழங்கவும்.',
    voiceNotSupported: 'இந்த உலாவியில் பேச்சு அறிதல் வசதி இல்லை. ஆடியோ பதிவு முறைக்கு மாறுகிறது.',
    noSpeechDetected: 'குரல் எதுவும் கேட்கவில்லை. தயவுசெய்து மைக்ரோஃபோனில் தெளிவாகப் பேசவும்.',
    trySaying: 'இப்படி கேட்டுப் பாருங்கள்:',
    voiceInputTooltip: 'விவசாயக் கேள்வியைப் பேசித் தேடுங்கள் (குரல் தேடல்)',
  },
  te: {
    appName: 'వ్యవసాయ సలహాదారు', dashboard: 'డాష్‌బోర్డ్', aiAdvisor: 'ఏఐ సలహాదారు',
    weather: 'వాతావరణం', cropAdvisor: 'పంట సలహాదారు', imageSearch: 'చిత్ర శోధన',
    myFarm: 'నా పొలం',
    signOut: 'సైన్ అవుట్', welcomeBack: 'తిరిగి స్వాగతం', createAccount: 'మీ ఖాతా సృష్టించండి',
    farmOverview: 'ఇవాళ మీ పొలం అవలోకనం',
    aiConversations: 'ఏఐ సంభాషణలు', cropReports: 'పంట నివేదికలు',
    currentTemp: 'ప్రస్తుత ఉష్ణోగ్రత', humidity: 'తేమ', weatherToday: 'ఇవాళ వాతావరణం',
    viewDays: '7-రోజుల → చూడండి', farmProfile: 'పొలం ప్రొఫైల్', edit: 'సవరించు', save: 'భద్రపరచు',
    cancel: 'రద్దు', fullName: 'పూర్తి పేరు', farmName: 'పొలం పేరు', location: 'స్థలం (నగరం)',
    farmSize: 'పొలం పరిమాణం (ఎకరాలు)', askAI: 'ఏఐ సలహాదారును అడగండి', checkWeather: 'వాతావరణం తనిఖీ',
    recommendCrops: 'పంటలు సూచించు', typeQuestion: 'మీ వ్యవసాయ ప్రశ్నను టైప్ చేయండి...',
    askAnything: 'వ్యవసాయం గురించి ఏదైనా అడగండి', clear: 'క్లియర్', searchCity: 'నగరం శోధించండి...',
    sevenDayForecast: '7-రోజుల ముందస్తు', farmingAdvisory: 'వ్యవసాయ సలహా',
    soilClimate: 'నేల & వాతావరణం', getRecommendations: 'సిఫార్సులు పొందండి',
    recommendedCrops: 'సిఫార్సు చేయబడిన పంటలు', saveReport: 'నివేదిక భద్రపరచు', savedReports: 'భద్రపరచిన నివేదికలు',
    noRecommendations: 'ఇంకా సిఫార్సులు లేవు', matchScore: 'మ్యాచ్ స్కోర్',
    season: 'సీజన్', water: 'నీరు', growing: 'ఎదుగు', yield: 'దిగుబడి',
    confidence: 'విశ్వాసం', uploadImage: 'చిత్రం అప్‌లోడ్', selectCrop: 'పంట ఎంచుకోండి',
    analyzeImage: 'చిత్రం విశ్లేషణ', diagnosis: 'రోగ నిర్ధారణ', treatment: 'చికిత్స',
    severity: 'తీవ్రత', healthy: 'ఆరోగ్యకరమైన', imageSearchDesc: 'వ్యాధులను గుర్తించడానికి మీ పంట ఫోటో అప్‌లోడ్ చేయండి',
    dragDrop: 'అప్‌లోడ్ కోసం క్లిక్ చేయండి', analyzing: 'విశ్లేషణ జరుగుతోంది...', noImage: 'చిత్రం ఎంచుకోబడలేదు',
    selectLanguage: 'భాష ఎంచుకోండి', language: 'భాష',

    weatherForecastTitle: 'వాతావరణ సూచన', feelsLike: 'అనుభూతి చెందేది', wind: 'గాలి',
    soilTemp: 'నేల ఉష్ణోగ్రత', rain: 'వర్షం', soilMoisture: 'నేల తేమ', day: 'పగలు', night: 'రాత్రి',
    uvIndex: 'యూవీ', sunrise: 'సూర్యోదయం', sunset: 'సూర్యాస్తమయం',
    useMyFarmLocation: 'నా పొలం స్థానాన్ని ఉపయోగించండి', useMyCurrentLocation: 'నా ప్రస్తుత స్థానాన్ని ఉపయోగించండి',
    noLocationSet: 'ఇంకా స్థానం సెట్ చేయలేదు',
    setLocationToSeeWeather: 'వాతావరణాన్ని చూడటానికి మీ పొలం స్థానాన్ని సెట్ చేయండి లేదా మీ ప్రస్తుత GPS ని ఉపయోగించండి',
    weatherFetchFailed: 'వాతావరణాన్ని పొందడంలో విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.', searchFailed: 'శోధన విఫలమైంది. మళ్లీ ప్రయత్నించండి.',
    locatingYou: 'మీ స్థానాన్ని కనుగొంటోంది...',

    goodMorning: 'శుభోదయం', goodAfternoon: 'శుభ మధ్యాహ్నం', goodEvening: 'శుభ సాయంత్రం',
    setLocationPrompt: 'వాతావరణాన్ని చూడటానికి మీ పొలం స్థానాన్ని సెట్ చేయండి', addLocation: 'స్థానం జోడించండి →',
    profileSaved: 'ప్రొఫైల్ భద్రపరచబడింది!', askAIDesc: 'తక్షణ వ్యవసాయ మార్గదర్శకత్వం పొందండి',
    checkWeatherDesc: 'మీ పొలం కోసం 7-రోజుల సూచన', recommendCropsDesc: 'మీ నేలకు ఉత్తమమైన పంటను కనుగొనండి',
    farmLocationTitle: 'పొలం స్థానం', farmArea: 'పొలం విస్తీర్ణం', viewFarm: 'పొలం చూడండి',
    updateLocation: 'స్థానాన్ని నవీకరించండి', farmBoundarySaved: 'పొలం సరిహద్దు భద్రపరచబడింది',
    noFarmSet: 'పొలం స్థానం సెట్ చేయలేదు', soil: 'నేల',

    myFarmSubtitle: 'ఖచ్చితమైన వాతావరణం మరియు సిఫార్సుల కోసం మీ పొలం సరిహద్దును మ్యాప్ చేయండి',
    farmLocationLabel: 'పొలం స్థానం', gpsCoordinates: 'జీపీఎస్ కోఆర్డినేట్లు', latitude: 'అక్షాంశం', longitude: 'రేఖాంశం',
    setCurrentLocation: 'ప్రస్తుత స్థానాన్ని సెట్ చేయండి', drawFarmBoundary: 'పొలం సరిహద్దును గీయండి', stopDrawing: 'గీయడం ఆపండి',
    clearBoundary: 'సరిహద్దును క్లియర్ చేయండి', calculatedArea: 'లెక్కించిన విస్తీర్ణం', saveFarm: 'పొలాన్ని భద్రపరచండి', farmSaved: 'పొలం భద్రపరచబడింది!',
    acres: 'ఎకరాలు', hectares: 'హెక్టార్లు', tapMapToDraw: 'సరిహద్దు పాయింట్లను జోడించడానికి మ్యాప్‌పై నొక్కండి',
    needMorePoints: 'విస్తీర్ణాన్ని లెక్కించడానికి కనీసం 3 పాయింట్లు జోడించండి', noBoundaryYet: 'ఇంకా సరిహద్దు గీయలేదు',
    locatingLoading: 'మీ స్థానాన్ని పొందుతోంది...', notSet: 'సెట్ చేయలేదు',

    gpsDenied: 'స్థాన అనుమతి నిరాకరించబడింది. దయచేసి మీ బ్రౌజర్ సెట్టింగ్‌లలో స్థాన యాక్సెస్‌ను అనుమతించండి.',
    gpsUnavailable: 'మీ స్థానాన్ని నిర్ధారించలేకపోయింది. దయచేసి మళ్లీ ప్రయత్నించండి.',
    gpsTimeout: 'స్థాన అభ్యర్థన సమయం ముగిసింది. దయచేసి మళ్లీ ప్రయత్నించండి.',
    gpsUnsupported: 'ఈ పరికరం/బ్రౌజర్‌లో GPS మద్దతు లేదు.',
    mapLoadFailure: 'మ్యాప్ లోడ్ కావడంలో విఫలమైంది. దయచేసి పేజీని రిఫ్రెష్ చేయండి.',
    invalidBoundary: 'చెల్లుబాటు అయ్యే పొలం సరిహద్దును ఏర్పరచడానికి కనీసం 3 పాయింట్లను గీయండి.',
    saveFailure: 'భద్రపరచలేకపోయింది. దయచేసి మీ కనెక్షన్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.',
    noInternet: 'ఇంటర్నెట్ కనెక్షన్ లేదు. దయచేసి మీ నెట్‌వర్క్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.',

    fromWeatherData: 'వాతావరణ డేటా నుండి', manualEntry: 'మాన్యువల్ ఎంట్రీ',
    useFarmWeatherData: 'పొలం వాతావరణ డేటాను ఉపయోగించండి', delete: 'తొలగించండి', savedGeneric: 'భద్రపరచబడింది!', farmer: 'రైతు', savingFarm: 'పొలం భద్రపరచబడుతోంది...', pleaseSignIn: 'మీ పొలాన్ని భద్రపరచడానికి దయచేసి సైన్ ఇన్ చేయండి.', tableMissingError: 'పొలం డేటాబేస్ టేబుల్ ఇంకా సెటప్ చేయలేదు. ఈ ప్రాజెక్ట్ యొక్క Supabase ఖాతాను నిర్వహించే వ్యక్తిని Supabase SQL Editor లో supabase/RUN_THIS_IN_SUPABASE.sql అమలు చేయమని అడగండి.',
    nitrogenLabel: 'నత్రజని (N)', phosphorusLabel: 'భాస్వరం (P)', potassiumLabel: 'పొటాషియం (K)', temperatureLabel: 'ఉష్ణోగ్రత', humidityLabel: 'తేమ', phLabel: 'పీహెచ్ స్థాయి', rainfallLabel: 'వర్షపాతం',
    saveFailedGeneric: 'సేవ్ చేయడం సాధ్యం కాలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.', deleteFailedGeneric: 'తొలగించడం సాధ్యం కాలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.', confirmDelete: 'ఈ నివేదికను తొలగించాలా?',
    cause: 'కారణం', prevention: 'నివారణ', otherConditions: 'ఇతర సాధ్యమైన పరిస్థితులు', scanningHint: 'వ్యాధి లక్షణాల కోసం చిత్రం స్కాన్ చేయబడుతోంది...', uploadPromptHint: 'పంట ఫోటోను అప్‌లోడ్ చేసి పంట రకాన్ని ఎంచుకోండి, తర్వాత రోగనిర్ధారణ పొందడానికి "చిత్రం విశ్లేషణ" క్లిక్ చేయండి.', aiPoweredLabel: 'AI-ఆధారిత వ్యాధి గుర్తింపు',
    notAPlantTitle: 'మొక్క చిత్రం కాదు', notAPlantHint: 'ఈ చిత్రం పంట వ్యాధి విశ్లేషణకు అనుకూలంగా కనిపించడం లేదు. దయచేసి మొక్క లేదా పంట యొక్క స్పష్టమైన ఫోటోను అప్‌లోడ్ చేయండి.',
    cropMismatchTitle: 'పంట సరిపోలలేదు', cropMismatchHint: 'అప్‌లోడ్ చేసిన చిత్రం ఎంచుకున్న పంటతో సరిపోలడం లేదు. దయచేసి మీ ఎంపికను తనిఖీ చేయండి లేదా సరిపోలే ఫోటోను అప్‌లోడ్ చేయండి.',
    lowConfidenceTitle: 'నిర్ధారించలేకపోయాము', lowConfidenceHint: 'ఈ ఫోటో నుండి మొక్క పరిస్థితిని నమ్మకంగా నిర్ధారించలేకపోయాము. మంచి వెలుతురులో స్పష్టమైన, దగ్గరి ఫోటోను ప్రయత్నించండి.',
    analysisFailedTitle: 'విశ్లేషణ విఫలమైంది', analysisFailedHint: 'చిత్రాన్ని విశ్లేషిస్తున్నప్పుడు ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.',
    visionModelUnavailableTitle: 'చిత్ర విశ్లేషణ ప్రస్తుతం అందుబాటులో లేదు', visionModelUnavailableHint: 'చిత్ర విశ్లేషణ సేవ ప్రస్తుతం అందుబాటులో లేదు. దయచేసి తర్వాత మళ్లీ ప్రయత్నించండి లేదా మద్దతును సంప్రదించండి.',
    retry: 'మళ్లీ ప్రయత్నించండి', identifiedAs: 'ఇలా గుర్తించబడింది',
    suspectedIssueTitle: 'అనుమానిత సమస్య', diseaseDetectedTitle: 'వ్యాధి గుర్తించబడింది', pestDetectedTitle: 'పురుగు గుర్తించబడింది', unknownCropTitle: 'పంటను గుర్తించలేకపోయాం', unknownIssueLabel: 'తెలియని పంట ఆరోగ్య సమస్య — దగ్గరగా పరిశీలన అవసరం', possibleCausesLabel: 'సాధ్యమైన కారణాలు', recommendationLabel: 'సిఫార్సు',
    severityLow: 'తక్కువ', severityMedium: 'మధ్యస్థం', severityHigh: 'అధికం', severityUnknown: 'తెలియదు',
    voiceSearch: 'వాయిస్ శోధన',
    listening: 'వింటోంది...',
    speakNow: 'ఇప్పుడు మాట్లాడండి, మీ వ్యవసాయ ప్రశ్నను అడగండి...',
    stopListening: 'వినడం ఆపు',
    readAloud: 'వినండి',
    stopSpeaking: 'ఆడియో ఆపు',
    autoSendIn: 'ప్రశ్న పంపబడుతోంది',
    sendNow: 'ఇప్పుడే పంపు',
    keepEditing: 'సవరించండి',
    autoSendToggle: 'నిశ్శబ్దం తర్వాత స్వయంచాలకంగా పంపు',
    spokenLanguage: 'మాట్లాడే భాష',
    transcribingVoice: 'వాయిస్ లిప్యంతరీకరణ జరుగుతోంది...',
    voicePermissionDenied: 'మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి బ్రౌజర్ సెట్టింగ్‌లలో మైక్రోఫోన్ అనుమతి ఇవ్వండి.',
    voiceNotSupported: 'ఈ బ్రౌజర్‌లో స్పీచ్ రికగ్నిషన్ సపోర్ట్ లేదు. ఆడియో రికార్డింగ్ మోడ్‌కు మారుతోంది.',
    noSpeechDetected: 'వాయిస్ గుర్తించబడలేదు. దయచేసి మైక్రోఫోన్‌లో స్పష్టంగా మాట్లాడండి.',
    trySaying: 'ఇలా మాట్లాడి చూడండి:',
    voiceInputTooltip: 'మాట్లాడి వ్యవసాయ ప్రశ్నను అడగండి (వాయిస్ సెర్చ్)',
  },
  bn: {
    appName: 'কৃষি উপদেষ্টা', dashboard: 'ড্যাশবোর্ড', aiAdvisor: 'এআই উপদেষ্টা',
    weather: 'আবহাওয়া', cropAdvisor: 'ফসল উপদেষ্টা', imageSearch: 'ছবি অনুসন্ধান',
    myFarm: 'আমার খামার',
    signOut: 'সাইন আউট', welcomeBack: 'ফিরে আসায় স্বাগতম', createAccount: 'আপনার অ্যাকাউন্ট তৈরি করুন',
    farmOverview: 'আজ আপনার খামারের ওভারভিউ',
    aiConversations: 'এআই কথোপকথন', cropReports: 'ফসল প্রতিবেদন',
    currentTemp: 'বর্তমান তাপমাত্রা', humidity: 'আর্দ্রতা', weatherToday: 'আজকের আবহাওয়া',
    viewDays: '৭-দিন → দেখুন', farmProfile: 'খামার প্রোফাইল', edit: 'সম্পাদনা', save: 'সংরক্ষণ',
    cancel: 'বাতিল', fullName: 'পূর্ণ নাম', farmName: 'খামারের নাম', location: 'অবস্থান (শহর)',
    farmSize: 'খামারের আকার (একর)', askAI: 'এআই উপদেষ্টাকে জিজ্ঞাসা করুন', checkWeather: 'আবহাওয়া পরীক্ষা',
    recommendCrops: 'ফসল সুপারিশ', typeQuestion: 'আপনার কৃষি প্রশ্ন লিখুন...',
    askAnything: 'কৃষি সম্পর্কে যা কিছু জিজ্ঞাসা করুন', clear: 'মুছুন', searchCity: 'শহর খুঁজুন...',
    sevenDayForecast: '৭-দিনের পূর্বাভাস', farmingAdvisory: 'কৃষি পরামর্শ',
    soilClimate: 'মাটি ও জলবায়ু', getRecommendations: 'সুপারিশ পান',
    recommendedCrops: 'সুপারিশকৃত ফসল', saveReport: 'প্রতিবেদন সংরক্ষণ', savedReports: 'সংরক্ষিত প্রতিবেদন',
    noRecommendations: 'এখনও কোন সুপারিশ নেই', matchScore: 'ম্যাচ স্কোর',
    season: 'ঋতু', water: 'জল', growing: 'বৃদ্ধি', yield: 'ফলন',
    confidence: 'আস্থা', uploadImage: 'ছবি আপলোড', selectCrop: 'ফসল নির্বাচন',
    analyzeImage: 'ছবি বিশ্লেষণ', diagnosis: 'রোগ নির্ণয়', treatment: 'চিকিৎসা',
    severity: 'মাত্রা', healthy: 'সুস্থ', imageSearchDesc: 'রোগ সনাক্ত করতে আপনার ফসলের ছবি আপলোড করুন',
    dragDrop: 'আপলোড করতে ক্লিক করুন', analyzing: 'বিশ্লেষণ হচ্ছে...', noImage: 'কোন ছবি নির্বাচিত নয়',
    selectLanguage: 'ভাষা নির্বাচন', language: 'ভাষা',

    weatherForecastTitle: 'আবহাওয়ার পূর্বাভাস', feelsLike: 'অনুভূত হচ্ছে', wind: 'বাতাস',
    soilTemp: 'মাটির তাপমাত্রা', rain: 'বৃষ্টি', soilMoisture: 'মাটির আর্দ্রতা', day: 'দিন', night: 'রাত',
    uvIndex: 'ইউভি', sunrise: 'সূর্যোদয়', sunset: 'সূর্যাস্ত',
    useMyFarmLocation: 'আমার খামারের অবস্থান ব্যবহার করুন', useMyCurrentLocation: 'আমার বর্তমান অবস্থান ব্যবহার করুন',
    noLocationSet: 'এখনও কোনো অবস্থান সেট করা হয়নি',
    setLocationToSeeWeather: 'আবহাওয়া দেখতে আপনার খামারের অবস্থান সেট করুন বা আপনার বর্তমান GPS ব্যবহার করুন',
    weatherFetchFailed: 'আবহাওয়া আনতে ব্যর্থ। আবার চেষ্টা করুন।', searchFailed: 'অনুসন্ধান ব্যর্থ। আবার চেষ্টা করুন।',
    locatingYou: 'আপনার অবস্থান খুঁজে বের করা হচ্ছে...',

    goodMorning: 'সুপ্রভাত', goodAfternoon: 'শুভ অপরাহ্ন', goodEvening: 'শুভ সন্ধ্যা',
    setLocationPrompt: 'আবহাওয়া দেখতে আপনার খামারের অবস্থান সেট করুন', addLocation: 'অবস্থান যোগ করুন →',
    profileSaved: 'প্রোফাইল সংরক্ষিত হয়েছে!', askAIDesc: 'তাৎক্ষণিক কৃষি নির্দেশনা পান',
    checkWeatherDesc: 'আপনার খামারের জন্য ৭-দিনের পূর্বাভাস', recommendCropsDesc: 'আপনার মাটির জন্য সেরা ফসল খুঁজুন',
    farmLocationTitle: 'খামারের অবস্থান', farmArea: 'খামারের আয়তন', viewFarm: 'খামার দেখুন',
    updateLocation: 'অবস্থান আপডেট করুন', farmBoundarySaved: 'খামারের সীমানা সংরক্ষিত হয়েছে',
    noFarmSet: 'কোনো খামারের অবস্থান সেট করা হয়নি', soil: 'মাটি',

    myFarmSubtitle: 'সঠিক আবহাওয়া ও সুপারিশের জন্য আপনার খামারের সীমানা ম্যাপ করুন',
    farmLocationLabel: 'খামারের অবস্থান', gpsCoordinates: 'জিপিএস স্থানাঙ্ক', latitude: 'অক্ষাংশ', longitude: 'দ্রাঘিমাংশ',
    setCurrentLocation: 'বর্তমান অবস্থান সেট করুন', drawFarmBoundary: 'খামারের সীমানা আঁকুন', stopDrawing: 'আঁকা বন্ধ করুন',
    clearBoundary: 'সীমানা মুছুন', calculatedArea: 'হিসাবকৃত আয়তন', saveFarm: 'খামার সংরক্ষণ করুন', farmSaved: 'খামার সংরক্ষিত হয়েছে!',
    acres: 'একর', hectares: 'হেক্টর', tapMapToDraw: 'সীমানা বিন্দু যোগ করতে মানচিত্রে ট্যাপ করুন',
    needMorePoints: 'আয়তন হিসাব করতে কমপক্ষে ৩টি বিন্দু যোগ করুন', noBoundaryYet: 'এখনও কোনো সীমানা আঁকা হয়নি',
    locatingLoading: 'আপনার অবস্থান পাওয়া যাচ্ছে...', notSet: 'সেট করা হয়নি',

    gpsDenied: 'অবস্থানের অনুমতি প্রত্যাখ্যাত হয়েছে। অনুগ্রহ করে আপনার ব্রাউজার সেটিংসে অবস্থান অ্যাক্সেসের অনুমতি দিন।',
    gpsUnavailable: 'আপনার অবস্থান নির্ধারণ করা যায়নি। আবার চেষ্টা করুন।',
    gpsTimeout: 'অবস্থান অনুরোধের সময় শেষ হয়ে গেছে। আবার চেষ্টা করুন।',
    gpsUnsupported: 'এই ডিভাইস/ব্রাউজারে GPS সমর্থিত নয়।',
    mapLoadFailure: 'মানচিত্র লোড করতে ব্যর্থ। অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন।',
    invalidBoundary: 'একটি বৈধ খামারের সীমানা তৈরি করতে কমপক্ষে ৩টি বিন্দু আঁকুন।',
    saveFailure: 'সংরক্ষণ করা যায়নি। আপনার সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।',
    noInternet: 'ইন্টারনেট সংযোগ নেই। আপনার নেটওয়ার্ক পরীক্ষা করে আবার চেষ্টা করুন।',

    fromWeatherData: 'আবহাওয়া তথ্য থেকে', manualEntry: 'ম্যানুয়াল এন্ট্রি',
    useFarmWeatherData: 'খামারের আবহাওয়া তথ্য ব্যবহার করুন', delete: 'মুছুন', savedGeneric: 'সংরক্ষিত হয়েছে!', farmer: 'কৃষক', savingFarm: 'খামার সংরক্ষণ করা হচ্ছে...', pleaseSignIn: 'আপনার খামার সংরক্ষণ করতে অনুগ্রহ করে সাইন ইন করুন।', tableMissingError: 'খামারের ডেটাবেস টেবিল এখনও সেট আপ করা হয়নি। এই প্রকল্পের Supabase অ্যাকাউন্ট পরিচালনাকারী ব্যক্তিকে Supabase SQL Editor-এ supabase/RUN_THIS_IN_SUPABASE.sql চালাতে বলুন।',
    nitrogenLabel: 'নাইট্রোজেন (N)', phosphorusLabel: 'ফসফরাস (P)', potassiumLabel: 'পটাশিয়াম (K)', temperatureLabel: 'তাপমাত্রা', humidityLabel: 'আর্দ্রতা', phLabel: 'পিএইচ মাত্রা', rainfallLabel: 'বৃষ্টিপাত',
    saveFailedGeneric: 'সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।', deleteFailedGeneric: 'মুছে ফেলা যায়নি। আবার চেষ্টা করুন।', confirmDelete: 'এই প্রতিবেদনটি মুছবেন?',
    cause: 'কারণ', prevention: 'প্রতিরোধ', otherConditions: 'অন্যান্য সম্ভাব্য অবস্থা', scanningHint: 'রোগের লক্ষণের জন্য ছবি স্ক্যান করা হচ্ছে...', uploadPromptHint: 'ফসলের ছবি আপলোড করুন এবং ফসলের ধরন নির্বাচন করুন, তারপর নির্ণয় পেতে "ছবি বিশ্লেষণ" এ ক্লিক করুন।', aiPoweredLabel: 'এআই-চালিত রোগ শনাক্তকরণ',
    notAPlantTitle: 'উদ্ভিদের ছবি নয়', notAPlantHint: 'এই ছবিটি ফসল রোগ বিশ্লেষণের জন্য উপযুক্ত বলে মনে হচ্ছে না। অনুগ্রহ করে একটি উদ্ভিদ বা ফসলের স্পষ্ট ছবি আপলোড করুন।',
    cropMismatchTitle: 'ফসল মেলেনি', cropMismatchHint: 'আপলোড করা ছবিটি নির্বাচিত ফসলের সাথে মিলছে না বলে মনে হচ্ছে। অনুগ্রহ করে আপনার নির্বাচন পরীক্ষা করুন বা মিলে যাওয়া ছবি আপলোড করুন।',
    lowConfidenceTitle: 'নির্ধারণ করা যায়নি', lowConfidenceHint: 'এই ছবি থেকে উদ্ভিদের অবস্থা নিশ্চিতভাবে নির্ধারণ করা যায়নি। ভালো আলোতে স্পষ্ট, কাছাকাছি ছবি চেষ্টা করুন।',
    analysisFailedTitle: 'বিশ্লেষণ ব্যর্থ হয়েছে', analysisFailedHint: 'ছবি বিশ্লেষণ করার সময় কিছু ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    visionModelUnavailableTitle: 'ছবি বিশ্লেষণ এখন উপলব্ধ নেই', visionModelUnavailableHint: 'ছবি বিশ্লেষণ পরিষেবা এখন উপলব্ধ নেই। অনুগ্রহ করে পরে আবার চেষ্টা করুন বা সহায়তার সাথে যোগাযোগ করুন।',
    retry: 'আবার চেষ্টা করুন', identifiedAs: 'হিসেবে চিহ্নিত হয়েছে',
    suspectedIssueTitle: 'সন্দেহভাজন সমস্যা', diseaseDetectedTitle: 'রোগ শনাক্ত হয়েছে', pestDetectedTitle: 'পোকা শনাক্ত হয়েছে', unknownCropTitle: 'ফসল শনাক্ত করা যায়নি', unknownIssueLabel: 'অজানা ফসল স্বাস্থ্য সমস্যা — কাছাকাছি থেকে পরীক্ষা প্রয়োজন', possibleCausesLabel: 'সম্ভাব্য কারণ', recommendationLabel: 'সুপারিশ',
    severityLow: 'কম', severityMedium: 'মাঝারি', severityHigh: 'বেশি', severityUnknown: 'অজানা',
    voiceSearch: 'ভয়েস অনুসন্ধান',
    listening: 'শুনছি...',
    speakNow: 'এখন বলুন, আপনার কৃষিকাজের প্রশ্ন জিজ্ঞাসা করুন...',
    stopListening: 'শোনা বন্ধ করুন',
    readAloud: 'পড়ে শোনান',
    stopSpeaking: 'অডিও বন্ধ করুন',
    autoSendIn: 'প্রশ্ন পাঠানো হচ্ছে',
    sendNow: 'এখনই পাঠান',
    keepEditing: 'সম্পাদনা করুন',
    autoSendToggle: 'কথা শেষ হলে স্বয়ংক্রিয়ভাবে পাঠান',
    spokenLanguage: 'কথ্য ভাষা',
    transcribingVoice: 'ভয়েস টেক্সটে রূপান্তর হচ্ছে...',
    voicePermissionDenied: 'মাইক্রোফোনের অনুমতি প্রত্যাখ্যাত হয়েছে। অনুগ্রহ করে ব্রাউজার সেটিংসে মাইক্রোফোন অ্যাক্সেসের অনুমতি দিন।',
    voiceNotSupported: 'এই ব্রাউজারে স্পিচ রিকগনিশন সমর্থিত নয়। অডিও রেকর্डिंग মোডে পরিবর্তন করা হচ্ছে।',
    noSpeechDetected: 'কোনো কথা সনাক্ত করা যায়নি। অনুগ্রহ করে মাইক্রোফোনে স্পষ্টভাবে বলুন।',
    trySaying: 'এটি বলে দেখুন:',
    voiceInputTooltip: 'কৃষিকাজের প্রশ্ন মুখে বলুন (ভয়েস অনুসন্ধান)',
  },
};

export function t(lang: Language): UIStrings {
  return UI[lang] ?? UI.en;
}
