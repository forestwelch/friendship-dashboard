export interface WidgetInteraction {
  last_interacted_at: string | null; // ISO timestamp string or null if never interacted
}

export interface WidgetUpdateInfo {
  last_updated_at: string | null; // ISO timestamp string or null if never updated
}

export function hasNewContent(
  lastUpdatedAt: string | null | undefined,
  lastInteractedAt: string | null | undefined
): boolean {
  if (!lastUpdatedAt) {
    return false;
  }
  if (!lastInteractedAt) {
    return true;
  }
  const updatedTime = new Date(lastUpdatedAt).getTime();
  const interactedTime = new Date(lastInteractedAt).getTime();
  return updatedTime > interactedTime;
}

export interface WidgetNotificationState {
  hasNewContent: boolean;
  lastUpdatedAt: string | null;
  lastInteractedAt: string | null;
}

export function getWidgetNotificationState(
  widgetUpdateInfo: WidgetUpdateInfo,
  widgetInteraction: WidgetInteraction | null
): WidgetNotificationState {
  const lastUpdatedAt = widgetUpdateInfo.last_updated_at;
  const lastInteractedAt = widgetInteraction?.last_interacted_at || null;

  return {
    hasNewContent: hasNewContent(lastUpdatedAt, lastInteractedAt),
    lastUpdatedAt,
    lastInteractedAt,
  };
}

/**
 * Update last_updated_at for a widget when its content changes
 * This is used for widgets that store their data in separate tables
 * (like Connect4, Fridge Magnets, Audio Snippets) rather than in friend_widgets.config
 */
export async function updateWidgetLastUpdatedAt(
  friendId: string,
  widgetType: string
): Promise<void> {
  const { supabase } = await import("./supabase");
  const { isSupabaseConfigured } = await import("./supabase");

  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    // Find the widget type ID
    const { data: widgetTypeData } = await supabase
      .from("widgets")
      .select("id")
      .eq("type", widgetType)
      .single();

    if (!widgetTypeData?.id) {
      console.error(`Widget type ${widgetType} not found`);
      return;
    }

    // Update last_updated_at for the widget
    const { error } = await supabase
      .from("friend_widgets")
      .update({ last_updated_at: new Date().toISOString() })
      .eq("friend_id", friendId)
      .eq("widget_id", widgetTypeData.id);

    if (error) {
      console.error(`Error updating last_updated_at for ${widgetType}:`, error);
    }
  } catch (error) {
    console.error(`Error in updateWidgetLastUpdatedAt for ${widgetType}:`, error);
  }
}
