import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  Compass,
  Droplets,
  Gauge,
  Loader2,
  MapPin,
  Moon,
  Search,
  Snowflake,
  Sparkles,
  Sun,
  Thermometer,
  Umbrella,
  Waves,
  Wind,
} from "lucide-react";

const weatherCopy = {
  0: ["Clear sky", "crystalline"],
  1: ["Mostly clear", "sunlit"],
  2: ["Partly cloudy", "layered"],
  3: ["Overcast", "silver"],
  45: ["Fog", "hushed"],
  48: ["Rime fog", "frosted"],
  51: ["Light drizzle", "misty"],
  53: ["Drizzle", "glossy"],
  55: ["Dense drizzle", "rain-kissed"],
  56: ["Freezing drizzle", "ice-glazed"],
  57: ["Heavy freezing drizzle", "ice-lit"],
  61: ["Light rain", "fresh"],
  63: ["Rain", "rainfall"],
  65: ["Heavy rain", "stormglass"],
  66: ["Freezing rain", "coldglass"],
  67: ["Heavy freezing rain", "frozen"],
  71: ["Light snow", "soft"],
  73: ["Snow", "alpine"],
  75: ["Heavy snow", "whiteout"],
  77: ["Snow grains", "powder"],
  80: ["Light showers", "passing"],
  81: ["Showers", "showery"],
  82: ["Violent showers", "torrential"],
  85: ["Light snow showers", "flurried"],
  86: ["Snow showers", "blizzard"],
  95: ["Thunderstorm", "electric"],
  96: ["Thunderstorm with hail", "charged"],
  99: ["Severe thunderstorm", "severe"],
};

const weatherIcons = {
  clear: Sun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  storm: CloudLightning,
  snow: Snowflake,
};

const sampleCities = ["Tokyo", "New York", "Reykjavik", "Cape Town"];

function getWeatherFamily(code) {
  if (code === 0 || code === 1) return "clear";
  if (code === 2 || code === 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  return "cloud";
}

function getWeatherLabel(code) {
  return weatherCopy[code] ?? ["Atmospheric", "dynamic"];
}

function formatTime(value) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDay(value) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(value));
}

function windDirection(degrees = 0) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degrees / 45) % 8];
}

function pickHourlyWindow(hourly) {
  if (!hourly?.time?.length) return [];
  const now = Date.now();
  const start = hourly.time.findIndex((time) => new Date(time).getTime() >= now);
  const safeStart = start === -1 ? 0 : start;

  return hourly.time.slice(safeStart, safeStart + 8).map((time, index) => ({
    time,
    temp: Math.round(hourly.temperature_2m[safeStart + index]),
    precipitation: Math.round(hourly.precipitation_probability[safeStart + index] ?? 0),
    code: hourly.weather_code[safeStart + index],
  }));
}

function buildDailyForecast(daily) {
  if (!daily?.time?.length) return [];
  return daily.time.slice(0, 7).map((time, index) => ({
    time,
    high: Math.round(daily.temperature_2m_max[index]),
    low: Math.round(daily.temperature_2m_min[index]),
    code: daily.weather_code[index],
    precipitation: Math.round(daily.precipitation_probability_max[index] ?? 0),
  }));
}

async function fetchWeather(location) {
  const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geoUrl.searchParams.set("name", location);
  geoUrl.searchParams.set("count", "1");
  geoUrl.searchParams.set("language", "en");
  geoUrl.searchParams.set("format", "json");

  const geoResponse = await fetch(geoUrl);
  if (!geoResponse.ok) throw new Error("Unable to search for that location.");
  const geo = await geoResponse.json();
  const place = geo.results?.[0];
  if (!place) throw new Error("I could not find that location. Try a city or landmark.");

  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
  weatherUrl.searchParams.set("latitude", place.latitude);
  weatherUrl.searchParams.set("longitude", place.longitude);
  weatherUrl.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m",
  );
  weatherUrl.searchParams.set(
    "hourly",
    "temperature_2m,precipitation_probability,weather_code",
  );
  weatherUrl.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
  );
  weatherUrl.searchParams.set("temperature_unit", "fahrenheit");
  weatherUrl.searchParams.set("wind_speed_unit", "mph");
  weatherUrl.searchParams.set("precipitation_unit", "inch");
  weatherUrl.searchParams.set("timezone", "auto");

  const weatherResponse = await fetch(weatherUrl);
  if (!weatherResponse.ok) throw new Error("Weather data is unavailable right now.");
  const weather = await weatherResponse.json();

  return {
    place,
    current: weather.current,
    daily: buildDailyForecast(weather.daily),
    hourly: pickHourlyWindow(weather.hourly),
    sunrise: weather.daily?.sunrise?.[0],
    sunset: weather.daily?.sunset?.[0],
    timezone: weather.timezone,
  };
}

