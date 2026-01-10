import { supabase, isSupabaseConfigured } from "./supabase";
import { Friend, WidgetSize, WidgetConfig, Song } from "./types";

export interface FriendWidget {
  id: string;
  widget_id: string;
  widget_type: string;
  widget_name: string;
  size: WidgetSize;
  position_x: number;
  position_y: number;
  config: WidgetConfig;
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

// Re-export common functions
export { getInboxItems, updateInboxItemStatus, createInboxItem } from "./queries-inbox";

/**
 * Get all friends
 */
export async function getAllFriends(): Promise<Friend[]> {
  if (!isSupabaseConfigured()) {
    return [
      {
        id: "mock-daniel",
        name: "daniel",
        slug: "daniel",
        display_name: "Daniel",
        color_primary: "#2a52be",
        color_secondary: "#7cb9e8",
        color_accent: "#00308f",
        color_bg: "#e6f2ff",
        color_text: "#001f3f",
      },
      {
        id: "mock-max",
        name: "max",
        slug: "max",
        display_name: "Max",
        color_primary: "#dc143c",
        color_secondary: "#ff6b6b",
        color_accent: "#8b0000",
        color_bg: "#ffe6e6",
        color_text: "#2d0000",
      },
    ];
  }

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
    // Return mock data if Supabase not configured
    return getMockFriendPage(slug);
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
    return getMockGlobalContent(contentType);
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

export async function getTop10Songs(): Promise<{ songs: Song[] }> {
  const data = await getGlobalContent("top_10_songs");
  if (data && typeof data === "object" && "songs" in data) {
    const songs = (data as { songs: unknown[] }).songs;
    // Filter out invalid songs - only return songs with mp3Url
    const validSongs = songs.filter(
      (song: unknown): song is Song =>
        typeof song === "object" &&
        song !== null &&
        "mp3Url" in song &&
        typeof (song as { mp3Url: unknown }).mp3Url === "string"
    );
    return { songs: validSongs };
  }
  // Return empty array if no data
  return { songs: [] };
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
    // Mock: Would save pixel art image
    return "mock-id";
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

// Mock data functions for development without Supabase
function getMockFriendPage(slug: string): FriendPageData | null {
  const themes: Record<string, Record<string, unknown>> = {
    daniel: {
      id: "mock-daniel",
      name: "daniel",
      slug: "daniel",
      display_name: "Daniel",
      color_primary: "#2a52be",
      color_secondary: "#7cb9e8",
      color_accent: "#00308f",
      color_bg: "#e6f2ff",
      color_text: "#001f3f",
    },
    max: {
      id: "mock-max",
      name: "max",
      slug: "max",
      display_name: "Max",
      color_primary: "#dc143c",
      color_secondary: "#ff6b6b",
      color_accent: "#8b0000",
      color_bg: "#ffe6e6",
      color_text: "#2d0000",
    },
  };

  const friend = themes[slug.toLowerCase()];
  if (!friend) return null;

  return {
    friend: friend as unknown as Friend,
    widgets: [
      {
        id: "mock-1",
        widget_id: "mock-music",
        widget_type: "music_player",
        widget_name: "Music Player",
        size: "1x1",
        position_x: 0,
        position_y: 0,
        config: {},
      },
      {
        id: "mock-2",
        widget_id: "mock-music",
        widget_type: "music_player",
        widget_name: "Music Player",
        size: "2x2",
        position_x: 2,
        position_y: 0,
        config: {},
      },
      {
        id: "mock-3",
        widget_id: "mock-music",
        widget_type: "music_player",
        widget_name: "Music Player",
        size: "3x3",
        position_x: 0,
        position_y: 2,
        config: {},
      },
    ],
  };
}

function getMockGlobalContent(contentType: string): unknown {
  if (contentType === "top_10_songs") {
    // Return empty array - no mock data
    return { songs: [] };
  }
  return null;
}
