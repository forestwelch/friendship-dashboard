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
      description: "Play a selected song",
      icon: "hn-music-solid",
      sizes: ["1x1"] as WidgetSize[],
    },
    {
      type: "pixel_art",
      name: "Pixel Art",
      description: "Display pixelated animations",
      icon: "hn-image-solid",
      sizes: ["1x1", "2x2", "3x3"],
    },
    {
      type: "personality_quiz",
      name: "Personality Quiz",
      description: "Discover your vibe together",
      icon: "hn-star-solid",
      sizes: ["1x1", "2x2", "3x3"],
    },
    {
      type: "connect_four",
      name: "Connect Four",
      description: "Play async turn-based game",
      icon: "hn-gamepad-solid",
      sizes: ["2x1", "2x2", "3x3"],
    },
    {
      type: "consumption_log",
      name: "Shared Consumption Log",
      description: "Running diary of media consumption",
      icon: "hn-book-solid",
      sizes: ["2x1"],
    },
    {
      type: "question_jar",
      name: "Question Jar",
      description: "Alternating Q&A conversation",
      icon: "hn-question-circle-solid",
      sizes: ["2x2"],
    },
    {
      type: "audio_snippets",
      name: "Audio Snippets",
      description: "Shared soundboard of 2-second clips",
      icon: "hn-microphone-solid",
      sizes: ["1x2", "1x3"],
    },
    {
      type: "absurd_reviews",
      name: "Absurd Reviews",
      description: "Rate mundane concepts together",
      icon: "hn-star-solid",
      sizes: ["2x2"],
    },
    {
      type: "fridge_magnets",
      name: "Fridge Magnets",
      description: "Virtual fridge with magnetic letters",
      icon: "hn-magnet-solid",
      sizes: ["2x3"] as WidgetSize[],
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
              <i className={`hn ${widget.icon}`} style={{ fontSize: "1.5rem" }} />
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
                        onSelectWidget(widget.type, size as WidgetSize);
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
