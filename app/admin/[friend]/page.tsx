import React from "react";
import { notFound } from "next/navigation";
import { getFriendPage } from "@/lib/queries";
import { Navigation } from "@/components/Navigation";
import { WidgetManager } from "@/components/admin/WidgetManager";

interface AdminFriendPageProps {
  params: Promise<{
    friend: string;
  }>;
}

export default async function AdminFriendPage({
  params,
}: AdminFriendPageProps) {
  const resolvedParams = await params;
  const friendSlug = resolvedParams?.friend;

  if (!friendSlug || typeof friendSlug !== "string") {
    notFound();
  }

  const pageData = await getFriendPage(friendSlug);

  if (!pageData || !pageData.friend) {
    notFound();
  }

  const { friend, widgets } = pageData;

  // Apply theme colors dynamically
  const hexToRgba = (hex: string, alpha: number): string => {
    const cleanHex = hex.replace("#", "");
    const hexLength = cleanHex.length;
    const rgbHex = hexLength === 8 ? cleanHex.slice(0, 6) : cleanHex;
    const r = parseInt(rgbHex.slice(0, 2), 16);
    const g = parseInt(rgbHex.slice(2, 4), 16);
    const b = parseInt(rgbHex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const gridTileBg = hexToRgba(friend.color_accent, 0.05);
  const gridTileBorder = hexToRgba(friend.color_secondary, 0.1);

  const _themeStyle: React.CSSProperties = {
    "--primary": friend.color_primary,
    "--secondary": friend.color_secondary,
    "--accent": friend.color_accent,
    "--bg": friend.color_bg,
    "--text": friend.color_text,
    "--grid-tile-bg": gridTileBg,
    "--grid-tile-border": gridTileBorder,
  } as React.CSSProperties;

  return (
    <>
      <Navigation />
      <div
        style={{
          paddingTop: `calc(var(--height-button) + var(--space-md))`,
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <WidgetManager friend={friend} initialWidgets={widgets} />
      </div>
    </>
  );
}
