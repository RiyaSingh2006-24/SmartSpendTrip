import { env, assertEnv } from "../config/env.js";
import { buildDemoWeatherSummary } from "../data/demoTravelData.js";
import { ApiError } from "../utils/errors.js";

const WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_BASE_URL = "https://api.openweathermap.org/data/2.5/forecast";

const scoreWeather = (temperature, weatherMain) => {
  let score = 72;
  if (temperature >= 18 && temperature <= 31) {
    score += 15;
  } else if (temperature < 10 || temperature > 37) {
    score -= 16;
  }
  if (["Clear", "Clouds"].includes(weatherMain)) {
    score += 8;
  }
  if (["Rain", "Thunderstorm", "Drizzle"].includes(weatherMain)) {
    score -= 12;
  }
  return Math.min(100, Math.max(10, score));
};

const fetchWeather = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(response.status, `OpenWeather request failed: ${await response.text()}`);
  }
  return response.json();
};

export const weatherService = {
  async getWeatherSummary(latitude, longitude) {
    if (env.demoMode) {
      return buildDemoWeatherSummary({ latitude, longitude });
    }

    try {
      assertEnv("openWeatherApiKey");

      const currentUrl = new URL(WEATHER_BASE_URL);
      currentUrl.searchParams.set("lat", String(latitude));
      currentUrl.searchParams.set("lon", String(longitude));
      currentUrl.searchParams.set("appid", env.openWeatherApiKey);
      currentUrl.searchParams.set("units", "metric");

      const forecastUrl = new URL(FORECAST_BASE_URL);
      forecastUrl.searchParams.set("lat", String(latitude));
      forecastUrl.searchParams.set("lon", String(longitude));
      forecastUrl.searchParams.set("appid", env.openWeatherApiKey);
      forecastUrl.searchParams.set("units", "metric");
      forecastUrl.searchParams.set("cnt", "6");

      const [current, forecast] = await Promise.all([
        fetchWeather(currentUrl),
        fetchWeather(forecastUrl),
      ]);

      const main = current.weather?.[0]?.main || "Clear";
      const description = current.weather?.[0]?.description || "clear sky";
      const temp = current.main?.temp ?? 0;

      return {
        headline: `${description} around ${Math.round(temp)}C`,
        condition: main,
        description,
        temperatureC: temp,
        forecastPreview: (forecast.list || [])
          .slice(0, 3)
          .map((item) => `${item.weather?.[0]?.main || "Clear"} ${Math.round(item.main?.temp || 0)}C`),
        score: scoreWeather(temp, main),
      };
    } catch (error) {
      if (!env.demoMode) {
        throw error;
      }

      return buildDemoWeatherSummary({ latitude, longitude });
    }
  },
};
