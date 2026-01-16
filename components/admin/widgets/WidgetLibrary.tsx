"use client";

import React, { useState, useMemo } from "react";
import { WidgetSize } from "@/lib/types";
import { FriendWidget } from "@/lib/queries";
import { playSound } from "@/lib/sounds";
import { findAvailablePosition } from "@/lib/utils/widget-utils";
import { WIDGET_TYPES, allowsMultipleInstances } from "@/lib/widget-types";
import clsx from "clsx";
import styles from "./WidgetLibrary.module.css";

interface WidgetLibraryProps {
  onSelectWidget: (type: string, size: WidgetSize) => void;
  widgets?: FriendWidget[];
}

interface WidgetTypeDefinition {
  type: string;
  name: string;
  description: string;
  icon: string;
  sizes: WidgetSize[];
}

export function WidgetLibrary({ onSelectWidget, widgets = [] }: WidgetLibraryProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [previewSize, _setPreviewSize] = useState<WidgetSize>("2x2");

  // Check if a widget type can be added
  const canAddWidget = useMemo(
    () =>
      (widgetType: string, sizes: WidgetSize[]): boolean => {
        // Check for duplicate widget types (except those that allow multiple instances)
        const existingWidgetsOfType = widgets.filter((w) => w.widget_type === widgetType);
        if (!allowsMultipleInstances(widgetType) && existingWidgetsOfType.length > 0) {
          return false;
        }

        // Check if there's space for at least one size
        return sizes.some((size) => findAvailablePosition(widgets, size) !== null);
      },
    [widgets]
  );

  const widgetTypes: WidgetTypeDefinition[] = [
    {
      type: WIDGET_TYPES.MUSIC_PLAYER,
      name: "Music Player",
      description: "Play MP3 songs (upload your own)",
      icon: "hn-music-solid",
      sizes: ["1x1", "3x1", "4x2"] as WidgetSize[],
    },
    {
      type: WIDGET_TYPES.PIXEL_ART,
      name: "Pixel Art",
      description: "Display pixelated animations",
      icon: "hn-image-solid",
      sizes: ["1x1", "2x2", "3x3"] as WidgetSize[],
    },
    {
      type: WIDGET_TYPES.CONNECT_FOUR,
      name: "Connect Four",
      description: "Play async turn-based game",
      icon: "hn-gaming", // gaming not available
      sizes: ["2x1", "2x2", "3x3"] as WidgetSize[],
    },
    {
      type: WIDGET_TYPES.CONSUMPTION_LOG,
      name: "Shared Consumption Log",
      description: "Running diary of media consumption",
      icon: "hn-bookmark-solid", // book-solid not available
      sizes: ["3x1"] as WidgetSize[],
    },
    {
      type: WIDGET_TYPES.QUESTION_JAR,
      name: "Question Jar",
      description: "Alternating Q&A conversation",
      icon: "hn-question-solid", // question-circle-solid not available
      sizes: ["2x2"] as WidgetSize[],
    },
    {
      type: WIDGET_TYPES.AUDIO_SNIPPETS,
      name: "Audio Snippets",
      description: "Shared soundboard of 5-second clips",
      icon: "hn-sound-on-solid", // microphone-solid not available
      sizes: ["1x2", "1x3", "2x1", "3x1"] as WidgetSize[],
    },
    {
      type: WIDGET_TYPES.ABSURD_REVIEWS,
      name: "Anthropocene Reviewed",
      description: "Rate mundane concepts together",
      icon: "hn-star-solid",
      sizes: ["2x1"] as WidgetSize[],
    },
    {
      type: WIDGET_TYPES.FRIDGE_MAGNETS,
      name: "Fridge Magnets",
      description: "Virtual fridge with magnetic letters",
      icon: "hn-paperclip-solid", // magnet-solid not available
      sizes: ["2x3", "3x4", "4x6"] as WidgetSize[],
    },
    {
      type: WIDGET_TYPES.TIC_TAC_TOE,
      name: "Tic Tac Toe",
      description: "Play infinite tic-tac-toe",
      icon: "hn-gaming", // gaming icon
      sizes: ["2x2", "3x3"] as WidgetSize[],
    },
  ];

  return (
    <div>
      <h3 className={clsx("game-heading-3", styles.title)}>Widget Library</h3>
      <div className={styles.grid}>
        {widgetTypes.map((widget) => {
          const isDisabled = !canAddWidget(widget.type, widget.sizes);
          return (
            <div
              key={widget.type}
              className={clsx(
                "game-card",
                !isDisabled && "game-card-hover",
                styles.card,
                isDisabled && styles.cardDisabled
              )}
              onClick={() => {
                if (isDisabled) return;
                setSelectedType(widget.type);
                playSound("click");
              }}
            >
              <div className={clsx("game-flex", "game-flex-gap-sm", styles.header)}>
                <i
                  className={clsx(
                    `hn ${widget.icon} ${styles.icon}`,
                    isDisabled && styles.iconDisabled
                  )}
                />
                <div
                  className={clsx("game-heading-3", styles.name, isDisabled && styles.nameDisabled)}
                >
                  {widget.name}
                </div>
              </div>
              <div
                className={clsx(
                  "game-text-muted",
                  styles.description,
                  isDisabled && styles.descriptionDisabled
                )}
              >
                {widget.description}
              </div>
              {selectedType === widget.type && !isDisabled && (
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
          );
        })}
      </div>
    </div>
  );
}
