"use client";

import React, { useState } from "react";
import { playSound } from "@/lib/sounds";

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
  friendId, 
  currentColors, 
  onColorChange,
  onRandomizeAll,
  themeColors = currentColors,
}: ColorSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const colorKeys = [
    { key: "primary", label: "Primary" },
    { key: "secondary", label: "Secondary" },
    { key: "accent", label: "Accent" },
    { key: "bg", label: "Background" },
    { key: "text", label: "Text" },
  ];

  const generateRandomColor = () => {
    // Generate colors that work well together (Game Boy style)
    const hues = [200, 0, 120, 300, 40]; // Blue, Red, Green, Magenta, Yellow
    const hue = hues[Math.floor(Math.random() * hues.length)];
    const saturation = 70 + Math.random() * 20;
    const lightness = 30 + Math.random() * 40;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const randomizeOne = (key: string) => {
    onColorChange(key, generateRandomColor());
  };

  return (
    <>
      {/* Pixelated Cog Button - using theme colors */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
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
                COLOR SETTINGS
              </h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  playSound("close");
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
                <i className="hn hn-times-solid" />
              </button>
            </div>

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
                      const input = document.createElement("input");
                      input.type = "color";
                      input.value = currentColors[key as keyof typeof currentColors];
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement;
                        onColorChange(key, target.value);
                      };
                      input.click();
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "var(--font-size-xs)", color: themeColors.text, opacity: 0.7 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: "var(--font-size-xs)", color: themeColors.text }}>
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
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 1000,
            }}
          />
        </>
      )}
    </>
  );
}

