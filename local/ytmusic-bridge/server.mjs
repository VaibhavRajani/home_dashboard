import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { io } from "socket.io-client";

const PORT = Number(process.env.PORT || 9864);
const HOST = process.env.HOST || "0.0.0.0";
const YTM_HOST = process.env.YTM_HOST || "http://127.0.0.1:9863";
const YTM_API = YTM_HOST.replace(/\/$/, "") + "/api/v1";
const BRIDGE_KEY = process.env.BRIDGE_KEY || "";

const tokenDir = path.join(os.homedir(), ".home-dashboard-ytm");
const tokenFile = path.join(tokenDir, "token.json");
fs.mkdirSync(tokenDir, { recursive: true });

let token = loadToken();
let socket = null;
let state = null;
let authInProgress = false;
let authError = null;

function loadToken() {
  try { return JSON.parse(fs.readFileSync(tokenFile, "utf8")).token || null; }
  catch { return null; }
}
function saveToken(value) {
  fs.writeFileSync(tokenFile, JSON.stringify({ token: value }, null, 2), { mode: 0o600 });
}
function clearToken() {
  token = null; state = null;
  try { fs.unlinkSync(tokenFile); } catch {}
  if (socket) { socket.disconnect(); socket = null; }
}
function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Bridge-Key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}
function authorized(req) { return !BRIDGE_KEY || req.headers["x-bridge-key"] === BRIDGE_KEY; }

async function ytm(pathname, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = token;
  const response = await fetch(YTM_API + pathname, { ...options, headers });
  if (response.status === 401) clearToken();
  const text = await response.text();
  let body = null; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    const error = new Error("YTM request failed: " + response.status);
    error.status = response.status; error.body = body; throw error;
  }
  return body;
}

function normalize(raw) {
  const player = raw?.player, video = raw?.video;
  if (!player) return { connected: false, authenticated: Boolean(token), track: null, volume: 0 };
  const thumbnail = video?.thumbnails?.slice()?.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || null;
  return {
    connected: true, authenticated: Boolean(token),
    playing: player.trackState === 1, buffering: player.trackState === 2,
    adPlaying: Boolean(player.adPlaying), progress: Number(player.videoProgress || 0),
    duration: Number(video?.durationSeconds || 0), volume: Number(player.volume || 0),
    track: video ? { id: video.id, title: video.title || "Unknown title", artist: video.author || "Unknown artist", album: video.album || "", artwork: thumbnail } : null,
  };
}
async function refreshState() {
  if (!token) return;
  try { state = normalize(await ytm("/state")); }
  catch (error) { if (error.status !== 401) console.error("YTM state error:", error.message); }
}
function connectRealtime() {
  if (!token) return;
  if (socket) socket.disconnect();
  socket = io(YTM_API + "/realtime", { transports: ["websocket"], auth: { token } });
  socket.on("connect", () => { console.log("Connected to YouTube Music Desktop."); refreshState(); });
  socket.on("state-update", raw => { state = normalize(raw); });
  socket.on("connect_error", error => console.error("YTM realtime:", error.message));
}
async function startAuth() {
  if (authInProgress) return { started: false, pending: true };
  authInProgress = true; authError = null;
  try {
    const result = await ytm("/auth/requestcode", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId: "homedashboard", appName: "Home Dashboard", appVersion: "1.0.0" })
    });
    const code = result?.code;
    if (!code) throw new Error("YouTube Music Desktop did not return an authorization code.");
    const exchange = await fetch(YTM_API + "/auth/request", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId: "homedashboard", code })
    });
    const body = await exchange.json().catch(() => ({}));
    if (!exchange.ok || !body.token) throw new Error(body?.message || "Authorization was denied or timed out.");
    token = body.token; saveToken(token); connectRealtime(); await refreshState();
    console.log("YouTube Music authorization complete.");
    return { started: true, authenticated: true };
  } catch (error) {
    authError = error instanceof Error ? error.message : String(error);
    console.error("YTM authorization:", authError);
    return { started: true, authenticated: false, error: authError };
  } finally { authInProgress = false; }
}
async function command(command, data) {
  if (!token) throw new Error("YouTube Music is not authorized.");
  const body = { command }; if (data !== undefined) body.data = data;
  await ytm("/command", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  await refreshState();
}
async function requestBody(req) {
  let raw = ""; for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, X-Bridge-Key", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" });
    return res.end();
  }
  const url = new URL(req.url || "/", "http://localhost");
  if (url.pathname === "/health") return json(res, 200, { ok: true, service: "home-dashboard-ytmusic-bridge" });
  if (!authorized(req)) return json(res, 401, { error: "Invalid bridge key" });
  try {
    if (req.method === "GET" && url.pathname === "/state") {
      if (!state && token) await refreshState();
      return json(res, 200, state || { connected: false, authenticated: Boolean(token), track: null, volume: 0 });
    }
    if (req.method === "GET" && url.pathname === "/auth/status") return json(res, 200, { authenticated: Boolean(token), inProgress: authInProgress, error: authError });
    if (req.method === "POST" && url.pathname === "/auth/start") {
      const result = await startAuth(); return json(res, result.error ? 400 : 200, result);
    }
    if (req.method === "POST" && url.pathname === "/command") {
      const body = await requestBody(req);
      const allowed = new Set(["playPause", "play", "pause", "next", "previous", "mute", "unmute", "volumeUp", "volumeDown", "setVolume", "seekTo", "shuffle", "repeatMode", "toggleLike", "toggleDislike"]);
      if (!allowed.has(body.command)) return json(res, 400, { error: "Unsupported command" });
      await command(body.command, body.data); return json(res, 200, { ok: true });
    }
    return json(res, 404, { error: "Not found" });
  } catch (error) {
    const status = error?.status === 401 ? 401 : 500;
    return json(res, status, { error: error instanceof Error ? error.message : String(error) });
  }
});
server.listen(PORT, HOST, () => {
  console.log("Home Dashboard YouTube Music bridge: http://" + HOST + ":" + PORT);
  console.log("YTM Companion Server: " + YTM_API);
  if (!BRIDGE_KEY) console.warn("WARNING: BRIDGE_KEY is not set.");
  if (token) connectRealtime();
});