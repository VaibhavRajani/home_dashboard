"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Stock } from "@/types/dashboard";

const DISPLAY_ORDER = ["hubs", "nvda", "googl", "spcx"] as const;

export interface UseStockMarketsOptions {
  /** Polling cadence in milliseconds. Defaults to 60s. */
  refreshInterval?: number;
  /** Whether to automatically poll on an interval. Defaults to `true`. */
  autoRefresh?: boolean;
}

export interface UseStockMarketsResult {
  stocks: Stock[] | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

function sortStocks(stocks: Stock[]): Stock[] {
  return [...stocks].sort((a, b) => {
    const ai = DISPLAY_ORDER.indexOf(a.id as (typeof DISPLAY_ORDER)[number]);
    const bi = DISPLAY_ORDER.indexOf(b.id as (typeof DISPLAY_ORDER)[number]);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

/**
 * Fetches HubSpot, NVIDIA, Google, and SpaceX quotes via the
 * local `/api/stocks` proxy (Yahoo Finance) and keeps them fresh
 * on a fixed interval. Safe to unmount mid-flight.
 */
export function useStockMarkets(
  options: UseStockMarketsOptions = {}
): UseStockMarketsResult {
  const { refreshInterval = 60_000, autoRefresh = true } = options;

  const [stocks, setStocks] = useState<Stock[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isMountedRef = useRef(true);

  const fetchMarkets = useCallback(async () => {
    setRefreshing(true);

    try {
      const response = await fetch("/api/stocks", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          body?.error ||
            `Stock request failed (${response.status} ${response.statusText})`
        );
      }

      const payload = (await response.json()) as Stock[] | unknown;
      if (!Array.isArray(payload)) {
        throw new Error("Unexpected response shape from stocks API");
      }

      if (!isMountedRef.current) return;

      setStocks(sortStocks(payload as Stock[]));
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;
      const message =
        err instanceof Error ? err.message : "Failed to load stock data";
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
    stocks,
    loading,
    refreshing,
    error,
    lastUpdated,
    refetch: fetchMarkets,
  };
}
