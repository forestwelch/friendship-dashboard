import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { getTop10Songs } from "@/lib/queries";
import { Song } from "@/lib/types";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ songs: [] });
  }

  try {
    const { songs } = await getTop10Songs();
    // Filter out any old YouTube songs that might have slipped through
    const validSongs = songs.filter((song) => song.mp3Url && !("youtubeId" in song));
    return NextResponse.json({ songs: validSongs });
  } catch (error) {
    console.error("Error fetching songs:", error);
    return NextResponse.json({ songs: [] });
  }
}

export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const body = await request.json();
  const { songs } = body;

  if (!songs || !Array.isArray(songs)) {
    return NextResponse.json({ error: "Invalid songs data" }, { status: 400 });
  }

  // Validate and filter out any old YouTube songs
  const validSongs = songs.filter((song: unknown): song is Song => {
    return (
      typeof song === "object" &&
      song !== null &&
      "mp3Url" in song &&
      typeof (song as { mp3Url: unknown }).mp3Url === "string" &&
      !("youtubeId" in song)
    );
  });

  if (validSongs.length !== songs.length) {
    console.warn(
      `Filtered out ${songs.length - validSongs.length} invalid songs (missing mp3Url or has youtubeId)`
    );
  }

  try {
    const adminClient = getSupabaseAdmin();
    // Update or insert global content
    const { error } = await adminClient.from("global_content").upsert(
      {
        content_type: "top_10_songs",
        data: { songs: validSongs },
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "content_type",
      }
    );

    if (error) {
      console.error("Error saving songs:", error);
      return NextResponse.json({ error: "Failed to save songs" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PUT /api/content/top_10_songs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
