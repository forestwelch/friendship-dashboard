import { NextRequest, NextResponse } from "next/server";
import { savePixelArtImage } from "@/lib/queries";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ images: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get("albumId"); // Filter by album (null for uncategorized)
    const includeAlbums = searchParams.get("includeAlbums") === "true"; // Batch request optimization

    // Fetching global images
    let query = supabase
      .from("pixel_art_images")
      .select("id, pixel_data, preview, width, height, album_id, created_at")
      .order("created_at", { ascending: false })
      .limit(100); // Limit to prevent huge payloads

    // Filter by album if specified
    if (albumId === "null" || albumId === "") {
      // Uncategorized images (album_id is null)
      query = query.is("album_id", null);
    } else if (albumId) {
      // Specific album
      query = query.eq("album_id", albumId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[API] Error fetching images:", error);
      return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
    }

    // Return pixel_data and preview
    const images = (data || []).map((img) => ({
      id: img.id,
      pixel_data: img.pixel_data || null,
      preview: img.preview || null,
      width: img.width || 256,
      height: img.height || 256,
      album_id: img.album_id || null,
      created_at: img.created_at,
    }));

    // Optionally include albums data (batch request optimization)
    let albums = undefined;
    if (includeAlbums) {
      // Fetch albums
      const { data: albumsData, error: albumsError } = await supabase
        .from("albums")
        .select("id, name, created_at")
        .order("name", { ascending: true });

      if (!albumsError && albumsData) {
        // Get image counts for all albums in a single query
        const { data: imageCounts } = await supabase
          .from("pixel_art_images")
          .select("album_id")
          .not("album_id", "is", null);

        // Build a map of album_id -> count
        const countMap = new Map<string, number>();
        (imageCounts || []).forEach((img) => {
          if (img.album_id) {
            countMap.set(img.album_id, (countMap.get(img.album_id) || 0) + 1);
          }
        });

        // Attach counts to albums
        albums = albumsData.map((album) => ({
          ...album,
          imageCount: countMap.get(album.id) || 0,
        }));
      }
    }

    const responseData = includeAlbums ? { images, albums } : { images };
    const response = NextResponse.json(responseData);

    // Add caching headers for better performance
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

    return response;
  } catch (error) {
    console.error("[API] Error in GET /api/images:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const pixelData = formData.get("pixel_data") as string | null;
    const preview = formData.get("preview") as string | null;

    if (!pixelData || !preview) {
      return NextResponse.json({ error: "Missing pixel_data or preview" }, { status: 400 });
    }

    const imageId = await savePixelArtImage(pixelData, preview);

    if (!imageId) {
      return NextResponse.json({ error: "Failed to save image" }, { status: 500 });
    }

    // Fetch the saved image to return
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("pixel_art_images")
        .select("id, pixel_data, preview, width, height, album_id, created_at")
        .eq("id", imageId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "Failed to fetch saved image" }, { status: 500 });
      }

      return NextResponse.json({
        image: {
          id: data.id,
          pixel_data: data.pixel_data || null,
          preview: data.preview || null,
          width: data.width || 256,
          height: data.height || 256,
          album_id: data.album_id || null,
          created_at: data.created_at,
        },
      });
    }

    return NextResponse.json({
      image: {
        id: imageId,
        pixel_data: pixelData,
        preview: preview,
        width: 256,
        height: 256,
        album_id: null,
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

export async function PATCH(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { imageIds, albumId } = body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json({ error: "imageIds array is required" }, { status: 400 });
    }

    // albumId can be null (to remove from album) or a UUID string
    const updateData: { album_id: string | null } = {
      album_id: albumId === null || albumId === "null" || albumId === "" ? null : albumId,
    };

    const { data, error } = await supabase
      .from("pixel_art_images")
      .update(updateData)
      .in("id", imageIds)
      .select("id");

    if (error) {
      console.error("[API] Error updating images:", error);
      return NextResponse.json({ error: "Failed to update images" }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: data?.length || 0 });
  } catch (error) {
    console.error("[API] Error in PATCH /api/images:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
