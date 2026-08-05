import { NextResponse } from "next/server";
import type { Stock } from "@/types/dashboard";

const STOCKS = [
  { symbol: "HUBS", name: "HubSpot", image: "/stocks/hubs.svg" },
  { symbol: "NVDA", name: "NVIDIA", image: "/stocks/nvda.svg" },
  { symbol: "GOOGL", name: "Google", image: "/stocks/googl.svg" },
  { symbol: "SPCX", name: "SpaceX", image: "/stocks/spcx.svg" },
] as const;

interface YahooChartMeta {
  symbol?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketTime?: number;
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: YahooChartMeta;
    } | null>;
    error?: { description?: string } | null;
  };
}

async function fetchStockQuote(
  symbol: string,
  name: string,
  image: string
): Promise<Stock> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    "?interval=1d&range=5d&includePrePost=false";

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; HomeDashboard/1.0)",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Yahoo Finance request failed for ${symbol} (${response.status})`
    );
  }

  const payload = (await response.json()) as YahooChartResponse;
  const meta = payload.chart?.result?.[0]?.meta;

  if (!meta) {
    throw new Error(
      payload.chart?.error?.description ||
        `No chart data returned for ${symbol}`
    );
  }

  const price = meta.regularMarketPrice ?? null;
  const previous = meta.chartPreviousClose ?? meta.previousClose ?? null;
  const changePercent =
    price !== null && previous !== null && previous !== 0
      ? ((price - previous) / previous) * 100
      : null;

  return {
    id: symbol.toLowerCase(),
    symbol,
    name,
    image,
    current_price: price,
    price_change_percentage_24h: changePercent,
    high_24h: meta.regularMarketDayHigh ?? null,
    low_24h: meta.regularMarketDayLow ?? null,
    last_updated: meta.regularMarketTime
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const stocks = await Promise.all(
      STOCKS.map((stock) =>
        fetchStockQuote(stock.symbol, stock.name, stock.image)
      )
    );

    return NextResponse.json(stocks);
  } catch (error) {
    console.error("Error in stocks API:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch stock market data",
      },
      { status: 500 }
    );
  }
}
