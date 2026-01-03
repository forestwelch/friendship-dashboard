import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const audioBlob = formData.get("audio") as File;
    const friendId = formData.get("friendId") as string;
    const recordedBy = formData.get("recordedBy") as string;
    const iconName = formData.get("iconName") as string;

    if (!audioBlob || !friendId || !recordedBy || !iconName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate blob size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (audioBlob.size > maxSize) {
      return NextResponse.json(
        { error: `File too large: ${audioBlob.size} bytes (max: ${maxSize})` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const fileName = `${friendId}/${timestamp}-${randomId}.webm`;

    const { error: uploadError } = await supabase.storage
      .from("audio-snippets")
      .upload(fileName, audioBlob, {
        contentType: audioBlob.type || "audio/webm",
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Error uploading audio:", uploadError);
      return NextResponse.json({ error: "Failed to upload audio file" }, { status: 500 });
    }

    // Get signed URL from Supabase Storage (valid for 1 hour)
    // This avoids CORS issues and works for private buckets
    const { data: urlData, error: urlError } = await supabase.storage
      .from("audio-snippets")
      .createSignedUrl(fileName, 3600);

    if (urlError) {
      console.error("Error creating signed URL:", urlError);
      // Fallback to API route if signed URL fails
      const audioUrl = `/api/audio/${fileName}`;

      const { data, error } = await supabase
        .from("audio_snippets")
        .insert({
          friend_id: friendId,
          audio_url: audioUrl,
          recorded_by: recordedBy as "admin" | "friend",
          icon_name: iconName,
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving audio snippet:", error);
        await supabase.storage.from("audio-snippets").remove([fileName]);
        return NextResponse.json(
          { error: "Failed to save audio snippet metadata" },
          { status: 500 }
        );
      }

      return NextResponse.json({ data });
    }

    const audioUrl = urlData.signedUrl;

    // Save metadata to database
    const { data, error } = await supabase
      .from("audio_snippets")
      .insert({
        friend_id: friendId,
        audio_url: audioUrl,
        recorded_by: recordedBy as "admin" | "friend",
        icon_name: iconName,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving audio snippet:", error);
      // Try to clean up the uploaded file
      await supabase.storage.from("audio-snippets").remove([fileName]);
      return NextResponse.json({ error: "Failed to save audio snippet metadata" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in audio upload API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
