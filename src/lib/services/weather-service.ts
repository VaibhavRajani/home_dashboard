import axios from "axios";
import { WeatherData } from "@/types/dashboard";
import { env } from "@/config/env";
import { BaseService } from "./base-service";
import { API_ENDPOINTS, LOCATIONS, CACHE_TTL } from "../constants";

export class WeatherService extends BaseService {
  private static instance: WeatherService;

  protected readonly cacheKey = "WEATHER" as const;
  protected readonly rateLimitKey = "WEATHER_API" as const;
  protected readonly cacheTTL = CACHE_TTL.WEATHER;

  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  async getCurrentWeather(): Promise<WeatherData | null> {
    if (!env.ENABLE_WEATHER) return null;

    const cached = this.getCached<WeatherData>();
    if (cached) return cached;

    if (this.isRateLimited()) {
      console.warn("Weather API rate limit exceeded, using cached data");
      return cached || null;
    }

    if (!env.OPENWEATHER_API_KEY) {
      console.warn("OpenWeatherMap API key not configured");
      return null;
    }

    try {
      const response = await axios.get(API_ENDPOINTS.WEATHER.CURRENT, {
        params: {
          lat: LOCATIONS.BROOKLINE.lat,
          lon: LOCATIONS.BROOKLINE.lon,
          appid: env.OPENWEATHER_API_KEY,
          units: "imperial",
        },
      });

      const weatherData: WeatherData = {
        temperature: Math.round(response.data.main.temp),
        feelsLike: Math.round(response.data.main.feels_like),
        humidity: response.data.main.humidity,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        windSpeed: Math.round(response.data.wind.speed),
        precipitation: response.data.rain?.["1h"] || 0,
        sunrise: new Date(response.data.sys.sunrise * 1000).toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        ),
        sunset: new Date(response.data.sys.sunset * 1000).toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        ),
        hourlyPrecipitation: [
          { time: "Now", precipitation: response.data.rain?.["1h"] || 0 },
          {
            time: "1h",
            precipitation: Math.round((response.data.rain?.["1h"] || 0) * 0.8),
          },
          {
            time: "2h",
            precipitation: Math.round((response.data.rain?.["1h"] || 0) * 0.6),
          },
          {
            time: "3h",
            precipitation: Math.round((response.data.rain?.["1h"] || 0) * 0.4),
          },
          {
            time: "4h",
            precipitation: Math.round((response.data.rain?.["1h"] || 0) * 0.2),
          },
        ],
      };

      this.setCached(weatherData);
      return weatherData;
    } catch (error) {
      return this.handleError(error, cached || null);
    }
  }
}
