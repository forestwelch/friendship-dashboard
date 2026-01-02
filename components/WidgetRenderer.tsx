"use client";

import React, { memo } from "react";
import {
  MusicPlayer,
  PixelArt,
  Calendar,
  Notes,
  Links,
  MediaRecommendations,
  Mood,
  EventCountdown,
  PersonalityQuiz,
  ConnectFour,
} from "@/components/widgets";
import { FriendWidget } from "@/lib/queries";
import { ConnectFourData } from "@/lib/queries-connect-four";
import { Song } from "@/lib/types";
import { createInboxItem } from "@/lib/queries-inbox";
import { useTheme } from "@/lib/theme-context";

interface WidgetRendererProps {
  widget: FriendWidget;
  songs?: Song[];
  pixelArtImageUrl?: string;
  onUploadImage?: (file: File) => Promise<void>;
  friendId?: string;
  friendName?: string;
  onUpdateWidgetConfig?: (widgetId: string, config: Record<string, unknown>) => Promise<void>;
}

/**
 * Dynamically renders widgets based on widget_type from database
 */
export const WidgetRenderer = memo(function WidgetRenderer({
  widget,
  songs = [],
  pixelArtImageUrl,
  onUploadImage: _onUploadImage,
  friendId,
  friendName = "Friend",
  onUpdateWidgetConfig,
}: WidgetRendererProps) {
  const themeColors = useTheme();
  const handleProposeHangout = async (date: string, time: string, message?: string) => {
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
      // Mark as watched - no-op without callback
      return;
    }

    const currentRecommendations = widget.config.recommendations || [];
    const updated = currentRecommendations.map((rec) =>
      rec.id === recommendationId ? { ...rec, watched: true } : rec
    );

    await onUpdateWidgetConfig(widget.id, {
      ...widget.config,
      recommendations: updated,
    });
  };

  const handleAddRecommendation = async () => {
    // For now, just log - could open a modal or navigate to a form
    // Add recommendation - would open modal
    // In a real implementation, this would:
    // 1. Open a modal/form
    // 2. Collect recommendation data
    // 3. Add to widget config via onUpdateWidgetConfig
    // 4. Or send to inbox if it's a recommendation from a friend
  };

  // Debug logging removed - was causing lint errors (Date.now() in render)
  switch (widget.widget_type) {
    case "music_player":
      return <MusicPlayer size={widget.size} songs={songs} />;

    case "pixel_art":
      // Check if widget config has pixelData (new programmatic approach) or imageUrls (backward compatibility)
      const pixelData = widget.config?.pixelData;
      const imageUrls = widget.config?.imageUrls;

      // Use programmatic rendering if pixelData is available
      if (pixelData && pixelData.length > 0 && themeColors) {
        return <PixelArt size={widget.size} pixelData={pixelData} themeColors={themeColors} />;
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
        return <PixelArt size={widget.size} pixelData={imagePixelData} themeColors={themeColors} />;
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
          events={widget.config.events || []}
          onProposeHangout={handleProposeHangout}
        />
      );

    case "notes":
      // Notes widget expects string[] but config stores objects with {id, content, created_at}
      const notesArray = widget.config.notes || [];
      const notesStrings = notesArray.map((n) => (typeof n === "string" ? n : n.content));

      return <Notes size={widget.size} initialNotes={notesStrings} />;

    case "shared_links":
    case "links": // Backward compatibility
      return <Links size={widget.size} links={widget.config.links || []} />;

    case "media_recommendations":
      return (
        <MediaRecommendations
          size={widget.size}
          recommendations={widget.config.recommendations || []}
          onMarkWatched={handleMarkWatched}
          onAddRecommendation={handleAddRecommendation}
        />
      );

    case "mood":
      const moodSize = parseInt(widget.size.split("x")[0]) as 1 | 2 | 3;
      return (
        <Mood
          size={moodSize}
          friendId={friendId || ""}
          widgetId={widget.id}
          themeColors={themeColors}
          config={widget.config as Record<string, unknown>}
        />
      );

    case "event_countdown":
      const eventSize = parseInt(widget.size.split("x")[0]) as 1 | 2 | 3;
      return (
        <EventCountdown
          size={eventSize}
          friendId={friendId || ""}
          widgetId={widget.id}
          themeColors={themeColors}
          config={widget.config as Record<string, unknown>}
        />
      );

    case "personality_quiz":
      const quizSize = parseInt(widget.size.split("x")[0]) as 1 | 2 | 3;
      return (
        <PersonalityQuiz
          size={quizSize}
          friendId={friendId || ""}
          widgetId={widget.id}
          themeColors={themeColors}
          config={widget.config as Record<string, unknown>}
        />
      );

    case "connect_four":
      // Convert "1x1" -> 1, "2x2" -> 2, "3x3" -> 3
      const connectFourSize = parseInt(widget.size.split("x")[0]) as 1 | 2 | 3;
      return (
        <ConnectFour
          size={connectFourSize}
          friendId={friendId || ""}
          friendName={friendName}
          widgetId={widget.id}
          themeColors={themeColors}
          config={widget.config as unknown as ConnectFourData}
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
