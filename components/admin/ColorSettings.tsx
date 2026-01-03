"use client";

import React, { useState, useCallback } from "react";
import { playSound } from "@/lib/sounds";
import { ColorPicker } from "./ColorPicker";
import clsx from "clsx";
import styles from "./ColorSettings.module.css";

interface ColorSettingsProps {
  friendId: string;
  currentColors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
  };
  onColorChange: (colorKey: string, value: string) => void;
  onRandomizeAll?: () => void;
  onClose?: () => void;
  themeColors?: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
  };
}

export function ColorSettings({
  friendId: _friendId,
  currentColors,
  onColorChange,
  onRandomizeAll,
  onClose,
  themeColors = currentColors,
}: ColorSettingsProps) {
  const [isOpen, setIsOpen] = useState(true); // Always open when component is rendered
  const [activeColorKey, setActiveColorKey] = useState<string | null>(null);

  const colorKeys = [
    { key: "primary", label: "Primary" },
    { key: "secondary", label: "Secondary" },
    { key: "accent", label: "Accent" },
    { key: "bg", label: "Background" },
    { key: "text", label: "Text" },
  ];

  const randomizeOne = useCallback(
    (key: string) => {
      // Generate colors that work well together (Game Boy style)
      // Math.random() is only called when button is clicked, not during render
      const hues = [200, 0, 120, 300, 40]; // Blue, Red, Green, Magenta, Yellow
      const hue = hues[Math.floor(Math.random() * hues.length)];
      const saturation = 70 + Math.random() * 20;
      const lightness = 30 + Math.random() * 40;
      const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      onColorChange(key, color);
    },
    [onColorChange]
  );

  const handleClose = () => {
    setIsOpen(false);
    setActiveColorKey(null);
    onClose?.();
    playSound("close");
  };

  return (
    <>
      {/* Color Picker Panel */}
      {isOpen && (
        <>
          <div
            className={styles.panel}
            style={{
              background: themeColors.bg,
              borderColor: themeColors.accent,
            }}
          >
            <div className={styles.panelHeader}>
              <h3
                className={clsx("game-heading-2", styles.panelTitle)}
                style={{ color: themeColors.text }}
              >
                {activeColorKey ? `EDIT ${activeColorKey.toUpperCase()}` : "COLOR SETTINGS"}
              </h3>
              <button
                onClick={() => {
                  if (activeColorKey) {
                    setActiveColorKey(null);
                    playSound("close");
                  } else {
                    handleClose();
                  }
                }}
                className={styles.closeButton}
                style={{ color: themeColors.text }}
              >
                {activeColorKey ? (
                  <i className={clsx("hn", "hn-arrow-left-solid", styles.closeIcon)} />
                ) : (
                  <i className="hn hn-times-solid" />
                )}
              </button>
            </div>

            {activeColorKey ? (
              // Color Picker View
              <ColorPicker
                currentColor={currentColors[activeColorKey as keyof typeof currentColors]}
                onColorChange={(color) => {
                  // Optional: Live preview or wait for confirm?
                  // User asked for "Hover preview click to confirm".
                  // So we can update immediately on hover/change for preview.
                  onColorChange(activeColorKey, color);
                }}
                onColorConfirm={(color) => {
                  onColorChange(activeColorKey, color);
                  setActiveColorKey(null); // Go back to list
                }}
              />
            ) : (
              // List View
              <>
                <div className={styles.colorList}>
                  {colorKeys.map(({ key, label }) => (
                    <div key={key} className={styles.colorItem}>
                      <div
                        className={styles.colorSwatch}
                        style={{
                          background: currentColors[key as keyof typeof currentColors],
                        }}
                        onClick={() => {
                          setActiveColorKey(key);
                          playSound("select");
                        }}
                      />
                      <div className={styles.colorInfo}>
                        <div className={styles.colorLabel} style={{ color: themeColors.text }}>
                          {label}
                        </div>
                        <div className={styles.colorValue} style={{ color: themeColors.text }}>
                          {currentColors[key as keyof typeof currentColors]}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          randomizeOne(key);
                          playSound("blip");
                        }}
                        className={styles.randomizeButton}
                        style={{
                          background: themeColors.secondary,
                          borderColor: themeColors.accent,
                          color: themeColors.text,
                        }}
                      >
                        <i className={clsx("hn", "hn-shuffle-solid", styles.randomizeIcon)} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    onRandomizeAll?.();
                    playSound("select");
                  }}
                  className={styles.randomizeAllButton}
                  style={{
                    background: themeColors.primary,
                    color: themeColors.bg,
                    borderColor: themeColors.accent,
                  }}
                >
                  <i className={clsx("hn", "hn-shuffle-solid", styles.randomizeAllIcon)} />
                  RANDOMIZE ALL
                </button>
              </>
            )}
          </div>

          {/* Backdrop */}
          <div className={styles.backdrop} onClick={handleClose} />
        </>
      )}
    </>
  );
}
