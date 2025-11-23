import { supabase, isSupabaseConfigured } from "./supabase";

export async function proposeHangout(
  friendId: string,
  date: string,
  time: string,
  message?: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.log("Mock: Proposed hangout", { friendId, date, time, message });
    return true;
  }

  return await createInboxItem(friendId, "hangout_proposal", {
    date,
    time,
    message,
  });
}

export async function updateMediaRecommendation(
  friendId: string,
  recommendations: any[]
): Promise<boolean> {
  // This would typically update the widget config in friend_widgets
  // But since configs are stored in the widget definition, we'd need the widget ID
  // For now, let's assume we're just logging it or sending to inbox if it's a new one
  console.log("Update media recommendations", friendId, recommendations);
  return true;
}


