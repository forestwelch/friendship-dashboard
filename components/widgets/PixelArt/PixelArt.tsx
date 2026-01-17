"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";
import { Shimmer } from "@/components/shared";
import {
  base64ToPixelData,
  ThemeColors,
  PIXEL_GRID_SIZE,
  mapIntensityToThemeColor,
} from "@/lib/utils/pixel-data-processing";
import { GRID_TILE_SIZE_REM, GRID_GAP_REM } from "@/lib/constants";
import styles from "./PixelArt.module.css";

export type TransitionType = "scanline" | "dissolve" | "boot-up";

interface PixelArtProps {
  size: WidgetSize;
  imageUrl?: string; // Single image (backward compatibility)
  imageUrls?: string[]; // Multiple images for slideshow (backward compatibility)
  pixelData?: string[]; // Array of base64-encoded pixel data (new programmatic approach)
  themeColors?: ThemeColors; // Theme colors for programmatic rendering
  pixelSize?: number; // Size of each pixel block for animation
  transitionDelay?: number; // Delay between slideshow transitions in ms
  transitionType?: TransitionType; // Transition effect type: scanline, dissolve, or boot-up
}

export function PixelArt({
  size,
  imageUrl,
  imageUrls,
  pixelData,
  themeColors,
  pixelSize: _pixelSize = 8, // Kept for backward compatibility but not used
  transitionDelay: _transitionDelay = 3000, // Kept for backward compatibility but not used (using random 3-5s)
  transitionType: _transitionType = "scanline", // Kept for config compatibility but not used
}: PixelArtProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Use refs to track previous values and prevent loops
  const prevImagesRef = useRef<string[]>([]);
  const isMountedRef = useRef(true);
  const slideshowTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine rendering mode: programmatic (pixelData) or image-based (backward compatibility)
  const useProgrammaticRendering = pixelData && pixelData.length > 0 && themeColors;

  // Use imageUrls if provided, otherwise fall back to single imageUrl (memoized to prevent re-renders)
  const images = useMemo(() => {
    return imageUrls && imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];
  }, [imageUrls, imageUrl]);

  const currentImage = useMemo(() => {
    if (images.length === 0) return undefined;
    return images[currentImageIndex] || images[0];
  }, [images, currentImageIndex]);

  // Get current pixel data for programmatic rendering
  const currentPixelData = useMemo(() => {
    if (!useProgrammaticRendering || !pixelData) return null;
    const data = pixelData[currentImageIndex] || pixelData[0];
    if (!data) return null;
    try {
      return base64ToPixelData(data);
    } catch (error) {
      console.error("Failed to decode pixel data:", error);
      return null;
    }
  }, [useProgrammaticRendering, pixelData, currentImageIndex]);

  // Calculate actual grid size from pixel data (supports 128x128, 256x256, etc.)
  const actualGridSize = useMemo(() => {
    if (!currentPixelData) return PIXEL_GRID_SIZE;
    // Calculate grid size from array length (assuming square grid)
    const size = Math.sqrt(currentPixelData.length);
    // Round to nearest integer and validate it's a perfect square
    const roundedSize = Math.round(size);
    if (roundedSize * roundedSize === currentPixelData.length) {
      return roundedSize;
    }
    // Fallback to default if not a perfect square
    return PIXEL_GRID_SIZE;
  }, [currentPixelData]);

  // Reset image index when images array changes (but not on every render)
  useEffect(() => {
    const imagesChanged = JSON.stringify(prevImagesRef.current) !== JSON.stringify(images);
    if (imagesChanged) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setCurrentImageIndex(0);
        setImageLoaded(false);
      }, 0);
      prevImagesRef.current = images;
    }
  }, [images]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (slideshowTimeoutRef.current) clearTimeout(slideshowTimeoutRef.current);
    };
  }, []);

  // Simple slideshow - random delay between 3-5 seconds, instant image change
  useEffect(() => {
    if (!isMountedRef.current) return;

    // Check if we have multiple images/pixel data
    const hasMultiple = useProgrammaticRendering
      ? pixelData && pixelData.length > 1
      : images.length > 1;

    if (!hasMultiple) return;
    if (!imageLoaded && !useProgrammaticRendering) return; // For image-based, wait for load

    // Random delay between 3000ms (3s) and 5000ms (5s)
    const randomDelay = Math.floor(Math.random() * 2000) + 3000;

    if (slideshowTimeoutRef.current) clearTimeout(slideshowTimeoutRef.current);
    slideshowTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setCurrentImageIndex((prev) => {
          const maxIndex = useProgrammaticRendering
            ? (pixelData?.length || 1) - 1
            : images.length - 1;
          return (prev + 1) % (maxIndex + 1);
        });
        setImageLoaded(false); // For image-based rendering
      }
    }, randomDelay);

    return () => {
      if (slideshowTimeoutRef.current) {
        clearTimeout(slideshowTimeoutRef.current);
        slideshowTimeoutRef.current = null;
      }
    };
  }, [currentImageIndex, images.length, pixelData, imageLoaded, useProgrammaticRendering]);

  // Simplified: No complex animations, just handle image changes

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Calculate pixel size for SVG rendering based on widget size
  const getSVGPixelSize = useCallback(() => {
    const rootFontSize =
      typeof window !== "undefined" && typeof document !== "undefined"
        ? parseFloat(getComputedStyle(document.documentElement).fontSize)
        : 16;
    const tileSize = GRID_TILE_SIZE_REM * rootFontSize;

    let widgetSize = tileSize;
    if (size === "2x2") {
      widgetSize = tileSize * 2 + GRID_GAP_REM * rootFontSize;
    } else if (size === "3x3") {
      widgetSize = tileSize * 3 + GRID_GAP_REM * 2 * rootFontSize;
    }

    // Each pixel should be widgetSize/gridSize (dynamic based on actual grid size)
    return widgetSize / actualGridSize;
  }, [size, actualGridSize]);

  // Hooks must be called unconditionally - move before conditional return
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgPixelSize = getSVGPixelSize();
  const gridSize = actualGridSize; // Use calculated grid size from pixel data
  const canvasSize = gridSize * svgPixelSize;

  // Optimized canvas rendering - only re-render when pixel data changes
  useEffect(() => {
    // Only render if conditions are met
    if (!useProgrammaticRendering || !currentPixelData || !themeColors || !canvasRef.current)
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Set canvas size to match calculated size (important for proper rendering)
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    ctx.imageSmoothingEnabled = false;

    // Simple, fast rendering - no complex animations
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    let currentColor = "";
    ctx.fillStyle = "";

    // Render all pixels at once - much faster than per-pixel state checks
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const pixelIndex = row * gridSize + col;
        if (pixelIndex >= currentPixelData.length) continue;

        const intensityLevel = currentPixelData[pixelIndex];
        const color = mapIntensityToThemeColor(intensityLevel, themeColors);

        if (color !== currentColor) {
          ctx.fillStyle = color;
          currentColor = color;
        }

        ctx.fillRect(col * svgPixelSize, row * svgPixelSize, svgPixelSize, svgPixelSize);
      }
    }
  }, [useProgrammaticRendering, currentPixelData, themeColors, gridSize, svgPixelSize, canvasSize]);

  // Show shimmer while loading (only when images exist but haven't loaded yet)
  // For programmatic: need pixelData and themeColors
  // For image-based: need image URL and it to be loaded
  // Only show shimmer if images/pixelData exist but haven't loaded yet
  const isLoading = useProgrammaticRendering
    ? pixelData && pixelData.length > 0 && (!currentPixelData || !themeColors)
    : images.length > 0 && !imageLoaded;

  if (isLoading) {
    return (
      <Widget size={size}>
        <Shimmer animation="verticalwipe" />
      </Widget>
    );
  }

  // Render programmatic Canvas (optimized, no complex animations)
  if (useProgrammaticRendering && currentPixelData && themeColors) {
    return (
      <Widget size={size}>
        <div className={styles.container}>
          {/* Optimized canvas rendering - instant changes, no transitions */}
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            className={styles.canvas}
          />
        </div>
      </Widget>
    );
  }

  // Fallback to image-based rendering (backward compatibility) - simplified, no DOM tiles
  return (
    <Widget size={size}>
      <div className={styles.imageContainer}>
        {/* Simple image rendering - instant changes, no transitions */}
        {currentImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${currentImageIndex}-${currentImage.substring(0, 50)}`}
            src={currentImage}
            alt="Pixel art"
            onLoad={handleImageLoad}
            onError={() => {
              console.error("Failed to load image");
              setImageLoaded(false);
            }}
            className={styles.image}
          />
        )}
      </div>
    </Widget>
  );
}

// Memoize PixelArt to prevent unnecessary re-renders
export const PixelArtMemo = React.memo(PixelArt);
