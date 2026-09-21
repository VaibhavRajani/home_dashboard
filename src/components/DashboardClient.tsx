"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import WeatherCard from "@/components/WeatherCard";
import TransitCard from "@/components/TransitCard";
import SpotifyCard from "@/components/SpotifyCard";
import { fetchDashboardData } from "@/lib/api";
import { env } from "@/config/env";
import type { DashboardData, MBTAPrediction, MBTAStop } from "@/types/dashboard";

interface Props { initialData: DashboardData; }
interface StopGroup { o: MBTAStop | null; i: MBTAStop | null; }

function mins(v: string) {
  const n = Math.round((new Date(v).getTime() - Date.now()) / 60000);
  return n <= 0 ? "now" : "in " + n + " min";
}

function Legacy({ data, onRefresh, loading }: { data: DashboardData; onRefresh: () => void; loading: boolean }) {
  const groups: Record<string, StopGroup> = {};
  data.mbta.forEach((s) => {
    const n = s.stopName.indexOf("Washington") >= 0 ? "Washington Square" : "Beaconsfield";
    if (!groups[n]) groups[n] = { o: null, i: null };
    if (s.stopName.indexOf("Outbound") >= 0 || s.stopId === "70229" || s.stopId === "70177") groups[n].o = s;
    else if (s.stopName.indexOf("Inbound") >= 0 || s.stopId === "70230" || s.stopId === "70176") groups[n].i = s;
  });

  const w = data.weather;

  const predictions = (stop: MBTAStop | null, direction: number): MBTAPrediction[] =>
    stop ? stop.predictions.filter((p) => p.direction === direction).slice(0, 2) : [];

  return <div className="legacy-dashboard">
    <div className="legacy-weather">
      <div className="legacy-temp">{w ? "☁ " + Math.round((w.temperature - 32) * 5 / 9) + "°" : "Weather"}</div>
      <div className="legacy-wdesc">{w && w.description}<br />{w && "Feels like " + Math.round((w.feelsLike - 32) * 5 / 9) + "°"}</div>
      <div className="legacy-clock"><b>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</b><strong>{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}</strong></div>
      {w && <><div className="legacy-stat"><b>Sunrise</b>{w.sunrise}</div><div className="legacy-stat"><b>Sunset</b>{w.sunset}</div><div className="legacy-stat"><b>Rain</b>{w.precipitation || 0}%</div></>}
    </div>

    <div className="legacy-main">
      <div className="legacy-card legacy-transit">
        <div className="legacy-head green"><b>🚇 Green Line</b><span>C & D Lines</span></div>
        <div className="legacy-body">
          {Object.keys(groups).map((n) => <div className="legacy-stop" key={n}>
            <b className="legacy-title">📍 {n}</b>
            <div className="legacy-cols">
              <div><b>↑ Outbound</b>{predictions(groups[n].o, 0).map((p, i) => <div className="legacy-train" key={i}>{p.headsign}<strong>{mins(p.arrivalTime)}</strong></div>)}</div>
              <div><b>↓ Inbound</b>{predictions(groups[n].i, 1).map((p, i) => <div className="legacy-train" key={i}>{p.headsign}<strong>{mins(p.arrivalTime)}</strong></div>)}</div>
            </div>
          </div>)}
        </div>
      </div>

      <div className="legacy-card legacy-spotify"><SpotifyCard /></div>
    </div>

    <div className="legacy-footer">
      <span>MBTA</span><span>Spotify</span><span>Weather</span>
      <span>Updated {data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : "—"}</span>
      <button onClick={onRefresh} disabled={loading}>{loading ? "Updating..." : "Refresh"}</button>
      <a href="https://rent683.vercel.app">💰 Rent</a><Link href="/crypto">₿ Crypto</Link><Link href="/stocks">📈 Stocks</Link>
    </div>
  </div>;
}

export default function DashboardClient({ initialData }: Props) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    try { setLoading(true); setData(await fetchDashboardData()); }
    catch (e) { console.error("Dashboard refresh failed:", e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const i = window.setInterval(refetch, Math.min(env.MBTA_REFRESH_INTERVAL, env.BIKES_REFRESH_INTERVAL, env.WEATHER_REFRESH_INTERVAL));
    return () => window.clearInterval(i);
  }, [refetch]);

  return <>
    <Legacy data={data} onRefresh={refetch} loading={loading} />
    <div className="modern-dashboard">
      <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex flex-col">
        <div className="h-[15vh] mb-4"><WeatherCard weather={data.weather || null} /></div>
        <div className="flex gap-4 flex-1 min-h-0"><div className="flex-[2]"><TransitCard stops={data.mbta || []} alerts={data.alerts || []} /></div><div className="flex-1"><SpotifyCard /></div></div>
        <div className="mt-2"><button onClick={refetch} disabled={loading}><RefreshCw className="w-3 h-3 inline" /> {loading ? "Refreshing..." : "Refresh"}</button></div>
      </div>
    </div>
  </>;
}