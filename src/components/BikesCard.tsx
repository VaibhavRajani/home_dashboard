"use client";

import { BluebikesStation } from "@/types/dashboard";
import { BLUEBIKES_CONFIG } from "@/lib/constants";
import {
  Bike,
  MapPin,
  CheckCircle,
  XCircle,
  Car,
  Zap,
} from "lucide-react";

interface BikesCardProps {
  stations: BluebikesStation[];
}

export default function BikesCard({ stations }: BikesCardProps) {
  const getAvailabilityColor = (bikes: number, docks: number) => {
    if (bikes === 0) return "text-red-600";
    if (bikes <= 3) return "text-orange-600";
    if (docks === 0) return "text-red-600";
    return "text-green-600";
  };

  const getAvailabilityText = (bikes: number, docks: number) => {
    if (bikes === 0) return "No bikes available";
    if (docks === 0) return "Station full";
    if (bikes <= 3) return "Low availability";
    return "Good availability";
  };

  const getStationName = (stationId: string) => {
    return (
      BLUEBIKES_CONFIG.STATION_NAMES[stationId] ||
      `Station ${stationId.slice(-4)}`
    );
  };

  const totalBikes = stations.reduce(
    (sum, station) => sum + station.numBikesAvailable,
    0
  );
  const totalDocks = stations.reduce(
    (sum, station) => sum + station.numDocksAvailable,
    0
  );
  const totalEbikes = stations.reduce(
    (sum, station) => sum + station.numEbikesAvailable,
    0
  );

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl shadow-2xl border border-blue-500/20 h-full overflow-hidden relative flex flex-col">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 animate-pulse"></div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 relative z-10 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-lg"></div>
            <Bike className="w-5 h-5 text-white relative z-10" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Bluebikes</h2>
            <p className="text-blue-100 text-xs">Washington Square</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm px-4 py-2 border-b border-blue-400/30 relative z-10 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-300">{totalBikes}</div>
            <div className="text-xs text-blue-200">Bikes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-cyan-300">{totalEbikes}</div>
            <div className="text-xs text-cyan-200">E-Bikes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-300">
              {totalDocks}
            </div>
            <div className="text-xs text-green-200">Docks</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex-1 overflow-y-auto relative z-10 min-h-0">
        {stations.length === 0 ? (
          <div className="text-center py-8">
            <Bike className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No mobility data available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stations.map((station) => (
              <div
                key={station.stationId}
                className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-lg p-2 border border-blue-400/20 flex flex-col"
              >
                {/* Station Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3 h-3 text-blue-300" />
                    <h3 className="text-xs font-semibold text-white truncate">
                      {getStationName(station.stationId)}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    {station.isRenting ? (
                      <CheckCircle className="w-2 h-2 text-green-400" />
                    ) : (
                      <XCircle className="w-2 h-2 text-red-400" />
                    )}
                    <span className="text-xs text-gray-300">
                      {station.isRenting ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Availability Grid */}
                <div className="grid grid-cols-3 gap-1 flex-1">
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded p-1 text-center border border-green-400/30 flex flex-col justify-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Bike className="w-2 h-2 text-green-300" />
                      <span className="text-xs text-green-200">Bikes</span>
                    </div>
                    <div className="text-xs font-bold text-green-300">
                      {station.numBikesAvailable}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 backdrop-blur-sm rounded p-1 text-center border border-cyan-400/30 flex flex-col justify-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Zap className="w-2 h-2 text-cyan-300" />
                      <span className="text-xs text-cyan-200">E-Bikes</span>
                    </div>
                    <div className="text-xs font-bold text-cyan-300">
                      {station.numEbikesAvailable}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded p-1 text-center border border-blue-400/30 flex flex-col justify-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Car className="w-2 h-2 text-blue-300" />
                      <span className="text-xs text-blue-200">Docks</span>
                    </div>
                    <div className="text-xs font-bold text-blue-300">
                      {station.numDocksAvailable}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="mt-1 text-center">
                  <span
                    className={`text-xs font-medium ${getAvailabilityColor(
                      station.numBikesAvailable,
                      station.numDocksAvailable
                    )}`}
                  >
                    {getAvailabilityText(
                      station.numBikesAvailable,
                      station.numDocksAvailable
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
