"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardData } from "@/types/dashboard";
import { fetchDashboardData, APIError } from "@/lib/api";

interface UseDashboardDataOptions {
  refreshInterval?: number;
  autoRefresh?: boolean;
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useDashboardData(
  options: UseDashboardDataOptions = {}
): UseDashboardDataReturn {
  const { refreshInterval = 30000, autoRefresh = true } = options;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await fetchDashboardData();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage =
        err instanceof APIError ? err.message : "Failed to fetch data";
      setError(errorMessage);
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval, autoRefresh]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    lastUpdated,
  };
}
