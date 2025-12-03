// Environment configuration with validation
export const env = {
  // API Keys
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
  MBTA_API_KEY: process.env.MBTA_API_KEY,
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,

  // URLs
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || "",
  SPOTIFY_REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI || "",

  // Feature flags
  ENABLE_WEATHER: process.env.NEXT_PUBLIC_ENABLE_WEATHER === "true",
  ENABLE_MBTA: process.env.NEXT_PUBLIC_ENABLE_MBTA !== "false",
  ENABLE_BLUEBIKES: process.env.NEXT_PUBLIC_ENABLE_BLUEBIKES !== "false",
  ENABLE_SPOTIFY: process.env.NEXT_PUBLIC_ENABLE_SPOTIFY !== "false",

  // Refresh intervals (in milliseconds)
  MBTA_REFRESH_INTERVAL: parseInt(
    process.env.NEXT_PUBLIC_MBTA_REFRESH_INTERVAL || "15000"
  ),
  BIKES_REFRESH_INTERVAL: parseInt(
    process.env.NEXT_PUBLIC_BIKES_REFRESH_INTERVAL || "30000"
  ),
  WEATHER_REFRESH_INTERVAL: parseInt(
    process.env.NEXT_PUBLIC_WEATHER_REFRESH_INTERVAL || "300000"
  ),
  SPOTIFY_REFRESH_INTERVAL: parseInt(
    process.env.NEXT_PUBLIC_SPOTIFY_REFRESH_INTERVAL || "2000"
  ),
} as const;

// Validate required environment variables
export function validateEnv() {
  const errors: string[] = [];

  // Only validate weather API key if weather is explicitly enabled
  if (env.ENABLE_WEATHER && !env.OPENWEATHER_API_KEY) {
    errors.push("OPENWEATHER_API_KEY is required when weather is enabled");
  }

  // Validate MBTA API key if MBTA is enabled
  if (env.ENABLE_MBTA && !env.MBTA_API_KEY) {
    errors.push("MBTA_API_KEY is required when MBTA is enabled");
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join("\n")}`);
  }
}
