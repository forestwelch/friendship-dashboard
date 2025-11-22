"use client";

import React, { useState, useEffect } from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";

interface PixelArtProps {
  size: WidgetSize;
  imageUrl: string;
  pixelSize?: number; // Size of each pixel block for animation
}

export function PixelArt({ size, imageUrl, pixelSize = 8 }: PixelArtProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calculate grid dimensions based on widget size
  const getGridDimensions = () => {
    // Get actual widget dimensions
    const tileSize = 80; // FIXED_TILE_SIZE from Grid
    const gap = 8; // FIXED_GAP from Grid

    let width = tileSize;
    let height = tileSize;

    if (size === "2x2") {
      width = tileSize * 2 + gap;
      height = tileSize * 2 + gap;
    } else if (size === "3x3") {
      width = tileSize * 3 + gap * 2;
      height = tileSize * 3 + gap * 2;
    }

    return {
      width,
      height,
      cols: Math.floor(width / pixelSize),
      rows: Math.floor(height / pixelSize),
    };
  };

  const { cols, rows } = getGridDimensions();

  useEffect(() => {
    // Trigger animation when image loads or changes
    if (imageLoaded && imageUrl) {
      setIsAnimating(true);
      // Reset animation after it completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, (cols + rows) * 20 + 500); // Total animation time
      return () => clearTimeout(timer);
    }
  }, [imageUrl, imageLoaded, cols, rows]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Generate grid of pixel tiles for animation
  const generatePixelTiles = () => {
    const tiles = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const delay = (x + y) * 20; // Stagger delay in milliseconds
        tiles.push({ x, y, delay });
      }
    }
    return tiles;
  };

  const pixelTiles = generatePixelTiles();

  return (
    <Widget size={size}>
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background image (hidden during animation) */}
        <img
          src={imageUrl}
          alt="Pixel art"
          onLoad={handleImageLoad}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: isAnimating ? 0 : 1,
            transition: "opacity 0.3s",
            imageRendering: "pixelated",
          }}
        />

        {/* Animated pixel tiles */}
        {isAnimating && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, ${pixelSize}px)`,
              gridTemplateRows: `repeat(${rows}, ${pixelSize}px)`,
            }}
          >
            {pixelTiles.map((tile) => (
              <div
                key={`${tile.x}-${tile.y}`}
                className="pixel-tile"
                style={{
                  width: `${pixelSize}px`,
                  height: `${pixelSize}px`,
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: `${cols * pixelSize}px ${rows * pixelSize}px`,
                  backgroundPosition: `-${tile.x * pixelSize}px -${tile.y * pixelSize}px`,
                  animationDelay: `${tile.delay}ms`,
                  imageRendering: "pixelated",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Widget>
  );
}

