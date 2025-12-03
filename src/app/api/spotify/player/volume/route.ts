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
    const { volume } = body;

    if (typeof volume !== "number" || volume < 0 || volume > 100) {
      return NextResponse.json(
        { error: "Invalid volume (0-100)" },
        { status: 400 }
      );
    }

    const spotifyService = SpotifyService.getInstance();
    await spotifyService.setVolume(volume, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting volume:", error);
    return NextResponse.json(
      { error: "Failed to set volume" },
      { status: 500 }
    );
  }
}

