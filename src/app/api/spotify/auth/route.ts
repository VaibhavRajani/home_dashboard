import { NextResponse } from "next/server";
import { SpotifyService } from "@/lib/services/spotify-service";

export async function GET() {
  try {
    const spotifyService = SpotifyService.getInstance();
    const authUrl = spotifyService.getAuthUrl();

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Error generating Spotify auth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}

