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
