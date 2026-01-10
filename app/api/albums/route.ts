import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ albums: [] });
  }

  try {
    // Fetch all albums with image counts
    const { data: albums, error: albumsError } = await supabase
      .from("albums")
      .select("id, name, created_at")
      .order("name", { ascending: true });

    if (albumsError) {
      console.error("[API] Error fetching albums:", albumsError);
      return NextResponse.json({ error: "Failed to fetch albums" }, { status: 500 });
    }

    // Get image counts for each album
    const albumsWithCounts = await Promise.all(
      (albums || []).map(async (album) => {
        const { count } = await supabase
          .from("pixel_art_images")
          .select("*", { count: "exact", head: true })
          .eq("album_id", album.id);

        return {
          ...album,
          imageCount: count || 0,
        };
      })
    );

    return NextResponse.json({ albums: albumsWithCounts });
  } catch (error) {
    console.error("[API] Error in GET /api/albums:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Album name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check for duplicate name
    const { data: existing } = await supabase
      .from("albums")
      .select("id")
      .eq("name", trimmedName)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Album with this name already exists" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("albums")
      .insert({ name: trimmedName })
      .select("id, name, created_at")
      .single();

    if (error) {
      console.error("[API] Error creating album:", error);
      return NextResponse.json({ error: "Failed to create album" }, { status: 500 });
    }

    return NextResponse.json({ album: data });
  } catch (error) {
    console.error("[API] Error in POST /api/albums:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Album ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Album name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check for duplicate name (excluding current album)
    const { data: existing } = await supabase
      .from("albums")
      .select("id")
      .eq("name", trimmedName)
      .neq("id", id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Album with this name already exists" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("albums")
      .update({ name: trimmedName })
      .eq("id", id)
      .select("id, name")
      .single();

    if (error) {
      console.error("[API] Error updating album:", error);
      return NextResponse.json({ error: "Failed to update album" }, { status: 500 });
    }

    return NextResponse.json({ album: data });
  } catch (error) {
    console.error("[API] Error in PUT /api/albums:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Album ID is required" }, { status: 400 });
    }

    // Set all images with this album_id to null (uncategorized)
    // This happens automatically via ON DELETE SET NULL, but we'll do it explicitly for clarity
    const { error: updateError } = await supabase
      .from("pixel_art_images")
      .update({ album_id: null })
      .eq("album_id", id);

    if (updateError) {
      console.error("[API] Error updating images:", updateError);
      return NextResponse.json({ error: "Failed to update images" }, { status: 500 });
    }

    // Delete the album
    const { error: deleteError } = await supabase.from("albums").delete().eq("id", id);

    if (deleteError) {
      console.error("[API] Error deleting album:", deleteError);
      return NextResponse.json({ error: "Failed to delete album" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error in DELETE /api/albums:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
