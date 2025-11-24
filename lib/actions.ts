import { isSupabaseConfigured } from "./supabase";
import { createInboxItem } from "./queries";

export async function proposeHangout(
  friendId: string,
  date: string,
  time: string,
  message?: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    // Mock: Proposed hangout
    return true;
  }

  return await createInboxItem(friendId, "hangout_proposal", {
    date,
    time,
    message,
  });
}

export async function updateMediaRecommendation(
  _friendId: string,
  _recommendations: Array<Record<string, unknown>>
): Promise<boolean> {
  // This would typically update the widget config in friend_widgets
  // But since configs are stored in the widget definition, we'd need the widget ID
  // For now, let's assume we're just logging it or sending to inbox if it's a new one
  // Update media recommendations
  return true;
}


