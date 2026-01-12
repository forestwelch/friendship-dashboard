import React from "react";
import { Navigation } from "@/components/shared";
import { FriendPageClient } from "@/app/[friend]/FriendPageClient";
import { Friend } from "@/lib/types";
import { FriendWidget } from "@/lib/queries";

// Mock friend for pixel art widget testing
const mockFriend: Friend = {
  id: "test-pixel-art",
  name: "pixel-art",
  slug: "pixel-art",
  display_name: "Pixel Art Widget Test",
  color_primary: "#4a9eff",
  color_secondary: "#6abfff",
  color_accent: "#2a7fff",
  color_bg: "#0a1a2e",
  color_text: "#c8e0ff",
};

// Pre-populated widgets: 1x1, 2x2, 3x3 pixel art widgets
const mockWidgets: FriendWidget[] = [
  {
    id: "pixel-1x1",
    widget_id: "pixel-art-widget-id",
    widget_type: "pixel_art",
    widget_name: "Pixel Art",
    size: "1x1",
    position_x: 0,
    position_y: 0,
    config: {},
  },
  {
    id: "pixel-2x2",
    widget_id: "pixel-art-widget-id",
    widget_type: "pixel_art",
    widget_name: "Pixel Art",
    size: "2x2",
    position_x: 2,
    position_y: 0,
    config: {},
  },
  {
    id: "pixel-3x3",
    widget_id: "pixel-art-widget-id",
    widget_type: "pixel_art",
    widget_name: "Pixel Art",
    size: "3x3",
    position_x: 5,
    position_y: 0,
    config: {},
  },
];

export default function PixelArtTestPage() {
  return (
    <>
      <Navigation />
      <FriendPageClient
        friend={mockFriend}
        initialWidgets={mockWidgets}
        pixelArtMap={new Map()}
        pixelArtBySize={new Map()}
      />
    </>
  );
}
