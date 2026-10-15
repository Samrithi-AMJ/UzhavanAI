// Curated reference information for known crop diseases/pests: symptoms,
// cause, treatment, and prevention text, in English (see
// diseaseTranslations.ts for the localized versions of every entry here).
//
// IMPORTANT — what this file is and isn't: this is a REFERENCE lookup
// table, not a diagnostic model. It used to also contain diagnoseImage(),
// a function that fabricated a "diagnosis" from a hash of the uploaded
// image's bytes filtered by whichever crop the farmer picked from a
// dropdown — no actual image content was ever examined, confidence scores
// were arithmetic on the hash, and roughly 1 in 4 images were labeled
// "Healthy" purely by chance regardless of what was actually in the photo.
// That function has been removed. Real image analysis now happens via
// server/visionModel.js (a local Ollama vision model) through the
// /api/image-diagnosis backend route — see src/lib/imageEngine.ts and
// ImageSearchPage.tsx. This file's role is now only to supply richer,
// localized cause/treatment/prevention detail (via getDiseaseByName()
// below) when the vision model's free-text identification happens to
// match one of these known entries.
export type DiseaseInfo = {
  name: string;
  crop: string;
  severity: 'Low' | 'Moderate' | 'High';
  symptoms: string;
  cause: string;
  treatment: string;
  prevention: string;
};

