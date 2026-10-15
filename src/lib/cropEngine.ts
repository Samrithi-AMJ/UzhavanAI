// Crop suitability profiles.
//
// Data provenance: the ideal N/P/K/temperature/humidity/pH ranges for the
// crops below that are present in data/Crop_recommendation.csv (a widely
// used, clean 2,200-row / 22-crop agronomic dataset — 100 balanced samples
// per crop) are calibrated from that dataset's real 5th–95th percentile
// values per crop (see data/crop_ranges.json, generated from the CSV).
// Season, water-requirement description, growing period, expected yield and
// the free-text notes are authored from general agronomic knowledge, since
// the dataset does not include those fields.
//
// Seven crops that are important for Indian smallholder farming but are NOT
// present in that dataset (wheat, sugarcane, soybean, groundnut, mustard,
// tomato, millet) keep their original hand-authored ranges unchanged.
//
// A second uploaded dataset ("crop_remmendation_dataset.csv", 10,000 rows
// with soil type/region/season/irrigation/fertilizer columns) was evaluated
// and found to carry no real statistical signal — its numeric features are
// statistically indistinguishable across different recommended crops (e.g.
// soil pH mean/std is ~6.0±1.1 regardless of which crop was "recommended").
// Building a recommendation feature from it would mean presenting arbitrary
// noise as data-driven advice, so it was intentionally NOT used here.
export type CropInput = {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
};

export type CropResult = {
  key: string;
  name: string;
  score: number;
  confidence: string;
  reason: string;
  season: string;
  waterRequirement: string;
  growingPeriod: string;
  expectedYield: string;
};

type CropProfile = {
  key: string;
  name: string;
  season: string;
  waterRequirement: string;
  growingPeriod: string;
  expectedYield: string;
  ideal: {
    nitrogen: [number, number];
    phosphorus: [number, number];
    potassium: [number, number];
    temperature: [number, number];
    humidity: [number, number];
    ph: [number, number];
    rainfall: [number, number];
  };
  notes: string;
};

