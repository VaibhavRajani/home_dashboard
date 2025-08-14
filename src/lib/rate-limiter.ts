interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

class RateLimiter {
  private requests = new Map<string, number[]>();

  isAllowed(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const requestTimes = this.requests.get(key) || [];
    const recentRequests = requestTimes.filter((time) => time > windowStart);

    if (recentRequests.length >= config.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, requestTimes] of this.requests.entries()) {
      const recentRequests = requestTimes.filter((time) => now - time < 60000);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

export const RATE_LIMITS = {
  MBTA_API: { windowMs: 1000, maxRequests: 10 },
  MBTA_ALERTS_API: { windowMs: 60000, maxRequests: 5 },
  BLUEBIKES_API: { windowMs: 60000, maxRequests: 30 },
  WEATHER_API: { windowMs: 60000, maxRequests: 60 },
  DASHBOARD_API: { windowMs: 1000, maxRequests: 5 },
} as const;

setInterval(() => {
  rateLimiter.cleanup();
}, 60000);
