import React from "react";
import { Navigation } from "@/components/Navigation";
import { FriendPageClient } from "@/app/[friend]/FriendPageClient";
import { Friend } from "@/lib/types";
import { FriendWidget } from "@/lib/queries";

// Mock friend for notes widget testing
const mockFriend: Friend = {
  id: "test-notes",
  name: "notes",
  slug: "notes",
  display_name: "Notes Widget Test",
  color_primary: "#4a9eff",
  color_secondary: "#6abfff",
  color_accent: "#2a7fff",
  color_bg: "#0a1a2e",
  color_text: "#c8e0ff",
};

// Pre-populated widgets: 1x1, 2x2, 3x3 notes widgets
const mockWidgets: FriendWidget[] = [
  {
    id: "notes-1x1",
    widget_id: "notes-widget-id",
    widget_type: "notes",
    widget_name: "Notes",
    size: "1x1",
    position_x: 0,
    position_y: 0,
    config: {},
  },
  {
    id: "notes-2x2",
    widget_id: "notes-widget-id",
    widget_type: "notes",
    widget_name: "Notes",
    size: "2x2",
    position_x: 2,
    position_y: 0,
    config: {},
  },
  {
    id: "notes-3x3",
    widget_id: "notes-widget-id",
    widget_type: "notes",
    widget_name: "Notes",
    size: "3x3",
    position_x: 5,
    position_y: 0,
    config: {},
  },
];

export default function NotesTestPage() {
  return (
    <>
      <Navigation />
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
