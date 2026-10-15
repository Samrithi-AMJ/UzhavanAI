import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { t } from '../lib/i18n';
import {
  fetchWeather, geocodeLocation, weatherIcon,
  type WeatherData, type GeoLocation,
} from '../lib/weather';
import { getWeatherDescription, generateWeatherAdvisory } from '../lib/weatherTranslations';
import { getCurrentPosition, GpsError } from '../lib/farm';
import {
  CloudSun, Search, Loader2, MapPin, Droplets, Wind, Thermometer,
  Sun, Sunrise, Sunset, CloudRain, Navigation, AlertCircle,
} from 'lucide-react';

export default function WeatherPage() {
  const { profile, language } = useAuth();
  const tr = t(language);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentLoc, setCurrentLoc] = useState<string>('');

  async function loadWeather(lat: number, lon: number, name: string) {
    setLoading(true);
    setError(null);
    try {
      const w = await fetchWeather(lat, lon);
      setWeather(w);
      setCurrentLoc(name);
    } catch {
      setError(tr.weatherFetchFailed);
    } finally {
      setLoading(false);
    }
  }

  // GPS priority: 1) saved farm location. Beyond that we never guess — the
  // farmer explicitly taps a button for their current GPS or a searched
  // city, so we never silently fall back to an unrelated default city.
  useEffect(() => {
    if (profile?.latitude != null && profile?.longitude != null) {
      loadWeather(profile.latitude, profile.longitude, profile.location || tr.myFarm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.latitude, profile?.longitude]);

  async function useFarmLocation() {
    if (profile?.latitude != null && profile?.longitude != null) {
      loadWeather(profile.latitude, profile.longitude, profile.location || tr.myFarm);
    } else {
      setError(tr.noFarmSet);
    }
  }

  async function useCurrentLocation() {
    setError(null);
    if (!navigator.onLine) {
      setError(tr.noInternet);
      return;
    }
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      await loadWeather(pos.coords.latitude, pos.coords.longitude, tr.useMyCurrentLocation);
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

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const results = await geocodeLocation(searchQuery);
      setSearchResults(results);
      setShowResults(true);
    } catch {
      setError(tr.searchFailed);
    } finally {
      setSearching(false);
    }
  }

  function selectLocation(loc: GeoLocation) {
    const name = [loc.name, loc.admin1, loc.country].filter(Boolean).join(', ');
    loadWeather(loc.latitude, loc.longitude, name);
    setShowResults(false);
    setSearchQuery('');
  }

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">{tr.weatherForecastTitle}</h1>
          {currentLoc && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-4 w-4" /> {currentLoc}
            </p>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length && setShowResults(true)}
              placeholder={tr.searchCity}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none sm:w-64"
            />
          </form>
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              {searchResults.map((loc, i) => (
                <button
                  key={i}
                  onClick={() => selectLocation(loc)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-gray-50"
                >
                  <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span>
                    {loc.name}
                    {loc.admin1 ? `, ${loc.admin1}` : ''}
                    {loc.country ? `, ${loc.country}` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Location action buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={useFarmLocation} className="btn-secondary py-2 text-sm">
          <MapPin className="h-4 w-4" /> {tr.useMyFarmLocation}
        </button>
        <button onClick={useCurrentLocation} disabled={locating} className="btn-secondary py-2 text-sm">
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
          {tr.useMyCurrentLocation}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700 ring-1 ring-error-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading || locating ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : weather ? (
        <div className="space-y-6">
          {/* Current weather hero */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-6 text-white lg:p-8">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-secondary-400/20 blur-2xl" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-6xl">{weatherIcon(weather.current.weatherCode, weather.current.isDay)}</span>
                  <div>
                    <div className="font-display text-5xl font-bold">{Math.round(weather.current.temperature)}°C</div>
                    <div className="text-lg text-primary-100">{getWeatherDescription(weather.current.weatherCode, language)}</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-primary-200">
                  {tr.feelsLike} {Math.round(weather.current.apparentTemperature)}°C
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Metric icon={Droplets} label={tr.humidity} value={`${weather.current.humidity}%`} />
                <Metric icon={Wind} label={tr.wind} value={`${Math.round(weather.current.windSpeed)} km/h`} />
                <Metric icon={Thermometer} label={tr.soilTemp} value={`${Math.round(weather.current.soilTemp0)}°C`} />
                <Metric icon={CloudRain} label={tr.rain} value={`${weather.current.precipitation} mm`} />
                <Metric icon={Sun} label={tr.soilMoisture} value={`${(weather.current.soilMoisture0 * 100).toFixed(1)}%`} />
                <Metric icon={Navigation} label={tr.day} value={weather.current.isDay ? tr.day : tr.night} />
              </div>
            </div>
          </div>

          {/* 7-day forecast */}
          <div className="card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">{tr.sevenDayForecast}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {weather.forecast.map((d) => {
                const dayName = new Date(d.date).toLocaleDateString(language, { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <div key={d.date} className="rounded-xl border border-gray-100 p-4 transition-all hover:border-primary-200 hover:shadow-sm">
                    <p className="text-sm font-semibold text-gray-900">{dayName}</p>
                    <div className="my-2 flex items-center gap-2">
                      <span className="text-3xl">{weatherIcon(d.weatherCode)}</span>
                      <span className="text-sm text-gray-500">{getWeatherDescription(d.weatherCode, language)}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-gray-900">{Math.round(d.tempMax)}°</span>
                      <span className="text-sm text-gray-400">/ {Math.round(d.tempMin)}°</span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-gray-500">
                      <p className="flex items-center gap-1.5">
                        <CloudRain className="h-3.5 w-3.5" /> {d.precipitationProbability}% · {d.precipitation}mm
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Wind className="h-3.5 w-3.5" /> {Math.round(d.windSpeedMax)} km/h
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Sun className="h-3.5 w-3.5" /> {tr.uvIndex} {d.uvIndexMax?.toFixed(1)}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Sunrise className="h-3.5 w-3.5" /> {new Date(d.sunrise).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Sunset className="h-3.5 w-3.5" /> {new Date(d.sunset).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Farming advisory based on weather */}
          <div className="card p-6">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-gray-900">
              <CloudSun className="h-5 w-5 text-primary-600" /> {tr.farmingAdvisory}
            </h2>
            <div className="space-y-2 text-sm text-gray-600">
              {generateWeatherAdvisory(weather, language).map((tip, i) => (
                <p key={i}>{tip}</p>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <MapPin className="mb-3 h-10 w-10 text-gray-300" />
          <h3 className="font-display text-lg font-semibold text-gray-900">{tr.noLocationSet}</h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500">{tr.setLocationToSeeWeather}</p>
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Wind; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-primary-200">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
