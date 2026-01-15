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