const DISEASES: DiseaseInfo[] = [
  {
    name: 'Blast',
    crop: 'Rice',
    severity: 'High',
    symptoms: 'Diamond-shaped lesions on leaves with gray centers and brown borders. Can affect nodes, neck, and panicles.',
    cause: 'Fungal infection by Magnaporthe oryzae. Favored by high humidity, cool nights, and excess nitrogen.',
    treatment: 'Apply tricyclazole or azoxystrobin fungicide at early stage. Reduce nitrogen application. Maintain water level.',
    prevention: 'Use resistant varieties like IR64. Avoid excessive nitrogen. Ensure proper spacing for air circulation.',
  },
  {
    name: 'Bacterial Blight',
    crop: 'Rice',
    severity: 'High',
    symptoms: 'Water-soaked stripes on leaf blades turning yellow then white. Wilting of seedlings.',
    cause: 'Bacterial infection by Xanthomonas oryzae. Spreads through water, wind, and contaminated tools.',
    treatment: 'Apply copper-based bactericide. Drain field temporarily. Remove infected plants.',
    prevention: 'Use disease-free seeds. Practice field sanitation. Avoid wounding plants. Grow resistant varieties.',
  },
  {
    name: 'Brown Spot',
    crop: 'Rice',
    severity: 'Moderate',
    symptoms: 'Small brown oval spots on leaves with yellow halos. Can cause grain discoloration.',
    cause: 'Fungal infection by Bipolaris oryzae. Favored by nutrient-deficient soils and drought stress.',
    treatment: 'Apply mancozeb or propiconazole. Correct soil nutrient deficiencies especially potassium.',
    prevention: 'Maintain soil fertility. Use healthy seeds. Practice crop rotation. Avoid water stress.',
  },
  {
    name: 'Leaf Rust',
    crop: 'Wheat',
    severity: 'Moderate',
    symptoms: 'Orange-brown pustules arranged in stripes on leaves. Premature leaf drying.',
    cause: 'Fungal infection by Puccinia triticina. Spreads rapidly in cool, moist conditions (10–20°C).',
    treatment: 'Apply propiconazole or tebuconazole fungicide. Remove volunteer wheat plants.',
    prevention: 'Grow resistant varieties. Plant early. Remove alternate hosts. Practice crop rotation.',
  },
  {
    name: 'Powdery Mildew',
    crop: 'Wheat',
    severity: 'Moderate',
    symptoms: 'White to gray powdery patches on leaves and stems. Leaves may turn yellow and dry.',
    cause: 'Fungal infection by Blumeria graminis. Thrives in cool, humid conditions with poor air circulation.',
    treatment: 'Apply sulfur or triazole fungicide. Improve field drainage and air circulation.',
    prevention: 'Use resistant varieties. Avoid excessive nitrogen. Ensure proper plant spacing.',
  },
  {
    name: 'Fall Armyworm',
    crop: 'Maize',
    severity: 'High',
    symptoms: 'Large irregular holes in leaves, windowpane feeding. Frass near leaf whorls. Plants may be defoliated.',
    cause: 'Insect pest Spodoptera frugiperda. Moths lay egg masses on leaves. Larvae feed aggressively.',
    treatment: 'Apply emamectin benzoate or chlorantraniliprole. Use pheromone traps for monitoring. Hand-pick larvae.',
    prevention: 'Early sowing. Intercropping with legumes. Use neem-based sprays. Release natural enemies.',
  },
  {
    name: 'Leaf Blight',
    crop: 'Maize',
    severity: 'Moderate',
    symptoms: 'Grayish-tan elongated lesions on leaves. Lesions may coalesce causing entire leaf blight.',
    cause: 'Fungal infection by Exserohilum turcicum. Favored by moderate temperatures and high humidity.',
    treatment: 'Apply mancozeb or pyraclostrobin fungicide. Remove infected debris.',
    prevention: 'Use resistant hybrids. Practice crop rotation. Remove crop residue. Plant early.',
  },
  {
    name: 'Pink Bollworm',
    crop: 'Cotton',
    severity: 'High',
    symptoms: 'Damaged flowers and bolls. Larvae inside bolls feed on lint and seeds. Stained lint.',
    cause: 'Insect pest Pectinophora gossypiella. Larvae bore into bolls and feed internally.',
    treatment: 'Use pheromone traps for monitoring. Apply chlorantraniliprole or spinosad. Destroy infested bolls.',
    prevention: 'Early sowing and timely harvest. Destroy crop residue. Use Bt cotton. Install pheromone traps early.',
  },
  {
    name: 'Boll Rot',
    crop: 'Cotton',
    severity: 'Moderate',
    symptoms: 'Soft, water-soaked bolls turning brown or black. Fuzzy fungal growth on affected bolls.',
    cause: 'Fungal infection by various pathogens. Favored by high humidity and insect damage.',
    treatment: 'Apply copper oxychloride or carbendazim. Control insect pests that create entry wounds.',
    prevention: 'Improve air circulation. Control sucking pests. Avoid dense planting. Practice crop rotation.',
  },
  {
    name: 'Yellow Mosaic Virus',
    crop: 'Soybean',
    severity: 'High',
    symptoms: 'Yellow mosaic pattern on leaves. Stunted growth. Reduced pod set and yield.',
    cause: 'Viral disease transmitted by whiteflies (Bemisia tabaci). Spreads rapidly in warm conditions.',
    treatment: 'No direct cure. Control whitefly vector with insecticides. Remove infected plants.',
    prevention: 'Use resistant varieties. Control whiteflies with yellow sticky traps and neem oil. Plant early.',
  },
  {
    name: 'Early Blight',
    crop: 'Tomato',
    severity: 'Moderate',
    symptoms: 'Dark brown concentric ring spots on older leaves with yellow halos. Leaf drop.',
    cause: 'Fungal infection by Alternaria solani. Favored by warm, humid weather (24–29°C).',
    treatment: 'Apply chlorothalonil or copper-based fungicide. Remove infected leaves. Mulch around plants.',
    prevention: 'Use disease-free seedlings. Practice crop rotation. Stake plants. Avoid overhead watering.',
  },
  {
    name: 'Late Blight',
    crop: 'Tomato',
    severity: 'High',
    symptoms: 'Water-soaked lesions on leaves turning dark brown. White mold on underside. Rapid plant collapse.',
    cause: 'Fungal-like infection by Phytophthora infestans. Spreads in cool, wet conditions (15–20°C).',
    treatment: 'Apply cymoxanil or metalaxyl fungicide immediately. Remove and destroy infected plants.',
    prevention: 'Use resistant varieties. Avoid overhead irrigation. Ensure good drainage. Remove volunteer plants.',
  },
  {
    name: 'Sigatoka Leaf Spot',
    crop: 'Banana',
    severity: 'High',
    symptoms: 'Small yellow streaks on leaves turning brown with gray centers. Premature leaf death.',
    cause: 'Fungal infection by Mycosphaerella fijiensis. Favored by high humidity and warm temperatures.',
    treatment: 'Apply propiconazole or azoxystrobin in rotation. Remove and burn infected leaves.',
    prevention: 'Plant resistant varieties. Ensure proper spacing. Remove suckers. Practice field sanitation.',
  },
  {
    name: 'Panama Wilt',
    crop: 'Banana',
    severity: 'High',
    symptoms: 'Yellowing of older leaves starting from margins. Wilting and splitting of pseudostem base.',
    cause: 'Fungal infection by Fusarium oxysporum. Soil-borne, persists for years. Spreads through water and tools.',
    treatment: 'No cure. Remove and destroy infected plants. Apply biocontrol agents like Trichoderma.',
    prevention: 'Use disease-free planting material. Plant resistant varieties. Practice crop rotation. Disinfect tools.',
  },
  {
    name: 'Aphid Infestation',
    crop: 'Mustard',
    severity: 'Moderate',
    symptoms: 'Curled, distorted leaves. Sticky honeydew on leaves. Stunted growth. Sooty mold.',
    cause: 'Sap-sucking insects (Lipaphis erysimi). Populations explode in cool, dry weather.',
    treatment: 'Apply imidacloprid or dimethoate. Use neem oil spray. Introduce ladybird beetles.',
    prevention: 'Monitor with yellow sticky traps. Plant early. Use balanced fertilization. Encourage natural enemies.',
  },
  {
    name: 'Downy Mildew',
    crop: 'Millet',
    severity: 'Moderate',
    symptoms: 'Yellow-green streaks on upper leaves. Grayish-white mold on leaf undersides. Stunted plants.',
    cause: 'Fungal infection by Sclerospora graminicola. Spreads through oospores in soil and wind.',
    treatment: 'Apply metalaxyl or mancozeb. Remove infected plants. Improve drainage.',
    prevention: 'Use resistant hybrids. Treat seeds with metalaxyl. Practice crop rotation. Remove weed hosts.',
  },
  {
    name: 'Wilt',
    crop: 'Chickpea',
    severity: 'High',
    symptoms: 'Sudden wilting and drying of plants. Browning of vascular tissue. Leaves droop but remain attached.',
    cause: 'Fungal infection by Fusarium oxysporum. Soil-borne, enters through roots. Favored by warm, dry soil.',
    treatment: 'No cure once infected. Apply Trichoderma biocontrol. Remove infected plants. Avoid waterlogging.',
    prevention: 'Use resistant varieties. Treat seeds with Trichoderma. Practice 3–4 year crop rotation. Deep plowing.',
  },
  {
    name: 'Healthy',
    crop: 'General',
    severity: 'Low',
    symptoms: 'No visible disease symptoms. Leaves appear green and healthy with normal growth.',
    cause: 'No pathogen detected.',
    treatment: 'No treatment needed. Continue regular farm practices.',
    prevention: 'Maintain balanced nutrition, proper irrigation, and regular monitoring to keep crops healthy.',
  },
];

