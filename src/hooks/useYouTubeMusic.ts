"use client";

import { useCallback, useEffect, useState } from "react";
import { env } from "@/config/env";

export interface YtmTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string | null;
}

export interface YtmState {
  connected: boolean;
  authenticated: boolean;
  playing?: boolean;
  buffering?: boolean;
  adPlaying?: boolean;
  progress: number;
  duration: number;
  volume: number;
  track: YtmTrack | null;
}

interface YtmAuthStatus {
  authenticated: boolean;
  inProgress: boolean;
  error: string | null;
}

function headers() {
  return env.YTM_BRIDGE_KEY ? { "X-Bridge-Key": env.YTM_BRIDGE_KEY } : {};
}

async function bridgeFetch(path: string, options: RequestInit = {}) {
  if (!env.YTM_BRIDGE_URL) throw new Error("YouTube Music bridge URL is not configured.");
  return fetch(env.YTM_BRIDGE_URL.replace(/\/$/, "") + path, {
    ...options,
    headers: { ...headers(), ...(options.headers || {}) },
    cache: "no-store",
  });
}

export function useYouTubeMusic() {
  const [state, setState] = useState<YtmState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!env.YTM_BRIDGE_URL) {
      setError("Set NEXT_PUBLIC_YTM_BRIDGE_URL to the Windows bridge.");
      setLoading(false);
      return;
    }
    try {
      const response = await bridgeFetch("/state");
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Bridge unavailable");
      setState(await response.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to reach YouTube Music bridge.");
    } finally {
      setLoading(false);
    }
  }, []);

  const authStatus = useCallback(async (): Promise<YtmAuthStatus | null> => {
    try {
      const response = await bridgeFetch("/auth/status");
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }, []);

  const startAuth = useCallback(async () => {
    try {
      setError(null);
      const response = await bridgeFetch("/auth/start", { method: "POST" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Could not start authorization.");
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authorization failed.");
    }
  }, [refetch]);

  const command = useCallback(async (commandName: string, data?: number) => {
    try {
      setError(null);
      const response = await bridgeFetch("/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: commandName, ...(data === undefined ? {} : { data }) }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Command failed");
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Command failed.");
    }
  }, [refetch]);

  useEffect(() => {
    refetch();
    const interval = window.setInterval(refetch, env.YTM_REFRESH_INTERVAL);
    return () => window.clearInterval(interval);
  }, [refetch]);

  return { state, loading, error, startAuth, authStatus, command, refetch };
}
