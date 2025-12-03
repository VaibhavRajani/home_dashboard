import { NextResponse } from "next/server";
import { SpotifyService } from "@/lib/services/spotify-service";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("spotify_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const spotifyService = SpotifyService.getInstance();
    const playerState = await spotifyService.getPlayerState(token);

    return NextResponse.json(playerState);
  } catch (error) {
    console.error("Error fetching Spotify player state:", error);
    return NextResponse.json(
      { error: "Failed to fetch player state" },
      { status: 500 }
    );
  }
}

