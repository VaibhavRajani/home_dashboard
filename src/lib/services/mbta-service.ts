import axios from "axios";
import { MBTAStop, MBTAAlert, MBTAPrediction as DashboardMBTAPrediction } from "@/types/dashboard";
import { env } from "@/config/env";
import { BaseService } from "./base-service";
import {
  API_ENDPOINTS,
  MBTA_CONFIG,
  CACHE_TTL,
  API_HEADERS,
} from "../constants";

interface MBTAPredictionResponse {
  attributes: {
    arrival_time: string;
    departure_time: string;
    direction_id: number;
  };
  relationships: {
    stop: { data: { id: string } };
    trip: { data: { id: string } };
  };
}

interface MBTATrip {
  id: string;
  attributes: {
    headsign?: string;
  };
}

interface MBTASchedule {
  attributes: {
    arrival_time: string;
    departure_time: string;
    direction_id: number;
  };
  relationships: {
    stop: { data: { id: string } };
    trip: { data: { id: string } };
  };
}

interface MBTAAlertResponse {
  id: string;
  attributes: {
    header: string;
    short_header: string;
    description: string;
    severity: number;
    effect: string;
    service_effect: string;
    timeframe: string;
    banner: string;
    url: string;
  };
}

export class MBTAService extends BaseService {
  private static instance: MBTAService;

  protected readonly cacheKey = "MBTA" as const;
  protected readonly rateLimitKey = "MBTA_API" as const;
  protected readonly cacheTTL = CACHE_TTL.MBTA;

  static getInstance(): MBTAService {
    if (!MBTAService.instance) {
      MBTAService.instance = new MBTAService();
    }
    return MBTAService.instance;
  }

  async getPredictions(): Promise<MBTAStop[]> {
    const cached = this.getCached<MBTAStop[]>();
    if (cached) return cached;

    if (this.isRateLimited()) {
      console.warn("MBTA API rate limit exceeded, using cached data");
      return cached || [];
    }

    if (!env.MBTA_API_KEY) {
      console.warn("MBTA API key not configured");
      return cached || [];
    }

    try {
      const realtimeData = await this.getRealtimePredictions();
      const scheduledData = await this.getScheduledTimes();

      // Merge real-time and scheduled data, using scheduled as fallback
      const mergedData = this.mergeRealtimeAndScheduled(
        realtimeData,
        scheduledData
      );

      if (mergedData.some((stop) => stop.predictions.length > 0)) {
        this.setCached(mergedData);
        return mergedData;
      }

      console.warn("No real-time or scheduled data available");
      return cached || [];
    } catch (error) {
      return this.handleError(error, cached || []);
    }
  }

  private async getRealtimePredictions(): Promise<MBTAStop[]> {
    if (!env.MBTA_API_KEY) return [];

    const response = await axios.get(API_ENDPOINTS.MBTA.PREDICTIONS, {
      params: {
        "filter[stop]": MBTA_CONFIG.STOPS.join(","),
        "filter[route]": MBTA_CONFIG.ROUTES,
        include: "stop,trip",
        sort: "arrival_time",
      },
      headers: {
        ...API_HEADERS.MBTA,
        "x-api-key": env.MBTA_API_KEY,
      },
    });

    const predictions = response.data.data as MBTAPredictionResponse[];
    const trips =
      (response.data.included?.filter(
        (item: { type: string }) => item.type === "trip"
      ) as MBTATrip[]) || [];
    const now = new Date();

    return MBTA_CONFIG.STOPS.map((stopId) => {
      const stopPredictions = predictions.filter(
        (p: MBTAPredictionResponse) => p.relationships.stop.data.id === stopId
      );

      const currentPredictions = stopPredictions.filter((p: MBTAPredictionResponse) => {
        const arrivalTime = new Date(p.attributes.arrival_time);
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
        return arrivalTime > thirtyMinutesAgo;
      });

      // Debug logging for real-time data
      if (stopPredictions.length > 0 && currentPredictions.length === 0) {
        console.log(
          `Stop ${stopId} has ${stopPredictions.length} predictions but ${currentPredictions.length} after filtering`
        );
        console.log(
          "Sample predictions:",
          stopPredictions.slice(0, 2).map((p) => ({
            arrivalTime: p.attributes.arrival_time,
            direction: p.attributes.direction_id,
            timeDiff: Math.floor(
              (new Date(p.attributes.arrival_time).getTime() - now.getTime()) /
                (1000 * 60)
            ),
          }))
        );
      }

      return {
        stopId,
        stopName: MBTA_CONFIG.STOP_NAMES[stopId] || stopId,
        predictions: currentPredictions.slice(0, 3).map((p: MBTAPredictionResponse) => {
          const trip = trips.find(
            (t: MBTATrip) => t.id === p.relationships.trip.data.id
          );
          const headsign =
            trip?.attributes?.headsign ||
            `Green Line ${
              p.attributes.direction_id === 0 ? "Outbound" : "Inbound"
            }`;

          return {
            arrivalTime: p.attributes.arrival_time,
            departureTime: p.attributes.departure_time,
            direction: p.attributes.direction_id,
            headsign,
            dataSource: "realtime" as const,
          };
        }),
        dataSource: "realtime" as const,
      };
    });
  }

