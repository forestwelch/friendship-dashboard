import React from "react";
import { notFound } from "next/navigation";
import { getFriendPage } from "@/lib/queries";
import { FriendPageClient } from "@/app/[friend]/FriendPageClient";
import { AdminNavigation } from "./AdminNavigation";

interface AdminFriendPageProps {
  params: Promise<{
    friend: string;
  }>;
}

export default async function AdminFriendPage({ params }: AdminFriendPageProps) {
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
  }

  return (
    <>
      <AdminNavigation />
      <FriendPageClient
        friend={friend}
        initialWidgets={widgets}
        pixelArtMap={pixelArtMap}
        pixelArtBySize={pixelArtBySize}
      />
    </>
  );
}
