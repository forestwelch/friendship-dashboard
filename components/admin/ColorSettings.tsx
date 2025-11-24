"use client";

import React, { useState, useCallback } from "react";
import { playSound } from "@/lib/sounds";
import { ColorPicker } from "./ColorPicker";

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
  themeColors = currentColors,
}: ColorSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <>
      {/* Pixelated Cog Button - using theme colors */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setActiveColorKey(null); // Reset on open/close toggle
          playSound("open");
        }}
        style={{
          position: "fixed",
          bottom: "var(--space-xl)",
          right: "var(--space-xl)",
          width: "48px",
          height: "48px",
          background: themeColors.accent,
          border: `var(--border-width-lg) solid ${themeColors.primary}`,
          borderRadius: "var(--radius-sm)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          boxShadow: "var(--game-shadow-lg)",
        }}
      >
        <i className="hn hn-cog-solid" style={{ fontSize: "20px", color: themeColors.text }} />
      </button>

      {/* Color Picker Panel */}
      {isOpen && (
        <>
          <div
            style={{
              position: "fixed",
              bottom: "100px",
              right: "var(--space-xl)",
              width: "320px",
              background: themeColors.bg,
              border: `var(--border-width-lg) solid ${themeColors.accent}`,
              borderRadius: "var(--radius-md)",
              padding: "var(--space-lg)",
              zIndex: 1001,
              boxShadow: "var(--game-shadow-xl)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--space-lg)",
              }}
            >
              <h3 className="game-heading-2" style={{ margin: 0, color: themeColors.text }}>
                {activeColorKey ? `EDIT ${activeColorKey.toUpperCase()}` : "COLOR SETTINGS"}
              </h3>
              <button
                onClick={() => {
                  if (activeColorKey) {
                    setActiveColorKey(null);
                    playSound("close");
                  } else {
                    setIsOpen(false);
                    playSound("close");
                  }
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: themeColors.text,
                  cursor: "pointer",
                  fontSize: "var(--font-size-xl)",
                  padding: "var(--space-xs)",
                }}
              >
                {activeColorKey ? (
                  <i className="hn hn-arrow-left-solid" style={{ fontSize: "16px" }} />
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
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-md)",
                    marginBottom: "var(--space-lg)",
                  }}
                >
                  {colorKeys.map(({ key, label }) => (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-md)",
                      }}
                    >
                      <div
                        style={{
                          width: "60px",
                          height: "32px",
                          background: currentColors[key as keyof typeof currentColors],
                          border: "var(--border-width-md) solid var(--game-border)",
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setActiveColorKey(key);
                          playSound("select");
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "var(--font-size-xs)",
                            color: themeColors.text,
                            opacity: 0.7,
                          }}
                        >
                          {label}
                        </div>
                        <div
                          style={{
                            fontSize: "var(--font-size-xs)",
                            color: themeColors.text,
                          }}
                        >
                          {currentColors[key as keyof typeof currentColors]}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          randomizeOne(key);
                          playSound("blip");
                        }}
                        style={{
                          padding: "var(--space-xs)",
                          background: themeColors.secondary,
                          border: `var(--border-width-md) solid ${themeColors.accent}`,
                          borderRadius: "var(--radius-sm)",
                          color: themeColors.text,
                          cursor: "pointer",
                          fontSize: "var(--font-size-xs)",
                          minWidth: "32px",
                          minHeight: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <i className="hn hn-dice-solid" style={{ fontSize: "12px" }} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    onRandomizeAll?.();
                    playSound("select");
                  }}
                  style={{
                    width: "100%",
                    padding: "var(--space-sm) var(--space-md)",
                    background: themeColors.primary,
                    color: themeColors.bg,
                    border: `var(--border-width-md) solid ${themeColors.accent}`,
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "var(--space-xs)",
                  }}
                >
                  <i className="hn hn-dice-solid" style={{ fontSize: "12px" }} />
                  RANDOMIZE ALL
                </button>
              </>
            )}
          </div>

          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "var(--game-overlay-bg-50)",
              zIndex: 1000,
            }}
          />
        </>
      )}
    </>
  );
}
