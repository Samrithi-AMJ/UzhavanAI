import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase, type Profile } from '../lib/supabase';
import { fetchWeather, weatherIcon } from '../lib/weather';
import { getWeatherDescription } from '../lib/weatherTranslations';
import { t } from '../lib/i18n';
import type { Page } from '../components/Layout';
import {
  MessageSquare, CloudSun, Wheat, TrendingUp, MapPin, Loader2,
  Sprout, Droplets, Thermometer, Save, CheckCircle2, Map as MapIcon,
} from 'lucide-react';

export default function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { user, profile, refreshProfile, language } = useAuth();
  const tr = t(language);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [weather, setWeather] = useState<Awaited<ReturnType<typeof fetchWeather>> | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [chatCount, setChatCount] = useState(0);
  const [recCount, setRecCount] = useState(0);
  const [hasFarmBoundary, setHasFarmBoundary] = useState(false);

  useEffect(() => {
    setForm(profile || {});
  }, [profile]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const [{ count: chats }, { count: recs }, { count: boundaries }] = await Promise.all([
        supabase.from('chat_history').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('crop_recommendations').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('farm_boundaries').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      setChatCount(chats ?? 0);
      setRecCount(recs ?? 0);
      setHasFarmBoundary((boundaries ?? 0) > 0);

      if (profile?.latitude && profile?.longitude) {
        try {
          const w = await fetchWeather(profile.latitude, profile.longitude);
          setWeather(w);
        } catch { /* ignore */ }
      }
      setWeatherLoading(false);
    }
    load();
  }, [user, profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    setSaving(true);
    setSaved(false);

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: form.full_name,
      farm_name: form.farm_name,
      location: form.location,
      latitude: form.latitude ?? null,
      longitude: form.longitude ?? null,
      farm_size_acres: form.farm_size_acres
        ? Number(form.farm_size_acres)
        : null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Profile save error:', error);
      setSaving(false);
      return;
    }

    await refreshProfile();

    setSaving(false);
    setEditing(false);
    setSaved(true);

    setTimeout(() => setSaved(false), 2500);
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return tr.goodMorning;
    if (h < 17) return tr.goodAfternoon;
    return tr.goodEvening;
  })();

  const hasFarmLocation = profile?.latitude != null && profile?.longitude != null;

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">
          {greeting}, {profile?.full_name?.split(' ')[0] || tr.farmer}!
        </h1>
        <p className="mt-1 text-gray-500">{tr.farmOverview}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={MessageSquare} label={tr.aiConversations} value={chatCount} color="primary" onClick={() => onNavigate('chatbot')} />
        <StatCard icon={Wheat} label={tr.cropReports} value={recCount} color="secondary" onClick={() => onNavigate('crops')} />
        <StatCard
          icon={Thermometer}
          label={tr.currentTemp}
          value={weather ? `${Math.round(weather.current.temperature)}°C` : '—'}
          color="accent"
          onClick={() => onNavigate('weather')}
        />
        <StatCard
          icon={Droplets}
          label={tr.humidity}
          value={weather ? `${weather.current.humidity}%` : '—'}
          color="primary"
          onClick={() => onNavigate('weather')}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Weather card */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <CloudSun className="h-5 w-5 text-primary-600" />
              <h2 className="font-display text-lg font-semibold text-gray-900">{tr.weatherToday}</h2>
            </div>
            <button onClick={() => onNavigate('weather')} className="text-sm font-medium text-primary-600 hover:text-primary-700">
              {tr.viewDays}
            </button>
          </div>
          <div className="p-6">
            {weatherLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : weather ? (
              <div>
                <div className="flex items-center gap-6">
                  <div className="text-5xl">{weatherIcon(weather.current.weatherCode, weather.current.isDay)}</div>
                  <div>
                    <div className="font-display text-4xl font-bold text-gray-900">
                      {Math.round(weather.current.temperature)}°C
                    </div>
                    <div className="text-gray-500">{getWeatherDescription(weather.current.weatherCode, language)}</div>
                  </div>
                  <div className="ml-auto text-right text-sm text-gray-500">
                    <p>{tr.feelsLike} {Math.round(weather.current.apparentTemperature)}°C</p>
                    <p>{tr.wind} {Math.round(weather.current.windSpeed)} km/h</p>
                    <p>{tr.soil} {Math.round(weather.current.soilTemp0)}°C</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 lg:grid-cols-5">
                  {weather.forecast.slice(0, 5).map((d) => (
                    <div key={d.date} className="rounded-xl bg-gray-50 p-3 text-center">
                      <p className="text-xs font-medium text-gray-500">
                        {new Date(d.date).toLocaleDateString(language, { weekday: 'short' })}
                      </p>
                      <p className="my-1 text-2xl">{weatherIcon(d.weatherCode)}</p>
                      <p className="text-xs font-semibold text-gray-900">{Math.round(d.tempMax)}°</p>
                      <p className="text-xs text-gray-400">{Math.round(d.tempMin)}°</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <MapPin className="mb-2 h-8 w-8 text-gray-300" />
                <p className="text-gray-500">{tr.setLocationPrompt}</p>
                <button onClick={() => onNavigate('farm')} className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700">
                  {tr.addLocation}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile / Edit card */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-primary-600" />
              <h2 className="font-display text-lg font-semibold text-gray-900">{tr.farmProfile}</h2>
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                {tr.edit}
              </button>
            )}
          </div>
          <div className="p-6">
            {editing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <Field label={tr.fullName}>
                  <input className="input-field" value={form.full_name || ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </Field>
                <Field label={tr.farmName}>
                  <input className="input-field" value={form.farm_name || ''} onChange={(e) => setForm({ ...form, farm_name: e.target.value })} />
                </Field>
                <Field label={tr.location}>
                  <input className="input-field" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </Field>
                <Field label={tr.farmSize}>
                  <input type="number" step="0.1" className="input-field" value={form.farm_size_acres ?? ''} onChange={(e) => setForm({ ...form, farm_size_acres: e.target.value ? Number(e.target.value) : null })} />
                </Field>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {tr.save}
                  </button>
                  <button type="button" onClick={() => { setEditing(false); setForm(profile || {}); }} className="btn-secondary">
                    {tr.cancel}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <InfoRow label={tr.fullName} value={profile?.full_name || '—'} />
                <InfoRow label={tr.farmName} value={profile?.farm_name || '—'} />
                <InfoRow label={tr.location} value={profile?.location || tr.notSet} />
                <InfoRow label={tr.farmSize} value={profile?.farm_size_acres ? `${profile.farm_size_acres} ${tr.acres}` : '—'} />
                {saved && (
                  <div className="flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700">
                    <CheckCircle2 className="h-4 w-4" /> {tr.profileSaved}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Farm location card */}
      <div className="mt-6 card p-6">
        <div className="flex items-center gap-2">
          <MapIcon className="h-5 w-5 text-primary-600" />
          <h2 className="font-display text-lg font-semibold text-gray-900">{tr.farmLocationTitle}</h2>
        </div>
        {hasFarmLocation ? (
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:flex sm:gap-8">
              <div>
                <p className="text-gray-500">{tr.latitude}</p>
                <p className="font-medium text-gray-900">{profile!.latitude!.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-gray-500">{tr.longitude}</p>
                <p className="font-medium text-gray-900">{profile!.longitude!.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-gray-500">{tr.farmArea}</p>
                <p className="font-medium text-gray-900">
                  {profile?.farm_size_acres ? `${profile.farm_size_acres} ${tr.acres}` : tr.notSet}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onNavigate('farm')} className="btn-secondary py-2 text-sm">{tr.viewFarm}</button>
              <button onClick={() => onNavigate('farm')} className="btn-secondary py-2 text-sm">{tr.updateLocation}</button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">{tr.noFarmSet}</p>
            <button onClick={() => onNavigate('farm')} className="btn-primary py-2 text-sm">{tr.viewFarm}</button>
          </div>
        )}
        {hasFarmBoundary && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-700">
            <CheckCircle2 className="h-4 w-4" /> {tr.farmBoundarySaved}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <QuickAction icon={MessageSquare} title={tr.askAI} desc={tr.askAIDesc} onClick={() => onNavigate('chatbot')} />
        <QuickAction icon={CloudSun} title={tr.checkWeather} desc={tr.checkWeatherDesc} onClick={() => onNavigate('weather')} />
        <QuickAction icon={Wheat} title={tr.recommendCrops} desc={tr.recommendCropsDesc} onClick={() => onNavigate('crops')} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, onClick }: {
  icon: typeof MessageSquare; label: string; value: string | number; color: string; onClick: () => void;
}) {
  const colors: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    secondary: 'bg-secondary-50 text-secondary-600',
    accent: 'bg-accent-50 text-accent-600',
  };
  return (
    <button onClick={onClick} className="card group flex items-center gap-4 p-4 text-left">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors[color]} transition-transform group-hover:scale-110`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </button>
  );
}

function QuickAction({ icon: Icon, title, desc, onClick }: {
  icon: typeof MessageSquare; title: string; desc: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="card group flex items-center gap-4 p-5 text-left transition-all hover:border-primary-200 hover:bg-primary-50/30">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 transition-transform group-hover:scale-110">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
      <TrendingUp className="ml-auto h-5 w-5 text-gray-300 transition-colors group-hover:text-primary-500" />
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-gray-50 pb-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
