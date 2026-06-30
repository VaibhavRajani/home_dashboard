export interface MBTAPrediction {
  arrivalTime: string;
  departureTime: string;
  direction: number;
  headsign: string;
  dataSource?: "realtime" | "scheduled";
}

export interface MBTAStop {
  stopId: string;
  stopName: string;
  predictions: MBTAPrediction[];
  dataSource: "realtime" | "scheduled" | "cached" | "mixed";
}

export interface BluebikesStation {
  stationId: string;
  numBikesAvailable: number;
  numDocksAvailable: number;
  numEbikesAvailable: number;
  numScootersAvailable: number;
  isInstalled: boolean;
  isRenting: boolean;
}

export interface MBTAAlert {
  id: string;
  header: string;
  shortHeader: string;
  description: string;
  severity: number;
  effect: string;
  serviceEffect: string;
  timeframe: string;
  banner?: string;
  url?: string;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  precipitation: number;
  sunrise: string;
  sunset: string;
  hourlyPrecipitation: Array<{
    time: string;
    precipitation: number;
  }>;
}

export interface DashboardData {
  mbta: MBTAStop[];
  bikes: BluebikesStation[];
  weather: WeatherData | null;
  lastUpdated: string;
  alerts: MBTAAlert[];
}

/**
 * Subset of the CoinGecko `/coins/markets` payload that the kiosk
 * crypto dashboard consumes. Only the fields actually rendered are
 * required; everything else from the API is ignored to keep payloads small.
 */
export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  high_24h: number | null;
  low_24h: number | null;
  market_cap?: number | null;
  market_cap_rank?: number | null;
  last_updated?: string | null;
}
