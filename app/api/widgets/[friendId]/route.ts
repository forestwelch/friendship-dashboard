import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { WidgetSize } from "@/lib/types";

interface FriendWidgetRow {
  id: string;
  widget_id: string;
  position_x: number;
  position_y: number;
  size: WidgetSize;
  config: Record<string, unknown>;
  widgets?: {
    id: string;
    type: string;
    name: string;
  };
  widget_type?: string;
  widget_name?: string;
}

interface WidgetTypeRow {
  id: string;
  type: string;
}

interface WidgetInput {
  widget_type: string;
  position_x: number;
  position_y: number;
  size: WidgetSize;
  config?: Record<string, unknown>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const resolvedParams = await params;
    const friendId = resolvedParams?.friendId;

    if (!friendId) {
      return NextResponse.json({ error: "Friend ID is required" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ widgets: [] });
    }

    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient
      .from("friend_widgets")
      .select(
        `
        *,
        widgets (
          id,
          type,
          name
        )
      `
      )
      .eq("friend_id", friendId)
      .order("position_y")
      .order("position_x");

    if (error) {
      console.error("Error fetching widgets:", error);
      return NextResponse.json({ error: "Failed to fetch widgets" }, { status: 500 });
    }

    // Transform the data to match expected format
    const widgets = (data || []).map((fw: FriendWidgetRow) => ({
      id: fw.id,
      widget_id: fw.widget_id,
      widget_type: fw.widgets?.type || fw.widget_type,
      widget_name: fw.widgets?.name || fw.widget_name,
      position_x: fw.position_x,
      position_y: fw.position_y,
      size: fw.size,
      config: fw.config || {},
    }));

    return NextResponse.json({ widgets });
  } catch (error) {
    console.error("Error in GET /api/widgets/[friendId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const resolvedParams = await params;
    const friendId = resolvedParams?.friendId;
    const body = await request.json();
    const { widgets } = body;

    if (!friendId) {
      return NextResponse.json({ error: "Friend ID is required" }, { status: 400 });
    }

    if (!widgets || !Array.isArray(widgets)) {
      return NextResponse.json({ error: "Widgets array is required" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const adminClient = getSupabaseAdmin();

    // First, get all widget types to resolve widget_type strings to widget_id UUIDs
    const { data: widgetTypes, error: widgetTypesError } = await adminClient
      .from("widgets")
      .select("id, type");

    if (widgetTypesError) {
      console.error("Error fetching widget types:", widgetTypesError);
      return NextResponse.json({ error: "Failed to fetch widget types" }, { status: 500 });
    }

    const widgetTypeMap = new Map((widgetTypes || []).map((wt: WidgetTypeRow) => [wt.type, wt.id]));

    // Delete all existing widgets for this friend
    const { error: deleteError } = await adminClient
      .from("friend_widgets")
      .delete()
      .eq("friend_id", friendId);

    if (deleteError) {
      console.error("Error deleting existing widgets:", deleteError);
      return NextResponse.json({ error: "Failed to delete existing widgets" }, { status: 500 });
    }

    // Insert new widgets
    const widgetsToInsert = widgets.map((w: WidgetInput) => {
      const widgetId = widgetTypeMap.get(w.widget_type);
      if (!widgetId) {
        throw new Error(`Unknown widget type: ${w.widget_type}`);
      }

      return {
        friend_id: friendId,
        widget_id: widgetId,
        position_x: w.position_x,
        position_y: w.position_y,
        size: w.size,
        config: w.config || {},
      };
    });

    if (widgetsToInsert.length > 0) {
      const { data: insertedWidgets, error: insertError } = await adminClient
        .from("friend_widgets")
        .insert(widgetsToInsert)
        .select(
          `
          *,
          widgets (
            id,
            type,
            name
          )
        `
        );

      if (insertError) {
        console.error("Error inserting widgets:", insertError);
        return NextResponse.json({ error: "Failed to save widgets" }, { status: 500 });
      }

      // Transform the response
      const result = (insertedWidgets || []).map((fw: FriendWidgetRow) => ({
        id: fw.id,
        widget_id: fw.widget_id,
        widget_type: fw.widgets?.type || fw.widget_type,
        widget_name: fw.widgets?.name || fw.widget_name,
        position_x: fw.position_x,
        position_y: fw.position_y,
        size: fw.size,
        config: fw.config || {},
      }));

      return NextResponse.json({ widgets: result });
    }

    return NextResponse.json({ widgets: [] });
  } catch (error) {
    console.error("Error in PUT /api/widgets/[friendId]:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
