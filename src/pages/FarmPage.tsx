import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase, type LatLng } from '../lib/supabase';
import { t } from '../lib/i18n';
import FarmMap from '../components/FarmMap';
import {
  getCurrentPosition, GpsError, loadFarmBoundary, saveFarmBoundary, describeSupabaseError,
  centroidOf, polygonAreaSquareMeters, squareMetersToAcres, squareMetersToHectares,
} from '../lib/farm';
import {
  MapPin, Navigation, PenLine, Eraser, Save, Loader2, CheckCircle2, AlertCircle, Ruler,
} from 'lucide-react';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export default function FarmPage() {
  const { user, profile, refreshProfile, language } = useAuth();
  const tr = t(language);

  const [point, setPoint] = useState<LatLng | null>(null);
  const [boundary, setBoundary] = useState<LatLng[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const saving = saveStatus === 'saving';

  useEffect(() => {
    async function loadInitial() {
      if (!user) return;
      try {
        const existing = await loadFarmBoundary(user.id);
        if (existing) {
          setBoundary(existing.boundary ?? []);
          if (existing.center_latitude != null && existing.center_longitude != null) {
            setPoint({ lat: existing.center_latitude, lng: existing.center_longitude });
          }
        } else if (profile?.latitude != null && profile?.longitude != null) {
          setPoint({ lat: profile.latitude, lng: profile.longitude });
        }
      } catch (e) {
        // Non-fatal — the farmer can still set a location fresh — but log
        // it so a real problem (missing table, RLS, etc.) isn't invisible.
        describeSupabaseError('Load farm on page open', e);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const areaSqMeters = useMemo(() => polygonAreaSquareMeters(boundary), [boundary]);
  const areaAcres = squareMetersToAcres(areaSqMeters);
  const areaHectares = squareMetersToHectares(areaSqMeters);
  const hasValidBoundary = boundary.length >= 3;

  async function useMyLocation() {
    setError(null);
    if (!navigator.onLine) {
      setError(tr.noInternet);
      return;
    }
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      setPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setSaveStatus('idle');
    } catch (e) {
      if (e instanceof GpsError) {
        setError(
          e.kind === 'denied' ? tr.gpsDenied :
          e.kind === 'timeout' ? tr.gpsTimeout :
          e.kind === 'unsupported' ? tr.gpsUnsupported :
          tr.gpsUnavailable
        );
      } else {
        setError(tr.gpsUnavailable);
      }
    } finally {
      setLocating(false);
    }
  }

  function toggleDrawing() {
    setError(null);
    setDrawing((d) => !d);
  }

  function handleBoundaryChange(next: LatLng[]) {
    setBoundary(next);
    setSaveStatus('idle');
  }

  function handleClearBoundary() {
    setError(null);
    setBoundary([]);
    setDrawing(false);
    setSaveStatus('idle');
  }

  async function saveFarm() {
    if (saving) return; // guard against double-submit
    setError(null);
    if (!user) {
      setError(tr.pleaseSignIn);
      return;
    }
    if (boundary.length > 0 && boundary.length < 3) {
      setError(tr.invalidBoundary);
      return;
    }
    if (!point && boundary.length === 0) {
      setError(tr.noLocationSet);
      return;
    }
    if (!navigator.onLine) {
      setError(tr.noInternet);
      return;
    }

    setSaveStatus('saving');
    try {
      const centroid = hasValidBoundary ? centroidOf(boundary) : point;
      const savedRow = await saveFarmBoundary({
        userId: user.id,
        boundary,
        centerLatitude: centroid?.lat ?? null,
        centerLongitude: centroid?.lng ?? null,
        areaAcres: hasValidBoundary ? areaAcres : null,
        areaHectares: hasValidBoundary ? areaHectares : null,
      });

      const profileUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (centroid) {
        profileUpdate.latitude = centroid.lat;
        profileUpdate.longitude = centroid.lng;
      }
      if (hasValidBoundary) {
        profileUpdate.farm_size_acres = Number(areaAcres.toFixed(2));
      }
      const { error: profileError } = await supabase.from('profiles').update(profileUpdate).eq('id', user.id);
      if (profileError) {
  describeSupabaseError('Update profile location after farm save', profileError);
  throw profileError;
}
      await refreshProfile();

      if (savedRow.center_latitude != null && savedRow.center_longitude != null) {
        setPoint({ lat: savedRow.center_latitude, lng: savedRow.center_longitude });
      }
      setDrawing(false);
      setSaveStatus('success');
    } catch (e) {
      const described = describeSupabaseError('Save farm', e);
      setSaveStatus('error');
      const tableMissing =
        described.code === 'PGRST205' ||
        /could not find the table/i.test(described.message) ||
        /schema cache/i.test(described.message);
      // Show the real reason, not just a generic message — a missing table,
      // an RLS denial, and a network drop all need different fixes.
      setError(
        tableMissing
          ? `${tr.tableMissingError} (${described.message})`
          : described.code
          ? `${tr.saveFailure} (${described.code}: ${described.message})`
          : `${tr.saveFailure} ${described.message ? `(${described.message})` : ''}`
      );
    }
  }

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">{tr.myFarm}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{tr.myFarmSubtitle}</p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700 ring-1 ring-error-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {loadingInitial ? (
            <div className="flex h-[320px] items-center justify-center rounded-2xl border border-gray-200 text-gray-400 sm:h-[420px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <FarmMap point={point} boundary={boundary} drawing={drawing} onBoundaryChange={handleBoundaryChange} />
          )}
          {drawing && (
            <p className="mt-2 text-center text-xs text-gray-500">{tr.tapMapToDraw}</p>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-gray-900">
              <MapPin className="h-4 w-4 text-primary-600" /> {tr.farmLocationLabel}
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">{tr.latitude}</span>
                <span className="font-medium text-gray-900">{point ? point.lat.toFixed(6) : tr.notSet}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500">{tr.longitude}</span>
                <span className="font-medium text-gray-900">{point ? point.lng.toFixed(6) : tr.notSet}</span>
              </div>
            </div>
            <button onClick={useMyLocation} disabled={locating} className="btn-primary mt-4 w-full">
              {locating ? <><Loader2 className="h-4 w-4 animate-spin" /> {tr.locatingLoading}</> : <><Navigation className="h-4 w-4" /> {tr.setCurrentLocation}</>}
            </button>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-gray-900">
              <Ruler className="h-4 w-4 text-primary-600" /> {tr.calculatedArea}
            </h2>
            {hasValidBoundary ? (
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold text-gray-900">{areaAcres.toFixed(2)}</span>
                <span className="text-sm text-gray-500">{tr.acres}</span>
                <span className="text-sm text-gray-300">·</span>
                <span className="text-sm text-gray-500">{areaHectares.toFixed(2)} {tr.hectares}</span>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {boundary.length > 0 ? tr.needMorePoints : tr.noBoundaryYet}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button onClick={toggleDrawing} className={drawing ? 'btn-secondary flex-1' : 'btn-primary flex-1'}>
                <PenLine className="h-4 w-4" /> {drawing ? tr.stopDrawing : tr.drawFarmBoundary}
              </button>
              <button onClick={handleClearBoundary} className="btn-secondary" disabled={boundary.length === 0}>
                <Eraser className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button onClick={saveFarm} disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? tr.savingFarm : tr.saveFarm}
          </button>
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700">
              <CheckCircle2 className="h-4 w-4" /> {tr.farmBoundarySaved}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