  private async getScheduledTimes(): Promise<MBTAStop[]> {
    if (!env.MBTA_API_KEY) return [];

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const today = now.toISOString().split("T")[0];

    try {
      const response = await axios.get(API_ENDPOINTS.MBTA.SCHEDULES, {
        params: {
          "filter[stop]": MBTA_CONFIG.STOPS.join(","),
          "filter[route]": MBTA_CONFIG.ROUTES,
          "filter[date]": today,
          "filter[min_time]": currentTime,
          include: "stop,trip",
          sort: "arrival_time",
        },
        headers: {
          ...API_HEADERS.MBTA,
          "x-api-key": env.MBTA_API_KEY,
        },
      });

      const schedules = response.data.data as MBTASchedule[];
      const trips =
        (response.data.included?.filter(
          (item: { type: string }) => item.type === "trip"
        ) as MBTATrip[]) || [];

      return MBTA_CONFIG.STOPS.map((stopId) => {
        const stopSchedules = schedules.filter(
          (s: MBTASchedule) => s.relationships.stop.data.id === stopId
        );

        return {
          stopId,
          stopName: MBTA_CONFIG.STOP_NAMES[stopId] || stopId,
          predictions: stopSchedules.slice(0, 3).map((s: MBTASchedule) => {
            const trip = trips.find(
              (t: MBTATrip) => t.id === s.relationships.trip.data.id
            );
            const headsign =
              trip?.attributes?.headsign ||
              `Green Line ${
                s.attributes.direction_id === 0 ? "Outbound" : "Inbound"
              }`;

            return {
              arrivalTime: s.attributes.arrival_time,
              departureTime: s.attributes.departure_time,
              direction: s.attributes.direction_id,
              headsign,
              dataSource: "scheduled" as const,
            };
          }),
          dataSource: "scheduled" as const,
        };
      });
    } catch (error) {
      console.error("Error fetching scheduled times:", error);
      return this.handleError(error, []);
    }
  }

  private mergeRealtimeAndScheduled(
    realtimeData: MBTAStop[],
    scheduledData: MBTAStop[]
  ): MBTAStop[] {
    return MBTA_CONFIG.STOPS.map((stopId) => {
      const realtimeStop = realtimeData.find((stop) => stop.stopId === stopId);
      const scheduledStop = scheduledData.find(
        (stop) => stop.stopId === stopId
      );

      const realtimePredictions = realtimeStop?.predictions || [];
      const scheduledPredictions = scheduledStop?.predictions || [];

      // Group predictions by direction
      const realtimeByDirection = {
        0: realtimePredictions.filter((p) => p.direction === 0),
        1: realtimePredictions.filter((p) => p.direction === 1),
      };

      const scheduledByDirection = {
        0: scheduledPredictions.filter((p) => p.direction === 0),
        1: scheduledPredictions.filter((p) => p.direction === 1),
      };

      // For each direction, use real-time if available, otherwise fall back to scheduled
      const mergedPredictions = [];

      // Helper function to filter out scheduled predictions that are too close to real-time ones
      const filterScheduledPredictions = (
        scheduledPreds: DashboardMBTAPrediction[],
        realtimePreds: DashboardMBTAPrediction[]
      ) => {
        if (realtimePreds.length === 0) return scheduledPreds;

        return scheduledPreds.filter((scheduledPred) => {
          const scheduledTime = new Date(scheduledPred.arrivalTime);
          return !realtimePreds.some((realtimePred) => {
            const realtimeTime = new Date(realtimePred.arrivalTime);
            const timeDiff = Math.abs(
              scheduledTime.getTime() - realtimeTime.getTime()
            );
            return timeDiff < 2 * 60 * 1000; // 2 minutes
          });
        });
      };

      // Outbound (direction 0)
      if (realtimeByDirection[0].length > 0) {
        console.log(
          `Stop ${stopId} outbound: Using ${realtimeByDirection[0].length} real-time predictions`
        );
        // Add all available real-time predictions (up to 2)
        mergedPredictions.push(
          ...realtimeByDirection[0].slice(0, 2).map((p) => ({
            ...p,
            dataSource: "realtime" as const,
          }))
        );

        // If we have less than 2 real-time predictions and there are scheduled predictions, add scheduled to fill the gap
        if (
          realtimeByDirection[0].length < 2 &&
          scheduledByDirection[0].length > 0
        ) {
          const remainingSlots = 2 - realtimeByDirection[0].length;
          const filteredScheduled = filterScheduledPredictions(
            scheduledByDirection[0],
            realtimeByDirection[0]
          );
          const scheduledToAdd = filteredScheduled.slice(0, remainingSlots);
          console.log(
            `Stop ${stopId} outbound: Adding ${scheduledToAdd.length} scheduled predictions to fill gap`
          );
          mergedPredictions.push(
            ...scheduledToAdd.map((p) => ({
              ...p,
              dataSource: "scheduled" as const,
            }))
          );
        }
      } else if (scheduledByDirection[0].length > 0) {
        console.log(
          `Stop ${stopId} outbound: No real-time data, using ${scheduledByDirection[0].length} scheduled predictions`
        );
        mergedPredictions.push(
          ...scheduledByDirection[0].slice(0, 2).map((p) => ({
            ...p,
            dataSource: "scheduled" as const,
          }))
        );
      } else {
        console.log(
          `Stop ${stopId} outbound: No real-time or scheduled data available`
        );
      }

      // Inbound (direction 1)
      if (realtimeByDirection[1].length > 0) {
        console.log(
          `Stop ${stopId} inbound: Using ${realtimeByDirection[1].length} real-time predictions`
        );
        // Add all available real-time predictions (up to 2)
        mergedPredictions.push(
          ...realtimeByDirection[1].slice(0, 2).map((p) => ({
            ...p,
            dataSource: "realtime" as const,
          }))
        );

        // If we have less than 2 real-time predictions and there are scheduled predictions, add scheduled to fill the gap
        if (
          realtimeByDirection[1].length < 2 &&
          scheduledByDirection[1].length > 0
        ) {
          const remainingSlots = 2 - realtimeByDirection[1].length;
          const filteredScheduled = filterScheduledPredictions(
            scheduledByDirection[1],
            realtimeByDirection[1]
          );
          const scheduledToAdd = filteredScheduled.slice(0, remainingSlots);
          console.log(
            `Stop ${stopId} inbound: Adding ${scheduledToAdd.length} scheduled predictions to fill gap`
          );
          mergedPredictions.push(
            ...scheduledToAdd.map((p) => ({
              ...p,
              dataSource: "scheduled" as const,
            }))
          );
        }
      } else if (scheduledByDirection[1].length > 0) {
        console.log(
          `Stop ${stopId} inbound: No real-time data, using ${scheduledByDirection[1].length} scheduled predictions`
        );
        mergedPredictions.push(
          ...scheduledByDirection[1].slice(0, 2).map((p) => ({
            ...p,
            dataSource: "scheduled" as const,
          }))
        );
      } else {
        console.log(
          `Stop ${stopId} inbound: No real-time or scheduled data available`
        );
      }

      return {
        stopId,
        stopName: MBTA_CONFIG.STOP_NAMES[stopId] || stopId,
        predictions: mergedPredictions,
        dataSource: mergedPredictions.some((p) => p.dataSource === "scheduled")
          ? ("mixed" as const)
          : ("realtime" as const),
      };
    });
  }

