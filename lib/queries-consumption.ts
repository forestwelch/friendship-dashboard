import { supabase, isSupabaseConfigured } from "./supabase";

export interface ConsumptionEntry {
  id: string;
  friend_id: string;
  title: string;
  link: string | null;
  thought: string;
  added_by: "admin" | "friend";
  read_by_admin: boolean;
  read_by_friend: boolean;
  created_at: string;
}

export async function getConsumptionEntries(friendId: string): Promise<ConsumptionEntry[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("consumption_log")
      .select("*")
      .eq("friend_id", friendId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching consumption entries:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getConsumptionEntries:", error);
    return [];
  }
}

export async function createConsumptionEntry(
  friendId: string,
  title: string,
  thought: string,
  link: string | null,
  addedBy: "admin" | "friend"
): Promise<ConsumptionEntry | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("consumption_log")
      .insert({
        friend_id: friendId,
        title,
        thought,
        link,
        added_by: addedBy,
        read_by_admin: addedBy === "admin",
        read_by_friend: addedBy === "friend",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating consumption entry:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in createConsumptionEntry:", error);
    return null;
  }
}

export async function markConsumptionEntryAsRead(
  entryId: string,
  reader: "admin" | "friend"
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const updateField = reader === "admin" ? "read_by_admin" : "read_by_friend";
    const { error } = await supabase
      .from("consumption_log")
      .update({ [updateField]: true })
      .eq("id", entryId);

    if (error) {
      console.error("Error marking entry as read:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in markConsumptionEntryAsRead:", error);
    return false;
  }
}
