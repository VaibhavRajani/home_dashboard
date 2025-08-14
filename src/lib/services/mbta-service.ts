import axios from "axios";
import { MBTAStop, MBTAAlert } from "@/types/dashboard";
import { env } from "@/config/env";
import { BaseService } from "./base-service";
import {
  API_ENDPOINTS,
  MBTA_CONFIG,
  CACHE_TTL,
  API_HEADERS,
} from "../constants";

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

      const totalPredictions = realtimeData.reduce(
        (sum, stop) => sum + stop.predictions.length,
        0
      );

      if (totalPredictions > 0) {
        this.setCached(realtimeData);
        return realtimeData;
      }

      const scheduledData = await this.getScheduledTimes();
      if (scheduledData.length > 0) {
        this.setCached(scheduledData);
        return scheduledData;
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

    const predictions = response.data.data;
    const trips =
      response.data.included?.filter((item: any) => item.type === "trip") || [];
    const now = new Date();

    return MBTA_CONFIG.STOPS.map((stopId) => {
      const stopPredictions = predictions.filter(
        (p: any) => p.relationships.stop.data.id === stopId
      );

      const currentPredictions = stopPredictions.filter((p: any) => {
        const arrivalTime = new Date(p.attributes.arrival_time);
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        return arrivalTime > oneHourAgo;
      });

      return {
        stopId,
        stopName: MBTA_CONFIG.STOP_NAMES[stopId] || stopId,
        predictions: currentPredictions.slice(0, 3).map((p: any) => {
          const trip = trips.find(
            (t: any) => t.id === p.relationships.trip.data.id
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

      const schedules = response.data.data;
      const trips =
        response.data.included?.filter((item: any) => item.type === "trip") ||
        [];

      return MBTA_CONFIG.STOPS.map((stopId) => {
        const stopSchedules = schedules.filter(
          (s: any) => s.relationships.stop.data.id === stopId
        );

        return {
          stopId,
          stopName: MBTA_CONFIG.STOP_NAMES[stopId] || stopId,
          predictions: stopSchedules.slice(0, 3).map((s: any) => {
            const trip = trips.find(
              (t: any) => t.id === s.relationships.trip.data.id
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
            };
          }),
          dataSource: "scheduled" as const,
        };
      });
    } catch (error) {
      return this.handleError(error, []);
    }
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

      const alerts: MBTAAlert[] = response.data.data.map((alert: any) => ({
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

      const alerts = response.data.data;
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
