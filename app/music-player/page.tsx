import React from "react";
import { Navigation } from "@/components/Navigation";
import { FriendPageClient } from "@/app/[friend]/FriendPageClient";
import { Friend } from "@/lib/types";
import { FriendWidget } from "@/lib/queries";
import { Song } from "@/lib/types";

// Mock friend for music player widget testing
const mockFriend: Friend = {
  id: "test-music-player",
  name: "music-player",
  slug: "music-player",
  display_name: "Music Player Widget Test",
  color_primary: "#4a9eff",
  color_secondary: "#6abfff",
  color_accent: "#2a7fff",
  color_bg: "#0a1a2e",
  color_text: "#c8e0ff",
};

// Pre-populated widgets: 1x1, 2x2, 3x3 music player widgets
const mockWidgets: FriendWidget[] = [
  {
    id: "music-1x1",
    widget_id: "music-player-widget-id",
    widget_type: "music_player",
    widget_name: "Music Player",
    size: "1x1",
    position_x: 0,
    position_y: 0,
    config: {},
  },
  {
    id: "music-2x2",
    widget_id: "music-player-widget-id",
    widget_type: "music_player",
    widget_name: "Music Player",
    size: "2x2",
    position_x: 2,
    position_y: 0,
    config: {},
  },
  {
    id: "music-3x3",
    widget_id: "music-player-widget-id",
    widget_type: "music_player",
    widget_name: "Music Player",
    size: "3x3",
    position_x: 5,
    position_y: 0,
    config: {},
  },
];

// Sample songs for testing
const mockSongs: Song[] = [
  { id: "1", title: "Test Song 1", artist: "Test Artist", youtubeId: "dQw4w9WgXcQ" },
  { id: "2", title: "Test Song 2", artist: "Test Artist", youtubeId: "dQw4w9WgXcQ" },
];

export default function MusicPlayerTestPage() {
  const navThemeColors = {
    bg: mockFriend.color_bg || "#0a1a2e",
    text: mockFriend.color_text || "#c8e0ff",
    border: mockFriend.color_accent || "#2a7fff",
    active: mockFriend.color_primary || "#4a9eff",
  };

  return (
    <>
      <Navigation themeColors={navThemeColors} />
      <FriendPageClient
        friend={mockFriend}
        initialWidgets={mockWidgets}
        songs={mockSongs}
        pixelArtMap={new Map()}
        pixelArtBySize={new Map()}
      />
    </>
  );
}
