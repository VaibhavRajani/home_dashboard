"use client";

import { useEffect, useState } from "react";
import type { SpotifyPlayerState } from "@/types/dashboard";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";

function time(ms:number){const s=Math.floor(ms/1000);return Math.floor(s/60)+":"+("0"+(s%60)).slice(-2);}

export default function SpotifyCard(){
  const {playerState, loading, refetch}=useSpotifyPlayer();
  const [progress,setProgress]=useState(0);

  useEffect(()=>{setProgress(playerState?.track?.progress || 0)},[playerState?.track?.id,playerState?.track?.progress]);
  useEffect(()=>{
    if(!playerState?.track?.isPlaying)return;
    const i=window.setInterval(()=>setProgress(p=>Math.min(p+1000,playerState.track?.duration||p)),1000);
    return()=>window.clearInterval(i);
  },[playerState?.track?.isPlaying,playerState?.track?.duration]);

  const action=async(path:string,body?:{volume:number})=>{
    try{
      await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});
      await refetch();
    }catch(e){console.error("Spotify action failed",e)}
  };
  const state=playerState;
  const track=state?.track;
  const percent=track&&track.duration>0?(progress/track.duration)*100:0;

  if(loading&&!state)return <section className="spotify-card"><div className="spotify-head"><b>♫ Spotify</b></div><div className="spotify-empty">Loading Spotify…</div></section>;

  if(!state?.isAuthenticated)return <section className="spotify-card"><div className="spotify-head"><b>♫ Spotify</b><span>Music</span></div><div className="spotify-empty"><div className="spotify-big-icon">♫</div><h3>Connect Spotify</h3><p>Control your music from this dashboard.</p><a className="spotify-connect" href="/api/spotify/auth">Connect Spotify</a></div></section>;

  if(!state.isConnected||!track)return <section className="spotify-card"><div className="spotify-head"><b>♫ Spotify</b><span>{state.device?.name||"No active device"}</span></div><div className="spotify-empty"><div className="spotify-big-icon">♫</div><h3>{state.device?"Nothing playing":"No active device"}</h3><p>{state.device?"Start a song in Spotify.":"Open Spotify and start playback."}</p><button className="spotify-connect" onClick={refetch}>Refresh</button></div></section>;

  return <section className="spotify-card">
    <div className="spotify-head"><b>♫ Spotify</b><span>{state.device?.name||"Connected"}</span></div>
    <div className="spotify-player">
      <img className="spotify-art" src={track.albumArtUrl} alt={track.album}/>
      <div className="spotify-track"><b>{track.name}</b><span>{track.artist}</span><small>{track.album}</small></div>
      <div className="spotify-progress"><span>{time(progress)}</span><i><em style={{width:percent+"%"}}/></i><span>{time(track.duration)}</span></div>
      <div className="spotify-controls">
        <button onClick={()=>action("/api/spotify/player/previous")}>⏮</button>
        <button className="spotify-play" onClick={()=>action(track.isPlaying?"/api/spotify/player/pause":"/api/spotify/player/play")}>{track.isPlaying?"❚❚":"▶"}</button>
        <button onClick={()=>action("/api/spotify/player/next")}>⏭</button>
      </div>
      {state.device&&<div className="spotify-volume"><span>🔊</span><input type="range" min="0" max="100" value={state.device.volume} onChange={e=>action("/api/spotify/player/volume",{volume:Number(e.target.value)})}/><span>{state.device.volume}%</span></div>}
    </div>
  </section>;
}
