# Brookline Home Dashboard

A Next.js dashboard built for a wall-mounted or tablet display, focused on Brookline, MA transit and local info. Optimized for a 7-inch tablet layout with auto-refreshing data.

## Routes

| Route | Description |
| --- | --- |
| `/` | **Home dashboard** — weather, MBTA transit, and Bluebikes |
| `/crypto` | **Crypto kiosk** — live BTC, ETH, ADA, and LINK prices (dark full-screen UI) |

## Features

### Home dashboard (`/`)

- **MBTA Transit** — Real-time Green Line C & D predictions for Washington Square and Beaconsfield stops, with service alerts and scheduled fallback when live data is unavailable
- **Bluebikes** — Bike and dock availability at nearby stations (Washington Sq, Washington St at Egremont Rd, Beacon St at Tappan St, Coolidge Corner)
- **Weather** — Current conditions for Brookline (optional, disabled by default)
- **Pay Rent** — Quick link to the rent payment page in the footer

### Crypto dashboard (`/crypto`)

- Live market data for **Bitcoin**, **Ethereum**, **Cardano**, and **Chainlink**
- Dark kiosk-style layout with price, 24h change, and high/low
- Auto-refreshes every 60 seconds via the [CoinGecko](https://www.coingecko.com/) public API — no API key required

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Required for MBTA transit (enabled by default)
MBTA_API_KEY=your_mbta_api_key

# Required only if weather is enabled
NEXT_PUBLIC_ENABLE_WEATHER=true
OPENWEATHER_API_KEY=your_openweather_api_key
```

| Variable | Required? | Notes |
| --- | --- | --- |
| `MBTA_API_KEY` | Yes (if MBTA enabled) | Free key from the [MBTA Developer Portal](https://api-v3.mbta.com/) |
| `OPENWEATHER_API_KEY` | Only if weather enabled | Free key from [OpenWeatherMap](https://openweathermap.org/api). Also set `NEXT_PUBLIC_ENABLE_WEATHER=true` |
| Bluebikes | No key needed | Public GBFS feed |
| Crypto (`/crypto`) | No key needed | CoinGecko public API |

### Feature flags

All features are on by default except weather:

```env
NEXT_PUBLIC_ENABLE_MBTA=true
NEXT_PUBLIC_ENABLE_BLUEBIKES=true
NEXT_PUBLIC_ENABLE_WEATHER=false
```

### Refresh intervals (optional)

Override polling intervals in milliseconds:

```env
NEXT_PUBLIC_MBTA_REFRESH_INTERVAL=15000
NEXT_PUBLIC_BIKES_REFRESH_INTERVAL=30000
NEXT_PUBLIC_WEATHER_REFRESH_INTERVAL=300000
```

## Getting Started

Install dependencies:

```bash
npm install
```

On Windows PowerShell, if you see a script execution policy error, use:

```bash
npm.cmd install
```

Run the development server:

```bash
npm run dev
```

Open:

- [http://localhost:3000](http://localhost:3000) — home dashboard
- [http://localhost:3000/crypto](http://localhost:3000/crypto) — crypto kiosk

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home dashboard
│   ├── crypto/page.tsx       # Crypto kiosk
│   └── api/
│       ├── dashboard-data/   # Aggregated MBTA, bikes, weather
│       └── status/           # Service health check
├── components/               # WeatherCard, TransitCard, BikesCard, CryptoCard
├── hooks/                    # useDashboardData, useCryptoMarkets
├── lib/services/             # MBTA, Bluebikes, Weather API clients
└── config/env.ts             # Environment and feature flags
```

## Deploy on Vercel

The project is configured for Vercel deployment. Set `MBTA_API_KEY` (and optionally `OPENWEATHER_API_KEY` + `NEXT_PUBLIC_ENABLE_WEATHER=true`) in your Vercel project environment variables.

```bash
npm run build
npm run start
```

Or connect the repo to [Vercel](https://vercel.com) for automatic deploys.
