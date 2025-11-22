import React from "react";
import { Grid, GridItem } from "@/components/Grid";
import { Widget } from "@/components/Widget";
import { MusicPlayer } from "@/components/widgets";
import { YouTubePlayerProvider } from "@/components/YouTubePlayer";
import { notFound } from "next/navigation";

interface FriendPageProps {
  params: Promise<{
    friend: string;
  }>;
}

export default async function FriendPage({ params }: FriendPageProps) {
  const resolvedParams = await params;
  const friend = resolvedParams?.friend;

  // Validate friend parameter
  if (!friend || typeof friend !== "string") {
    notFound();
  }

  // Determine theme based on friend slug
  const getThemeClass = (slug: string) => {
    if (!slug || typeof slug !== "string") {
      return "theme-daniel"; // Default fallback
    }
    
    switch (slug.toLowerCase()) {
      case "daniel":
        return "theme-daniel";
      case "max":
        return "theme-max";
      case "violet":
      case "plum":
        return "theme-violet-plum";
      case "gameboy":
      case "gb":
        return "theme-gameboy";
      default:
        return "theme-daniel";
    }
  };

  const themeClass = getThemeClass(friend);

  return (
    <YouTubePlayerProvider>
      <div className={themeClass} style={{ width: "100vw", height: "100vh", background: "var(--bg)" }}>
        <Grid>
          {/* Music Player 1x1 at position (0, 0) */}
          <GridItem position={{ x: 0, y: 0 }} size="1x1">
            <MusicPlayer size="1x1" />
          </GridItem>

          {/* Music Player 2x2 at position (2, 0) */}
          <GridItem position={{ x: 2, y: 0 }} size="2x2">
            <MusicPlayer size="2x2" />
          </GridItem>

          {/* Music Player 3x3 at position (0, 2) */}
          <GridItem position={{ x: 0, y: 2 }} size="3x3">
            <MusicPlayer size="3x3" />
          </GridItem>
        </Grid>
      </div>
    </YouTubePlayerProvider>
  );
}


