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

// WidgetInput interface removed - using inline type from request body

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
    const widgets = (data || []).map(
      (fw: FriendWidgetRow & { last_updated_at?: string | null }) => ({
        id: fw.id,
        widget_id: fw.widget_id,
        widget_type: fw.widgets?.type || fw.widget_type,
        widget_name: fw.widgets?.name || fw.widget_name,
        position_x: fw.position_x,
        position_y: fw.position_y,
        size: fw.size,
        config: fw.config || {},
        last_updated_at: fw.last_updated_at || null,
      })
    );

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

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/08ba6ecb-f05f-479b-b2cd-50cb668f1262", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "app/api/widgets/[friendId]/route.ts:100",
        message: "Received widgets from frontend",
        data: {
          widgetCount: widgets?.length || 0,
          sampleWidget: widgets?.[0] || null,
          widgetIds: widgets?.map((w: { id?: string }) => w.id).filter(Boolean) || [],
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion

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
    // Also get allow_multiple flag for duplicate checking
    const { data: widgetTypes, error: widgetTypesError } = await adminClient
      .from("widgets")
      .select("id, type, allow_multiple");

    if (widgetTypesError) {
      console.error("Error fetching widget types:", widgetTypesError);
      return NextResponse.json({ error: "Failed to fetch widget types" }, { status: 500 });
    }

    const widgetTypeMap = new Map(
      (widgetTypes || []).map((wt: WidgetTypeRow & { allow_multiple?: boolean }) => [
        wt.type,
        wt.id,
      ])
    );

    const widgetAllowMultipleMap = new Map(
      (widgetTypes || []).map((wt: WidgetTypeRow & { allow_multiple?: boolean }) => [
        wt.type,
        wt.allow_multiple || false,
      ])
    );

    // Check for duplicate widget types (except those that allow_multiple)
    const widgetTypeCounts = new Map<string, number>();
    for (const w of widgets) {
      const count = widgetTypeCounts.get(w.widget_type) || 0;
      widgetTypeCounts.set(w.widget_type, count + 1);

      const allowMultiple = widgetAllowMultipleMap.get(w.widget_type) || false;
      if (!allowMultiple && count >= 1) {
        return NextResponse.json(
          { error: `Only one ${w.widget_type} widget is allowed per friend` },
          { status: 400 }
        );
      }
    }

    // Get existing widgets to match by ID and compare changes
    const { data: existingWidgets } = await adminClient
      .from("friend_widgets")
      .select("id, widget_id, position_x, position_y, size, config, last_updated_at")
      .eq("friend_id", friendId);

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/08ba6ecb-f05f-479b-b2cd-50cb668f1262", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "app/api/widgets/[friendId]/route.ts:156",
        message: "Widget save started",
        data: {
          friendId,
          widgetCount: widgets.length,
          existingCount: existingWidgets?.length || 0,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion

    // Create a map of existing widgets by ID for quick lookup
    const existingWidgetsById = new Map<
      string,
      typeof existingWidgets extends (infer T)[] ? T : never
    >();
    (existingWidgets || []).forEach((ew) => {
      existingWidgetsById.set(ew.id, ew);
    });

    // Separate widgets into updates (by ID) and inserts (new widgets)
    // Since frontend doesn't send IDs, we match by widget_type + position
    // But we need to be careful: if a widget moves, we update it by ID, not create a new one
    const widgetsToUpdate: Array<{ id: string; data: Record<string, unknown> }> = [];
    const widgetsToInsert: Array<Record<string, unknown>> = [];
    const widgetIdsToKeep = new Set<string>();

    // Create a map of existing widgets by widget_type for matching
    // Since frontend doesn't send IDs, we match by widget_type (assuming one per type, except pixel_art)
    const existingWidgetsByType = new Map<
      string,
      typeof existingWidgets extends (infer T)[] ? T[] : never[]
    >();
    (existingWidgets || []).forEach((ew) => {
      // Get widget type from widget_id lookup
      const widgetType = Array.from(widgetTypeMap.entries()).find(
        ([_, id]) => id === ew.widget_id
      )?.[0];
      if (widgetType) {
        if (!existingWidgetsByType.has(widgetType)) {
          existingWidgetsByType.set(widgetType, []);
        }
        existingWidgetsByType.get(widgetType)!.push(ew);
      }
    });

    for (const w of widgets) {
      const widgetId = widgetTypeMap.get(w.widget_type);
      if (!widgetId) {
        throw new Error(`Unknown widget type: ${w.widget_type}`);
      }

      // Try to find existing widget by ID first (if frontend sends it)
      let existingWidget: typeof existingWidgets extends (infer T)[] ? T | null : null = null;

      if (w.id && existingWidgetsById.has(w.id)) {
        existingWidget = existingWidgetsById.get(w.id)!;
      } else {
        // Match by widget_type (for non-pixel_art, there's only one)
        // For pixel_art, match by position
        const widgetsOfType = existingWidgetsByType.get(w.widget_type) || [];
        if (w.widget_type === "pixel_art") {
          // For pixel_art, match by position
          existingWidget =
            widgetsOfType.find(
              (ew) => ew.position_x === w.position_x && ew.position_y === w.position_y
            ) || null;
        } else {
          // For other types, there should be only one
          existingWidget = widgetsOfType[0] || null;
        }
      }

      if (existingWidget) {
        widgetIdsToKeep.add(existingWidget.id);

        // Check if widget actually changed
        const positionChanged =
          existingWidget.position_x !== w.position_x || existingWidget.position_y !== w.position_y;
        const sizeChanged = existingWidget.size !== w.size;
        const configChanged =
          JSON.stringify(existingWidget.config || {}) !== JSON.stringify(w.config || {});

        const hasChanged = positionChanged || sizeChanged || configChanged;

        // #region agent log
        fetch("http://127.0.0.1:7242/ingest/08ba6ecb-f05f-479b-b2cd-50cb668f1262", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "app/api/widgets/[friendId]/route.ts:200",
            message: "Widget update check",
            data: {
              widgetId: existingWidget.id,
              widgetType: w.widget_type,
              position: `${w.position_x},${w.position_y}`,
              size: w.size,
              hasChanged,
              positionChanged,
              sizeChanged,
              configChanged,
              existingLastUpdated: existingWidget.last_updated_at || null,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "A",
          }),
        }).catch(() => {});
        // #endregion

        // Prepare update data
        const updateData: Record<string, unknown> = {
          widget_id: widgetId,
          position_x: w.position_x,
          position_y: w.position_y,
          size: w.size,
          config: w.config || {},
        };

        // Only update last_updated_at if widget actually changed
        if (!hasChanged) {
          updateData.last_updated_at = existingWidget.last_updated_at;
        }
        // If changed, let the database trigger handle updating last_updated_at

        widgetsToUpdate.push({ id: existingWidget.id, data: updateData });
      } else {
        // New widget - insert it
        // #region agent log
        fetch("http://127.0.0.1:7242/ingest/08ba6ecb-f05f-479b-b2cd-50cb668f1262", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "app/api/widgets/[friendId]/route.ts:230",
            message: "Widget insert (new)",
            data: {
              widgetType: w.widget_type,
              position: `${w.position_x},${w.position_y}`,
              size: w.size,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "A",
          }),
        }).catch(() => {});
        // #endregion
        widgetsToInsert.push({
          friend_id: friendId,
          widget_id: widgetId,
          position_x: w.position_x,
          position_y: w.position_y,
          size: w.size,
          config: w.config || {},
          last_updated_at: null, // New widgets haven't been "updated" yet
        });
      }
    }

    // Update existing widgets by ID
    const updatedWidgets: FriendWidgetRow[] = [];
    for (const update of widgetsToUpdate) {
      const { data: updatedWidget, error: updateError } = await adminClient
        .from("friend_widgets")
        .update(update.data)
        .eq("id", update.id)
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
        .single();

      if (updateError) {
        console.error(`Error updating widget ${update.id}:`, updateError);
        return NextResponse.json(
          { error: `Failed to update widget ${update.id}`, details: updateError.message },
          { status: 500 }
        );
      }

      if (updatedWidget) {
        updatedWidgets.push(updatedWidget as FriendWidgetRow);
      }
    }

    // Insert new widgets
    let insertedWidgets: FriendWidgetRow[] = [];
    if (widgetsToInsert.length > 0) {
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/08ba6ecb-f05f-479b-b2cd-50cb668f1262", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "app/api/widgets/[friendId]/route.ts:270",
          message: "About to insert new widgets",
          data: { count: widgetsToInsert.length },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "A",
        }),
      }).catch(() => {});
      // #endregion
      const { data: inserted, error: insertError } = await adminClient
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
        return NextResponse.json(
          {
            error: "Failed to save widgets",
            details: insertError.message,
            code: insertError.code,
            hint: insertError.hint,
          },
          { status: 500 }
        );
      }

      insertedWidgets = (inserted || []) as FriendWidgetRow[];
    }

    // Delete widgets that are no longer in the request
    const widgetIdsToDelete = Array.from(existingWidgetsById.keys()).filter(
      (id) => !widgetIdsToKeep.has(id)
    );

    if (widgetIdsToDelete.length > 0) {
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/08ba6ecb-f05f-479b-b2cd-50cb668f1262", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "app/api/widgets/[friendId]/route.ts:275",
          message: "About to delete removed widgets",
          data: { count: widgetIdsToDelete.length, ids: widgetIdsToDelete },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "A",
        }),
      }).catch(() => {});
      // #endregion
      const { error: deleteError } = await adminClient
        .from("friend_widgets")
        .delete()
        .in("id", widgetIdsToDelete);

      if (deleteError) {
        console.error("Error deleting widgets:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete removed widgets", details: deleteError.message },
          { status: 500 }
        );
      }
    }

    // Combine updated and inserted widgets
    const allWidgets = [...updatedWidgets, ...insertedWidgets];

    // Transform the response - include last_updated_at
    const result = allWidgets.map((fw: FriendWidgetRow & { last_updated_at?: string | null }) => ({
      id: fw.id,
      widget_id: fw.widget_id,
      widget_type: fw.widgets?.type || fw.widget_type,
      widget_name: fw.widgets?.name || fw.widget_name,
      position_x: fw.position_x,
      position_y: fw.position_y,
      size: fw.size,
      config: fw.config || {},
      last_updated_at: fw.last_updated_at || null,
    }));

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/08ba6ecb-f05f-479b-b2cd-50cb668f1262", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "app/api/widgets/[friendId]/route.ts:305",
        message: "Widget save completed",
        data: {
          updatedCount: updatedWidgets.length,
          insertedCount: insertedWidgets.length,
          deletedCount: widgetIdsToDelete.length,
          totalCount: result.length,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json({ widgets: result });
  } catch (error) {
    console.error("Error in PUT /api/widgets/[friendId]:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
