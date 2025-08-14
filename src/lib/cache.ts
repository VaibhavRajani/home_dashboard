interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private store = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.store.clear();
  }
}

export const cache = new Cache();

export const CACHE_KEYS = {
  MBTA: "mbta_data",
  MBTA_ALERTS: "mbta_alerts_data",
  BLUEBIKES: "bluebikes_data",
  WEATHER: "weather_data",
  DASHBOARD: "dashboard_data",
} as const;
