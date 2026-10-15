import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth';
import { t } from '../lib/i18n';
import { supabase, type CropRecommendation as SavedRec } from '../lib/supabase';
import { recommendCrops, type CropInput, type CropResult } from '../lib/cropEngine';
import { translateCropResults } from '../lib/cropTranslations';
import { fetchWeather } from '../lib/weather';
import {
  Wheat, Loader2, Save, Sparkles, Droplets, Calendar, TrendingUp,
  History, Trash2, Beaker, Leaf, ChevronRight, CloudSun, X, Printer, CheckCircle2,
} from 'lucide-react';

const DEFAULT_INPUT: CropInput = {
  nitrogen: 90,
  phosphorus: 42,
  potassium: 43,
  temperature: 25,
  humidity: 65,
  ph: 6.5,
  rainfall: 800,
};

const LOCAL_STORAGE_KEY = 'uzhavan-saved-crop-reports';

function getLocalReports(): SavedRec[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReport(report: SavedRec) {
  try {
    const current = getLocalReports();
    const updated = [report, ...current.filter((r) => r.id !== report.id)].slice(0, 15);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota
  }
}

function deleteLocalReport(id: string) {
  try {
    const current = getLocalReports();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current.filter((r) => r.id !== id)));
  } catch {
    // Ignore
  }
}

function safeParseArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }
  return [];
}

