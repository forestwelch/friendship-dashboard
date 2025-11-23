"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";

interface PixelArtProps {
  size: WidgetSize;
  imageUrl?: string; // Single image (backward compatibility)
  imageUrls?: string[]; // Multiple images for slideshow
  pixelSize?: number; // Size of each pixel block for animation
  transitionDelay?: number; // Delay between slideshow transitions in ms
}

export function PixelArt({ 
  size, 
  imageUrl, 
  imageUrls, 
  pixelSize = 8,
  transitionDelay = 3000 
}: PixelArtProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Use imageUrls if provided, otherwise fall back to single imageUrl (memoized to prevent re-renders)
  const images = useMemo(() => {
    return imageUrls && imageUrls.length > 0 ? imageUrls : (imageUrl ? [imageUrl] : []);
  }, [imageUrls, imageUrl]);
  
  const currentImage = useMemo(() => {
    if (images.length === 0) return undefined;
    return images[currentImageIndex] || images[0];
  }, [images, currentImageIndex]);

  // Calculate grid dimensions based on widget size
  const getGridDimensions = () => {
    // Get actual widget dimensions - updated to match new grid (5rem tiles, 0.5rem gap)
    // Default to 16px if window not available (SSR)
    const rootFontSize = typeof window !== "undefined" && typeof document !== "undefined"
      ? parseFloat(getComputedStyle(document.documentElement).fontSize) 
      : 16;
    const tileSize = 5 * rootFontSize; // 5rem
    const gap = 0.5 * rootFontSize; // 0.5rem

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

  const { cols, rows } = useMemo(() => getGridDimensions(), [size, pixelSize]);

  // Reset image loaded state when image changes (use key to prevent loops)
  const currentImageKey = useMemo(() => {
    return currentImage ? currentImage.substring(0, 100) : null;
  }, [currentImage]);
  
  useEffect(() => {
    if (currentImageKey) {
      setImageLoaded(false);
      setCurrentImageIndex(0); // Reset to first image when images change
    }
  }, [currentImageKey]);

  useEffect(() => {
    // Trigger animation when image loads
    if (imageLoaded && currentImage) {
      setIsAnimating(true);
      // Reset animation after it completes
      const animationDuration = (cols + rows) * 20 + 500;
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, animationDuration);
      return () => clearTimeout(timer);
    } else if (!currentImage) {
      setIsAnimating(false);
      setImageLoaded(false);
    }
  }, [imageLoaded, currentImage, cols, rows]);

  // Slideshow effect - cycle through images (only when animation completes)
  useEffect(() => {
    if (images.length <= 1) return;
    if (!imageLoaded) return; // Don't cycle until current image is loaded
    if (isAnimating) return; // Don't cycle during animation

    const animationDuration = (cols + rows) * 20 + 500;
    const showDuration = Math.max(transitionDelay - animationDuration, 1000); // Minimum 1 second

    const timer = setTimeout(() => {
      setCurrentImageIndex((prev) => {
        const next = (prev + 1) % images.length;
        console.log(`[PixelArt] Cycling to image ${next} of ${images.length}`);
        return next;
      });
      setImageLoaded(false); // Trigger reload for next image
    }, showDuration);

    return () => clearTimeout(timer);
  }, [currentImageIndex, images.length, cols, rows, transitionDelay, imageLoaded, isAnimating]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Generate grid of pixel tiles for animation (memoized to prevent re-creation)
  const pixelTiles = useMemo(() => {
    const tiles = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const delay = (x + y) * 20; // Stagger delay in milliseconds
        tiles.push({ x, y, delay });
      }
    }
    return tiles;
  }, [cols, rows]);

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
        {currentImage && (
          <img
            key={`${currentImageIndex}-${currentImage.substring(0, 50)}`} // Key to force reload on change
            src={currentImage}
            alt="Pixel art"
            onLoad={handleImageLoad}
            onError={() => {
              console.error("Failed to load image");
              setImageLoaded(false);
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: isAnimating ? 0 : 1,
              transition: "opacity 0.3s",
              imageRendering: "pixelated",
            }}
          />
        )}

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
                  backgroundImage: `url(${currentImage})`,
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

