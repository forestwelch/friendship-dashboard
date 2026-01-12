import React from "react";
import { Navigation } from "@/components/Navigation";
import { FriendPageClient } from "@/app/[friend]/FriendPageClient";
import { Friend } from "@/lib/types";
import { FriendWidget } from "@/lib/queries";

// Mock friend for media recommendations widget testing
const mockFriend: Friend = {
  id: "test-media-recommendations",
  name: "media-recommendations",
  slug: "media-recommendations",
  display_name: "Media Recommendations Widget Test",
  color_primary: "#4a9eff",
  color_secondary: "#6abfff",
  color_accent: "#2a7fff",
  color_bg: "#0a1a2e",
  color_text: "#c8e0ff",
};

// Pre-populated widgets: 1x1, 2x2, 3x3 media recommendations widgets
const mockWidgets: FriendWidget[] = [
  {
    id: "media-1x1",
    widget_id: "media-recommendations-widget-id",
    widget_type: "media_recommendations",
    widget_name: "Media Recommendations",
    size: "1x1",
    position_x: 0,
    position_y: 0,
    config: {},
  },
  {
    id: "media-2x2",
    widget_id: "media-recommendations-widget-id",
    widget_type: "media_recommendations",
    widget_name: "Media Recommendations",
    size: "2x2",
    position_x: 2,
    position_y: 0,
    config: {},
  },
  {
    id: "media-3x3",
    widget_id: "media-recommendations-widget-id",
    widget_type: "media_recommendations",
    widget_name: "Media Recommendations",
    size: "3x3",
    position_x: 5,
    position_y: 0,
    config: {},
  },
];

export default function MediaRecommendationsTestPage() {
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