export default function CropAdvisorPage() {
  const { user, profile, language } = useAuth();
  const tr = t(language);
  const [input, setInput] = useState<CropInput>(DEFAULT_INPUT);
  const [fromWeather, setFromWeather] = useState<{ temperature: boolean; humidity: boolean; rainfall: boolean }>({
    temperature: false, humidity: false, rainfall: false,
  });
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [results, setResults] = useState<CropResult[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [history, setHistory] = useState<SavedRec[]>([]);
  const [selectedReport, setSelectedReport] = useState<SavedRec | null>(null);
  const [loadedBanner, setLoadedBanner] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    const local = getLocalReports();
    if (local.length > 0) {
      setHistory(local);
    }

    Promise.resolve(
      supabase
        .from('crop_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
    )
      .then(({ data, error }) => {
        if (!error && Array.isArray(data) && data.length > 0) {
          const merged = [...(data as SavedRec[]), ...local.filter((l) => !data.some((d) => d.id === l.id))];
          setHistory(merged);
        } else if (local.length > 0) {
          setHistory(local);
        }
      })
      .catch(() => {
        setHistory(local);
      });
  }, [user]);

  async function useFarmWeatherData() {
    if (!profile?.latitude || !profile?.longitude) return;
    setLoadingWeather(true);
    try {
      const w = await fetchWeather(profile.latitude, profile.longitude);
      const totalForecastRain = w.forecast.reduce((sum, d) => sum + d.precipitation, 0);
      const averageDailyRain = totalForecastRain / Math.max(w.forecast.length, 1);
      // Convert the 7-day forecast into a more realistic local monthly/seasonal estimate.
      // Multiplying a 7-day total by 52 overstates rainfall by treating a short sample as a full year.
      const rainfallEstimate = Math.max(0, Math.round(averageDailyRain * 30));
      setInput((prev) => ({
        ...prev,
        temperature: Math.round(w.current.temperature),
        humidity: Math.round(w.current.humidity),
        rainfall: rainfallEstimate,
      }));
      setFromWeather({ temperature: true, humidity: true, rainfall: true });
    } catch {
      // Silently keep manual values — the button simply has no effect if weather can't be fetched.
    } finally {
      setLoadingWeather(false);
    }
  }

  function setManual(field: keyof CropInput, value: number) {
    setInput((prev) => ({ ...prev, [field]: value }));
    if (field === 'temperature' || field === 'humidity' || field === 'rainfall') {
      setFromWeather((prev) => ({ ...prev, [field]: false }));
    }
  }

  function analyze() {
    setAnalyzing(true);
    setSaved(false);
    setTimeout(() => {
      const recs = recommendCrops(input);
      setResults(recs);
      setAnalyzing(false);
    }, 800);
  }

  async function saveResults() {
    if (!user || !results) return;
    if (savingRef.current) return; // synchronous re-entrancy guard
    savingRef.current = true;
    setSaving(true);
    setSaveError(false);

    const newId = `rec-${Date.now()}`;
    const newReport: SavedRec = {
      id: newId,
      user_id: user.id,
      inputs: input as unknown as Record<string, unknown>,
      results: results as unknown as CropResult[],
      created_at: new Date().toISOString(),
    };

    // Always preserve locally so reports never fail to save or open
    saveLocalReport(newReport);
    setHistory((prev) => [newReport, ...prev.filter((r) => r.id !== newId)]);

    try {
      const { data } = await supabase.from('crop_recommendations').insert({
        inputs: input as unknown as Record<string, unknown>,
        results: results as unknown as never,
      }).select().maybeSingle();

      if (data && (data as SavedRec).id) {
        deleteLocalReport(newId);
        saveLocalReport(data as SavedRec);
        setHistory((prev) => [(data as SavedRec), ...prev.filter((r) => r.id !== newId)]);
      }
    } catch (err) {
      console.warn('[UzhavanAI] Supabase insert failed, preserved locally:', err);
    } finally {
      setSaving(false);
      savingRef.current = false;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  async function deleteHistory(id: string) {
    if (typeof window !== 'undefined' && !window.confirm(tr.confirmDelete)) return;
    deleteLocalReport(id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
    if (selectedReport?.id === id) {
      setSelectedReport(null);
    }
    try {
      const { error } = await supabase.from('crop_recommendations').delete().eq('id', id);
      if (error) {
        setDeleteError(tr.deleteFailedGeneric);
        setTimeout(() => setDeleteError(null), 4000);
      }
    } catch {
      // Ignored
    }
  }

  function openReportModal(rec: SavedRec) {
    setSelectedReport(rec);
  }

  function applyReportToCalculator(rec: SavedRec) {
    const rawInputs = rec.inputs;
    const safeInputs = typeof rawInputs === 'string' ? JSON.parse(rawInputs) : rawInputs;
    const rawResults = rec.results;
    const safeResults = safeParseArray<CropResult>(rawResults);

    if (safeInputs) {
      setInput(safeInputs as CropInput);
    }
    if (safeResults && safeResults.length > 0) {
      setResults(safeResults);
      const topCrop = translateCropResults([safeResults[0]], language)[0];
      setLoadedBanner(topCrop?.name ?? '');
    }

    setSelectedReport(null);

    // Smooth scroll up to the results section so the user clearly sees the opened report!
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  const displayedResults = results ? translateCropResults(results, language) : null;

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">{tr.cropAdvisor}</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {tr.soilClimate} — {tr.getRecommendations}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input form */}
        <div className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-primary-600" />
              <h2 className="font-display text-lg font-semibold text-gray-900">{tr.soilClimate}</h2>
            </div>
            {profile?.latitude && profile?.longitude && (
              <button
                onClick={useFarmWeatherData}
                disabled={loadingWeather}
                className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                {loadingWeather ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudSun className="h-3.5 w-3.5" />}
                {tr.useFarmWeatherData}
              </button>
            )}
          </div>

          <div className="space-y-4">
            <SliderInput label={tr.nitrogenLabel} unit="kg/ha" value={input.nitrogen} min={0} max={200} step={5}
              onChange={(v) => setManual('nitrogen', v)} color="primary" />
            <SliderInput label={tr.phosphorusLabel} unit="kg/ha" value={input.phosphorus} min={0} max={150} step={2}
              onChange={(v) => setManual('phosphorus', v)} color="secondary" />
            <SliderInput label={tr.potassiumLabel} unit="kg/ha" value={input.potassium} min={0} max={200} step={5}
              onChange={(v) => setManual('potassium', v)} color="accent" />
            <SliderInput label={tr.temperatureLabel} unit="°C" value={input.temperature} min={0} max={45} step={1}
              onChange={(v) => setManual('temperature', v)} color="warning" badge={fromWeather.temperature ? tr.fromWeatherData : tr.manualEntry} />
            <SliderInput label={tr.humidityLabel} unit="%" value={input.humidity} min={0} max={100} step={1}
              onChange={(v) => setManual('humidity', v)} color="primary" badge={fromWeather.humidity ? tr.fromWeatherData : tr.manualEntry} />
            <SliderInput label={tr.phLabel} unit="" value={input.ph} min={3} max={10} step={0.1}
              onChange={(v) => setManual('ph', v)} color="secondary" />
            <SliderInput label={tr.rainfallLabel} unit="mm" value={input.rainfall} min={0} max={3000} step={50}
              onChange={(v) => setManual('rainfall', v)} color="primary" badge={fromWeather.rainfall ? tr.fromWeatherData : tr.manualEntry} />
          </div>

          <button onClick={analyze} disabled={analyzing} className="btn-primary mt-6 w-full">
            {analyzing ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> {tr.analyzing}</>
            ) : (
              <><Sparkles className="h-5 w-5" /> {tr.getRecommendations}</>
            )}
          </button>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="lg:col-span-3">
          {loadedBanner && (
            <div className="mb-4 flex items-center justify-between rounded-xl bg-primary-50 p-3.5 border border-primary-200 text-sm text-primary-900 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-primary-600 flex-shrink-0" />
                <span>
                  {language === 'ta' ? `சேமித்த அறிக்கை ஏற்றப்பட்டது (${loadedBanner})` :
                   language === 'hi' ? `सहेजी गई रिपोर्ट लोड की गई (${loadedBanner})` :
                   `Loaded Saved Report (${loadedBanner})`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLoadedBanner(null)}
                className="text-primary-700 hover:text-primary-900 text-xs font-semibold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>
          )}

          {displayedResults ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-gray-900">{tr.recommendedCrops}</h2>
                <button onClick={saveResults} disabled={saving} className="btn-secondary py-2 text-sm">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {tr.saveReport}
                </button>
              </div>

              {saved && (
                <div className="flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700">
                  {tr.savedGeneric}
                </div>
              )}

              {saveError && (
                <div className="flex items-center gap-2 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">
                  {tr.saveFailedGeneric}
                </div>
              )}

              {displayedResults.map((crop, i) => (
                <CropCard key={crop.key ?? crop.name} crop={crop} rank={i + 1} tr={tr} />
              ))}
            </div>
          ) : (
            <div className="card flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
                <Wheat className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="font-display text-lg font-semibold text-gray-900">{tr.noRecommendations}</h3>
              <p className="mt-1 max-w-xs text-sm text-gray-500">
                {tr.soilClimate} → {tr.getRecommendations}
              </p>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-gray-900">
                <History className="h-4 w-4 text-gray-500" /> {tr.savedReports}
              </h3>
              {deleteError && (
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">
                  {deleteError}
                </div>
              )}
              <div className="space-y-2">
                {history.map((rec) => {
                  const safeRecResults = safeParseArray<CropResult>(rec.results);
                  const rawTopCrop = safeRecResults[0];
                  const topCrop = rawTopCrop ? translateCropResults([rawTopCrop], language)[0] : null;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => openReportModal(rec)}
                      className="card group flex items-center justify-between gap-3 p-3 transition hover:border-primary-400 hover:shadow-md cursor-pointer border border-gray-100"
                    >
                      <div className="flex flex-1 items-center gap-3 text-left">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-secondary-50 text-secondary-600 transition group-hover:bg-primary-50 group-hover:text-primary-600">
                          <Leaf className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                            {topCrop?.name ?? '—'} {topCrop ? `(${topCrop.score}% ${tr.matchScore})` : ''}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(rec.created_at).toLocaleDateString(language, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 opacity-90 transition group-hover:bg-primary-600 group-hover:text-white">
                          {language === 'ta' ? 'அறிக்கையைத் திறக்க' :
                           language === 'hi' ? 'रिपोर्ट खोलें' :
                           language === 'te' ? 'నివేదిక తెరవండి' :
                           language === 'mr' ? 'अहवाल उघडा' :
                           language === 'bn' ? 'প্রতিবেদন খুলুন' :
                           'Open Report'}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHistory(rec.id);
                          }}
                          aria-label={tr.delete}
                          title={tr.delete}
                          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-error-50 hover:text-error-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saved Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-gray-900">
                    {language === 'ta' ? 'சேமித்த பயிர் அறிக்கை' : 
                     language === 'hi' ? 'सहेजी गई फसल रिपोर्ट' : 
                     language === 'te' ? 'సేవ్ చేసిన పంట నివేదిక' : 
                     language === 'mr' ? 'जतन केलेला पीक अहवाल' : 
                     language === 'bn' ? 'সংরক্ষিত ফসলের প্রতিবেদন' : 
                     'Saved Crop Advisory Report'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedReport.created_at).toLocaleString(language, { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Soil & Climate Parameters */}
            <div className="my-5 rounded-xl bg-gray-50 p-4 border border-gray-200/80">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                {language === 'ta' ? 'பயன்படுத்தப்பட்ட மண் மற்றும் காலநிலை அளவுருக்கள்' : 
                 language === 'hi' ? 'उपयोग किए गए मिट्टी और जलवायु पैरामीटर' : 
                 'Soil & Climate Parameters Used'}
              </h4>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 text-xs">
                <div className="rounded-lg bg-white p-2.5 shadow-sm border border-gray-100">
                  <span className="text-gray-500 font-medium">N - P - K:</span>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {Number((selectedReport.inputs as Record<string, unknown>)?.nitrogen ?? 0)} - {Number((selectedReport.inputs as Record<string, unknown>)?.phosphorus ?? 0)} - {Number((selectedReport.inputs as Record<string, unknown>)?.potassium ?? 0)} kg/ha
                  </p>
                </div>
                <div className="rounded-lg bg-white p-2.5 shadow-sm border border-gray-100">
                  <span className="text-gray-500 font-medium">{tr.temperatureLabel}:</span>
                  <p className="font-semibold text-gray-900 mt-0.5">{Number((selectedReport.inputs as Record<string, unknown>)?.temperature ?? 0)} °C</p>
                </div>
                <div className="rounded-lg bg-white p-2.5 shadow-sm border border-gray-100">
                  <span className="text-gray-500 font-medium">{tr.humidityLabel}:</span>
                  <p className="font-semibold text-gray-900 mt-0.5">{Number((selectedReport.inputs as Record<string, unknown>)?.humidity ?? 0)}%</p>
                </div>
                <div className="rounded-lg bg-white p-2.5 shadow-sm border border-gray-100">
                  <span className="text-gray-500 font-medium">{tr.rainfallLabel} / pH:</span>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {Number((selectedReport.inputs as Record<string, unknown>)?.rainfall ?? 0)} mm / {Number((selectedReport.inputs as Record<string, unknown>)?.ph ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommended Crops in this report */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h4 className="text-sm font-semibold text-gray-900">{tr.recommendedCrops}</h4>
                <span className="text-xs font-medium text-gray-500">
                  {safeParseArray<CropResult>(selectedReport.results).length} {language === 'ta' ? 'பயிர்கள்' : 'crops'}
                </span>
              </div>
              {translateCropResults(
                safeParseArray<CropResult>(selectedReport.results),
                language
              ).map((crop, i) => (
                <CropCard key={crop.key ?? crop.name ?? i} crop={crop} rank={i + 1} tr={tr} />
              ))}
            </div>

            {/* Footer buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                {language === 'ta' ? 'அறிக்கையை அச்சிடுக' : 'Print Report'}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {tr.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => applyReportToCalculator(selectedReport)}
                  className="btn-primary text-sm flex items-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  {language === 'ta' ? 'இந்த அறிக்கையை ஏற்று (Load)' : 'Load into Calculator'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SliderInput({ label, unit, value, min, max, step, onChange, color, badge }: {
  label: string; unit: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; color: string; badge?: string;
}) {
  const colors: Record<string, string> = {
    primary: 'accent-primary-600',
    secondary: 'accent-secondary-600',
    accent: 'accent-accent-500',
    warning: 'accent-warning-500',
  };
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-2">
          {badge && <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">{badge}</span>}
          <span className="text-sm font-semibold text-gray-900">
            {value}{unit && ` ${unit}`}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 ${colors[color]}`}
      />
    </div>
  );
}

function CropCard({ crop, rank, tr }: { crop: CropResult; rank: number; tr: ReturnType<typeof t> }) {
  const confidenceColor =
    crop.score >= 80 ? 'bg-success-100 text-success-700' :
    crop.score >= 60 ? 'bg-accent-100 text-accent-700' :
    'bg-error-100 text-error-700';

  const scoreColor =
    crop.score >= 80 ? 'text-success-600' :
    crop.score >= 60 ? 'text-accent-600' :
    'text-error-600';

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
          <span className="font-display text-xl font-bold">{rank}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-bold text-gray-900">{crop.name}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${confidenceColor}`}>
              {crop.confidence} {tr.confidence}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">{crop.reason}</p>
        </div>
        <div className="text-right">
          <div className={`font-display text-3xl font-bold ${scoreColor}`}>{crop.score}%</div>
          <div className="text-xs text-gray-400">{tr.matchScore}</div>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-1.5 w-full bg-gray-100">
        <div
          className={`h-full rounded-r-full transition-all ${
            crop.score >= 80 ? 'bg-success-500' : crop.score >= 60 ? 'bg-accent-500' : 'bg-error-500'
          }`}
          style={{ width: `${crop.score}%` }}
        />
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 p-5 pt-4 sm:grid-cols-4">
        <Detail icon={Calendar} label={tr.season} value={crop.season} />
        <Detail icon={Droplets} label={tr.water} value={crop.waterRequirement} />
        <Detail icon={TrendingUp} label={tr.growing} value={crop.growingPeriod} />
        <Detail icon={Wheat} label={tr.yield} value={crop.expectedYield} />
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-0.5 text-sm font-medium text-gray-700">{value}</p>
    </div>
  );
}
