import { supabase, isSupabaseConfigured } from "../supabase";

/**
 * Get inbox items for admin
 */
export async function getInboxItems(
  status: "all" | "pending" | "approved" | "rejected" = "all"
): Promise<Array<Record<string, unknown>>> {
  if (!isSupabaseConfigured()) {
    return [
      {
        id: "mock-1",
        type: "recommendation",
        friend_id: "mock-daniel",
        friend_name: "Daniel",
        data: {
          title: "The Matrix",
          type: "movie",
          description: "You have to watch this!",
        },
        created_at: new Date().toISOString(),
        status: "pending",
      },
    ];
  }

  try {
    let query = supabase
      .from("inbox_items")
      .select(
        `
        *,
        friend:friend_id (
          display_name
        )
      `
      )
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching inbox items:", error);
      return [];
    }

    return data.map((item: Record<string, unknown>) => ({
      ...item,
      friend_name:
        (item.friend && typeof item.friend === "object" && "display_name" in item.friend
          ? (item.friend as { display_name: string }).display_name
          : null) || "Unknown",
    }));
  } catch (error) {
    console.error("Error in getInboxItems:", error);
    return [];
  }
}

/**
 * Update inbox item status
 */
export async function updateInboxItemStatus(
  itemId: string,
  status: "approved" | "rejected"
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    // Mock: Updated inbox item status
    return true;
  }

  try {
    const { error } = await supabase.from("inbox_items").update({ status }).eq("id", itemId);

    if (error) {
      console.error("Error updating inbox item:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateInboxItemStatus:", error);
    return false;
  }
}

/**
 * Create inbox item
 */
export async function createInboxItem(
  friendId: string,
  type: "recommendation" | "hangout_proposal",
  data: Record<string, unknown>
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    // Mock: Created inbox item
    return true;
  }

  try {
    const { error } = await supabase.from("inbox_items").insert({
      friend_id: friendId,
      type,
      data,
    });

    if (error) {
      console.error("Error creating inbox item:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in createInboxItem:", error);
    return false;
  }
}
