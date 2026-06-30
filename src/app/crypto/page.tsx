"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import CryptoCard, { CryptoCardSkeleton } from "@/components/CryptoCard";
import { useCryptoMarkets } from "@/hooks/useCryptoMarkets";

const SKELETON_PLACEHOLDERS = [0, 1, 2, 3];

export default function CryptoPage() {
  const { coins, loading, refreshing, error, lastUpdated, refetch } =
    useCryptoMarkets({ refreshInterval: 60_000, autoRefresh: true });

  const isInitialLoading = loading && !coins;
  const showCards = coins && coins.length > 0;

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between px-6 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
            aria-hidden="true"
          />
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Crypto Markets
          </h1>
          <span className="hidden text-xs font-medium uppercase tracking-[0.2em] text-slate-500 sm:inline">
            Live · USD
          </span>
        </div>

        <button
          type="button"
          onClick={refetch}
          disabled={refreshing}
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-60"
          aria-label={
            lastUpdated
              ? `Refresh market data. Last updated at ${lastUpdatedLabel}`
              : "Refresh market data"
          }
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : "transition-transform group-hover:rotate-90"}`}
            aria-hidden="true"
          />
          <span className="tabular-nums">
            <span className="text-slate-500">Updated</span>{" "}
            <span className="text-slate-200">{lastUpdatedLabel}</span>
          </span>
        </button>
      </header>

      <section className="flex flex-1 min-h-0 flex-col px-6 pb-6 sm:px-8 sm:pb-8">
        {error && !showCards ? (
          <FallbackPanel error={error} onRetry={refetch} retrying={refreshing} />
        ) : (
          <>
            {error && showCards && (
              <div
                role="status"
                className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300"
              >
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  Showing last known values — failed to refresh: {error}
                </span>
              </div>
            )}

            <div
              className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-4"
              aria-busy={isInitialLoading}
            >
              {isInitialLoading
                ? SKELETON_PLACEHOLDERS.map((i) => <CryptoCardSkeleton key={i} />)
                : coins?.map((coin) => <CryptoCard key={coin.id} coin={coin} />)}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function FallbackPanel({
  error,
  onRetry,
  retrying,
}: {
  error: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="max-w-md rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
        <AlertTriangle
          className="mx-auto h-8 w-8 text-rose-400"
          aria-hidden="true"
        />
        <h2 className="mt-3 text-lg font-semibold text-white">
          Market data unavailable
        </h2>
        <p className="mt-1 text-sm text-slate-400">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          {retrying ? "Retrying…" : "Try again"}
        </button>
      </div>
    </div>
  );
}
