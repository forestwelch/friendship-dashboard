import { Friend, Song } from "@/lib/types";
import { FriendWidget } from "@/lib/queries";

// Shared test dashboard data - update this file to change what appears in both
// /test-dashboard and the color palette preview

export const testDashboardFriend: Friend = {
  id: "test-friend-id",
  name: "testuser",
  slug: "test",
  display_name: "Test Dashboard",
  color_primary: "#4a9eff",
  color_secondary: "#6abfff",
  color_accent: "#2a7fff",
  color_bg: "#0a1a2e",
  color_text: "#c8e0ff",
  created_at: new Date().toISOString(),
};

export const testDashboardSongs: Song[] = [
  {
    id: "1",
    title: "Test Song 1",
    artist: "Artist A",
    mp3Url: "https://example.com/test1.mp3",
  },
  {
    id: "2",
    title: "Test Song 2",
    artist: "Artist B",
    mp3Url: "https://example.com/test2.mp3",
  },
];

export const testDashboardWidgets: FriendWidget[] = [
  {
    id: "w1",
    widget_id: "music-player-id",
    widget_type: "music_player",
    widget_name: "Music Player",
    size: "2x2",
    position_x: 0,
    position_y: 0,
    config: {},
    // Recent update - should show as new content
    last_updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
  },
  {
    id: "w2",
    widget_id: "calendar-id",
    widget_type: "calendar",
    widget_name: "Calendar",
    size: "2x2",
    position_x: 2,
    position_y: 0,
    config: {
      events: [
        {
          id: "e1",
          title: "Test Event",
          date: new Date().toISOString(),
          type: "hangout",
        },
      ],
    },
    // Old update - should show as already seen (if interacted)
    last_updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  },
  {
    id: "w3",
    widget_id: "notes-id",
    widget_type: "notes",
    widget_name: "Notes",
    size: "2x2",
    position_x: 4,
    position_y: 0,
    config: {
      notes: [
        {
          id: "n1",
          content: "This is a test note.",
          created_at: new Date().toISOString(),
        },
      ],
    },
    // Very recent update - should show as new content
    last_updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
  },
  {
    id: "w4",
    widget_id: "links-id",
    widget_type: "links",
    widget_name: "Links",
    size: "2x2",
    position_x: 0,
    position_y: 2,
    config: {
      links: [
        {
          id: "l1",
          title: "Google",
          url: "https://google.com",
          icon: "hn-globe",
        },
      ],
    },
    // No update timestamp - should not show as new
    last_updated_at: null,
  },
  {
    id: "w5",
    widget_id: "media-id",
    widget_type: "media_recommendations",
    widget_name: "Media",
    size: "2x2",
    position_x: 2,
    position_y: 2,
    config: {
      recommendations: [{ id: "m1", title: "Inception", type: "Movie", rating: 5 }],
    },
    // Recent update - should show as new content
    last_updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
  },
  {
    id: "w6",
    widget_id: "pixel-art-id",
    widget_type: "pixel_art",
    widget_name: "Pixel Art",
    size: "2x2",
    position_x: 4,
    position_y: 2,
    config: {},
    // Old update - should show as already seen (if interacted)
    last_updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
];
