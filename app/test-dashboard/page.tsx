"use client";

import React from "react";
import { FriendPageClient } from "@/app/[friend]/FriendPageClient";
import { Friend, Song } from "@/lib/types";
import { FriendWidget } from "@/lib/queries";

export default function TestDashboardPage() {
  // Mock Friend Data
  const mockFriend: Friend = {
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

  // Mock Songs
  const mockSongs: Song[] = [
    {
      id: "1",
      title: "Test Song 1",
      artist: "Artist A",
      youtubeId: "dQw4w9WgXcQ",
    },
    {
      id: "2",
      title: "Test Song 2",
      artist: "Artist B",
      youtubeId: "dQw4w9WgXcQ",
    },
  ];

  // Mock Widgets - One of each type
  const mockWidgets: FriendWidget[] = [
    {
      id: "w1",
      widget_id: "music-player-id",
      widget_type: "music_player",
      widget_name: "Music Player",
      size: "2x2",
      position_x: 0,
      position_y: 0,
      config: {},
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
    },
  ];

  return (
    <FriendPageClient
      friend={mockFriend}
      initialWidgets={mockWidgets}
      songs={mockSongs}
      pixelArtMap={new Map()}
      pixelArtBySize={new Map()}
    />
  );
}
