import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Profile = {
  id: string;
  full_name: string;
  farm_name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  farm_size_acres: number | null;
  language: string;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export type CropRecommendation = {
  id: string;
  user_id: string;
  inputs: Record<string, unknown>;
  results: CropResult[];
  created_at: string;
};

export type CropResult = {
  key?: string;
  name: string;
  score: number;
  confidence: string;
  reason: string;
  season: string;
  waterRequirement: string;
  growingPeriod: string;
  expectedYield: string;
};

export type LatLng = { lat: number; lng: number };

export type FarmBoundary = {
  id: string;
  user_id: string;
  boundary: LatLng[];
  center_latitude: number | null;
  center_longitude: number | null;
  area_acres: number | null;
  area_hectares: number | null;
  created_at: string;
  updated_at: string;
};
