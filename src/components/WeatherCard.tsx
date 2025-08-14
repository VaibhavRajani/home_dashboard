"use client";

import { WeatherData } from "@/types/dashboard";
import { Thermometer, CloudRain, Sunrise, Sunset } from "lucide-react";
import Image from "next/image";

interface WeatherCardProps {
  weather: WeatherData | null;
}

export default function WeatherCard({ weather }: WeatherCardProps) {
  if (!weather) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl shadow-2xl border border-blue-500/20 h-full overflow-hidden relative flex items-center justify-center p-4">
        <div className="text-center">
          <Thermometer className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Weather data unavailable</p>
        </div>
      </div>
    );
  }

  const fahrenheitToCelsius = (fahrenheit: number) => {
    return Math.round(((fahrenheit - 32) * 5) / 9);
  };

  const getWeatherIcon = (icon: string) => {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl shadow-2xl border border-blue-500/20 h-full overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 animate-pulse"></div>

      {/* Content */}
      <div className="relative z-10 p-3 h-full flex items-center justify-between">
        {/* Left Side - Main Weather Info */}
        <div className="flex items-center space-x-3">
          {/* Weather Icon with glow effect */}
          <div className="text-center relative flex flex-col items-center">
            <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl"></div>
            <Image
              src={getWeatherIcon(weather.icon)}
              alt={weather.description}
              width={48}
              height={48}
              className="relative z-10 drop-shadow-2xl"
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
                <Thermometer className="w-5 h-5 relative z-10 text-cyan-300" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                  {fahrenheitToCelsius(weather.temperature)}°
                </div>
                <div className="text-xs opacity-80 text-cyan-200">
                  Feels like {fahrenheitToCelsius(weather.feelsLike)}°
                </div>
              </div>
            </div>
          </div>

          {/* Hourly Precipitation */}
          <div className="text-center flex flex-col items-center">
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-lg p-2 border border-blue-400/30">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <CloudRain className="w-3 h-3 text-blue-300" />
                <span className="text-xs font-semibold text-blue-200">
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
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-lg p-3 border border-purple-400/30 min-w-[120px]">
            <div className="text-sm font-bold text-white">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
            <div className="text-lg font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </div>
          </div>
        </div>

        {/* Right Side - Weather Details */}
        <div className="flex space-x-2">
          {/* Sunrise */}
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20 flex flex-col items-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Sunrise className="w-3 h-3 text-orange-300" />
              <span className="text-xs font-semibold text-orange-200">
                Sunrise
              </span>
            </div>
            <div className="text-sm font-bold text-white">
              {weather.sunrise}
            </div>
          </div>

          {/* Sunset */}
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20 flex flex-col items-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Sunset className="w-3 h-3 text-red-300" />
              <span className="text-xs font-semibold text-red-200">Sunset</span>
            </div>
            <div className="text-sm font-bold text-white">{weather.sunset}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
