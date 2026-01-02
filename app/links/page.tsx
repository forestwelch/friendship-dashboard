import React from "react";
import { Navigation } from "@/components/Navigation";
import { FriendPageClient } from "@/app/[friend]/FriendPageClient";
import { Friend } from "@/lib/types";
import { FriendWidget } from "@/lib/queries";

// Mock friend for links widget testing
const mockFriend: Friend = {
  id: "test-links",
  name: "links",
  slug: "links",
  display_name: "Links Widget Test",
  color_primary: "#4a9eff",
  color_secondary: "#6abfff",
  color_accent: "#2a7fff",
  color_bg: "#0a1a2e",
  color_text: "#c8e0ff",
};

// Pre-populated widgets: 1x1, 2x2, 3x3 links widgets
const mockWidgets: FriendWidget[] = [
  {
    id: "links-1x1",
    widget_id: "links-widget-id",
    widget_type: "links",
    widget_name: "Links",
    size: "1x1",
    position_x: 0,
    position_y: 0,
    config: {},
  },
  {
    id: "links-2x2",
    widget_id: "links-widget-id",
    widget_type: "links",
    widget_name: "Links",
    size: "2x2",
    position_x: 2,
    position_y: 0,
    config: {},
  },
  {
    id: "links-3x3",
    widget_id: "links-widget-id",
    widget_type: "links",
    widget_name: "Links",
    size: "3x3",
    position_x: 5,
    position_y: 0,
    config: {},
  },
];

export default function LinksTestPage() {
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
        songs={[]}
        pixelArtMap={new Map()}
        pixelArtBySize={new Map()}
      />
    </>
  );
}
