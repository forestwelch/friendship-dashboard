import { supabase, isSupabaseConfigured } from "./supabase";
import { Friend, WidgetSize, Song } from "./types";

export interface FriendWidget {
  id: string;
  widget_id: string;
  widget_type: string;
  widget_name: string;
  size: WidgetSize;
  position_x: number;
  position_y: number;
  config: Record<string, any>;
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
    console.time("[DB] getAllFriends");
    const { data, error } = await supabase
      .from("friends")
      .select("*")
      .order("display_name");

    console.timeEnd("[DB] getAllFriends");

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
    console.time("[DB] getFriendPage");
    
    // Fetch friend
    console.time("[DB] getFriendPage - friend");
    const { data: friend, error: friendError } = await supabase
      .from("friends")
      .select("*")
      .eq("slug", slug)
      .single();
    console.timeEnd("[DB] getFriendPage - friend");

    if (friendError || !friend) {
      console.error("Error fetching friend:", friendError);
      console.timeEnd("[DB] getFriendPage");
      return null;
    }

    // Parallelize queries for better performance
    const [widgetsResult, pixelArtResult] = await Promise.all([
      // Fetch friend's widgets with widget type info
      supabase
        .from("friend_widgets")
        .select(`
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
        `)
        .eq("friend_id", friend.id)
        .order("position_y")
        .order("position_x"),
      // Fetch pixel art images for this friend (lazy load - don't fetch full image data here)
      supabase
        .from("pixel_art_images")
        .select("id, widget_id, size")
        .eq("friend_id", friend.id)
    ]);

    console.timeEnd("[DB] getFriendPage");

    const { data: widgets, error: widgetsError } = widgetsResult;
    const { data: pixelArtImages } = pixelArtResult;

    if (widgetsError) {
      console.error("Error fetching widgets:", widgetsError);
      return null;
    }

    // Transform widgets data
    const transformedWidgets: FriendWidget[] = (widgets || []).map((w: any) => ({
      id: w.id,
      widget_id: w.widget_id,
      widget_type: w.widgets?.type || "",
      widget_name: w.widgets?.name || "",
      size: w.size,
      position_x: w.position_x,
      position_y: w.position_y,
      config: w.config || {},
    }));

    return {
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
      pixelArtImages: (pixelArtImages || []).map((img: any) => ({
        ...img,
        image_data: "" // Will be fetched separately if needed
      })) || [],
    };
  } catch (error) {
    console.error("Error in getFriendPage:", error);
    return null;
  }
}

/**
 * Get global content (shared across all friends)
 */
export async function getGlobalContent(contentType: string): Promise<any> {
  if (!isSupabaseConfigured()) {
    return getMockGlobalContent(contentType);
  }

  try {
    console.time(`[DB] getGlobalContent - ${contentType}`);
    const { data, error } = await supabase
      .from("global_content")
      .select("data")
      .eq("content_type", contentType)
      .single();

    console.timeEnd(`[DB] getGlobalContent - ${contentType}`);

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
export async function getPersonalContent(
  friendId: string,
  contentType: string
): Promise<any> {
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
 * Save pixel art image (supports both old base_image_data and new pixel_data)
 */
export async function savePixelArtImage(
  friendId: string | null, // Allow null for global images
  widgetId: string | null,
  size: WidgetSize,
  imageData?: string, // Old format: base64 image data
  pixelData?: string // New format: base64-encoded Uint8Array
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    console.log("Mock: Would save pixel art image");
    return "mock-id";
  }

  try {
    const insertData: any = {
      friend_id: friendId,
      widget_id: widgetId,
      size,
    };

    // Use pixel_data if provided (new format), otherwise fall back to base_image_data (old format)
    if (pixelData) {
      insertData.pixel_data = pixelData;
      insertData.width = 128; // Updated to match PIXEL_GRID_SIZE
      insertData.height = 128;
    } else if (imageData) {
      insertData.base_image_data = imageData;
    } else {
      console.error("Error saving pixel art: No imageData or pixelData provided");
      return null;
    }

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

// Mock data functions for development without Supabase
function getMockFriendPage(slug: string): FriendPageData | null {
  const themes: Record<string, any> = {
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
    friend,
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

function getMockGlobalContent(contentType: string): any {
  if (contentType === "top_10_songs") {
    return [
      { id: "1", title: "Bohemian Rhapsody", artist: "Queen", youtubeId: "fJ9rUzIMcZQ" },
      { id: "2", title: "Stairway to Heaven", artist: "Led Zeppelin", youtubeId: "QkF3oxziUI4" },
      { id: "3", title: "Hotel California", artist: "Eagles", youtubeId: "BciS5krYL80" },
      { id: "4", title: "Sweet Child O' Mine", artist: "Guns N' Roses", youtubeId: "1w7OgIMMRc4" },
      { id: "5", title: "Comfortably Numb", artist: "Pink Floyd", youtubeId: "YlUKcNNmywk" },
      { id: "6", title: "Thunderstruck", artist: "AC/DC", youtubeId: "v2AC41dglnM" },
      { id: "7", title: "Back in Black", artist: "AC/DC", youtubeId: "pAgnJDJN4VA" },
      { id: "8", title: "Smells Like Teen Spirit", artist: "Nirvana", youtubeId: "hTWKbfoikeg" },
      { id: "9", title: "Enter Sandman", artist: "Metallica", youtubeId: "CD-E-LDc384" },
      { id: "10", title: "Paranoid", artist: "Black Sabbath", youtubeId: "0qanF-91aJo" },
    ];
  }
  return null;
}
