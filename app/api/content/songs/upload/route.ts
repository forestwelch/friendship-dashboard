import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const mp3File = formData.get("mp3") as File;
    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;

    if (!mp3File || !title || !artist) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!mp3File.type.startsWith("audio/")) {
      return NextResponse.json({ error: "File must be an audio file" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (mp3File.size > maxSize) {
      return NextResponse.json(
        { error: `File too large: ${mp3File.size} bytes (max: ${maxSize})` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const fileName = `songs/${timestamp}-${randomId}.mp3`;

    const { error: uploadError } = await supabase.storage
      .from("audio-snippets")
      .upload(fileName, mp3File, {
        contentType: mp3File.type || "audio/mpeg",
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Error uploading MP3:", uploadError);
      return NextResponse.json({ error: "Failed to upload MP3 file" }, { status: 500 });
    }

    const { data: urlData, error: urlError } = await supabase.storage
      .from("audio-snippets")
      .createSignedUrl(fileName, 31536000); // 1 year expiry

    let mp3Url: string;
    if (urlError || !urlData) {
      const { data: publicUrlData } = supabase.storage
        .from("audio-snippets")
        .getPublicUrl(fileName);
      mp3Url = publicUrlData.publicUrl;
    } else {
      mp3Url = urlData.signedUrl;
    }

    return NextResponse.json({
      mp3Url,
      fileName,
      title,
      artist,
    });
  } catch (error) {
    console.error("Error in MP3 upload API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
