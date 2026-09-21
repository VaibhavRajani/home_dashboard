"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import WeatherCard from "@/components/WeatherCard";
import TransitCard from "@/components/TransitCard";
import BikesCard from "@/components/BikesCard";
import { fetchDashboardData } from "@/lib/api";
import { env } from "@/config/env";
import type { DashboardData } from "@/types/dashboard";

interface Props { initialData: DashboardData; }

function mins(v:string){const n=Math.round((new Date(v).getTime()-Date.now())/60000);return n<=0?"now":"in "+n+" min"}

function Legacy({data}:{data:DashboardData}) {
 const groups:any={};
 (data.mbta||[]).forEach((s:any)=>{const n=s.stopName.indexOf("Washington")>=0?"Washington Square":"Beaconsfield";if(!groups[n])groups[n]={o:null,i:null};if(s.stopName.indexOf("Outbound")>=0||s.stopId==="70229"||s.stopId==="70177")groups[n].o=s;else if(s.stopName.indexOf("Inbound")>=0||s.stopId==="70230"||s.stopId==="70176")groups[n].i=s});
 const bikes=(data.bikes||[]).reduce((n:any,s:any)=>n+s.numBikesAvailable,0);
 const ebikes=(data.bikes||[]).reduce((n:any,s:any)=>n+s.numEbikesAvailable,0);
 const docks=(data.bikes||[]).reduce((n:any,s:any)=>n+s.numDocksAvailable,0);
 const w:any=data.weather;
 return <div className="legacy-dashboard">
  <div className="legacy-weather">
   <div className="legacy-temp">{w?"☁ "+Math.round((w.temperature-32)*5/9)+"°":"Weather"}</div>
   <div className="legacy-wdesc">{w&&w.description}<br/>{w&&"Feels like "+Math.round((w.feelsLike-32)*5/9)+"°"}</div>
   <div className="legacy-clock"><b>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</b><strong>{new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:true})}</strong></div>
   {w&&<><div className="legacy-stat"><b>Sunrise</b>{w.sunrise}</div><div className="legacy-stat"><b>Sunset</b>{w.sunset}</div><div className="legacy-stat"><b>Rain</b>{w.precipitation||0}%</div></>}
  </div>
  <div className="legacy-main">
   <div className="legacy-card legacy-transit"><div className="legacy-head green"><b>🚇 Green Line</b><span>C & D Lines</span></div><div className="legacy-body">
    {Object.keys(groups).map(n=><div className="legacy-stop" key={n}><b className="legacy-title">📍 {n}</b><div className="legacy-cols">
      <div><b>↑ Outbound</b>{(groups[n].o?.predictions||[]).filter((p:any)=>p.direction===0).slice(0,2).map((p:any,i:number)=><div className="legacy-train" key={i}>{p.headsign}<strong>{mins(p.arrivalTime)}</strong></div>)}</div>
      <div><b>↓ Inbound</b>{(groups[n].i?.predictions||[]).filter((p:any)=>p.direction===1).slice(0,2).map((p:any,i:number)=><div className="legacy-train" key={i}>{p.headsign}<strong>{mins(p.arrivalTime)}</strong></div>)}</div>
    </div></div>)}
   </div></div>
   <div className="legacy-card legacy-bikes"><div className="legacy-head blue"><b>🚲 Bluebikes</b><span>Washington Square</span></div><div className="legacy-summary"><div><b>{bikes}</b><small>Bikes</small></div><div><b>{ebikes}</b><small>E-Bikes</small></div><div><b>{docks}</b><small>Docks</small></div></div><div className="legacy-list">{(data.bikes||[]).map((s:any)=><div className="legacy-bike" key={s.stationId}><b>{s.stationId}</b><span>{s.numBikesAvailable} bikes</span><span>{s.numEbikesAvailable} e-bikes</span><span>{s.numDocksAvailable} docks</span></div>)}</div></div>
  </div>
  <div className="legacy-footer"><span>MBTA</span><span>Bluebikes</span><span>Weather</span><span>Updated {data.lastUpdated?new Date(data.lastUpdated).toLocaleTimeString():"—"}</span><button data-action="refresh">Refresh</button><a href="https://rent683.vercel.app">💰 Rent</a><Link href="/crypto">₿ Crypto</Link><Link href="/stocks">📈 Stocks</Link></div>
 </div>
}

export default function DashboardClient({initialData}:Props){
 const [data,setData]=useState(initialData); const [loading,setLoading]=useState(false);
 const refetch=useCallback(async()=>{try{setLoading(true);setData(await fetchDashboardData())}catch(e){console.error(e)}finally{setLoading(false)}},[]);
 useEffect(()=>{const i=window.setInterval(refetch,Math.min(env.MBTA_REFRESH_INTERVAL,env.BIKES_REFRESH_INTERVAL,env.WEATHER_REFRESH_INTERVAL));const buttons=document.querySelectorAll("[data-action=refresh]");buttons.forEach(b=>b.addEventListener("click",refetch as any));return()=>{window.clearInterval(i);buttons.forEach(b=>b.removeEventListener("click",refetch as any))}},[refetch]);
 return <><Legacy data={data}/><div className="modern-dashboard"><div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex flex-col"><div className="h-[15vh] mb-4"><WeatherCard weather={data.weather||null}/></div><div className="flex gap-4 flex-1 min-h-0"><div className="flex-[2]"><TransitCard stops={data.mbta||[]} alerts={data.alerts||[]}/></div><div className="flex-1"><BikesCard stations={data.bikes||[]}/></div></div><div className="mt-2"><button onClick={refetch} disabled={loading}><RefreshCw className="w-3 h-3 inline"/> {loading?"Refreshing...":"Refresh"}</button></div></div></div></>
}