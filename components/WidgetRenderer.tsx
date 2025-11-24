"use client";

import React, { memo } from "react";
import {
  MusicPlayer,
  PixelArt,
  Calendar,
  Notes,
  Links,
  MediaRecommendations,
} from "@/components/widgets";
import { FriendWidget } from "@/lib/queries";
import { Song } from "@/lib/types";
import { createInboxItem } from "@/lib/queries-inbox";
import { ThemeColors } from "@/lib/pixel-data-processing";
import { useTheme } from "@/lib/theme-context";

interface WidgetRendererProps {
  widget: FriendWidget;
  songs?: Song[];
  pixelArtImageUrl?: string;
  onUploadImage?: (file: File) => Promise<void>;
  friendId?: string;
  onUpdateWidgetConfig?: (
    widgetId: string,
    config: Record<string, any>
  ) => Promise<void>;
}

/**
 * Dynamically renders widgets based on widget_type from database
 */
export const WidgetRenderer = memo(function WidgetRenderer({
  widget,
  songs = [],
  pixelArtImageUrl,
  onUploadImage,
  friendId,
  onUpdateWidgetConfig,
}: WidgetRendererProps) {
  const themeColors = useTheme();
  const handleProposeHangout = async (
    date: string,
    time: string,
    message?: string
  ) => {
    if (!friendId) {
      console.error("No friend ID provided for hangout proposal");
      return;
    }

    const success = await createInboxItem(friendId, "hangout_proposal", {
      date,
      time,
      message,
    });

    if (success) {
      alert(`Hangout proposal sent: ${date} at ${time}`);
    } else {
      alert("Failed to send hangout proposal");
    }
  };

  const handleMarkWatched = async (recommendationId: string) => {
    if (!onUpdateWidgetConfig) {
      console.log("Mark as watched:", recommendationId);
      return;
    }

    const currentRecommendations = widget.config?.recommendations || [];
    const updated = currentRecommendations.map((rec: any) =>
      rec.id === recommendationId ? { ...rec, watched: true } : rec
    );

    await onUpdateWidgetConfig(widget.id, {
      ...widget.config,
      recommendations: updated,
    });
  };

  const handleAddRecommendation = async () => {
    // For now, just log - could open a modal or navigate to a form
    console.log("Add recommendation - would open modal");
    // In a real implementation, this would:
    // 1. Open a modal/form
    // 2. Collect recommendation data
    // 3. Add to widget config via onUpdateWidgetConfig
    // 4. Or send to inbox if it's a recommendation from a friend
  };

  switch (widget.widget_type) {
    case "music_player":
      return <MusicPlayer size={widget.size} songs={songs} />;

    case "pixel_art":
      // Check if widget config has pixelData (new programmatic approach) or imageUrls (backward compatibility)
      const pixelData = widget.config?.pixelData;
      const imageUrls = widget.config?.imageUrls;

      // Use programmatic rendering if pixelData is available
      if (pixelData && pixelData.length > 0 && themeColors) {
        return (
          <PixelArt
            size={widget.size}
            pixelData={pixelData}
            themeColors={themeColors}
          />
        );
      }

      // Fallback to image-based rendering (backward compatibility)
      if (!imageUrls && !pixelArtImageUrl) {
        return (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text)",
              fontSize: "var(--font-size-sm)",
            }}
          >
            No image
          </div>
        );
      }

      return (
        <PixelArt
          size={widget.size}
          imageUrl={imageUrls ? undefined : pixelArtImageUrl}
          imageUrls={imageUrls}
        />
      );

    case "image":
      // Route "image" widgets to PixelArt for backward compatibility
      const imageImageUrls = widget.config?.imageUrls;
      const imagePixelData = widget.config?.pixelData;

      // Use programmatic rendering if pixelData is available
      if (imagePixelData && imagePixelData.length > 0 && themeColors) {
        return (
          <PixelArt
            size={widget.size}
            pixelData={imagePixelData}
            themeColors={themeColors}
          />
        );
      }

      return (
        <PixelArt
          size={widget.size}
          imageUrl={imageImageUrls ? undefined : pixelArtImageUrl}
          imageUrls={imageImageUrls}
        />
      );

    case "calendar":
      return (
        <Calendar
          size={widget.size}
          events={widget.config?.events || []}
          onProposeHangout={handleProposeHangout}
        />
      );

    case "notes":
      // Notes widget expects string[] but config stores objects with {id, content, created_at}
      const notesArray = widget.config?.notes || [];
      const notesStrings =
        Array.isArray(notesArray) &&
        notesArray.length > 0 &&
        typeof notesArray[0] === "object"
          ? notesArray.map((n: any) => n.content || n)
          : notesArray;

      return <Notes size={widget.size} initialNotes={notesStrings} />;

    case "links":
      return <Links size={widget.size} links={widget.config?.links || []} />;

    case "media_recommendations":
      return (
        <MediaRecommendations
          size={widget.size}
          recommendations={widget.config?.recommendations || []}
          onMarkWatched={handleMarkWatched}
          onAddRecommendation={handleAddRecommendation}
        />
      );

    default:
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          Unknown widget: {widget.widget_type}
        </div>
      );
  }
});
