"use client";

import { useDashboardData } from "@/hooks/useDashboardData";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import WeatherCard from "@/components/WeatherCard";
import TransitCard from "@/components/TransitCard";
import BikesCard from "@/components/BikesCard";
import { RefreshCw } from "lucide-react";
import { env } from "@/config/env";

export default function HomePage() {
  const { data, loading, error, refetch, lastUpdated } = useDashboardData({
    refreshInterval: Math.min(
      env.MBTA_REFRESH_INTERVAL,
      env.BIKES_REFRESH_INTERVAL,
      env.WEATHER_REFRESH_INTERVAL
    ), // Use the fastest refresh interval
    autoRefresh: true,
  });

  if (loading && !data) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <ErrorDisplay error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex flex-col">
      {/* Weather Card - Compact Height */}
      <div className="h-[15vh] mb-4">
        <WeatherCard weather={data?.weather || null} />
      </div>

      {/* Main Content - Side by Side Cards */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* MBTA Card - Takes up more space */}
        <div className="flex-[2]">
          <TransitCard stops={data?.mbta || []} alerts={data?.alerts || []} />
        </div>

        {/* Bluebikes Card - Narrower */}
        <div className="flex-1">
          <BikesCard stations={data?.bikes || []} />
        </div>
      </div>

      {/* Footer with Last Updated and Refresh Button */}
      <div className="mt-2 bg-white/60 backdrop-blur-md rounded-lg p-2 border border-white/30 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Status Indicators */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700">MBTA</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700">
                  Bluebikes
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700">
                  Weather
                </span>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-xs text-gray-600 border-l border-gray-300 pl-2">
              Last updated:{" "}
              <span className="font-medium">
                {lastUpdated
                  ? new Date(lastUpdated).toLocaleTimeString()
                  : "Never"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Pays Rent Button */}
            <a
              href="https://rent683.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-2 py-1 rounded-md transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium"
            >
              <span>💰</span>
              <span>Pay Rent</span>
            </a>

            {/* Refresh Button */}
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center space-x-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-2 py-1 rounded-md transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none text-xs"
            >
              <RefreshCw
                className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
              />
              <span className="font-medium">
                {loading ? "Refreshing..." : "Refresh"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
