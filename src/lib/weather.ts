export type GeoLocation = {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
};

export type CurrentWeather = {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  weatherDescription: string;
  isDay: boolean;
  soilTemp0: number;
  soilTemp6: number;
  soilMoisture0: number;
};

export type DailyForecast = {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  precipitationProbability: number;
  weatherCode: number;
  weatherDescription: string;
  windSpeedMax: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
};

export type WeatherData = {
  current: CurrentWeather;
  forecast: DailyForecast[];
};

const WMO_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export function describeWeather(code: number): string {
  return WMO_CODES[code] ?? 'Unknown';
}

export async function geocodeLocation(query: string): Promise<GeoLocation[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query
  )}&count=5&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to geocode location');
  const data = await res.json();
  if (!data.results) return [];
  return data.results.map((r: Record<string, unknown>) => ({
    name: r.name as string,
    latitude: r.latitude as number,
    longitude: r.longitude as number,
    country: r.country as string | undefined,
    admin1: r.admin1 as string | undefined,
  }));
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day,soil_temperature_0cm,soil_temperature_6cm,soil_moisture_0_1cm',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset,uv_index_max',
    timezone: 'auto',
    forecast_days: '7',
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather data');
  const data = await res.json();

  const cur = data.current;
  const current: CurrentWeather = {
    temperature: cur.temperature_2m,
    apparentTemperature: cur.apparent_temperature,
    humidity: cur.relative_humidity_2m,
    precipitation: cur.precipitation,
    windSpeed: cur.wind_speed_10m,
    weatherCode: cur.weather_code,
    weatherDescription: describeWeather(cur.weather_code),
    isDay: cur.is_day === 1,
    soilTemp0: cur.soil_temperature_0cm,
    soilTemp6: cur.soil_temperature_6cm,
    soilMoisture0: cur.soil_moisture_0_1cm,
  };

  const daily = data.daily;
  const forecast: DailyForecast[] = daily.time.map((date: string, i: number) => ({
    date,
    tempMax: daily.temperature_2m_max[i],
    tempMin: daily.temperature_2m_min[i],
    precipitation: daily.precipitation_sum[i],
    precipitationProbability: daily.precipitation_probability_max[i],
    weatherCode: daily.weather_code[i],
    weatherDescription: describeWeather(daily.weather_code[i]),
    windSpeedMax: daily.wind_speed_10m_max[i],
    sunrise: daily.sunrise[i],
    sunset: daily.sunset[i],
    uvIndexMax: daily.uv_index_max[i],
  }));

  return { current, forecast };
}

export function weatherIcon(code: number, isDay = true): string {
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code <= 2) return isDay ? '🌤️' : '🌙';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '🌨️';
  return '⛈️';
}
