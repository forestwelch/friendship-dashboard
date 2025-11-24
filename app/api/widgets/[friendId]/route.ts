import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { FriendWidget } from "@/lib/queries";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  const { friendId } = await params;
  const body = await request.json();
  const { widgets } = body;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  if (!widgets || !Array.isArray(widgets)) {
    return NextResponse.json(
      { error: "Invalid widgets data" },
      { status: 400 }
    );
  }

  try {
    const adminClient = getSupabaseAdmin();
    
    // Get widget type IDs from widget types first
    const widgetTypes = await adminClient.from("widgets").select("id, type");
    if (widgetTypes.error) {
      console.error("Error fetching widget types:", widgetTypes.error);
      return NextResponse.json(
        { error: `Failed to fetch widget types: ${widgetTypes.error.message}` },
        { status: 500 }
      );
    }

    const widgetTypeMap = new Map(
      (widgetTypes.data || []).map((w) => [w.type, w.id])
    );

    // Validate all widget types exist
    const invalidTypes = widgets
      .map((w: FriendWidget) => w.widget_type)
      .filter((type) => !widgetTypeMap.has(type));
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/08ba6ecb-f05f-479b-b2cd-50cb668f1262',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/widgets/route.ts:44',message:'Validating widget types',data:{invalidTypes,availableTypes:Array.from(widgetTypeMap.keys()),widgetTypes:widgets.map((w: FriendWidget) => w.widget_type)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        {
          error: `Unknown widget types: ${invalidTypes.join(", ")}. Available types: ${Array.from(widgetTypeMap.keys()).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Saving widgets for friend
    
    // Delete all existing widgets for this friend
    const { error: deleteError } = await adminClient
      .from("friend_widgets")
      .delete()
      .eq("friend_id", friendId);

    if (deleteError) {
      console.error("[API] Error deleting widgets:", deleteError);
      return NextResponse.json(
        { error: `Failed to delete existing widgets: ${deleteError.message}` },
        { status: 500 }
      );
    }
    
    // Deleted existing widgets, inserting new ones

    // Insert new widgets
    const widgetsToInsert = widgets.map((w: FriendWidget) => {
      const widgetTypeId = widgetTypeMap.get(w.widget_type);
      if (!widgetTypeId) {
        throw new Error(`Widget type ${w.widget_type} not found`);
      }

      return {
        friend_id: friendId,
        widget_id: widgetTypeId,
        size: w.size,
        position_x: w.position_x,
        position_y: w.position_y,
        config: w.config || {},
      };
    });

    if (widgetsToInsert.length > 0) {
      const { error: insertError } = await adminClient
        .from("friend_widgets")
        .insert(widgetsToInsert);

      if (insertError) {
        console.error("[API] Error inserting widgets:", insertError);
        console.error("[API] Widgets that failed:", JSON.stringify(widgetsToInsert, null, 2));
        return NextResponse.json(
          { error: `Failed to save widgets: ${insertError.message}`, details: insertError },
          { status: 500 }
        );
      }
      
      // Successfully saved widgets
    }

    return NextResponse.json({ success: true, saved: widgetsToInsert.length });
  } catch (error) {
    console.error("Error saving widgets:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

