"use client";

import React, { memo } from "react";
import {
  MusicPlayer,
  PixelArt,
  ConnectFour,
  ConsumptionLog,
  QuestionJar,
  AudioSnippets,
  AbsurdReviews,
  FridgeMagnets,
} from "@/components/widgets";
import { PersonalityQuiz } from "@/components/widgets/_unused/PersonalityQuiz";
import { FriendWidget } from "@/lib/queries";
import { ConnectFourData } from "@/components/widgets";
import { useTheme } from "@/lib/theme-context";

interface WidgetRendererProps {
  widget: FriendWidget;
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
  pixelArtImageUrl,
  onUploadImage: _onUploadImage,
  friendId,
  friendName = "Friend",
  onUpdateWidgetConfig: _onUpdateWidgetConfig,
}: WidgetRendererProps) {
  const themeColors = useTheme();

  // Debug logging removed - was causing lint errors (Date.now() in render)
  switch (widget.widget_type) {
    case "music_player":
      return (
        <MusicPlayer
          size={widget.size}
          playlistSongIds={widget.config?.playlistSongIds as string[] | undefined}
          selectedSongId={widget.config?.selectedSongId as string | undefined}
        />
      );

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
            transitionType={
              (widget.config.transitionType as "scanline" | "dissolve" | "boot-up") || "scanline"
            }
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
          transitionType={
            (widget.config.transitionType as "scanline" | "dissolve" | "boot-up") || "scanline"
          }
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
            transitionType={
              (widget.config.transitionType as "scanline" | "dissolve" | "boot-up") || "scanline"
            }
          />
        );
      }

      return (
        <PixelArt
          size={widget.size}
          imageUrl={imageImageUrls ? undefined : pixelArtImageUrl}
          imageUrls={imageImageUrls}
          transitionType={
            (widget.config.transitionType as "scanline" | "dissolve" | "boot-up") || "scanline"
          }
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
      return (
        <ConnectFour
          size={widget.size}
          friendId={friendId || ""}
          friendName={friendName}
          widgetId={widget.id}
          themeColors={themeColors}
          config={widget.config as unknown as ConnectFourData}
        />
      );

    case "consumption_log":
      return (
        <ConsumptionLog size={widget.size} friendId={friendId || ""} friendName={friendName} />
      );

    case "question_jar":
      return <QuestionJar size={widget.size} friendId={friendId || ""} friendName={friendName} />;

    case "audio_snippets":
      return <AudioSnippets size={widget.size} friendId={friendId || ""} />;

    case "absurd_reviews":
      return <AbsurdReviews size={widget.size} friendId={friendId || ""} friendName={friendName} />;

    case "fridge_magnets":
      return <FridgeMagnets size={widget.size} friendId={friendId || ""} />;

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
