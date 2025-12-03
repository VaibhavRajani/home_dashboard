import { BaseService } from "./base-service";
import { SpotifyPlayerState, SpotifyTrack } from "@/types/dashboard";
import { CACHE_TTL } from "../constants";
import { env } from "@/config/env";
import axios from "axios";

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface SpotifyCurrentlyPlayingResponse {
  is_playing: boolean;
  item: {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: {
      name: string;
      images: Array<{ url: string }>;
    };
    duration_ms: number;
    uri: string;
  } | null;
  progress_ms: number;
  device: {
    id: string;
    name: string;
    type: string;
    volume_percent: number;
    is_active: boolean;
  } | null;
}

export class SpotifyService extends BaseService {
  private static instance: SpotifyService;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  protected readonly cacheKey = "SPOTIFY" as const;
  protected readonly rateLimitKey = "SPOTIFY_API" as const;
  protected readonly cacheTTL = CACHE_TTL.SPOTIFY;

  private constructor() {
    super();
  }

  static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  getAuthUrl(state?: string): string {
    const scopes = [
      "user-read-playback-state",
      "user-modify-playback-state",
      "user-read-currently-playing",
    ].join(" ");

    const params = new URLSearchParams({
      client_id: env.SPOTIFY_CLIENT_ID || "",
      response_type: "code",
      redirect_uri: env.SPOTIFY_REDIRECT_URI || "",
      scope: scopes,
      ...(state && { state }),
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const response = await axios.post<SpotifyTokenResponse>(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: env.SPOTIFY_REDIRECT_URI || "",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
              `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
            ).toString("base64")}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000;

      return this.accessToken;
    } catch (error) {
      console.error("Error exchanging code for token:", error);
      throw error;
    }
  }

  setAccessToken(token: string, expiresIn: number): void {
    this.accessToken = token;
    this.tokenExpiry = Date.now() + expiresIn * 1000;
  }

  private async getAccessToken(): Promise<string | null> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }
    return null;
  }

  async getPlayerState(token?: string): Promise<SpotifyPlayerState> {
    const accessToken = token || (await this.getAccessToken());

    if (!accessToken) {
      return {
        track: null,
        device: null,
        isConnected: false,
        isAuthenticated: false,
      };
    }

    try {
      const response = await axios.get<SpotifyCurrentlyPlayingResponse>(
        "https://api.spotify.com/v1/me/player",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.data || !response.data.item) {
        return {
          track: null,
          device: response.data?.device
            ? {
                name: response.data.device.name,
                type: response.data.device.type,
                volume: response.data.device.volume_percent,
              }
            : null,
          isConnected: !!response.data?.device?.is_active,
          isAuthenticated: true,
        };
      }

      const track: SpotifyTrack = {
        id: response.data.item.id,
        name: response.data.item.name,
        artist: response.data.item.artists[0]?.name || "Unknown Artist",
        album: response.data.item.album.name,
        albumArtUrl:
          response.data.item.album.images[0]?.url ||
          "https://via.placeholder.com/300",
        duration: response.data.item.duration_ms,
        progress: response.data.progress_ms,
        isPlaying: response.data.is_playing,
        uri: response.data.item.uri,
      };

      return {
        track,
        device: response.data.device
          ? {
              name: response.data.device.name,
              type: response.data.device.type,
              volume: response.data.device.volume_percent,
            }
          : null,
        isConnected: response.data.device?.is_active || false,
        isAuthenticated: true,
      };
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        // Token expired or invalid
        this.accessToken = null;
        return {
          track: null,
          device: null,
          isConnected: false,
          isAuthenticated: false,
        };
      }

      // Device not active or no playback
      if (
        axiosError.response?.status === 204 ||
        axiosError.response?.status === 404
      ) {
        return {
          track: null,
          device: null,
          isConnected: false,
          isAuthenticated: true,
        };
      }

      return this.handleError(error, {
        track: null,
        device: null,
        isConnected: false,
        isAuthenticated: false,
      });
    }
  }

  async play(token?: string): Promise<void> {
    const accessToken = token || (await this.getAccessToken());
    if (!accessToken) throw new Error("Not authenticated");

    await axios.put(
      "https://api.spotify.com/v1/me/player/play",
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  async pause(token?: string): Promise<void> {
    const accessToken = token || (await this.getAccessToken());
    if (!accessToken) throw new Error("Not authenticated");

    await axios.put(
      "https://api.spotify.com/v1/me/player/pause",
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  async skipNext(token?: string): Promise<void> {
    const accessToken = token || (await this.getAccessToken());
    if (!accessToken) throw new Error("Not authenticated");

    await axios.post(
      "https://api.spotify.com/v1/me/player/next",
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  async skipPrevious(token?: string): Promise<void> {
    const accessToken = token || (await this.getAccessToken());
    if (!accessToken) throw new Error("Not authenticated");

    await axios.post(
      "https://api.spotify.com/v1/me/player/previous",
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  async setVolume(volume: number, token?: string): Promise<void> {
    const accessToken = token || (await this.getAccessToken());
    if (!accessToken) throw new Error("Not authenticated");

    await axios.put(
      `https://api.spotify.com/v1/me/player/volume?volume_percent=${Math.max(
        0,
        Math.min(100, volume)
      )}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }
}
