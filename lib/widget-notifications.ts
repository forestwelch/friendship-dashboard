/**
 * Widget notification utilities
 * Determines if a widget has new content since the viewer's last interaction
 */

export interface WidgetInteraction {
  last_interacted_at: string | null; // ISO timestamp string or null if never interacted
}

export interface WidgetUpdateInfo {
  last_updated_at: string | null; // ISO timestamp string or null if never updated
}

/**
 * Check if a widget has new content since the viewer's last interaction
 * @param lastUpdatedAt - When the widget content was last updated (from friend_widgets.last_updated_at)
 * @param lastInteractedAt - When the viewer last interacted with the widget (from widget_interactions.last_interacted_at)
 * @returns true if widget has new content, false otherwise
 */
export function hasNewContent(
  lastUpdatedAt: string | null | undefined,
  lastInteractedAt: string | null | undefined
): boolean {
  // If widget was never updated, no new content
  if (!lastUpdatedAt) {
    return false;
  }

  // If viewer never interacted, consider it new content
  if (!lastInteractedAt) {
    return true;
  }

  // Compare timestamps - widget has new content if updated after last interaction
  const updatedTime = new Date(lastUpdatedAt).getTime();
  const interactedTime = new Date(lastInteractedAt).getTime();

  return updatedTime > interactedTime;
}

/**
 * Get the interaction data for a widget from the viewer's perspective
 * This will be used to determine visual state
 */
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
