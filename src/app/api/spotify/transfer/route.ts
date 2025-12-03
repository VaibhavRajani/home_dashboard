import { NextResponse } from "next/server";
import { SpotifyService } from "@/lib/services/spotify-service";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("spotify_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { deviceId } = body;

    if (!deviceId || typeof deviceId !== "string") {
      return NextResponse.json(
        { error: "Invalid device ID" },
        { status: 400 }
      );
    }

    const spotifyService = SpotifyService.getInstance();
    await spotifyService.transferPlayback(deviceId, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error transferring playback:", error);
    return NextResponse.json(
      { error: "Failed to transfer playback" },
      { status: 500 }
    );
  }
}

