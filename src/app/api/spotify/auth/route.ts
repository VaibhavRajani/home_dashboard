import { NextResponse } from "next/server";
import { SpotifyService } from "@/lib/services/spotify-service";

export async function GET() {
  try {
    const spotifyService = SpotifyService.getInstance();
    const authUrl = spotifyService.getAuthUrl();

    if (!authUrl || !process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_REDIRECT_URI) {
      return NextResponse.json(
        { error: "Spotify environment variables are not configured" },
        { status: 500 }
      );
    }

    // The Spotify card links directly to this endpoint, so redirect the
    // browser to Spotify rather than returning the URL as JSON.
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error generating Spotify auth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}
