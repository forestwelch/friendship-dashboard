import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

/**
 * POST /api/widgets/interactions
 * Update or create a widget interaction record
 * Body: { friend_widget_id: string, viewer_friend_id: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { friend_widget_id, viewer_friend_id } = body;

    if (!friend_widget_id || !viewer_friend_id) {
      return NextResponse.json(
        { error: "friend_widget_id and viewer_friend_id are required" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      // Mock response for development
      return NextResponse.json({ success: true, last_interacted_at: new Date().toISOString() });
    }

    const adminClient = getSupabaseAdmin();

    // Upsert interaction record (update if exists, insert if not)
    const { data, error } = await adminClient
      .from("widget_interactions")
      .upsert(
        {
          friend_widget_id,
          viewer_friend_id,
          last_interacted_at: new Date().toISOString(),
        },
        {
          onConflict: "friend_widget_id,viewer_friend_id",
        }
      )
      .select("last_interacted_at")
      .single();

    if (error) {
      console.error("Error updating widget interaction:", error);
      return NextResponse.json({ error: "Failed to update interaction" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      last_interacted_at: data?.last_interacted_at,
    });
  } catch (error) {
    console.error("Error in POST /api/widgets/interactions:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * GET /api/widgets/interactions
 * Get interaction records for a viewer friend
 * Query params: viewer_friend_id (required), friend_widget_ids (optional comma-separated list)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const viewer_friend_id = searchParams.get("viewer_friend_id");
    const friend_widget_ids = searchParams.get("friend_widget_ids");

    if (!viewer_friend_id) {
      return NextResponse.json({ error: "viewer_friend_id is required" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      // Mock response for development
      return NextResponse.json({ interactions: [] });
    }

    const adminClient = getSupabaseAdmin();
    let query = adminClient
      .from("widget_interactions")
      .select("friend_widget_id, last_interacted_at")
      .eq("viewer_friend_id", viewer_friend_id);

    // Filter by specific widget IDs if provided
    if (friend_widget_ids) {
      const widgetIdArray = friend_widget_ids.split(",").filter((id) => id.trim());
      if (widgetIdArray.length > 0) {
        query = query.in("friend_widget_id", widgetIdArray);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching widget interactions:", error);
      return NextResponse.json({ error: "Failed to fetch interactions" }, { status: 500 });
    }

    // Transform to a map for easier lookup
    const interactionsMap: Record<string, { last_interacted_at: string }> = {};
    (data || []).forEach((interaction) => {
      interactionsMap[interaction.friend_widget_id] = {
        last_interacted_at: interaction.last_interacted_at,
      };
    });

    return NextResponse.json({ interactions: interactionsMap });
  } catch (error) {
    console.error("Error in GET /api/widgets/interactions:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
