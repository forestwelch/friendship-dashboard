import React from "react";
import { Navigation } from "@/components/Navigation";
import { FriendPageClient } from "@/app/[friend]/FriendPageClient";
import { Friend } from "@/lib/types";
import { FriendWidget } from "@/lib/queries";
import { Song } from "@/lib/types";

// Mock friend for calendar widget testing
const mockFriend: Friend = {
  id: "test-calendar",
  name: "calendar",
  slug: "calendar",
  display_name: "Calendar Widget Test",
  color_primary: "#4a9eff",
  color_secondary: "#6abfff",
  color_accent: "#2a7fff",
  color_bg: "#0a1a2e",
  color_text: "#c8e0ff",
};

// Pre-populated widgets: 1x1, 2x2, 3x3 calendar widgets
const mockWidgets: FriendWidget[] = [
  {
    id: "calendar-1x1",
    widget_id: "calendar-widget-id",
    widget_type: "calendar",
    widget_name: "Calendar",
    size: "1x1",
    position_x: 0,
    position_y: 0,
    config: {},
  },
  {
    id: "calendar-2x2",
    widget_id: "calendar-widget-id",
    widget_type: "calendar",
    widget_name: "Calendar",
    size: "2x2",
    position_x: 2,
    position_y: 0,
    config: {},
  },
  {
    id: "calendar-3x3",
    widget_id: "calendar-widget-id",
    widget_type: "calendar",
    widget_name: "Calendar",
    size: "3x3",
    position_x: 5,
    position_y: 0,
    config: {},
  },
];

export default function CalendarTestPage() {
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