const CROP_PROFILES: CropProfile[] = [

  {
    key: 'wheat',
    name: 'Wheat',
    season: 'Rabi (Winter)',
    waterRequirement: 'Medium (450–650 mm)',
    growingPeriod: '110–130 days',
    expectedYield: '2.5–4.0 t/ha',
    ideal: {
      nitrogen: [70, 120],
      phosphorus: [30, 55],
      potassium: [35, 70],
      temperature: [10, 25],
      humidity: [50, 70],
      ph: [6.0, 7.5],
      rainfall: [300, 700],
    },
    notes: 'Cool-season cereal, prefers well-drained loamy soils.',
  },
  {
    key: 'sugarcane',
    name: 'Sugarcane',
    season: 'Annual (year-round planting)',
    waterRequirement: 'High (1500–2500 mm)',
    growingPeriod: '10–18 months',
    expectedYield: '60–80 t/ha',
    ideal: {
      nitrogen: [100, 180],
      phosphorus: [40, 70],
      potassium: [50, 100],
      temperature: [22, 35],
      humidity: [70, 85],
      ph: [6.0, 7.5],
      rainfall: [1000, 2500],
    },
    notes: 'Long-duration crop requiring abundant water and fertile soil.',
  },
  {
    key: 'soybean',
    name: 'Soybean',
    season: 'Kharif',
    waterRequirement: 'Medium (450–700 mm)',
    growingPeriod: '90–120 days',
    expectedYield: '1.5–3.0 t/ha',
    ideal: {
      nitrogen: [40, 80],
      phosphorus: [30, 60],
      potassium: [30, 60],
      temperature: [20, 32],
      humidity: [60, 80],
      ph: [6.0, 7.0],
      rainfall: [400, 800],
    },
    notes: 'Nitrogen-fixing legume improves soil fertility; good for rotation.',
  },
  {
    key: 'groundnut',
    name: 'Groundnut',
    season: 'Kharif / Summer',
    waterRequirement: 'Low–Medium (300–500 mm)',
    growingPeriod: '100–130 days',
    expectedYield: '1.0–2.0 t/ha',
    ideal: {
      nitrogen: [20, 50],
      phosphorus: [30, 60],
      potassium: [30, 60],
      temperature: [22, 32],
      humidity: [50, 70],
      ph: [5.5, 7.0],
      rainfall: [300, 600],
    },
    notes: 'Drought-tolerant oilseed; thrives in sandy loam soils.',
  },
  {
    key: 'mustard',
    name: 'Mustard',
    season: 'Rabi',
    waterRequirement: 'Low (250–400 mm)',
    growingPeriod: '110–140 days',
    expectedYield: '1.0–1.8 t/ha',
    ideal: {
      nitrogen: [50, 90],
      phosphorus: [30, 50],
      potassium: [30, 60],
      temperature: [15, 25],
      humidity: [40, 60],
      ph: [6.0, 7.5],
      rainfall: [200, 500],
    },
    notes: 'Cool-season oilseed; tolerates light frost and dry conditions.',
  },
  {
    key: 'tomato',
    name: 'Tomato',
    season: 'Year-round (Rabi preferred)',
    waterRequirement: 'Medium (500–700 mm)',
    growingPeriod: '90–120 days',
    expectedYield: '25–40 t/ha',
    ideal: {
      nitrogen: [80, 130],
      phosphorus: [40, 70],
      potassium: [60, 120],
      temperature: [18, 30],
      humidity: [55, 70],
      ph: [6.0, 6.8],
      rainfall: [400, 700],
    },
    notes: 'High-value vegetable; sensitive to extreme heat and waterlogging.',
  },
  {
    key: 'millet',
    name: 'Millet (Bajra)',
    season: 'Kharif',
    waterRequirement: 'Low (300–500 mm)',
    growingPeriod: '70–90 days',
    expectedYield: '1.0–2.0 t/ha',
    ideal: {
      nitrogen: [30, 70],
      phosphorus: [20, 45],
      potassium: [25, 50],
      temperature: [25, 38],
      humidity: [30, 55],
      ph: [6.0, 7.5],
      rainfall: [200, 500],
    },
    notes: 'Highly drought-tolerant; ideal for arid and semi-arid regions.',
  },
  {
    key: 'rice',
    name: 'Rice',
    season: 'Kharif (Monsoon)',
    waterRequirement: 'High (1200–1500 mm)',
    growingPeriod: '110–150 days',
    expectedYield: '2.5–4.5 t/ha',
    ideal: {
      nitrogen: [60.0, 98.0],
      phosphorus: [35.0, 59.0],
      potassium: [35.0, 45.0],
      temperature: [20.3, 26.7],
      humidity: [80.3, 84.6],
      ph: [5.1, 7.6],
      rainfall: [900, 1700],
    },
    notes: 'Thrives in flooded or waterlogged conditions with warm humid climate.',
  },
  {
    key: 'maize',
    name: 'Maize',
    season: 'Kharif/Rabi (dual season)',
    waterRequirement: 'Medium (500–800 mm)',
    growingPeriod: '90–120 days',
    expectedYield: '2.5–6.0 t/ha',
    ideal: {
      nitrogen: [61.0, 99.0],
      phosphorus: [35.0, 60.0],
      potassium: [15.0, 25.0],
      temperature: [18.3, 26.0],
      humidity: [56.5, 73.6],
      ph: [5.6, 6.9],
      rainfall: [500, 800],
    },
    notes: 'Versatile cereal; needs well-drained soil and warm days for grain filling.',
  },
  {
    key: 'cotton',
    name: 'Cotton',
    season: 'Kharif',
    waterRequirement: 'Medium (600–1200 mm)',
    growingPeriod: '150–180 days',
    expectedYield: '1.5–2.5 t/ha (seed cotton)',
    ideal: {
      nitrogen: [101.0, 136.0],
      phosphorus: [36.0, 60.0],
      potassium: [15.0, 25.0],
      temperature: [22.1, 25.7],
      humidity: [75.6, 84.6],
      ph: [6.0, 7.9],
      rainfall: [600, 1100],
    },
    notes: 'Deep-rooted; sensitive to waterlogging, prefers black or well-drained loamy soils.',
  },
  {
    key: 'banana',
    name: 'Banana',
    season: 'Year-round',
    waterRequirement: 'High (1200–2000 mm)',
    growingPeriod: '11–16 months',
    expectedYield: '40–60 t/ha',
    ideal: {
      nitrogen: [82.0, 117.0],
      phosphorus: [71.0, 94.0],
      potassium: [45.0, 55.0],
      temperature: [25.1, 29.4],
      humidity: [76.1, 84.5],
      ph: [5.6, 6.4],
      rainfall: [1000, 2000],
    },
    notes: 'Heavy potassium feeder; requires warm humid climate and irrigation.',
  },
  {
    key: 'chickpea',
    name: 'Chickpea (Gram)',
    season: 'Rabi',
    waterRequirement: 'Low (250–400 mm)',
    growingPeriod: '95–115 days',
    expectedYield: '1.0–1.8 t/ha',
    ideal: {
      nitrogen: [22.0, 59.0],
      phosphorus: [56.0, 79.0],
      potassium: [75.0, 85.0],
      temperature: [17.2, 20.7],
      humidity: [14.4, 19.7],
      ph: [6.2, 8.7],
      rainfall: [200, 500],
    },
    notes: 'Cool-season legume; nitrogen-fixing and drought-tolerant.',
  },
  {
    key: 'pigeonpeas',
    name: 'Pigeon Pea (Tur/Arhar)',
    season: 'Kharif',
    waterRequirement: 'Low–Medium (600–650 mm)',
    growingPeriod: '150–180 days',
    expectedYield: '0.8–1.5 t/ha',
    ideal: {
      nitrogen: [3.0, 39.0],
      phosphorus: [56.0, 77.0],
      potassium: [16.0, 25.0],
      temperature: [19.0, 36.2],
      humidity: [32.5, 66.7],
      ph: [4.7, 7.2],
      rainfall: [600, 1000],
    },
    notes: 'Deep-rooted, drought-hardy legume; commonly intercropped with cereals.',
  },
  {
    key: 'mungbean',
    name: 'Green Gram (Mung Bean)',
    season: 'Kharif/summer',
    waterRequirement: 'Low (350–500 mm)',
    growingPeriod: '60–75 days',
    expectedYield: '0.6–1.0 t/ha',
    ideal: {
      nitrogen: [2.0, 37.0],
      phosphorus: [36.0, 59.0],
      potassium: [15.0, 25.0],
      temperature: [27.1, 29.9],
      humidity: [80.4, 89.7],
      ph: [6.3, 7.2],
      rainfall: [350, 600],
    },
    notes: 'Short-duration pulse; fits well between two main crops in rotation.',
  },
  {
    key: 'blackgram',
    name: 'Black Gram (Urad)',
    season: 'Kharif/Rabi',
    waterRequirement: 'Low (350–500 mm)',
    growingPeriod: '70–90 days',
    expectedYield: '0.6–1.0 t/ha',
    ideal: {
      nitrogen: [20.9, 58.0],
      phosphorus: [57.0, 79.0],
      potassium: [15.0, 25.0],
      temperature: [25.7, 34.1],
      humidity: [60.4, 69.1],
      ph: [6.5, 7.7],
      rainfall: [350, 600],
    },
    notes: 'Short-duration pulse suited to residual soil moisture after rice.',
  },
  {
    key: 'lentil',
    name: 'Lentil (Masoor)',
    season: 'Rabi',
    waterRequirement: 'Low (300–400 mm)',
    growingPeriod: '100–120 days',
    expectedYield: '0.8–1.2 t/ha',
    ideal: {
      nitrogen: [2.0, 38.0],
      phosphorus: [57.0, 79.0],
      potassium: [15.0, 24.0],
      temperature: [18.4, 29.2],
      humidity: [60.5, 69.4],
      ph: [6.1, 7.7],
      rainfall: [300, 500],
    },
    notes: 'Cool-season pulse; grown mostly on conserved soil moisture.',
  },
  {
    key: 'kidneybeans',
    name: 'Kidney Beans (Rajma)',
    season: 'Kharif (hills)/Rabi',
    waterRequirement: 'Medium (400–600 mm)',
    growingPeriod: '90–120 days',
    expectedYield: '1.2–2.0 t/ha',
    ideal: {
      nitrogen: [3.0, 37.0],
      phosphorus: [56.0, 80.0],
      potassium: [15.0, 25.0],
      temperature: [15.8, 24.3],
      humidity: [18.3, 24.9],
      ph: [5.5, 6.0],
      rainfall: [400, 700],
    },
    notes: 'Prefers cooler climates; common in hill and Rabi cultivation.',
  },
  {
    key: 'mothbeans',
    name: 'Moth Bean',
    season: 'Kharif',
    waterRequirement: 'Very Low (250–400 mm)',
    growingPeriod: '65–90 days',
    expectedYield: '0.4–0.8 t/ha',
    ideal: {
      nitrogen: [3.0, 39.0],
      phosphorus: [36.0, 59.0],
      potassium: [15.0, 25.0],
      temperature: [24.5, 31.2],
      humidity: [41.8, 63.1],
      ph: [3.7, 9.4],
      rainfall: [200, 500],
    },
    notes: 'Extremely drought-tolerant pulse suited to arid, sandy soils.',
  },
  {
    key: 'coconut',
    name: 'Coconut',
    season: 'Year-round (perennial)',
    waterRequirement: 'High (1500–2300 mm)',
    growingPeriod: 'Perennial (bearing from 5–7 yrs)',
    expectedYield: '80–120 nuts/palm/yr',
    ideal: {
      nitrogen: [1.0, 39.0],
      phosphorus: [6.0, 30.0],
      potassium: [26.0, 35.0],
      temperature: [25.1, 29.5],
      humidity: [91.0, 99.6],
      ph: [5.6, 6.4],
      rainfall: [1300, 2300],
    },
    notes: 'Tropical coastal-climate perennial; needs well-drained sandy/loamy soil.',
  },
  {
    key: 'papaya',
    name: 'Papaya',
    season: 'Year-round',
    waterRequirement: 'Medium–High (1200–1500 mm)',
    growingPeriod: '9–12 months to first harvest',
    expectedYield: '40–60 t/ha',
    ideal: {
      nitrogen: [32.0, 69.0],
      phosphorus: [47.0, 68.0],
      potassium: [45.0, 55.0],
      temperature: [23.7, 42.9],
      humidity: [90.2, 94.6],
      ph: [6.5, 7.0],
      rainfall: [1000, 1800],
    },
    notes: 'Fast-growing fruit crop; very sensitive to waterlogging, needs good drainage.',
  },
  {
    key: 'mango',
    name: 'Mango',
    season: 'Year-round (perennial)',
    waterRequirement: 'Medium (750–1200 mm)',
    growingPeriod: 'Perennial (bearing from 4–6 yrs)',
    expectedYield: '8–15 t/ha (mature orchard)',
    ideal: {
      nitrogen: [1.0, 39.0],
      phosphorus: [16.0, 38.0],
      potassium: [25.0, 35.0],
      temperature: [27.4, 35.5],
      humidity: [45.6, 54.4],
      ph: [4.7, 6.8],
      rainfall: [750, 1500],
    },
    notes: 'Deep, well-drained soil preferred; needs a distinct dry spell before flowering.',
  },
  {
    key: 'grapes',
    name: 'Grapes',
    season: 'Year-round (perennial, pruned cycles)',
    waterRequirement: 'Medium (500–800 mm, often irrigated)',
    growingPeriod: 'Perennial (2 crops/yr with pruning)',
    expectedYield: '15–25 t/ha',
    ideal: {
      nitrogen: [4.0, 39.0],
      phosphorus: [120.0, 144.0],
      potassium: [195.0, 205.0],
      temperature: [9.9, 40.7],
      humidity: [80.1, 83.7],
      ph: [5.6, 6.5],
      rainfall: [500, 900],
    },
    notes: 'Prefers dry climate with irrigation; sensitive to humidity-driven fungal disease.',
  },
  {
    key: 'watermelon',
    name: 'Watermelon',
    season: 'Summer/Zaid',
    waterRequirement: 'Medium (400–600 mm)',
    growingPeriod: '80–100 days',
    expectedYield: '20–35 t/ha',
    ideal: {
      nitrogen: [81.0, 119.0],
      phosphorus: [6.0, 29.0],
      potassium: [45.0, 55.0],
      temperature: [24.3, 26.8],
      humidity: [80.5, 89.6],
      ph: [6.1, 6.9],
      rainfall: [350, 650],
    },
    notes: 'Warm-season vine crop; needs sandy loam with good drainage.',
  },
  {
    key: 'muskmelon',
    name: 'Muskmelon',
    season: 'Summer/Zaid',
    waterRequirement: 'Medium (350–500 mm)',
    growingPeriod: '80–100 days',
    expectedYield: '15–25 t/ha',
    ideal: {
      nitrogen: [82.0, 118.0],
      phosphorus: [6.0, 28.0],
      potassium: [45.0, 55.0],
      temperature: [27.1, 29.9],
      humidity: [90.3, 94.8],
      ph: [6.0, 6.7],
      rainfall: [300, 550],
    },
    notes: 'Warm, dry climate preferred; vulnerable to fruit rot in excess humidity.',
  },
  {
    key: 'apple',
    name: 'Apple',
    season: 'Temperate (hill regions)',
    waterRequirement: 'Medium (1000–1250 mm)',
    growingPeriod: 'Perennial (bearing from 4–5 yrs)',
    expectedYield: '10–20 t/ha (mature orchard)',
    ideal: {
      nitrogen: [2.0, 37.0],
      phosphorus: [121.0, 144.0],
      potassium: [195.0, 205.0],
      temperature: [21.2, 23.8],
      humidity: [90.2, 94.7],
      ph: [5.6, 6.4],
      rainfall: [1000, 1300],
    },
    notes: 'Needs winter chilling; grown mainly in hill regions like Himachal Pradesh/Kashmir.',
  },
  {
    key: 'orange',
    name: 'Orange (Citrus)',
    season: 'Year-round (perennial)',
    waterRequirement: 'Medium (1000–1200 mm)',
    growingPeriod: 'Perennial (bearing from 3–5 yrs)',
    expectedYield: '10–20 t/ha',
    ideal: {
      nitrogen: [1.0, 39.0],
      phosphorus: [6.0, 29.0],
      potassium: [5.0, 15.0],
      temperature: [11.0, 34.1],
      humidity: [90.2, 94.6],
      ph: [6.1, 7.9],
      rainfall: [900, 1300],
    },
    notes: 'Well-drained soil essential; sensitive to waterlogging and salinity.',
  },
  {
    key: 'pomegranate',
    name: 'Pomegranate',
    season: 'Year-round (perennial)',
    waterRequirement: 'Low–Medium (500–800 mm)',
    growingPeriod: 'Perennial (bearing from 2–3 yrs)',
    expectedYield: '10–18 t/ha',
    ideal: {
      nitrogen: [2.0, 40.0],
      phosphorus: [6.0, 29.0],
      potassium: [36.0, 45.0],
      temperature: [18.4, 24.8],
      humidity: [85.6, 94.6],
      ph: [5.7, 7.1],
      rainfall: [500, 900],
    },
    notes: 'Hardy, drought-tolerant fruit crop; performs well in semi-arid climates.',
  },
  {
    key: 'coffee',
    name: 'Coffee',
    season: 'Year-round (perennial)',
    waterRequirement: 'Medium–High (1500–2000 mm)',
    growingPeriod: 'Perennial (bearing from 3–4 yrs)',
    expectedYield: '0.8–1.5 t/ha (clean coffee)',
    ideal: {
      nitrogen: [82.0, 118.0],
      phosphorus: [16.9, 40.0],
      potassium: [25.0, 35.0],
      temperature: [23.2, 27.6],
      humidity: [51.1, 68.5],
      ph: [6.1, 7.5],
      rainfall: [1200, 2000],
    },
    notes: 'Shade-grown perennial; needs cool hill climate and well-distributed rainfall.',
  },
  {
    key: 'jute',
    name: 'Jute',
    season: 'Kharif',
    waterRequirement: 'High (1200–1500 mm)',
    growingPeriod: '100–120 days',
    expectedYield: '2.0–2.8 t/ha (fibre)',
    ideal: {
      nitrogen: [61.0, 96.1],
      phosphorus: [37.0, 58.0],
      potassium: [35.0, 45.0],
      temperature: [23.2, 26.8],
      humidity: [71.3, 88.4],
      ph: [6.1, 7.4],
      rainfall: [1000, 2000],
    },
    notes: 'Needs warm humid climate with high rainfall; grown mainly in riverine alluvial soil.',
  },

];

