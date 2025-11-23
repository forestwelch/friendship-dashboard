import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { Song } from "@/lib/types";

export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { songs } = body;

  if (!songs || !Array.isArray(songs)) {
    return NextResponse.json(
      { error: "Invalid songs data" },
      { status: 400 }
    );
  }

  try {
    const adminClient = getSupabaseAdmin();
    // Update or insert global content
    const { error } = await adminClient
      .from("global_content")
      .upsert(
        {
          content_type: "top_10_songs",
          data: { songs },
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "content_type",
        }
      );

    if (error) {
      console.error("Error saving songs:", error);
      return NextResponse.json(
        { error: "Failed to save songs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PUT /api/content/top_10_songs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