export const CROP_OPTIONS = [
  'Rice', 'Wheat', 'Maize', 'Cotton', 'Soybean', 'Tomato', 'Banana',
  'Mustard', 'Millet', 'Chickpea', 'Groundnut', 'Sugarcane',
];

/**
 * Looks up a disease/pest reference entry by its stable English name
 * (case-insensitive). Used to enrich a name identified live by the vision
 * model (server/visionModel.js) with curated, localizable detail (cause,
 * treatment, prevention) — see diseaseTranslations.ts's translateDisease().
 * Returns null if the name isn't in our curated reference list (which is
 * expected and fine: the vision model can identify things we don't have a
 * curated write-up for — callers should fall back to the model's own
 * observedSymptoms text in that case, not treat this as an error).
 */
export function getDiseaseByName(name: string): DiseaseInfo | null {
  const lower = name.trim().toLowerCase();
  if (!lower) return null;

  // Exact match first (fastest, most reliable).
  const exact = DISEASES.find((d) => d.name.toLowerCase() === lower);
  if (exact) return exact;

  // Fuzzy fallback: a vision model commonly prefixes/suffixes the crop
  // name onto a disease name (e.g. "Rice Blast" instead of just "Blast",
  // as seen in the reference table). Match if one name fully contains the
  // other as a whole word-ish substring, preferring the longest/most
  // specific match so a generic word doesn't match too eagerly.
  const candidates = DISEASES.filter((d) => {
    const dLower = d.name.toLowerCase();
    return lower.includes(dLower) || dLower.includes(lower);
  });
  if (candidates.length === 0) return null;
  // Prefer the entry whose name is longest (most specific) among matches.
  return candidates.reduce((best, c) => (c.name.length > best.name.length ? c : best));
}
