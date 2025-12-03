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

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArtUrl: string;
  duration: number;
  progress: number;
  isPlaying: boolean;
  uri: string;
}

export interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  volume: number;
  isActive: boolean;
  isRestricted: boolean;
  supportsVolume: boolean;
}

export interface SpotifyPlayerState {
  track: SpotifyTrack | null;
  device: {
    id: string;
    name: string;
    type: string;
    volume: number;
  } | null;
  isConnected: boolean;
  isAuthenticated: boolean;
}

export interface DashboardData {
  mbta: MBTAStop[];
  bikes: BluebikesStation[];
  weather: WeatherData | null;
  spotify: SpotifyPlayerState | null;
  lastUpdated: string;
  alerts: MBTAAlert[];
}
