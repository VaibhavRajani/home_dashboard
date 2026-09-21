"use client";

import { useEffect, useState } from "react";
import { env } from "@/config/env";
import { useYouTubeMusic } from "@/hooks/useYouTubeMusic";

function time(seconds: number) {
  const s = Math.max(0, Math.floor(seconds || 0));
  return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
}

export default function YouTubeMusicCard() {
  const { state, loading, error, startAuth, authStatus, command, refetch } = useYouTubeMusic();
  const [progress, setProgress] = useState(0);
  const [authPending, setAuthPending] = useState(false);

  useEffect(() => {
    setProgress(state?.progress || 0);
  }, [state?.track?.id, state?.progress]);

  useEffect(() => {
    if (!state?.playing) return;
    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(value + 1, state.duration || value));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state?.playing, state?.duration, state?.track?.id]);

  useEffect(() => {
    if (!authPending) return;
    const timer = window.setInterval(async () => {
      const status = await authStatus();
      if (status?.authenticated) {
        setAuthPending(false);
        refetch();
      } else if (status && !status.inProgress && status.error) {
        setAuthPending(false);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [authPending, authStatus, refetch]);

  const configured = Boolean(env.YTM_BRIDGE_URL);
  const track = state?.track;
  const percent = track && state.duration > 0 ? Math.min(100, (progress / state.duration) * 100) : 0;

  if (!configured) {
    return <section className="ytm-card"><div className="ytm-head"><b>♫ YouTube Music</b><span>Setup needed</span></div><div className="ytm-empty"><div className="ytm-icon">♫</div><h3>Connect the Windows PC</h3><p>Set NEXT_PUBLIC_YTM_BRIDGE_URL to the local bridge.</p></div></section>;
  }

  if (loading && !state) {
    return <section className="ytm-card"><div className="ytm-head"><b>♫ YouTube Music</b></div><div className="ytm-empty">Connecting to Windows PC…</div></section>;
  }

  if (!state?.authenticated) {
    return <section className="ytm-card"><div className="ytm-head"><b>♫ YouTube Music</b><span>Windows</span></div><div className="ytm-empty"><div className="ytm-icon">♫</div><h3>{authPending ? "Approve on Windows" : "Connect YouTube Music"}</h3><p>{authPending ? "Click Allow in YouTube Music Desktop on your PC." : "Control the music playing on your Windows PC."}</p><button className="ytm-connect" onClick={async () => { setAuthPending(true); await startAuth(); }}> {authPending ? "Waiting…" : "Connect"} </button></div></section>;
  }

  if (!state.connected || !track) {
    return <section className="ytm-card"><div className="ytm-head"><b>♫ YouTube Music</b><span>{state.connected ? "Ready" : "Desktop offline"}</span></div><div className="ytm-empty"><div className="ytm-icon">♫</div><h3>{state.connected ? "Nothing playing" : "YouTube Music Desktop offline"}</h3><p>{state.connected ? "Start a song on the Windows PC." : "Open YouTube Music Desktop and try again."}</p><button className="ytm-connect" onClick={refetch}>Refresh</button></div></section>;
  }

  return <section className="ytm-card">
    <div className="ytm-head"><b>♫ YouTube Music</b><span>{state.adPlaying ? "Advertisement" : "Windows PC"}</span></div>
    <div className="ytm-player">
      {track.artwork ? <img className="ytm-art" src={track.artwork} alt={track.album || track.title} /> : <div className="ytm-art ytm-art-placeholder">♫</div>}
      <div className="ytm-track"><b>{track.title}</b><span>{track.artist}</span>{track.album && <small>{track.album}</small>}</div>
      <div className="ytm-progress">
        <span>{time(progress)}</span>
        <input type="range" min="0" max={Math.max(1, state.duration)} step="1" value={Math.min(progress, state.duration || progress)} onChange={(e) => setProgress(Number(e.target.value))} onMouseUp={(e) => command("seekTo", Number((e.target as HTMLInputElement).value))} onTouchEnd={(e) => command("seekTo", Number((e.target as HTMLInputElement).value))} />
        <span>{time(state.duration)}</span>
      </div>
      <div className="ytm-controls">
        <button onClick={() => command("previous")} aria-label="Previous">⏮</button>
        <button className="ytm-play" onClick={() => command(state.playing ? "pause" : "play")} aria-label={state.playing ? "Pause" : "Play"}>{state.playing ? "❚❚" : "▶"}</button>
        <button onClick={() => command("next")} aria-label="Next">⏭</button>
      </div>
      <div className="ytm-volume"><span>🔊</span><input type="range" min="0" max="100" value={state.volume} onChange={(e) => command("setVolume", Number(e.target.value))} /><span>{state.volume}%</span></div>
      {error && <small className="ytm-error">{error}</small>}
    </div>
  </section>;
}
