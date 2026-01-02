import { NextRequest, NextResponse } from "next/server";
import { savePixelArtImage } from "@/lib/queries";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ images: [] });
  }

  try {
    // Fetching global images
    // Only fetch pixel_data (not base_image_data) for performance - 4KB vs MB
    const { data, error } = await supabase
      .from("pixel_art_images")
      .select("id, pixel_data, size, width, height, created_at")
      .is("friend_id", null) // Only global images
      .order("created_at", { ascending: false })
      .limit(100); // Limit to prevent huge payloads

    // Fetched images

    if (error) {
      console.error("[API] Error fetching images:", error);
      return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
    }

    // Return only pixel_data (new format, 4KB) - skip base_image_data for performance
    const images = (data || []).map((img) => ({
      id: img.id,
      pixel_data: img.pixel_data || null, // New format: base64-encoded Uint8Array (4KB)
      size: img.size,
      width: img.width || 128, // Default to 128x128
      height: img.height || 128,
      created_at: img.created_at,
    }));

    return NextResponse.json({ images });
  } catch (error) {
    console.error("[API] Error in GET /api/images:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const pixelData = formData.get("pixel_data") as string | null; // New format: pre-processed pixel data

    if (!file && !pixelData) {
      return NextResponse.json({ error: "Missing file or pixel_data" }, { status: 400 });
    }

    let imageId: string | null = null;

    if (pixelData) {
      // New format: pixel_data is already processed client-side
      imageId = await savePixelArtImage(null, null, "2x2", undefined, pixelData);
    } else if (file) {
      // Old format: convert file to base64 (for backward compatibility)
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const base64DataUrl = `data:${file.type};base64,${base64}`;
      imageId = await savePixelArtImage(null, null, "2x2", base64DataUrl);
    }

    if (!imageId) {
      return NextResponse.json({ error: "Failed to save image" }, { status: 500 });
    }

    // Fetch the saved image to return
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("pixel_art_images")
        .select("id, pixel_data, base_image_data, size, width, height, created_at")
        .eq("id", imageId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "Failed to fetch saved image" }, { status: 500 });
      }

      return NextResponse.json({
        image: {
          id: data.id,
          pixel_data: data.pixel_data || null,
          size: data.size,
          width: data.width || 128,
          height: data.height || 128,
          created_at: data.created_at,
        },
      });
    }

    return NextResponse.json({
      image: {
        id: imageId,
        pixel_data: pixelData || null,
        size: "2x2",
        width: 128,
        height: 128,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in POST /api/images:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids");

    if (!ids) {
      return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 });
    }

    const idArray = ids.split(",");

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.from("pixel_art_images").delete().in("id", idArray);

    if (error) {
      console.error("Error deleting images:", error);
      return NextResponse.json({ error: "Failed to delete images" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/images:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
