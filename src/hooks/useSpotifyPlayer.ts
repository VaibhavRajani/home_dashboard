"use client";

import { useState, useEffect, useCallback } from "react";
import { SpotifyPlayerState } from "@/types/dashboard";
import { env } from "@/config/env";

interface UseSpotifyPlayerReturn {
  playerState: SpotifyPlayerState | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSpotifyPlayer(
  refreshInterval: number = env.SPOTIFY_REFRESH_INTERVAL
): UseSpotifyPlayerReturn {
  const [playerState, setPlayerState] = useState<SpotifyPlayerState | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayerState = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/spotify/player");

      if (response.status === 401) {
        // Not authenticated
        setPlayerState({
          track: null,
          device: null,
          isConnected: false,
          isAuthenticated: false,
        });
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPlayerState(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch player state";
      setError(errorMessage);
      console.error("Spotify player state fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayerState();
  }, [fetchPlayerState]);

  useEffect(() => {
    const interval = setInterval(fetchPlayerState, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPlayerState, refreshInterval]);

  return {
    playerState,
    loading,
    error,
    refetch: fetchPlayerState,
  };
}

