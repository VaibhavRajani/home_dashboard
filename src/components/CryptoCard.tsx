"use client";

import Image from "next/image";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Coin } from "@/types/dashboard";

interface CryptoCardProps {
  coin: Coin;
}

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const subPriceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  // Show more precision for sub-dollar assets so values like $0.4123 remain legible.
  if (Math.abs(value) > 0 && Math.abs(value) < 1) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 4,
    }).format(value);
  }
  return priceFormatter.format(value);
}

function formatSubPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (Math.abs(value) > 0 && Math.abs(value) < 1) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 4,
    }).format(value);
  }
  return subPriceFormatter.format(value);
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export default function CryptoCard({ coin }: CryptoCardProps) {
  const change = coin.price_change_percentage_24h ?? 0;
  const isPositive = change >= 0;

  const trendColor = isPositive ? "text-emerald-400" : "text-rose-400";
  const trendBg = isPositive
    ? "bg-emerald-500/10 ring-emerald-500/30"
    : "bg-rose-500/10 ring-rose-500/30";

  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <article
      className="relative flex h-full flex-col justify-between rounded-2xl bg-slate-900/80 p-5 ring-1 ring-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur"
      aria-label={`${coin.name} market snapshot`}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {coin.image ? (
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10 bg-slate-800">
              <Image
                src={coin.image}
                alt={`${coin.name} logo`}
                fill
                sizes="44px"
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="h-11 w-11 shrink-0 rounded-full bg-slate-800 ring-1 ring-white/10" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-300">
              {coin.name}
            </p>
            <p className="text-2xl font-bold uppercase tracking-wider text-white">
              {coin.symbol}
            </p>
          </div>
        </div>

        <div
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ring-1 ${trendBg} ${trendColor}`}
          aria-label={`24 hour change ${formatPercent(coin.price_change_percentage_24h)}`}
        >
          <TrendIcon className="h-4 w-4" aria-hidden="true" />
          <span>{formatPercent(coin.price_change_percentage_24h)}</span>
        </div>
      </header>

      <div className="mt-4">
        <p
          className="text-3xl font-extrabold tracking-tight text-white tabular-nums sm:text-4xl"
          aria-label={`Spot price ${formatPrice(coin.current_price)}`}
        >
          {formatPrice(coin.current_price)}
        </p>
      </div>

      <footer className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            24h High
          </span>
          <span className="text-base font-semibold text-emerald-300 tabular-nums">
            {formatSubPrice(coin.high_24h)}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            24h Low
          </span>
          <span className="text-base font-semibold text-rose-300 tabular-nums">
            {formatSubPrice(coin.low_24h)}
          </span>
        </div>
      </footer>
    </article>
  );
}

export function CryptoCardSkeleton() {
  return (
    <div
      className="flex h-full animate-pulse flex-col justify-between rounded-2xl bg-slate-900/80 p-5 ring-1 ring-white/10"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-slate-800" />
          <div className="space-y-2">
            <div className="h-3 w-20 rounded bg-slate-800" />
            <div className="h-5 w-12 rounded bg-slate-800" />
          </div>
        </div>
        <div className="h-6 w-16 rounded-full bg-slate-800" />
      </div>
      <div className="mt-4 h-10 w-32 rounded bg-slate-800" />
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
        <div className="space-y-2">
          <div className="h-2.5 w-16 rounded bg-slate-800" />
          <div className="h-4 w-20 rounded bg-slate-800" />
        </div>
        <div className="space-y-2 text-right">
          <div className="ml-auto h-2.5 w-16 rounded bg-slate-800" />
          <div className="ml-auto h-4 w-20 rounded bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