function suitabilityScore(input: CropInput, ideal: CropProfile['ideal']): number {
  const fields: (keyof typeof ideal)[] = [
    'nitrogen',
    'phosphorus',
    'potassium',
    'temperature',
    'humidity',
    'ph',
    'rainfall',
  ];

  let total = 0;
  for (const f of fields) {
    const [min, max] = ideal[f];
    const val = input[f];
    if (val >= min && val <= max) {
      total += 1;
    } else {
      const range = max - min;
      const dist = val < min ? min - val : val - max;
      const penalty = Math.min(1, dist / (range * 1.5));
      total += Math.max(0, 1 - penalty);
    }
  }
  return total / fields.length;
}

export function recommendCrops(input: CropInput): CropResult[] {
  const scored = CROP_PROFILES.map((crop) => {
    const score = suitabilityScore(input, crop.ideal);
    return { crop, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 5).map(({ crop, score }) => {
    const pct = Math.round(score * 100);
    const confidence = pct >= 80 ? 'High' : pct >= 60 ? 'Moderate' : 'Low';
    return {
      key: crop.key,
      name: crop.name,
      score: pct,
      confidence,
      reason: crop.notes,
      season: crop.season,
      waterRequirement: crop.waterRequirement,
      growingPeriod: crop.growingPeriod,
      expectedYield: crop.expectedYield,
    };
  });
}
