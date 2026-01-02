import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ friends: [] });
  }

  try {
    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient.from("friends").select("*").order("display_name");

    if (error) {
      console.error("Error fetching friends:", error);
      return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
    }

    return NextResponse.json({ friends: data || [] });
  } catch (error) {
    console.error("Error in GET /api/friends:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      display_name,
      color_primary,
      color_secondary,
      color_accent,
      color_bg,
      color_text,
    } = body;

    if (!name || !slug || !display_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient
      .from("friends")
      .insert({
        name,
        slug,
        display_name,
        color_primary: color_primary || "#4a9eff",
        color_secondary: color_secondary || "#6abfff",
        color_accent: color_accent || "#2a7fff",
        color_bg: color_bg || "#0a1a2e",
        color_text: color_text || "#c8e0ff",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating friend:", error);
      return NextResponse.json(
        { error: `Failed to create friend: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ friend: data });
  } catch (error) {
    console.error("Error in POST /api/friends:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
