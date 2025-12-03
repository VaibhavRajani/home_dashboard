import { NextResponse } from "next/server";
import { SpotifyService } from "@/lib/services/spotify-service";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    const origin = url.origin;

    if (error) {
      return NextResponse.redirect(`${origin}/?spotify_error=${error}`);
    }

    if (!code) {
      return NextResponse.redirect(`${origin}/?spotify_error=no_code`);
    }

    const spotifyService = SpotifyService.getInstance();
    const token = await spotifyService.exchangeCodeForToken(code);

    // Store token in httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set("spotify_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 hour
    });

    return NextResponse.redirect(`${origin}/?spotify_connected=true`);
  } catch (error) {
    console.error("Error in Spotify callback:", error);
    const url = new URL(request.url);
    return NextResponse.redirect(`${url.origin}/?spotify_error=callback_failed`);
  }
}

