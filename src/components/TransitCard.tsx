"use client";

import { MBTAStop, MBTAAlert } from "@/types/dashboard";
import {
  Train,
  Clock,
  MapPin,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import AlertModal from "./AlertModal";
import { formatDistanceToNow } from "date-fns";

interface TransitCardProps {
  stops: MBTAStop[];
  alerts: MBTAAlert[];
}

export default function TransitCard({ stops, alerts }: TransitCardProps) {
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getStatusColor = (timeString: string) => {
    const minutes = Math.floor(
      (new Date(timeString).getTime() - Date.now()) / (1000 * 60)
    );
    if (minutes <= 2) return "text-red-600 font-bold";
    return "text-green-600";
  };

  // Group stops by location (Washington or Beaconsfield) and handle separate inbound/outbound stops
  const stopGroups = stops.reduce((groups, stop) => {
    // Extract the location name (Washington or Beaconsfield)
    const locationName = stop.stopName.includes("Washington")
      ? "Washington"
      : "Beaconsfield";

    if (!groups[locationName]) {
      groups[locationName] = {
        outbound: null,
        inbound: null,
      };
    }

    // Determine if this is inbound or outbound based on stop name or stop ID
    if (
      stop.stopName.includes("Outbound") ||
      stop.stopId === "70229" ||
      stop.stopId === "70177"
    ) {
      groups[locationName].outbound = stop;
    } else if (
      stop.stopName.includes("Inbound") ||
      stop.stopId === "70230" ||
      stop.stopId === "70176"
    ) {
      groups[locationName].inbound = stop;
    }

    return groups;
  }, {} as Record<string, { outbound: MBTAStop | null; inbound: MBTAStop | null }>);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 rounded-2xl shadow-2xl border border-green-500/20 h-full overflow-hidden relative flex flex-col">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 animate-pulse"></div>

      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 relative z-10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400/30 rounded-full blur-lg"></div>
              <Train className="w-5 h-5 text-white relative z-10" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Green Line</h2>
              <p className="text-green-100 text-xs">C & D Lines</p>
            </div>
          </div>

          {/* Alert Status */}
          <div className="flex items-center space-x-2">
            {alerts.length > 0 ? (
              <button
                onClick={() => setIsAlertModalOpen(true)}
                className="relative group"
              >
                <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg group-hover:bg-yellow-400/30 transition-all"></div>
                <AlertTriangle className="w-4 h-4 text-yellow-300 relative z-10 group-hover:text-yellow-200 transition-colors" />
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {alerts.length}
                </div>
              </button>
            ) : (
              <div className="flex items-center space-x-2 bg-green-400/20 backdrop-blur-sm rounded-full px-2 py-1 border border-green-400/30">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-200">
                  No active alerts
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex-1 overflow-y-auto relative z-10 min-h-0">
        {stops.length === 0 ? (
          <div className="text-center py-8">
            <Train className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No transit data available</p>
            <p className="text-gray-400 text-sm mt-2">
              Service may be reduced or temporarily unavailable
            </p>
          </div>
        ) : (
          <>
            {/* Data Source Indicator */}
            {stops.some((stop) => stop.dataSource === "scheduled") && (
              <div className="mb-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-blue-400" />
                  <span className="text-xs text-blue-300 font-medium">
                    Scheduled times - Real-time unavailable
                  </span>
                </div>
              </div>
            )}

            {stops.some((stop) => stop.dataSource === "cached") && (
              <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-yellow-300 font-medium">
                    Cached data - API unavailable
                  </span>
                </div>
              </div>
            )}

            {/* Stop Layout - Each stop gets its own row */}
            <div className="space-y-3 h-full">
              {Object.entries(stopGroups).map(([locationName, stops]) => (
                <div
                  key={locationName}
                  className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-lg p-3 border border-green-400/20 flex-1 flex flex-col"
                >
                  {/* Stop Header */}
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-4 h-4 text-green-300" />
                    <h3 className="text-sm font-semibold text-white">
                      {locationName === "Washington"
                        ? `${locationName} Square`
                        : locationName}
                    </h3>
                  </div>

                  {/* Direction Layout within this stop */}
                  <div className="flex gap-3 flex-1">
                    {/* Outbound Column */}
                    <div className="flex-1 flex flex-col">
                      <div className="mb-2 flex items-center space-x-2">
                        <ArrowUp className="w-3 h-3 text-green-400" />
                        <h4 className="text-xs font-semibold text-green-300">
                          Outbound
                        </h4>
                      </div>
                      <div className="space-y-2 flex-1">
                        {stops.outbound &&
                          stops.outbound.predictions
                            .filter((p) => p.direction === 0)
                            .slice(0, 2)
                            .map((prediction, index) => (
                              <div
                                key={index}
                                className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 backdrop-blur-sm rounded p-2 border border-green-400/30 flex-1"
                              >
                                <div className="flex items-center justify-between h-full">
                                  <div className="flex flex-col">
                                    <div className="text-xs text-white font-medium truncate">
                                      {prediction.headsign}
                                      {prediction.dataSource ===
                                        "scheduled" && (
                                        <span className="ml-1 text-xs text-blue-300 font-medium">
                                          (Scheduled)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div
                                      className={`text-xs font-bold ${getStatusColor(
                                        prediction.arrivalTime
                                      )}`}
                                    >
                                      {formatTime(prediction.arrivalTime)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                      </div>
                    </div>

                    {/* Inbound Column */}
                    <div className="flex-1 flex flex-col">
                      <div className="mb-2 flex items-center space-x-2">
                        <ArrowDown className="w-3 h-3 text-blue-400" />
                        <h4 className="text-xs font-semibold text-blue-300">
                          Inbound
                        </h4>
                      </div>
                      <div className="space-y-2 flex-1">
                        {stops.inbound &&
                          stops.inbound.predictions
                            .filter((p) => p.direction === 1)
                            .slice(0, 2)
                            .map((prediction, index) => (
                              <div
                                key={index}
                                className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 backdrop-blur-sm rounded p-2 border border-blue-400/30 flex-1"
                              >
                                <div className="flex items-center justify-between h-full">
                                  <div className="flex flex-col">
                                    <div className="text-xs text-white font-medium truncate">
                                      {prediction.headsign}
                                      {prediction.dataSource ===
                                        "scheduled" && (
                                        <span className="ml-1 text-xs text-blue-300 font-medium">
                                          (Scheduled)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div
                                      className={`text-xs font-bold ${getStatusColor(
                                        prediction.arrivalTime
                                      )}`}
                                    >
                                      {formatTime(prediction.arrivalTime)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Alert Modal */}
      <AlertModal
        alerts={alerts}
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
      />
    </div>
  );
}
