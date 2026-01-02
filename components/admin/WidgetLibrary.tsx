"use client";

import React, { useState } from "react";
import { WidgetSize } from "@/lib/types";
import { playSound } from "@/lib/sounds";
import clsx from "clsx";
import styles from "./WidgetLibrary.module.css";

interface WidgetLibraryProps {
  onSelectWidget: (type: string, size: WidgetSize) => void;
}

export function WidgetLibrary({ onSelectWidget }: WidgetLibraryProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [previewSize, _setPreviewSize] = useState<WidgetSize>("2x2");

  const widgetTypes = [
    {
      type: "music_player",
      name: "Music Player",
      description: "Play your top songs",
      icon: "🎵",
      sizes: ["1x1", "2x2", "3x3"] as WidgetSize[],
    },
    {
      type: "pixel_art",
      name: "Pixel Art",
      description: "Display pixelated animations",
      icon: "👾",
      sizes: ["1x1", "2x2", "3x3"] as WidgetSize[],
    },
    {
      type: "calendar",
      name: "Calendar",
      description: "View events and dates",
      icon: "📅",
      sizes: ["1x1", "2x2", "3x3"] as WidgetSize[],
    },
    {
      type: "notes",
      name: "Notes",
      description: "Quick notes and reminders",
      icon: "📝",
      sizes: ["1x1", "2x2", "3x3"] as WidgetSize[],
    },
    {
      type: "shared_links",
      name: "Links",
      description: "Quick access links",
      icon: "🔗",
      sizes: ["1x1", "2x2", "3x3"] as WidgetSize[],
    },
    {
      type: "media_recommendations",
      name: "Media Recommendations",
      description: "Share and track media",
      icon: "🎬",
      sizes: ["1x1", "2x2", "3x3"] as WidgetSize[],
    },
    {
      type: "mood",
      name: "Mood Tracker",
      description: "Track your mood with emojis",
      icon: "😊",
      sizes: ["1x1", "2x2", "3x3"] as WidgetSize[],
    },
    {
      type: "event_countdown",
      name: "Event Countdown",
      description: "Countdown to upcoming events",
      icon: "⏰",
      sizes: ["1x1", "2x2", "3x3"] as WidgetSize[],
    },
    {
      type: "personality_quiz",
      name: "Personality Quiz",
      description: "Discover your vibe together",
      icon: "✨",
      sizes: ["1x1", "2x2", "3x3"] as WidgetSize[],
    },
    {
      type: "connect_four",
      name: "Connect Four",
      description: "Play async turn-based game",
      icon: "🎮",
      sizes: ["1x1", "2x2", "3x3"] as WidgetSize[],
    },
  ];

  return (
    <div>
      <h3 className={clsx("game-heading-3", styles.title)}>Widget Library</h3>
      <div className={styles.grid}>
        {widgetTypes.map((widget) => (
          <div
            key={widget.type}
            className={clsx("game-card", "game-card-hover", styles.card)}
            onClick={() => {
              setSelectedType(widget.type);
              playSound("click");
            }}
          >
            <div className={clsx("game-flex", "game-flex-gap-sm", styles.header)}>
              <span className={styles.icon}>{widget.icon}</span>
              <div className={clsx("game-heading-3", styles.name)}>{widget.name}</div>
            </div>
            <div className={clsx("game-text-muted", styles.description)}>{widget.description}</div>
            {selectedType === widget.type && (
              <div className={clsx("game-animate-slide-in", styles.sizeSelector)}>
                <div className={clsx("game-heading-3", styles.sizeTitle)}>Select Size:</div>
                <div className="game-flex game-flex-gap-sm">
                  {widget.sizes.map((size) => (
                    <button
                      key={size}
                      className={clsx(
                        "game-button",
                        previewSize === size && "game-button-primary",
                        styles.sizeButton
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectWidget(widget.type, size);
                        setSelectedType(null);
                        playSound("success");
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
