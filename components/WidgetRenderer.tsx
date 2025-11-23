"use client";

import React from "react";
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

interface WidgetRendererProps {
  widget: FriendWidget;
  songs?: Song[];
  pixelArtImageUrl?: string;
}

/**
 * Dynamically renders widgets based on widget_type from database
 */
export function WidgetRenderer({
  widget,
  songs = [],
  pixelArtImageUrl,
}: WidgetRendererProps) {
  switch (widget.widget_type) {
    case "music_player":
      return <MusicPlayer size={widget.size} songs={songs} />;

    case "pixel_art":
      if (!pixelArtImageUrl) {
        return (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text)",
              fontSize: "12px",
            }}
          >
            No image
          </div>
        );
      }
      return <PixelArt size={widget.size} imageUrl={pixelArtImageUrl} />;

    case "calendar":
      return (
        <Calendar
          size={widget.size}
          events={widget.config?.events || []}
          onProposeHangout={(date, time) => {
            // TODO: Send to inbox
            console.log("Propose hangout:", date, time);
            alert(`Hangout proposal sent: ${date} at ${time}`);
          }}
        />
      );

    case "notes":
      return (
        <Notes size={widget.size} initialNotes={widget.config?.notes || []} />
      );

    case "links":
      return <Links size={widget.size} links={widget.config?.links || []} />;

    case "media_recommendations":
      return (
        <MediaRecommendations
          size={widget.size}
          recommendations={widget.config?.recommendations || []}
          onMarkWatched={(id) => {
            // TODO: Update in database
            console.log("Mark as watched:", id);
          }}
          onAddRecommendation={() => {
            // TODO: Open add recommendation modal
            console.log("Add recommendation");
          }}
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
            fontSize: "12px",
          }}
        >
          Unknown widget: {widget.widget_type}
        </div>
      );
  }
}
