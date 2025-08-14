import axios from "axios";
import { BluebikesStation } from "@/types/dashboard";
import { BaseService } from "./base-service";
import { API_ENDPOINTS, BLUEBIKES_CONFIG, CACHE_TTL } from "../constants";

interface BluebikesStationResponse {
  station_id: string;
  name: string;
  num_bikes_available: number;
  num_docks_available: number;
  num_ebikes_available?: number;
  num_scooters_available?: number;
  is_installed: boolean;
  is_renting: boolean;
}

interface BluebikesSystemStatus {
  is_renting: boolean;
}

export class BluebikesService extends BaseService {
  private static instance: BluebikesService;

  protected readonly cacheKey = "BLUEBIKES" as const;
  protected readonly rateLimitKey = "BLUEBIKES_API" as const;
  protected readonly cacheTTL = CACHE_TTL.BLUEBIKES;

  static getInstance(): BluebikesService {
    if (!BluebikesService.instance) {
      BluebikesService.instance = new BluebikesService();
    }
    return BluebikesService.instance;
  }

  async getStationStatus(): Promise<BluebikesStation[]> {
    const cached = this.getCached<BluebikesStation[]>();
    if (cached) return cached;

    if (this.isRateLimited()) {
      console.warn("Bluebikes API rate limit exceeded, using cached data");
      return cached || [];
    }

    try {
      const response = await axios.get(API_ENDPOINTS.BLUEBIKES.STATION_STATUS);
      const stations = response.data.data
        .stations as BluebikesStationResponse[];

      const brooklineStations = stations
        .filter((station: BluebikesStationResponse) =>
          BLUEBIKES_CONFIG.STATIONS.includes(station.station_id as string)
        )
        .map((station: BluebikesStationResponse) => ({
          stationId: station.station_id,
          name: station.name,
          numBikesAvailable: station.num_bikes_available,
          numDocksAvailable: station.num_docks_available,
          numEbikesAvailable: station.num_ebikes_available || 0,
          numScootersAvailable: station.num_scooters_available || 0,
          isInstalled: station.is_installed,
          isRenting: station.is_renting,
        }));

      this.setCached(brooklineStations);
      return brooklineStations;
    } catch (error) {
      return this.handleError(error, cached || []);
    }
  }

  async getSystemStatus(): Promise<{ status: string; message?: string }> {
    try {
      const response = await axios.get(API_ENDPOINTS.BLUEBIKES.SYSTEM_STATUS);
      const systemStatus = response.data.data as BluebikesSystemStatus;

      if (systemStatus.is_renting) {
        return { status: "operational" };
      } else {
        return {
          status: "maintenance",
          message: "System temporarily unavailable",
        };
      }
    } catch (error) {
      return this.handleError(error, { status: "unknown" });
    }
  }
}
