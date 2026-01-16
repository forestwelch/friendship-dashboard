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
  TicTacToe,
} from "@/components/widgets";
import { FriendWidget } from "@/lib/queries";
import { ConnectFourData, TicTacToeData } from "@/components/widgets";
import { useTheme } from "@/lib/contexts/theme-context";
import { WIDGET_TYPES } from "@/lib/widget-types";

interface WidgetRendererProps {
  widget: FriendWidget;
  pixelArtImageUrl?: string;
  onUploadImage?: (file: File) => Promise<void>;
  friendId?: string;
  friendName?: string;
  onUpdateWidgetConfig?: (widgetId: string, config: Record<string, unknown>) => Promise<void>;
  isEditMode?: boolean;
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
  isEditMode = false,
}: WidgetRendererProps) {
  const themeColors = useTheme();

  // Debug logging removed - was causing lint errors (Date.now() in render)
  switch (widget.widget_type) {
    case WIDGET_TYPES.MUSIC_PLAYER:
      return (
        <MusicPlayer
          size={widget.size}
          playlistSongIds={widget.config?.playlistSongIds as string[] | undefined}
          selectedSongId={widget.config?.selectedSongId as string | undefined}
        />
      );

    case WIDGET_TYPES.PIXEL_ART:
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
          <div className="w-full h-full flex items-center justify-center text-center game-text-muted">
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

    case WIDGET_TYPES.CONNECT_FOUR:
      return (
        <ConnectFour
          size={widget.size}
          friendId={friendId || ""}
          friendName={friendName}
          widgetId={widget.id}
          themeColors={themeColors}
          config={widget.config as unknown as ConnectFourData}
          isEditMode={isEditMode}
        />
      );

    case WIDGET_TYPES.CONSUMPTION_LOG:
      return (
        <ConsumptionLog size={widget.size} friendId={friendId || ""} friendName={friendName} />
      );

    case WIDGET_TYPES.QUESTION_JAR:
      return <QuestionJar size={widget.size} friendId={friendId || ""} friendName={friendName} />;

    case WIDGET_TYPES.AUDIO_SNIPPETS:
      return <AudioSnippets size={widget.size} friendId={friendId || ""} />;

    case WIDGET_TYPES.ABSURD_REVIEWS:
      return <AbsurdReviews size={widget.size} friendId={friendId || ""} friendName={friendName} />;

    case WIDGET_TYPES.FRIDGE_MAGNETS:
      return <FridgeMagnets size={widget.size} friendId={friendId || ""} />;

    case WIDGET_TYPES.TIC_TAC_TOE:
      return (
        <TicTacToe
          size={widget.size}
          friendId={friendId || ""}
          friendName={friendName}
          widgetId={widget.id}
          themeColors={themeColors}
          config={widget.config as unknown as TicTacToeData}
          isEditMode={isEditMode}
        />
      );

    default:
      return (
        <div className="w-full h-full flex items-center justify-center text-center game-text-muted">
          Unknown widget: {widget.widget_type}
        </div>
      );
  }
});
