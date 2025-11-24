import React from "react";
import { Navigation } from "@/components/Navigation";
import { notFound } from "next/navigation";
import { getFriendPage, getGlobalContent } from "@/lib/queries";
import { Song } from "@/lib/types";
import { FriendPageClient } from "./FriendPageClient";

interface FriendPageProps {
  params: Promise<{
    friend: string;
  }>;
}

export default async function FriendPage({ params }: FriendPageProps) {
  const resolvedParams = await params;
  const friendSlug = resolvedParams?.friend;

  // Validate friend parameter
  if (!friendSlug || typeof friendSlug !== "string") {
    notFound();
  }

  // Fetch friend data from Supabase
  const pageData = await getFriendPage(friendSlug);

  if (!pageData || !pageData.friend) {
    notFound();
  }

  const { friend, widgets, pixelArtImages } = pageData;

  // Fetch global content (e.g., top 10 songs)
  const songsData = await getGlobalContent("top_10_songs");
  const songs: Song[] = songsData?.songs || [];

  // Create a map of pixel art images by widget_id for quick lookup
  // Also create a fallback map by size for images without widget_id
  const pixelArtMap = new Map<string, string>();
  const pixelArtBySize = new Map<string, string>();

  if (pixelArtImages && pixelArtImages.length > 0) {
    pixelArtImages.forEach((img) => {
      // Match by widget_id if set (links to friend_widgets.id)
      if (img.widget_id) {
        pixelArtMap.set(img.widget_id, img.image_data);
      }
      // Store by size as fallback (use first image of each size)
      // This allows matching pixel art to widgets even if widget_id is null
      if (!pixelArtBySize.has(img.size)) {
        pixelArtBySize.set(img.size, img.image_data);
      }
    });
    // Debug: Log available pixel art
    // Debug: Found pixel art images
  }

  // Pass theme colors to Navigation
  const navThemeColors = {
    bg: friend.color_bg || "#0a1a2e",
    text: friend.color_text || "#c8e0ff",
    border: friend.color_accent || "#2a7fff",
    active: friend.color_primary || "#4a9eff",
  };

  return (
    <>
      <Navigation themeColors={navThemeColors} className="friend-page-nav" />
      <FriendPageClient
        friend={friend}
        initialWidgets={widgets}
        songs={songs}
        pixelArtMap={pixelArtMap}
        pixelArtBySize={pixelArtBySize}
      />
    </>
  );
}
