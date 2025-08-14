"use client";

import { WeatherData } from "@/types/dashboard";
import {
  Cloud,
  Thermometer,
  Droplets,
  Sunrise,
  Sunset,
  CloudRain,
} from "lucide-react";

interface WeatherCardProps {
  weather: WeatherData | null;
}

export default function WeatherCard({ weather }: WeatherCardProps) {
  if (!weather) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 h-full flex items-center justify-center">
        <div className="text-center">
          <Cloud className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-lg">Weather data unavailable</p>
        </div>
      </div>
    );
  }

  const getWeatherIcon = (iconCode: string) => {
    const baseUrl = "https://openweathermap.org/img/wn/";
    return `${baseUrl}${iconCode}@2x.png`;
  };

  const fahrenheitToCelsius = (f: number) => {
    return Math.round(((f - 32) * 5) / 9);
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl h-full overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-30">
        <div className="w-full h-full bg-[radial-gradient(circle_at_30px_30px,rgba(255,255,255,0.1)_2px,transparent_2px)] bg-[length:60px_60px]"></div>
      </div>

      <div className="h-full flex items-center justify-between py-4 px-6 text-white relative z-10">
        {/* Left Side - Main Weather Info */}
        <div className="flex items-center space-x-5">
          {/* Weather Icon with glow effect */}
          <div className="text-center relative flex flex-col items-center">
            <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl"></div>
            <img
              src={getWeatherIcon(weather.icon)}
              alt={weather.description}
              className="w-16 h-16 relative z-10 drop-shadow-2xl"
            />
            <p className="text-xs capitalize mt-1 text-cyan-200 font-medium">
              {weather.description}
            </p>
          </div>

          {/* Temperature in Celsius */}
          <div className="text-center flex flex-col items-center">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full blur-lg opacity-50"></div>
                <Thermometer className="w-7 h-7 relative z-10 text-cyan-300" />
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                  {fahrenheitToCelsius(weather.temperature)}°
                </div>
                <div className="text-sm opacity-80 text-cyan-200">
                  Feels like {fahrenheitToCelsius(weather.feelsLike)}°
                </div>
              </div>
            </div>
          </div>

          {/* Hourly Precipitation */}
          <div className="text-center flex flex-col items-center">
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-lg p-3 border border-blue-400/30">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <CloudRain className="w-4 h-4 text-blue-300" />
                <span className="text-sm font-semibold text-blue-200">
                  Hourly Rain
                </span>
              </div>
              <div className="flex space-x-1">
                {weather.hourlyPrecipitation?.map((hour, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-blue-200 mb-1">
                      {hour.time}
                    </div>
                    <div className="text-xs font-bold text-white">
                      {hour.precipitation}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center - Date and Time */}
        <div className="text-center flex flex-col items-center">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-lg p-4 border border-purple-400/30 min-w-[140px]">
            <div className="text-lg font-bold text-white">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </div>
          </div>
        </div>

        {/* Right Side - Weather Details */}
        <div className="flex space-x-4">
          {/* Precipitation */}
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 flex flex-col items-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <CloudRain className="w-4 h-4 text-blue-300" />
              <span className="text-sm font-semibold text-blue-200">
                Precipitation
              </span>
            </div>
            <div className="text-xl font-bold text-white">0%</div>
            <div className="text-xs text-blue-200 mt-1">0.0 in</div>
          </div>

          {/* Sunrise */}
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 flex flex-col items-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <Sunrise className="w-4 h-4 text-orange-300" />
              <span className="text-sm font-semibold text-orange-200">
                Sunrise
              </span>
            </div>
            <div className="text-xl font-bold text-white">
              {weather.sunrise}
            </div>
          </div>

          {/* Sunset */}
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 flex flex-col items-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <Sunset className="w-4 h-4 text-red-300" />
              <span className="text-sm font-semibold text-red-200">Sunset</span>
            </div>
            <div className="text-xl font-bold text-white">{weather.sunset}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
