import {
  BluebikesStation,
  DashboardData,
  MBTAStop,
  WeatherData,
  MBTAAlert,
} from "@/types/dashboard";
import { MBTAService } from "./mbta-service";
import { BluebikesService } from "./bluebikes-service";
import { WeatherService } from "./weather-service";
import { BaseService } from "./base-service";
import { CACHE_TTL } from "../constants";
import { env } from "@/config/env";

export class DashboardService extends BaseService {
  private static instance: DashboardService;
  private mbtaService: MBTAService;
  private bluebikesService: BluebikesService;
  private weatherService: WeatherService;

  protected readonly cacheKey = "DASHBOARD" as const;
  protected readonly rateLimitKey = "DASHBOARD_API" as const;
  protected readonly cacheTTL = CACHE_TTL.DASHBOARD;

  private constructor() {
    super();
    this.mbtaService = MBTAService.getInstance();
    this.bluebikesService = BluebikesService.getInstance();
    this.weatherService = WeatherService.getInstance();
  }

  static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  async getDashboardData(): Promise<DashboardData> {
    const cached = this.getCached<DashboardData>();
    if (cached) return cached;

    if (this.isRateLimited()) {
      console.warn("Dashboard API rate limit exceeded, using cached data");
      return cached || this.getEmptyDashboardData();
    }

    try {
      const fetchPromises = [];

      if (env.ENABLE_MBTA) {
        fetchPromises.push(
          this.mbtaService
            .getPredictions()
            .then((data) => ({ type: "mbta", data }))
        );
        fetchPromises.push(
          this.mbtaService
            .getAlerts()
            .then((data) => ({ type: "alerts", data }))
        );
      }

      if (env.ENABLE_BLUEBIKES) {
        fetchPromises.push(
          this.bluebikesService
            .getStationStatus()
            .then((data) => ({ type: "bikes", data }))
        );
      }

      if (env.ENABLE_WEATHER) {
        fetchPromises.push(
          this.weatherService
            .getCurrentWeather()
            .then((data) => ({ type: "weather", data }))
        );
      }

      const results = await Promise.all(fetchPromises);

      const mbtaData =
        (results.find((r) => r.type === "mbta")?.data as MBTAStop[]) || [];
      const bikesData =
        (results.find((r) => r.type === "bikes")?.data as BluebikesStation[]) ||
        [];
      const weatherData =
        (results.find((r) => r.type === "weather")
          ?.data as WeatherData | null) || null;
      const alertsData =
        (results.find((r) => r.type === "alerts")?.data as MBTAAlert[]) || [];

      // Spotify is handled separately via API routes, so we don't fetch it here
      // It's fetched client-side for real-time updates
      const dashboardData: DashboardData = {
        mbta: mbtaData,
        bikes: bikesData,
        weather: weatherData,
        alerts: alertsData,
        spotify: null, // Spotify is fetched separately
        lastUpdated: new Date().toISOString(),
      };

      this.setCached(dashboardData);
      return dashboardData;
    } catch (error) {
      return this.handleError(error, cached || this.getEmptyDashboardData());
    }
  }

  async getSystemStatus(): Promise<{
    mbta: { status: string; message?: string };
    bluebikes: { status: string; message?: string };
    weather: { status: string; message?: string };
  }> {
    const [mbtaStatus, bluebikesStatus] = await Promise.all([
      this.mbtaService.getServiceStatus(),
      this.bluebikesService.getSystemStatus(),
    ]);

    return {
      mbta: mbtaStatus,
      bluebikes: bluebikesStatus,
      weather: { status: env.ENABLE_WEATHER ? "enabled" : "disabled" },
    };
  }

  private getEmptyDashboardData(): DashboardData {
    return {
      mbta: [],
      bikes: [],
      weather: null,
      alerts: [],
      spotify: null,
      lastUpdated: new Date().toISOString(),
    };
  }
}
