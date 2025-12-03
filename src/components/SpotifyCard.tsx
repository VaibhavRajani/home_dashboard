"use client";

import { SpotifyPlayerState, SpotifyDevice } from "@/types/dashboard";
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  LogIn,
  Radio,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface SpotifyCardProps {
  playerState: SpotifyPlayerState | null;
}

export default function SpotifyCard({ playerState }: SpotifyCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localState, setLocalState] = useState<SpotifyPlayerState | null>(
    playerState
  );
  const [progress, setProgress] = useState(0);
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

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

  // Fetch devices when authenticated
  useEffect(() => {
    if (localState?.isAuthenticated) {
      fetchDevices();
    }
  }, [localState?.isAuthenticated]);

  // Close device selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        showDeviceSelector &&
        !target.closest('[data-device-selector]')
      ) {
        setShowDeviceSelector(false);
      }
    };

    if (showDeviceSelector) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showDeviceSelector]);

  const fetchDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const response = await fetch("/api/spotify/devices");
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const handleTransferDevice = async (deviceId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/spotify/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceId }),
      });

      if (response.ok) {
        setShowDeviceSelector(false);
        // Refresh player state after transfer
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
      console.error("Error transferring device:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
    async (
      action: "play" | "pause" | "next" | "previous" | "volume",
      volume?: number,
      deviceId?: string
    ) => {
      setIsLoading(true);
      try {
        let endpoint = "";
        const method = "POST";
        let body: { volume?: number; deviceId?: string } = {};

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
            body = { volume, deviceId };
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

          {/* Device Selector */}
          {isAuthenticated && (
            <div className="relative" data-device-selector>
              <button
                onClick={() => {
                  setShowDeviceSelector(!showDeviceSelector);
                  if (!showDeviceSelector) {
                    fetchDevices();
                  }
                }}
                className="flex items-center space-x-1 text-xs text-purple-100 hover:text-white transition-colors"
                disabled={isLoadingDevices}
              >
                <Radio className="w-3 h-3" />
                <span className="truncate max-w-[80px]">
                  {localState?.device?.name || "Select Device"}
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* Device Dropdown */}
              {showDeviceSelector && (
                <div className="absolute right-0 top-full mt-2 bg-slate-800 rounded-lg shadow-xl border border-purple-500/30 min-w-[200px] max-h-[200px] overflow-y-auto z-20">
                  {isLoadingDevices ? (
                    <div className="p-3 text-center text-purple-300 text-xs">
                      Loading devices...
                    </div>
                  ) : devices.length === 0 ? (
                    <div className="p-3 text-center text-purple-300 text-xs">
                      No devices found
                    </div>
                  ) : (
                    devices.map((device) => (
                      <button
                        key={device.id}
                        onClick={() => {
                          if (device.id !== localState?.device?.id) {
                            handleTransferDevice(device.id);
                          } else {
                            setShowDeviceSelector(false);
                          }
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-purple-500/20 transition-colors flex items-center justify-between ${
                          device.id === localState?.device?.id
                            ? "bg-purple-500/30 text-white"
                            : "text-purple-200"
                        } ${device.isRestricted ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={device.isRestricted || isLoading}
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Radio className="w-3 h-3 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium">
                              {device.name}
                            </div>
                            <div className="text-purple-400 text-[10px]">
                              {device.type}
                              {device.isActive && " • Active"}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
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
            <p className="text-gray-400 text-sm mb-4">
              Select a device to start playing
            </p>
            <button
              onClick={() => {
                setShowDeviceSelector(!showDeviceSelector);
                if (!showDeviceSelector) {
                  fetchDevices();
                }
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 text-sm font-medium"
            >
              <Radio className="w-4 h-4" />
              <span>Select Device</span>
            </button>
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
                <Image
                  src={track.albumArtUrl}
                  alt={track.album}
                  width={192}
                  height={192}
                  className="w-48 h-48 rounded-2xl shadow-2xl relative z-10 object-cover"
                  unoptimized
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
                    handlePlayerAction(
                      "volume",
                      parseInt(e.target.value),
                      localState.device?.id
                    )
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

