"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { playSound } from "@/lib/sounds";

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  onColorConfirm: (color: string) => void;
}

export function ColorPicker({ currentColor, onColorChange, onColorConfirm }: ColorPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverColor, setHoverColor] = useState<string | null>(null);

  // 64x64 Grid
  const GRID_SIZE = 64;

  // Draw the color spectrum on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw spectrum
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        // Map X to Hue (0-360)
        const hue = (x / GRID_SIZE) * 360;

        // Map Y to Lightness (10-90 to avoid pure black/white which are less useful for themes usually)
        // Or Saturation/Lightness mix.
        // Let's try: Top = High Lightness, Bottom = Low Lightness
        // We'll keep Saturation high for that "Game Boy" vivid look, or vary it.

        // Let's do a standard HSL plane:
        // X = Hue
        // Y = Lightness (100% at top, 0% at bottom)
        // Saturation = 100% (vivid colors) or maybe varied across a dimension?

        // Actually, let's make it interesting:
        // X = Hue
        // Y = Lightness
        // Saturation = Fixed at 80% for retro feel?

        const lightness = 100 - (y / GRID_SIZE) * 100;
        const saturation = 80; // Fixed saturation for consistency

        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);

      if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        // Reconstruct color logic (must match drawing logic)
        const hue = (x / GRID_SIZE) * 360;
        const lightness = 100 - (y / GRID_SIZE) * 100;
        const saturation = 80;

        const newColor = `hsl(${Math.floor(hue)}, ${saturation}%, ${Math.floor(lightness)}%)`;

        setHoverColor(newColor);
        // Only trigger callback if significantly different to avoid spamming?
        // But user wants "hover preview", so instantaneous is better.
        onColorChange(newColor);

        if (!isHovering) {
          setIsHovering(true);
          playSound("hover"); // We'll need to add this sound type
        }
      }
    },
    [onColorChange, isHovering]
  );

  const handleClick = useCallback(() => {
    if (hoverColor) {
      playSound("select");
      onColorConfirm(hoverColor);
    }
  }, [hoverColor, onColorConfirm]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          border: "var(--border-width-md) solid var(--game-border)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--game-shadow-sm)",
          overflow: "hidden",
          cursor: "crosshair",
          background: "var(--bg)",
          display: "flex",
        }}
      >
        <canvas
          ref={canvasRef}
          width={GRID_SIZE}
          height={GRID_SIZE}
          style={{
            width: "256px", // Display size (4x scale of 64px)
            height: "256px",
            imageRendering: "pixelated",
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setIsHovering(false);
            setHoverColor(null);
            // Optionally revert to original color here if we wanted "cancel on leave" behavior,
            // but "replace native picker" usually implies the last hovered/clicked is what you get?
            // Let's leave it for now.
          }}
          onClick={handleClick}
        />

        {/* Crosshair indicator */}
        {isHovering && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              background: "transparent",
            }}
          >
            {/* We can't easily draw a crosshair over the exact pixel without calculating coordinates again. 
                But the cursor: crosshair handles most of it. 
                Maybe just a border highlight? */}
          </div>
        )}
      </div>

      {/* Preview values */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-md)",
          fontSize: "var(--font-size-xs)",
          fontFamily: "monospace",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xs)",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              background: currentColor,
              border: "1px solid var(--game-border)",
            }}
          />
          <span>CURR</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xs)",
          }}
        >
          <span>NEW</span>
          <div
            style={{
              width: "12px",
              height: "12px",
              background: hoverColor || currentColor,
              border: "1px solid var(--game-border)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
