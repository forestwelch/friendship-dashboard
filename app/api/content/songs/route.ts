import { NextRequest, NextResponse } from "next/server";
import { supabase, getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { Song } from "@/lib/types";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ songs: [] });
  }

  try {
    const { data, error } = await supabase
      .from("global_content")
      .select("data")
      .eq("content_type", "songs")
      .single();

    if (error || !data) {
      return NextResponse.json({ songs: [] });
    }

    const songsData = data.data;
    if (songsData && typeof songsData === "object" && "songs" in songsData) {
      const songs = (songsData as { songs: unknown[] }).songs;
      const validSongs = songs.filter(
        (song: unknown): song is Song =>
          typeof song === "object" &&
          song !== null &&
          "mp3Url" in song &&
          typeof (song as { mp3Url: unknown }).mp3Url === "string"
      );
      return NextResponse.json({ songs: validSongs });
    }

    return NextResponse.json({ songs: [] });
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

  const validSongs = songs.filter((song: unknown): song is Song => {
    return (
      typeof song === "object" &&
      song !== null &&
      "mp3Url" in song &&
      typeof (song as { mp3Url: unknown }).mp3Url === "string"
    );
  });

  try {
    const adminClient = getSupabaseAdmin();
    const { error } = await adminClient.from("global_content").upsert(
      {
        content_type: "songs",
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
    console.error("Error in PUT /api/content/songs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
