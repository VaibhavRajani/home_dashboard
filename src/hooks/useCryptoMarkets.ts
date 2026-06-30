"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Coin } from "@/types/dashboard";

const COINGECKO_MARKETS_URL =
  "https://api.coingecko.com/api/v3/coins/markets" +
  "?vs_currency=usd" +
  "&ids=bitcoin,ethereum,cardano,chainlink" +
  "&order=market_cap_desc" +
  "&per_page=4" +
  "&page=1" +
  "&sparkline=false" +
  "&price_change_percentage=24h";

/**
 * Preferred display order, independent of what CoinGecko returns.
 * Falls back to `market_cap_desc` ordering for any coin not listed here.
 */
const DISPLAY_ORDER = ["bitcoin", "ethereum", "cardano", "chainlink"] as const;

export interface UseCryptoMarketsOptions {
  /** Polling cadence in milliseconds. Defaults to 60s. */
  refreshInterval?: number;
  /** Whether to automatically poll on an interval. Defaults to `true`. */
  autoRefresh?: boolean;
}

export interface UseCryptoMarketsResult {
  coins: Coin[] | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

function sortCoins(coins: Coin[]): Coin[] {
  return [...coins].sort((a, b) => {
    const ai = DISPLAY_ORDER.indexOf(a.id as (typeof DISPLAY_ORDER)[number]);
    const bi = DISPLAY_ORDER.indexOf(b.id as (typeof DISPLAY_ORDER)[number]);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

/**
 * Fetches market data for the configured coins from CoinGecko and
 * keeps it fresh on a fixed polling interval (default 60s — well
 * under the public free-tier rate limit). Safe to unmount mid-flight:
 * stale responses are ignored after the component is torn down.
 */
export function useCryptoMarkets(
  options: UseCryptoMarketsOptions = {}
): UseCryptoMarketsResult {
  const { refreshInterval = 60_000, autoRefresh = true } = options;

  const [coins, setCoins] = useState<Coin[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isMountedRef = useRef(true);

  const fetchMarkets = useCallback(async () => {
    setRefreshing(true);

    try {
      const response = await fetch(COINGECKO_MARKETS_URL, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `CoinGecko request failed (${response.status} ${response.statusText})`
        );
      }

      const payload = (await response.json()) as Coin[] | unknown;
      if (!Array.isArray(payload)) {
        throw new Error("Unexpected response shape from CoinGecko");
      }

      if (!isMountedRef.current) return;

      setCoins(sortCoins(payload as Coin[]));
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;
      const message =
        err instanceof Error ? err.message : "Failed to load market data";
      setError(message);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchMarkets();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchMarkets]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(fetchMarkets, refreshInterval);
    return () => window.clearInterval(id);
  }, [autoRefresh, refreshInterval, fetchMarkets]);

  return {
    coins,
    loading,
    refreshing,
    error,
    lastUpdated,
    refetch: fetchMarkets,
  };
}
