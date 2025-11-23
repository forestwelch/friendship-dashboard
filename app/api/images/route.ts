import { NextRequest, NextResponse } from "next/server";
import { savePixelArtImage } from "@/lib/queries";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { WidgetSize } from "@/lib/types";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ images: [] });
  }

  try {
    console.log("[API] Fetching global images...");
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from("pixel_art_images")
      .select("id, base_image_data, size, created_at")
      .is("friend_id", null) // Only global images
      .order("created_at", { ascending: false })
      .limit(100); // Limit to prevent huge payloads

    const fetchTime = Date.now() - startTime;
    console.log(`[API] Fetched ${data?.length || 0} images in ${fetchTime}ms`);

    if (error) {
      console.error("[API] Error fetching images:", error);
      return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
    }

    // Create thumbnails for faster loading (first 1000 chars of base64)
    const imagesWithThumbnails = (data || []).map((img) => ({
      id: img.id,
      base_image_data: img.base_image_data, // Keep full image for processing
      thumbnail: img.base_image_data.substring(0, 100) + "...", // Thumbnail for preview
      size: img.size,
      created_at: img.created_at,
    }));

    return NextResponse.json({ images: imagesWithThumbnails });
  } catch (error) {
    console.error("[API] Error in GET /api/images:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const base64DataUrl = `data:${file.type};base64,${base64}`;

    // Save to database - use "2x2" as default size since images work for all sizes
    // The size field is kept for backward compatibility but images are flexible
    const imageId = await savePixelArtImage(null, null, "2x2", base64DataUrl);

    if (!imageId) {
      return NextResponse.json({ error: "Failed to save image" }, { status: 500 });
    }

    // Fetch the saved image to return
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("pixel_art_images")
        .select("id, base_image_data, size, created_at")
        .eq("id", imageId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "Failed to fetch saved image" }, { status: 500 });
      }

      return NextResponse.json({ image: data });
    }

      return NextResponse.json({ 
        image: { 
          id: imageId, 
          base_image_data: base64DataUrl, 
          size: "2x2", // Default for compatibility
          created_at: new Date().toISOString() 
        } 
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

    const { error } = await supabase
      .from("pixel_art_images")
      .delete()
      .in("id", idArray);

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

