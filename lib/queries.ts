import { supabase, isSupabaseConfigured } from "./supabase";
import { Friend, WidgetSize, WidgetConfig } from "./types";

export interface FriendWidget {
  id: string;
  widget_id: string;
  widget_type: string;
  widget_name: string;
  size: WidgetSize;
  position_x: number;
  position_y: number;
  config: WidgetConfig;
  last_updated_at?: string | null; // ISO timestamp
}

export interface FriendPageData {
  friend: Friend;
  widgets: FriendWidget[];
  pixelArtImages?: Array<{
    id: string;
    widget_id: string | null;
    size: WidgetSize;
    image_data: string;
  }>;
}

/**
 * Get widget interactions for a viewer friend
 * Returns a map of friend_widget_id -> { last_interacted_at: string }
 */
export async function getWidgetInteractions(
  viewerFriendId: string,
  friendWidgetIds?: string[]
): Promise<Record<string, { last_interacted_at: string }>> {
  if (!isSupabaseConfigured()) {
    return {};
  }

  try {
    let query = supabase
      .from("widget_interactions")
      .select("friend_widget_id, last_interacted_at")
      .eq("viewer_friend_id", viewerFriendId);

    if (friendWidgetIds && friendWidgetIds.length > 0) {
      query = query.in("friend_widget_id", friendWidgetIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching widget interactions:", error);
      return {};
    }

    // Transform to a map for easier lookup
    const interactionsMap: Record<string, { last_interacted_at: string }> = {};
    (data || []).forEach((interaction) => {
      interactionsMap[interaction.friend_widget_id] = {
        last_interacted_at: interaction.last_interacted_at,
      };
    });

    return interactionsMap;
  } catch (error) {
    console.error("Error in getWidgetInteractions:", error);
    return {};
  }
}

/**
 * Get all friends
 */
export async function getAllFriends(): Promise<Friend[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase.from("friends").select("*").order("display_name");

    if (error) {
      console.error("Error fetching friends:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAllFriends:", error);
    return [];
  }
}

/**
 * Get friend page data including widgets and layout
 */
export async function getFriendPage(slug: string): Promise<FriendPageData | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    // Fetch friend
    const { data: friend, error: friendError } = await supabase
      .from("friends")
      .select("*")
      .eq("slug", slug)
      .single();
    // Performance: getFriendPage - friend query

    if (friendError || !friend) {
      console.error("Error fetching friend:", friendError);
      return null;
    }

    // Parallelize queries for better performance
    const [widgetsResult, pixelArtResult] = await Promise.all([
      // Fetch friend's widgets with widget type info
      supabase
        .from("friend_widgets")
        .select(
          `
          id,
          widget_id,
          size,
          position_x,
          position_y,
          config,
          last_updated_at,
          widgets:widget_id (
            type,
            name
          )
        `
        )
        .eq("friend_id", friend.id)
        .order("position_y")
        .order("position_x"),
      // Fetch pixel art images for this friend (lazy load - don't fetch full image data here)
      supabase.from("pixel_art_images").select("id, widget_id, size").eq("friend_id", friend.id),
    ]);

    const { data: widgets, error: widgetsError } = widgetsResult;
    const { data: pixelArtImages } = pixelArtResult;

    if (widgetsError) {
      console.error("Error fetching widgets:", widgetsError);
      return null;
    }

    // Transform widgets data
    const transformedWidgets: FriendWidget[] = (widgets || []).map((w: Record<string, unknown>) => {
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/08ba6ecb-f05f-479b-b2cd-50cb668f1262", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "queries.ts:142",
          message: "Transforming widget",
          data: {
            widgetId: w.id,
            widgetType:
              w.widgets && typeof w.widgets === "object" && "type" in w.widgets
                ? String((w.widgets as { type: string }).type)
                : undefined,
            widgetName:
              w.widgets && typeof w.widgets === "object" && "name" in w.widgets
                ? String((w.widgets as { name: string }).name)
                : undefined,
            hasWidgets: !!w.widgets,
          },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "A",
        }),
      }).catch(() => {});
      // #endregion
      return {
        id: String(w.id),
        widget_id: String(w.widget_id),
        widget_type:
          w.widgets && typeof w.widgets === "object" && "type" in w.widgets
            ? String((w.widgets as { type: string }).type)
            : "",
        widget_name:
          w.widgets && typeof w.widgets === "object" && "name" in w.widgets
            ? String((w.widgets as { name: string }).name)
            : "",
        size: w.size as WidgetSize,
        position_x: Number(w.position_x),
        position_y: Number(w.position_y),
        config: (w.config || {}) as WidgetConfig,
        last_updated_at: w.last_updated_at ? String(w.last_updated_at) : null,
      };
    });

    const result = {
      friend: {
        id: friend.id,
        name: friend.name,
        slug: friend.slug,
        display_name: friend.display_name,
        color_primary: friend.color_primary,
        color_secondary: friend.color_secondary,
        color_accent: friend.color_accent,
        color_bg: friend.color_bg,
        color_text: friend.color_text,
      },
      widgets: transformedWidgets,
      // Map back to expected interface (without full image data for performance)
      pixelArtImages:
        (pixelArtImages || []).map((img: Record<string, unknown>) => ({
          id: String(img.id || ""),
          widget_id: img.widget_id ? String(img.widget_id) : null,
          size: (img.size as WidgetSize) || "1x1",
          image_data: "", // Will be fetched separately if needed
        })) || [],
    };

    // Performance: getFriendPage completed
    return result;
  } catch (error) {
    console.error("Error in getFriendPage:", error);
    return null;
  }
}

