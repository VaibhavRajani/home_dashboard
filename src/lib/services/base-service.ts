import { cache, CACHE_KEYS } from "../cache";
import { rateLimiter, RATE_LIMITS } from "../rate-limiter";
import { env } from "@/config/env";

export abstract class BaseService {
  protected abstract readonly cacheKey: keyof typeof CACHE_KEYS;
  protected abstract readonly rateLimitKey: keyof typeof RATE_LIMITS;
  protected abstract readonly cacheTTL: number;

  protected getCached<T>(): T | null {
    return cache.get<T>(CACHE_KEYS[this.cacheKey]);
  }

  protected setCached<T>(data: T): void {
    cache.set(CACHE_KEYS[this.cacheKey], data, this.cacheTTL);
  }

  protected isRateLimited(): boolean {
    return !rateLimiter.isAllowed(
      this.rateLimitKey,
      RATE_LIMITS[this.rateLimitKey]
    );
  }

  protected handleError<T>(error: any, fallback: T): T {
    console.error(`Error in ${this.constructor.name}:`, error);
    return fallback;
  }
}
