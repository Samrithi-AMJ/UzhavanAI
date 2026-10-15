import { supabase, type FarmBoundary, type LatLng } from './supabase';

export type GpsErrorKind = 'denied' | 'unavailable' | 'timeout' | 'unsupported';

export class GpsError extends Error {
  kind: GpsErrorKind;
  constructor(kind: GpsErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

/**
 * Supabase/PostgREST errors carry message/code/details/hint. Network errors
 * (offline, DNS, CORS) are plain Errors/TypeErrors with just a message.
 * This normalizes both into one shape and — critically — always logs the
 * full original error to the console so a failure is never silently lost.
 */
export type DescribedError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function describeSupabaseError(context: string, error: unknown): DescribedError {
  const e = error as { message?: string; code?: string; details?: string; hint?: string } | null;
  const described: DescribedError = {
    message: e?.message || (error instanceof Error ? error.message : 'Unknown error'),
    code: e?.code,
    details: e?.details,
    hint: e?.hint,
  };
  console.error(`[UzhavanAI] ${context} failed:`, {
    message: described.message,
    code: described.code,
    details: described.details,
    hint: described.hint,
    raw: error,
  });
  return described;
}

/**
 * Request the browser's current GPS position.
 * Rejects with a GpsError carrying a machine-readable `kind` so the UI
 * can show a translated, user-friendly message instead of a raw error.
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new GpsError('unsupported', 'Geolocation is not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new GpsError('denied', 'GPS permission denied.'));
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          reject(new GpsError('unavailable', 'GPS position unavailable.'));
        } else {
          reject(new GpsError('timeout', 'GPS request timed out.'));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

const EARTH_RADIUS_M = 6371000;

/**
 * Approximate the centroid of a polygon as the plain average of its points.
 * Good enough for a single farm field (a few hundred metres across at most).
 */
export function centroidOf(points: LatLng[]): LatLng | null {
  if (points.length === 0) return null;
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

/**
 * Calculate the approximate area (in square metres) of a lat/lng polygon
 * using an equirectangular projection centred on the polygon, then the
 * standard shoelace formula. Accurate enough for farm-field-sized plots.
 */
export function polygonAreaSquareMeters(points: LatLng[]): number {
  if (points.length < 3) return 0;

  const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const latRad = (avgLat * Math.PI) / 180;

  const projected = points.map((p) => ({
    x: p.lng * (Math.PI / 180) * EARTH_RADIUS_M * Math.cos(latRad),
    y: p.lat * (Math.PI / 180) * EARTH_RADIUS_M,
  }));

  let area = 0;
  for (let i = 0; i < projected.length; i++) {
    const j = (i + 1) % projected.length;
    area += projected[i].x * projected[j].y;
    area -= projected[j].x * projected[i].y;
  }
  return Math.abs(area) / 2;
}

export function squareMetersToAcres(sqm: number): number {
  return sqm / 4046.8564224;
}

export function squareMetersToHectares(sqm: number): number {
  return sqm / 10000;
}

export async function loadFarmBoundary(userId: string): Promise<FarmBoundary | null> {
  const { data, error } = await supabase
    .from('farm_boundaries')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    describeSupabaseError('Load farm boundary', error);
    throw error;
  }
  return (data as FarmBoundary) ?? null;
}

export async function saveFarmBoundary(params: {
  userId: string;
  boundary: LatLng[];
  centerLatitude: number | null;
  centerLongitude: number | null;
  areaAcres: number | null;
  areaHectares: number | null;
}): Promise<FarmBoundary> {
  const { data, error } = await supabase
    .from('farm_boundaries')
    .upsert(
      {
        user_id: params.userId,
        boundary: params.boundary,
        center_latitude: params.centerLatitude,
        center_longitude: params.centerLongitude,
        area_acres: params.areaAcres,
        area_hectares: params.areaHectares,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single();
  if (error) {
    describeSupabaseError('Save farm boundary', error);
    throw error;
  }
  return data as FarmBoundary;
}

export async function clearFarmBoundary(userId: string): Promise<void> {
  const { error } = await supabase.from('farm_boundaries').delete().eq('user_id', userId);
  if (error) {
    describeSupabaseError('Clear farm boundary', error);
    throw error;
  }
}
