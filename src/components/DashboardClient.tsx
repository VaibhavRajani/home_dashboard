"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import WeatherCard from "@/components/WeatherCard";
import TransitCard from "@/components/TransitCard";
import BikesCard from "@/components/BikesCard";
import { fetchDashboardData } from "@/lib/api";
import { env } from "@/config/env";
import type { DashboardData } from "@/types/dashboard";

interface DashboardClientProps {
  initialData: DashboardData;
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const next = await fetchDashboardData();
      setData(next);
    } catch (error) {
      // Keep the last server-rendered data visible if refresh fails.
      console.error("Dashboard refresh failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(
      refetch,
      Math.min(
        env.MBTA_REFRESH_INTERVAL,
        env.BIKES_REFRESH_INTERVAL,
        env.WEATHER_REFRESH_INTERVAL
      )
    );
    return () => window.clearInterval(interval);
  }, [refetch]);

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex flex-col">
      <div className="h-[15vh] mb-4">
        <WeatherCard weather={data.weather || null} />
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-[2]">
          <TransitCard stops={data.mbta || []} alerts={data.alerts || []} />
        </div>
        <div className="flex-1">
          <BikesCard stations={data.bikes || []} />
        </div>
      </div>

      <div className="mt-2 bg-white/60 backdrop-blur-md rounded-lg p-2 border border-white/30 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-gray-700">MBTA</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-gray-700">Bluebikes</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-gray-700">Weather</span>
              </div>
            </div>

            <div className="text-xs text-gray-600 border-l border-gray-300 pl-2">
              Last updated:{" "}
              <span className="font-medium">
                {data.lastUpdated
                  ? new Date(data.lastUpdated).toLocaleTimeString()
                  : "Never"}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="https://rent683.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-2 py-1 rounded-md transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium"
            >
              <span>💰</span>
              <span>Pay Rent</span>
            </a>

            <Link
              href="/crypto"
              className="flex items-center space-x-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-2 py-1 rounded-md transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium"
            >
              <span>₿</span>
              <span>Crypto</span>
            </Link>

            <Link
              href="/stocks"
              className="flex items-center space-x-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-2 py-1 rounded-md transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium"
            >
              <span>📈</span>
              <span>Stocks</span>
            </Link>

            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center space-x-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-2 py-1 rounded-md transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none text-xs"
            >
              <RefreshCw className={"w-3 h-3" + (loading ? " animate-spin" : "")} />
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
