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
    await spotifyService.skipNext(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error skipping next:", error);
    return NextResponse.json(
      { error: "Failed to skip next" },
      { status: 500 }
    );
  }
}

