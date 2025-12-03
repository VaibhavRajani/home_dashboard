import { NextResponse } from "next/server";
import { SpotifyService } from "@/lib/services/spotify-service";
import { cookies } from "next/headers";

export async function POST() {
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
    await spotifyService.skipPrevious(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error skipping previous:", error);
    return NextResponse.json(
      { error: "Failed to skip previous" },
      { status: 500 }
    );
  }
}

