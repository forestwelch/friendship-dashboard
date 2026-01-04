import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // First, get the audio snippet to find the file path
    const { data: snippet, error: fetchError } = await supabase
      .from("audio_snippets")
      .select("audio_url")
      .eq("id", id)
      .single();

    if (fetchError || !snippet) {
      console.error("Error fetching audio snippet:", fetchError);
      return NextResponse.json({ error: "Audio snippet not found" }, { status: 404 });
    }

    // Extract file path from URL (format: /api/audio/{friendId}/{timestamp}-{randomId}.webm)
    // or signed URL from storage
    let fileName: string | null = null;
    if (snippet.audio_url.startsWith("/api/audio/")) {
      // Extract path after /api/audio/
      fileName = snippet.audio_url.replace("/api/audio/", "");
    } else if (snippet.audio_url.includes("/audio-snippets/")) {
      // Extract path from signed URL
      const urlParts = snippet.audio_url.split("/audio-snippets/");
      if (urlParts.length > 1) {
        fileName = urlParts[1].split("?")[0]; // Remove query params
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase.from("audio_snippets").delete().eq("id", id);

    if (deleteError) {
      console.error("Error deleting audio snippet:", deleteError);
      return NextResponse.json({ error: "Failed to delete audio snippet" }, { status: 500 });
    }

    // Try to delete file from storage if we have the filename
    if (fileName) {
      try {
        await supabase.storage.from("audio-snippets").remove([fileName]);
      } catch (storageError) {
        // Log but don't fail - file might already be deleted or not exist
        console.warn("Error deleting audio file from storage:", storageError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/audio/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