function WeatherScene({ family, isDay }) {
  const particles = useMemo(() => Array.from({ length: 42 }, (_, index) => index), []);

  return (
    <div className={`weather-scene ${family} ${isDay ? "day" : "night"}`} aria-hidden="true">
      <div className="sky-orbit" />
      <div className="horizon-glow" />
      <div className="mountain ridge-one" />
      <div className="mountain ridge-two" />
      <div className="city-grid" />
      <div className="cloud-bank cloud-a" />
      <div className="cloud-bank cloud-b" />
      <div className="cloud-bank cloud-c" />
      <div className="lightning-bolt" />
      <div className="rain-field">
        {particles.map((item) => (
          <i key={item} style={{ "--i": item }} />
        ))}
      </div>
      <div className="snow-field">
        {particles.slice(0, 28).map((item) => (
          <i key={item} style={{ "--i": item }} />
        ))}
      </div>
      <div className="mist-layer" />
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, accent }) {
  return (
    <article className="metric-card">
      <div className="metric-icon" style={{ "--accent": accent }}>
        <Icon size={19} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function App() {
  const [query, setQuery] = useState("San Francisco");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentCode = weather?.current?.weather_code ?? 2;
  const family = getWeatherFamily(currentCode);
  const [condition, mood] = getWeatherLabel(currentCode);
  const Icon = weatherIcons[family];
  const isDay = weather?.current?.is_day !== 0;

  async function handleSubmit(event, explicitLocation) {
    event?.preventDefault();
    const location = (explicitLocation ?? query).trim();
    if (!location) return;

    setLoading(true);
    setError("");

    try {
      const nextWeather = await fetchWeather(location);
      setWeather(nextWeather);
      setQuery(
        [nextWeather.place.name, nextWeather.place.admin1, nextWeather.place.country]
          .filter(Boolean)
          .join(", "),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const high = weather?.daily?.[0]?.high;
  const low = weather?.daily?.[0]?.low;
  const placeName = weather
    ? [weather.place.name, weather.place.admin1, weather.place.country].filter(Boolean).join(", ")
    : "Search any city";

  useEffect(() => {
    let isMounted = true;

    async function loadInitialWeather() {
      setLoading(true);
      try {
        const nextWeather = await fetchWeather("San Francisco");
        if (!isMounted) return;
        setWeather(nextWeather);
        setQuery(
          [nextWeather.place.name, nextWeather.place.admin1, nextWeather.place.country]
            .filter(Boolean)
            .join(", "),
        );
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInitialWeather();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="app-shell">
      <WeatherScene family={family} isDay={isDay} />
      <section className="dashboard">
        <nav className="topbar" aria-label="Application">
          <div className="brand">
            <span className="brand-mark">
              <Sparkles size={18} />
            </span>
            <span>S-Weather</span>
          </div>
          <div className="status-pill">
            <Waves size={16} />
            Live Open-Meteo data
          </div>
        </nav>

        <section className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <MapPin size={16} />
              {placeName}
            </div>
            <h1>Weather that feels alive.</h1>
            <p>
              Enter a place and watch the interface reshape itself around the real forecast:
              sunlight, rain, snow, storms, wind, pressure, and the next seven days.
            </p>

            <form className="search-panel" onSubmit={handleSubmit}>
              <Search size={21} />
              <input
                aria-label="Location"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search city, region, or landmark"
              />
              <button disabled={loading} type="submit">
                {loading ? <Loader2 className="spin" size={20} /> : "Forecast"}
              </button>
            </form>

            <div className="quick-cities" aria-label="Quick city searches">
              {sampleCities.map((city) => (
                <button key={city} type="button" onClick={(event) => handleSubmit(event, city)}>
                  {city}
                </button>
              ))}
            </div>

            {error ? (
              <div className="error-banner">
                <AlertTriangle size={18} />
                {error}
              </div>
            ) : null}
          </div>

          <aside className="current-panel">
            <div className="condition-row">
              <div className="condition-icon">
                <Icon size={58} />
              </div>
              <div>
                <span className="mood">{mood} conditions</span>
                <strong>{condition}</strong>
              </div>
            </div>

            <div className="temperature-row">
              <span>{weather ? Math.round(weather.current.temperature_2m) : "--"}</span>
              <sup>°F</sup>
            </div>

            <div className="range-bar">
              <span>{low ?? "--"}°</span>
              <div>
                <i style={{ width: high && low ? `${Math.min(95, Math.max(22, high - low + 46))}%` : "55%" }} />
              </div>
              <span>{high ?? "--"}°</span>
            </div>
          </aside>
        </section>

        <section className="data-grid">
          <div className="glass-panel span-two">
            <div className="panel-header">
              <div>
                <span>Next hours</span>
                <h2>Atmospheric timeline</h2>
              </div>
              <Compass size={22} />
            </div>
            <div className="hourly-track">
              {(weather?.hourly?.length ? weather.hourly : Array.from({ length: 8 })).map((hour, index) => {
                const HourIcon = hour ? weatherIcons[getWeatherFamily(hour.code)] : Cloud;
                return (
                  <article key={hour?.time ?? index} className="hour-card">
                    <span>{hour ? formatTime(hour.time) : "--"}</span>
                    <HourIcon size={24} />
                    <strong>{hour ? `${hour.temp}°` : "--"}</strong>
                    <small>{hour ? `${hour.precipitation}%` : "--"}</small>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="metrics-grid">
            <MetricCard
              icon={Thermometer}
              label="Feels like"
              value={weather ? `${Math.round(weather.current.apparent_temperature)}°F` : "--"}
              accent="#ffb86b"
            />
            <MetricCard
              icon={Droplets}
              label="Humidity"
              value={weather ? `${weather.current.relative_humidity_2m}%` : "--"}
              accent="#63e6ff"
            />
            <MetricCard
              icon={Wind}
              label="Wind"
              value={
                weather
                  ? `${Math.round(weather.current.wind_speed_10m)} mph ${windDirection(
                      weather.current.wind_direction_10m,
                    )}`
                  : "--"
              }
              accent="#b8f7d4"
            />
            <MetricCard
              icon={Gauge}
              label="Pressure"
              value={weather ? `${Math.round(weather.current.pressure_msl)} hPa` : "--"}
              accent="#d8c6ff"
            />
          </div>

          <div className="glass-panel forecast-panel">
            <div className="panel-header">
              <div>
                <span>Seven day</span>
                <h2>Forecast arc</h2>
              </div>
              <Umbrella size={22} />
            </div>
            <div className="forecast-list">
              {(weather?.daily?.length ? weather.daily : Array.from({ length: 7 })).map((day, index) => {
                const DayIcon = day ? weatherIcons[getWeatherFamily(day.code)] : Cloud;
                return (
                  <article key={day?.time ?? index} className="forecast-day">
                    <span>{day ? formatDay(day.time) : "---"}</span>
                    <DayIcon size={21} />
                    <div className="forecast-line">
                      <i style={{ width: day ? `${Math.max(18, day.precipitation)}%` : "35%" }} />
                    </div>
                    <strong>{day ? `${day.high}° / ${day.low}°` : "--"}</strong>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="sun-panel">
            <div>
              <Sun size={28} />
              <span>Sunrise</span>
              <strong>{weather?.sunrise ? formatTime(weather.sunrise) : "--"}</strong>
            </div>
            <div>
              <Moon size={28} />
              <span>Sunset</span>
              <strong>{weather?.sunset ? formatTime(weather.sunset) : "--"}</strong>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;