/**
 * Get global content (shared across all friends)
 */
export async function getGlobalContent(contentType: string): Promise<unknown> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("global_content")
      .select("data")
      .eq("content_type", contentType)
      .single();

    // Performance: getGlobalContent completed

    if (error || !data) {
      console.error("Error fetching global content:", error);
      return null;
    }

    return data.data;
  } catch (error) {
    console.error("Error in getGlobalContent:", error);
    return null;
  }
}

/**
 * Get personal content (friend-specific)
 */
export async function getPersonalContent(friendId: string, contentType: string): Promise<unknown> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("personal_content")
      .select("data")
      .eq("friend_id", friendId)
      .eq("content_type", contentType)
      .single();

    if (error || !data) {
      return null;
    }

    return data.data;
  } catch (error) {
    console.error("Error in getPersonalContent:", error);
    return null;
  }
}

/**
 * Save pixel art image with pixel_data and preview
 */
export async function savePixelArtImage(
  pixelData: string, // Required: base64-encoded Uint8Array
  preview: string // Required: base64 PNG preview
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const insertData: Record<string, unknown> = {
      pixel_data: pixelData,
      preview: preview,
      width: 256,
      height: 256,
    };

    const { data, error } = await supabase
      .from("pixel_art_images")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      console.error("Error saving pixel art:", error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error("Error in savePixelArtImage:", error);
    return null;
  }
}

/**
 * Get all albums with image counts
 */
export async function getAllAlbums(): Promise<
  Array<{ id: string; name: string; created_at: string; imageCount: number }>
> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data: albums, error: albumsError } = await supabase
      .from("albums")
      .select("id, name, created_at")
      .order("name", { ascending: true });

    if (albumsError) {
      console.error("Error fetching albums:", albumsError);
      return [];
    }

    // Get image counts for each album
    const albumsWithCounts = await Promise.all(
      (albums || []).map(async (album) => {
        const { count } = await supabase
          .from("pixel_art_images")
          .select("*", { count: "exact", head: true })
          .eq("album_id", album.id);

        return {
          ...album,
          imageCount: count || 0,
        };
      })
    );

    return albumsWithCounts;
  } catch (error) {
    console.error("Error in getAllAlbums:", error);
    return [];
  }
}

/**
 * Create a new album
 */
export async function createAlbum(
  name: string
): Promise<{ id: string; name: string; created_at: string } | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const trimmedName = name.trim();

    // Check for duplicate name
    const { data: existing } = await supabase
      .from("albums")
      .select("id")
      .eq("name", trimmedName)
      .single();

    if (existing) {
      throw new Error("Album with this name already exists");
    }

    const { data, error } = await supabase
      .from("albums")
      .insert({ name: trimmedName })
      .select("id, name, created_at")
      .single();

    if (error) {
      console.error("Error creating album:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in createAlbum:", error);
    return null;
  }
}

/**
 * Rename an album
 */
export async function renameAlbum(
  id: string,
  name: string
): Promise<{ id: string; name: string } | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const trimmedName = name.trim();

    // Check for duplicate name (excluding current album)
    const { data: existing } = await supabase
      .from("albums")
      .select("id")
      .eq("name", trimmedName)
      .neq("id", id)
      .single();

    if (existing) {
      throw new Error("Album with this name already exists");
    }

    const { data, error } = await supabase
      .from("albums")
      .update({ name: trimmedName })
      .eq("id", id)
      .select("id, name")
      .single();

    if (error) {
      console.error("Error renaming album:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in renameAlbum:", error);
    return null;
  }
}

/**
 * Delete an album (sets all images to uncategorized)
 */
export async function deleteAlbum(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    // Set all images with this album_id to null (uncategorized)
    const { error: updateError } = await supabase
      .from("pixel_art_images")
      .update({ album_id: null })
      .eq("album_id", id);

    if (updateError) {
      console.error("Error updating images:", updateError);
      return false;
    }

    // Delete the album
    const { error: deleteError } = await supabase.from("albums").delete().eq("id", id);

    if (deleteError) {
      console.error("Error deleting album:", deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteAlbum:", error);
    return false;
  }
}

/**
 * Update images' album assignment
 */
export async function updateImageAlbums(
  imageIds: string[],
  albumId: string | null
): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  try {
    const updateData: { album_id: string | null } = {
      album_id: albumId === null || albumId === "null" || albumId === "" ? null : albumId,
    };

    const { data, error } = await supabase
      .from("pixel_art_images")
      .update(updateData)
      .in("id", imageIds)
      .select("id");

    if (error) {
      console.error("Error updating image albums:", error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error("Error in updateImageAlbums:", error);
    return 0;
  }
}