  async getAlerts(): Promise<MBTAAlert[]> {
    const cached = this.getCached<MBTAAlert[]>();
    if (cached) return cached;

    if (this.isRateLimited()) {
      console.warn("MBTA Alerts API rate limit exceeded, using cached data");
      return cached || [];
    }

    if (!env.MBTA_API_KEY) {
      console.warn("MBTA API key not configured");
      return [];
    }

    try {
      const response = await axios.get(API_ENDPOINTS.MBTA.ALERTS, {
        params: {
          "filter[route]": MBTA_CONFIG.ROUTES,
          "filter[activity]": "BOARD,EXIT,RIDE",
        },
        headers: {
          ...API_HEADERS.MBTA,
          "x-api-key": env.MBTA_API_KEY,
        },
      });

      const alerts: MBTAAlert[] = (
        response.data.data as MBTAAlertResponse[]
      ).map((alert: MBTAAlertResponse) => ({
        id: alert.id,
        header: alert.attributes.header,
        shortHeader: alert.attributes.short_header,
        description: alert.attributes.description,
        severity: alert.attributes.severity,
        effect: alert.attributes.effect,
        serviceEffect: alert.attributes.service_effect,
        timeframe: alert.attributes.timeframe,
        banner: alert.attributes.banner,
        url: alert.attributes.url,
      }));

      this.setCached(alerts);
      return alerts;
    } catch (error) {
      return this.handleError(error, cached || []);
    }
  }

  async getServiceStatus(): Promise<{ status: string; message?: string }> {
    if (!env.MBTA_API_KEY) {
      return { status: "unknown", message: "API key not configured" };
    }

    try {
      const response = await axios.get(API_ENDPOINTS.MBTA.ALERTS, {
        params: {
          "filter[route]": "Green-C",
          "filter[activity]": "BOARD,EXIT,RIDE",
        },
        headers: {
          ...API_HEADERS.MBTA,
          "x-api-key": env.MBTA_API_KEY,
        },
      });

      const alerts = response.data.data as MBTAAlertResponse[];
      if (alerts.length > 0) {
        return {
          status: "delays",
          message: alerts[0].attributes.header,
        };
      }

      return { status: "normal" };
    } catch (error) {
      return this.handleError(error, { status: "unknown" });
    }
  }
}
