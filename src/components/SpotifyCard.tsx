"use client";

import { SpotifyPlayerState } from "@/types/dashboard";
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  LogIn,
  Radio,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";

interface SpotifyCardProps {
  playerState: SpotifyPlayerState | null;
}

export default function SpotifyCard({ playerState }: SpotifyCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localState, setLocalState] = useState<SpotifyPlayerState | null>(
    playerState
  );
  const [progress, setProgress] = useState(0);

  // Update local state when prop changes
  useEffect(() => {
    setLocalState(playerState);
    if (playerState?.track) {
      setProgress(playerState.track.progress);
    }
  }, [playerState]);

  // Update progress while playing
  useEffect(() => {
    if (!localState?.track?.isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= (localState.track?.duration || 0)) {
          return 0;
        }
        return prev + 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [localState?.track?.isPlaying, localState?.track?.duration]);

  const handleAuth = async () => {
    try {
      const response = await fetch("/api/spotify/auth");
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Error initiating auth:", error);
    }
  };

  const handlePlayerAction = useCallback(
    async (action: "play" | "pause" | "next" | "previous" | "volume", volume?: number) => {
      setIsLoading(true);
      try {
        let endpoint = "";
        let method = "POST";
        let body: any = {};

        switch (action) {
          case "play":
            endpoint = "/api/spotify/player/play";
            break;
          case "pause":
            endpoint = "/api/spotify/player/pause";
            break;
          case "next":
            endpoint = "/api/spotify/player/next";
            break;
          case "previous":
            endpoint = "/api/spotify/player/previous";
            break;
          case "volume":
            endpoint = "/api/spotify/player/volume";
            body = { volume };
            break;
        }

        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          ...(Object.keys(body).length > 0 && { body: JSON.stringify(body) }),
        });

        if (response.ok) {
          // Optimistically update UI
          if (action === "play") {
            setLocalState((prev) =>
              prev && prev.track
                ? { ...prev, track: { ...prev.track, isPlaying: true } }
                : prev
            );
          } else if (action === "pause") {
            setLocalState((prev) =>
              prev && prev.track
                ? { ...prev, track: { ...prev.track, isPlaying: false } }
                : prev
            );
          }

          // Refresh player state after a short delay
          setTimeout(async () => {
            try {
              const stateResponse = await fetch("/api/spotify/player");
              if (stateResponse.ok) {
                const newState = await stateResponse.json();
                setLocalState(newState);
              }
            } catch (error) {
              console.error("Error refreshing state:", error);
            }
          }, 500);
        }
      } catch (error) {
        console.error(`Error ${action}:`, error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercent =
    localState?.track && localState.track.duration > 0
      ? (progress / localState.track.duration) * 100
      : 0;

  const isAuthenticated = localState?.isAuthenticated || false;
  const isConnected = localState?.isConnected || false;
  const track = localState?.track;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl border border-purple-500/20 h-full overflow-hidden relative flex flex-col">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse"></div>

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 relative z-10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-400/30 rounded-full blur-lg"></div>
              <Music className="w-5 h-5 text-white relative z-10" />
            </div>
            <div className="flex gap-2 items-center">
              <h2 className="text-lg font-bold text-white">Spotify</h2>
              {isConnected && (
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></div>
                  <span className="text-purple-100 text-xs">Connected</span>
                </div>
              )}
            </div>
          </div>

          {/* Device Info */}
          {localState?.device && (
            <div className="flex items-center space-x-2">
              <Radio className="w-3 h-3 text-purple-200" />
              <span className="text-xs text-purple-100 truncate max-w-[100px]">
                {localState.device.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 overflow-y-auto relative z-10 min-h-0 flex flex-col">
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 text-lg font-semibold mb-2">
              Connect to Spotify
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Sign in to control your music playback
            </p>
            <button
              onClick={handleAuth}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 font-medium"
            >
              <LogIn className="w-4 h-4" />
              <span>Connect Spotify</span>
            </button>
          </div>
        ) : !isConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <Radio className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 text-lg font-semibold mb-2">
              No Active Device
            </p>
            <p className="text-gray-400 text-sm">
              Start playing music on a Spotify device to control it here
            </p>
          </div>
        ) : !track ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 text-lg font-semibold mb-2">
              Nothing Playing
            </p>
            <p className="text-gray-400 text-sm">
              Start playing music to see it here
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Album Art */}
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl"></div>
                <img
                  src={track.albumArtUrl}
                  alt={track.album}
                  className="w-48 h-48 rounded-2xl shadow-2xl relative z-10 object-cover"
                />
              </div>
            </div>

            {/* Track Info */}
            <div className="mb-4 text-center">
              <h3 className="text-lg font-bold text-white mb-1 truncate">
                {track.name}
              </h3>
              <p className="text-sm text-purple-200 mb-1 truncate">
                {track.artist}
              </p>
              <p className="text-xs text-purple-300 truncate">{track.album}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-purple-300 mb-1">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(track.duration)}</span>
              </div>
              <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4 mb-4">
              <button
                onClick={() => handlePlayerAction("previous")}
                disabled={isLoading}
                className="bg-slate-700/50 hover:bg-slate-700 text-white p-2 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={() =>
                  handlePlayerAction(track.isPlaying ? "pause" : "play")
                }
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-4 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {track.isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </button>

              <button
                onClick={() => handlePlayerAction("next")}
                disabled={isLoading}
                className="bg-slate-700/50 hover:bg-slate-700 text-white p-2 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Volume Control */}
            {localState.device && (
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-purple-300" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localState.device.volume}
                  onChange={(e) =>
                    handlePlayerAction("volume", parseInt(e.target.value))
                  }
                  className="flex-1 h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <span className="text-xs text-purple-300 w-8 text-right">
                  {localState.device.volume}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

