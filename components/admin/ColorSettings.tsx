"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { playSound } from "@/lib/sounds";
import { ColorPicker } from "./ColorPicker";
import clsx from "clsx";
import styles from "./ColorSettings.module.css";
import { hslToHex, hexToHsl, isValidHex } from "@/lib/color-utils";

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
  const [hexInputs, setHexInputs] = useState<Record<string, string>>({});

  // Store original colors when component mounts - use useState with lazy initialization
  const [originalColors] = useState<typeof currentColors>(() => currentColors);
  const [originalColorForPicker, setOriginalColorForPicker] = useState<string | null>(null);

  // Dragging state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle drag start
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();

      // Convert from CSS positioning (bottom/right) to absolute positioning (top/left)
      // This happens on first drag
      if (position === null) {
        setPosition({
          x: rect.left,
          y: rect.top,
        });
      }

      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
      e.preventDefault(); // Prevent text selection while dragging
    },
    [position]
  );

  // Handle drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (position === null) return;

      // Calculate new position
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Constrain to viewport
      const panelWidth = panelRef.current?.offsetWidth || 320;
      const panelHeight = panelRef.current?.offsetHeight || 500;
      const constrainedX = Math.max(0, Math.min(newX, window.innerWidth - panelWidth));
      const constrainedY = Math.max(0, Math.min(newY, window.innerHeight - panelHeight));

      setPosition({
        x: constrainedX,
        y: constrainedY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, position]);

  const colorKeys = [
    { key: "primary", label: "Primary" },
    { key: "secondary", label: "Secondary" },
    { key: "accent", label: "Accent" },
    { key: "bg", label: "Background" },
    { key: "text", label: "Text" },
  ];

  const handleClose = () => {
    // Revert all colors to original when closing
    Object.keys(originalColors).forEach((key) => {
      onColorChange(key, originalColors[key as keyof typeof originalColors]);
    });
    setIsOpen(false);
    setActiveColorKey(null);
    setOriginalColorForPicker(null);
    onClose?.();
    playSound("close");
  };

  const handleCancelColorPicker = () => {
    if (activeColorKey && originalColorForPicker !== null) {
      // Revert the color being edited to its original value
      onColorChange(activeColorKey, originalColorForPicker);
    }
    setActiveColorKey(null);
    setOriginalColorForPicker(null);
    playSound("close");
  };

  return (
    <>
      {/* Color Picker Panel */}
      {isOpen && (
        <>
          <div
            ref={panelRef}
            className={styles.panel}
            style={{
              background: themeColors.bg,
              borderColor: themeColors.accent,
              cursor: isDragging ? "grabbing" : "default",
              ...(position && {
                left: `${position.x}px`,
                top: `${position.y}px`,
                bottom: "auto",
                right: "auto",
                transform: "none",
              }),
            }}
          >
            <div
              className={styles.panelHeader}
              onMouseDown={handleMouseDown}
              style={{
                cursor: "grab",
              }}
            >
              <h3
                className={clsx("game-heading-2", styles.panelTitle)}
                style={{ color: themeColors.text }}
              >
                {activeColorKey ? `EDIT ${activeColorKey.toUpperCase()}` : "COLOR SETTINGS"}
              </h3>
              <button
                onClick={() => {
                  if (activeColorKey) {
                    handleCancelColorPicker();
                  } else {
                    handleClose();
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className={styles.closeButton}
                style={{ color: themeColors.text }}
              >
                <i className="hn hn-times-solid" />
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
                  {colorKeys.map(({ key, label }) => {
                    const currentHsl = currentColors[key as keyof typeof currentColors];
                    const derivedHex = hslToHex(currentHsl);
                    const displayHex = hexInputs[key] ?? derivedHex;

                    return (
                      <div key={key} className={styles.colorItem}>
                        <div className={styles.colorLabel} style={{ color: themeColors.text }}>
                          {label.toUpperCase()}
                        </div>
                        <input
                          type="text"
                          value={displayHex}
                          onChange={(e) => {
                            const value = e.target.value;
                            setHexInputs((prev) => ({ ...prev, [key]: value }));
                            if (isValidHex(value)) {
                              const hsl = hexToHsl(value);
                              if (hsl) {
                                onColorChange(key, hsl);
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (isValidHex(value)) {
                              const hsl = hexToHsl(value);
                              if (hsl) {
                                onColorChange(key, hsl);
                              }
                              setHexInputs((prev) => {
                                const updated = { ...prev };
                                delete updated[key];
                                return updated;
                              });
                            } else {
                              playSound("error");
                              setHexInputs((prev) => {
                                const updated = { ...prev };
                                delete updated[key];
                                return updated;
                              });
                            }
                          }}
                          style={{
                            width: "6rem",
                            height: "32px",
                            padding: "var(--space-xs)",
                            fontSize: "var(--font-size-sm)",
                            fontFamily: "monospace",
                            background: themeColors.bg,
                            border: "var(--border-width-md) solid " + themeColors.accent,
                            borderRadius: "var(--radius-sm)",
                            color: themeColors.text,
                            boxSizing: "border-box",
                          }}
                          placeholder="#000000"
                        />
                        <div
                          className={styles.colorSwatch}
                          style={{
                            background: currentHsl,
                          }}
                          onClick={() => {
                            // Store the original color when entering the picker
                            setOriginalColorForPicker(
                              currentColors[key as keyof typeof currentColors]
                            );
                            setActiveColorKey(key);
                            playSound("select");
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {onRandomizeAll && (
                  <button
                    onClick={() => {
                      onRandomizeAll();
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
                )}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
