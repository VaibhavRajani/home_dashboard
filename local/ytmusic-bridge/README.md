# Home Dashboard YouTube Music Bridge

This Windows bridge connects the dashboard to YouTube Music Desktop App's Companion Server.

## 1. Install YouTube Music Desktop

Install the current YouTube Music Desktop App for Windows.

In YouTube Music Desktop:
1. Open Settings -> Integration.
2. Enable Companion Server.
3. Enable Companion authorization.
4. Keep YouTube Music Desktop running.

The Companion Server normally runs at `http://127.0.0.1:9863/api/v1`.

## 2. Install the bridge

Install Node.js 20+ on the Windows PC, then in PowerShell:

    cd local\ytmusic-bridge
    npm install
    Copy-Item .env.example .env

Edit `.env` and set a random key:

    PORT=9864
    HOST=0.0.0.0
    BRIDGE_KEY=put-a-long-random-string-here
    YTM_HOST=http://127.0.0.1:9863

Then run `npm start`.

## 3. First authorization

Open the dashboard and press **Connect YouTube Music**. The bridge requests authorization from YouTube Music Desktop. Approve the Allow/Deny prompt in the desktop app.

The bridge stores the Companion token under your Windows user profile and never commits it to Git.

## 4. Dashboard configuration

For a dashboard served over your home LAN, set:

    NEXT_PUBLIC_YTM_BRIDGE_URL=http://YOUR_WINDOWS_PC_IP:9864
    NEXT_PUBLIC_YTM_BRIDGE_KEY=the-same-value-as-BRIDGE_KEY

Example: `http://192.168.1.50:9864`.

For the first version, open the dashboard from the Windows PC or another device over HTTP on the same LAN. A public HTTPS Vercel page cannot make ordinary browser requests to an HTTP-only LAN bridge because browsers block mixed-content requests. If you want Vercel later, we can add a secure Tailscale/HTTPS tunnel.

## 5. Windows Firewall

When Windows asks whether Node.js should communicate on the network, allow it on your Private network. If the iPad cannot connect, allow TCP port 9864 through Windows Defender Firewall for Private networks.

## Controls

- Current song, artist and album
- Album artwork
- Play / pause
- Previous / next
- Seek
- Volume
- Playback progress
- Buffering and ad state