export const API_ENDPOINTS = {
  MBTA: {
    PREDICTIONS: "https://api-v3.mbta.com/predictions",
    SCHEDULES: "https://api-v3.mbta.com/schedules",
    ALERTS: "https://api-v3.mbta.com/alerts",
  },
  BLUEBIKES: {
    STATION_STATUS: "https://gbfs.bluebikes.com/gbfs/en/station_status.json",
    SYSTEM_STATUS: "https://gbfs.bluebikes.com/gbfs/en/system_status.json",
    STATION_INFO: "https://gbfs.bluebikes.com/gbfs/en/station_information.json",
  },
  WEATHER: {
    CURRENT: "https://api.openweathermap.org/data/2.5/weather",
    FORECAST: "https://api.openweathermap.org/data/2.5/forecast",
    ONECALL: "https://api.openweathermap.org/data/2.5/onecall",
  },
} as const;

export const LOCATIONS = {
  BROOKLINE: {
    lat: 42.3318,
    lon: -71.1212,
  },
} as const;

export const MBTA_CONFIG = {
  STOPS: [
    "70229", // Washington Square - Cleveland Circle (C outbound)
    "70230", // Washington Square - Park Street (C inbound)
    "70176", // Beaconsfield - Park Street (D inbound)
    "70177", // Beaconsfield - Riverside (D outbound)
  ],
  ROUTES: "Green-C,Green-D",
  STOP_NAMES: {
    "70229": "Washington Square (C Outbound)",
    "70230": "Washington Square (C Inbound)",
    "70176": "Beaconsfield (D Inbound)",
    "70177": "Beaconsfield (D Outbound)",
  } as Record<string, string>,
} as const;

export const BLUEBIKES_CONFIG = {
  STATIONS: [
    "270ad97d-035d-472a-9827-76d3187afc56", // Washington Sq
    "510239fe-69c3-458b-b53c-6ce001845f4a", // Washington St at Egremont Rd
    "f8349ed6-0de8-11e7-991c-3863bb43a7d0", // Beacon St at Tappan St
    "f83494b4-0de8-11e7-991c-3863bb43a7d0", // Coolidge Corner
  ] as string[],
  STATION_NAMES: {
    "270ad97d-035d-472a-9827-76d3187afc56": "Washington Sq",
    "510239fe-69c3-458b-b53c-6ce001845f4a": "Washington St at Egremont Rd",
    "f8349ed6-0de8-11e7-991c-3863bb43a7d0": "Beacon St at Tappan St",
    "f83494b4-0de8-11e7-991c-3863bb43a7d0": "Coolidge Corner",
  } as Record<string, string>,
} as const;

export const CACHE_TTL = {
  MBTA: 15 * 1000, // 15 seconds
  MBTA_ALERTS: 10 * 60 * 1000, // 10 minutes
  BLUEBIKES: 30 * 1000, // 30 seconds
  WEATHER: 5 * 60 * 1000, // 5 minutes
  DASHBOARD: 10 * 1000, // 10 seconds
} as const;

export const API_HEADERS = {
  MBTA: {
    Accept: "application/vnd.api+json",
  },
} as const;
