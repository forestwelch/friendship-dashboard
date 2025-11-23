"use client";

import React, { useState } from "react";
import { WidgetSize } from "@/lib/types";
import { playSound } from "@/lib/sounds";

interface WidgetLibraryProps {
  onSelectWidget: (type: string, size: WidgetSize) => void;
}

export function WidgetLibrary({ onSelectWidget }: WidgetLibraryProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<WidgetSize>("2x2");

  const widgetTypes = [
    {
      type: "music_player",
      name: "Music Player",
      description: "Play your top songs",
      icon: "🎵",
      sizes: ["1x1", "2x2", "3x3"] as WidgetSize[],
    },
    {
      type: "image",
      name: "Image",
      description: "Display uploaded images",
      icon: "📷",
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
      type: "links",
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
  ];

  return (
    <div>
      <h3 className="game-heading-3" style={{ marginBottom: "var(--space-md)" }}>Widget Library</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "var(--space-md)",
        }}
      >
        {widgetTypes.map((widget) => (
          <div
            key={widget.type}
            className="game-card game-card-hover"
            style={{
              cursor: "pointer",
              padding: "var(--space-md)",
            }}
            onClick={() => {
              setSelectedType(widget.type);
              playSound("click");
            }}
          >
            <div className="game-flex game-flex-gap-sm" style={{ marginBottom: "var(--space-sm)", alignItems: "center" }}>
              <span style={{ fontSize: "18px" }}>{widget.icon}</span>
              <div className="game-heading-3" style={{ margin: 0 }}>
                {widget.name}
              </div>
            </div>
            <div className="game-text-muted" style={{ marginBottom: "var(--space-sm)" }}>
              {widget.description}
            </div>
            {selectedType === widget.type && (
              <div className="game-animate-slide-in" style={{ marginTop: "var(--space-md)" }}>
                <div className="game-heading-3" style={{ marginBottom: "var(--space-sm)", fontSize: "11px" }}>
                  Select Size:
                </div>
                <div className="game-flex game-flex-gap-sm">
                  {widget.sizes.map((size) => (
                    <button
                      key={size}
                      className={`game-button ${previewSize === size ? "game-button-primary" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectWidget(widget.type, size);
                        setSelectedType(null);
                        playSound("success");
                      }}
                      style={{ fontSize: "11px", padding: "var(--space-xs) var(--space-sm)" }}
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
