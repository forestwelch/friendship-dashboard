"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";
import {
  base64ToPixelData,
  ThemeColors,
  PIXEL_GRID_SIZE,
  mapIntensityToThemeColor,
  generateScanlineOrder,
} from "@/lib/pixel-data-processing";

interface PixelArtProps {
  size: WidgetSize;
  imageUrl?: string; // Single image (backward compatibility)
  imageUrls?: string[]; // Multiple images for slideshow (backward compatibility)
  pixelData?: string[]; // Array of base64-encoded pixel data (new programmatic approach)
  themeColors?: ThemeColors; // Theme colors for programmatic rendering
  pixelSize?: number; // Size of each pixel block for animation
  transitionDelay?: number; // Delay between slideshow transitions in ms
}

export function PixelArt({
  size,
  imageUrl,
  imageUrls,
  pixelData,
  themeColors,
  pixelSize = 8,
  transitionDelay = 3000,
}: PixelArtProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [scanlineProgress, setScanlineProgress] = useState(0); // 0 to 1, tracks scanline position

  // Use refs to track previous values and prevent loops
  const prevImagesRef = useRef<string[]>([]);
  const isMountedRef = useRef(true);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const slideshowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanlineStartTimeRef = useRef<number | null>(null);
  const lastImageIndexRef = useRef<number>(0);
  const animationStartDelayRef = useRef<NodeJS.Timeout | null>(null);

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

  // Get next pixel data for cascade animation
  const nextPixelData = useMemo(() => {
    if (!useProgrammaticRendering || !pixelData || pixelData.length <= 1) return null;
    const nextIndex = (currentImageIndex + 1) % pixelData.length;
    const data = pixelData[nextIndex];
    if (!data) return null;
    try {
      return base64ToPixelData(data);
    } catch (error) {
      console.error("Failed to decode next pixel data:", error);
      return null;
    }
  }, [useProgrammaticRendering, pixelData, currentImageIndex]);

  // Calculate grid dimensions based on widget size
  const getGridDimensions = useCallback(() => {
    // Get actual widget dimensions - updated to match new grid (5rem tiles, 0.5rem gap)
    // Default to 16px if window not available (SSR)
    const rootFontSize =
      typeof window !== "undefined" && typeof document !== "undefined"
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
  }, [size, pixelSize]);

  const { cols, rows } = useMemo(() => {
    return getGridDimensions();
  }, [getGridDimensions]);

  // Reset image index when images array changes (but not on every render)
  useEffect(() => {
    const imagesChanged = JSON.stringify(prevImagesRef.current) !== JSON.stringify(images);
    if (imagesChanged && images.length > 0) {
      // Defer to avoid sync setState
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
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      if (slideshowTimeoutRef.current) clearTimeout(slideshowTimeoutRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (animationStartDelayRef.current) clearTimeout(animationStartDelayRef.current);
    };
  }, []);

  // Trigger animation when image loads
  useEffect(() => {
    if (!isMountedRef.current) return;

    if (imageLoaded && currentImage) {
      // Defer to avoid sync setState
      setTimeout(() => setIsAnimating(true), 0);
      // Reset animation after it completes
      const animationDuration = (cols + rows) * 20 + 500;
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setIsAnimating(false);
        }
      }, animationDuration);
    } else if (!currentImage) {
      // Defer to avoid sync setState
      setTimeout(() => {
        setIsAnimating(false);
        setImageLoaded(false);
      }, 0);
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [imageLoaded, currentImage, cols, rows]);

  // Slideshow effect - cycle through images (works for both programmatic and image-based)
  useEffect(() => {
    if (!isMountedRef.current) return;

    // Check if we have multiple images/pixel data
    const hasMultiple = useProgrammaticRendering
      ? pixelData && pixelData.length > 1
      : images.length > 1;

    if (!hasMultiple) return;
    if (!imageLoaded && !useProgrammaticRendering) return; // For image-based, wait for load
    if (isAnimating) return; // Don't cycle during animation
    if (scanlineProgress > 0 && scanlineProgress < 1) return; // Don't cycle during scanline animation

    // For programmatic rendering: animation effect handles the transition timing
    // We only update the index after animation completes
    // For image-based: wait transitionDelay
    if (useProgrammaticRendering) {
      // Don't auto-cycle for programmatic rendering - animation effect handles it
      return;
    }

    const waitDuration = transitionDelay;

    if (slideshowTimeoutRef.current) clearTimeout(slideshowTimeoutRef.current);
    slideshowTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && !isAnimating && scanlineProgress === 0) {
        setCurrentImageIndex((prev) => {
          const maxIndex = images.length - 1;
          const next = (prev + 1) % (maxIndex + 1);
          // Image cycling handled silently
          return next;
        });
        setImageLoaded(false); // For image-based rendering
      }
    }, waitDuration);

    return () => {
      if (slideshowTimeoutRef.current) {
        clearTimeout(slideshowTimeoutRef.current);
        slideshowTimeoutRef.current = null;
      }
    };
  }, [
    currentImageIndex,
    images.length,
    pixelData,
    cols,
    rows,
    transitionDelay,
    imageLoaded,
    isAnimating,
    scanlineProgress,
    useProgrammaticRendering,
  ]);

  // Animation trigger: Wait 3 seconds after image change, then start animation
  useEffect(() => {
    if (!useProgrammaticRendering || !currentPixelData || !nextPixelData) {
      // Reset state if no next image - defer to avoid sync setState
      setTimeout(() => {
        setIsAnimating(false);
        setScanlineProgress(0);
      }, 0);
      scanlineStartTimeRef.current = null;
      return;
    }

    // Don't start if already animating
    if (isAnimating) return;

    // Check if image index changed
    const imageIndexChanged = lastImageIndexRef.current !== currentImageIndex;

    if (imageIndexChanged) {
      lastImageIndexRef.current = currentImageIndex;
    }

    // Clear any existing delay
    if (animationStartDelayRef.current) {
      clearTimeout(animationStartDelayRef.current);
    }

    // Wait 3 seconds before starting animation (show current image first)
    animationStartDelayRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setIsAnimating(true);
      setScanlineProgress(0);
      scanlineStartTimeRef.current = Date.now();
    }, 3000);

    return () => {
      if (animationStartDelayRef.current) {
        clearTimeout(animationStartDelayRef.current);
        animationStartDelayRef.current = null;
      }
    };
  }, [currentImageIndex, useProgrammaticRendering, currentPixelData, nextPixelData, isAnimating]);

  // Animation progress loop: Updates scanlineProgress while animating
  useEffect(() => {
    if (!isAnimating || !scanlineStartTimeRef.current) return;

    const SCANLINE_DURATION = 2000; // 2 seconds for smooth animation

    const animate = () => {
      if (!scanlineStartTimeRef.current || !isMountedRef.current) return;

      const elapsed = Date.now() - scanlineStartTimeRef.current;
      const progress = Math.min(elapsed / SCANLINE_DURATION, 1);

      setScanlineProgress(progress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setScanlineProgress(1.0);
        setIsAnimating(false);
        scanlineStartTimeRef.current = null;

        // Wait 3 seconds, then move to next image
        setTimeout(() => {
          if (isMountedRef.current) {
            setScanlineProgress(0);
            setCurrentImageIndex((prev) => {
              const maxIndex = pixelData?.length || 1;
              const next = (prev + 1) % maxIndex;
              return next;
            });
          }
        }, 3000);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isAnimating, pixelData?.length]);

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

  // Calculate pixel size for SVG rendering based on widget size
  const getSVGPixelSize = () => {
    const rootFontSize =
      typeof window !== "undefined" && typeof document !== "undefined"
        ? parseFloat(getComputedStyle(document.documentElement).fontSize)
        : 16;
    const tileSize = 5 * rootFontSize; // 5rem

    let widgetSize = tileSize;
    if (size === "2x2") {
      widgetSize = tileSize * 2 + 0.5 * rootFontSize;
    } else if (size === "3x3") {
      widgetSize = tileSize * 3 + 1 * rootFontSize;
    }

    // Each pixel in the 128x128 grid should be widgetSize/128
    return widgetSize / PIXEL_GRID_SIZE;
  };

  // Generate scanline order for CRT animation
  const _scanlineOrder = useMemo(() => {
    if (!useProgrammaticRendering) return [];
    return generateScanlineOrder(PIXEL_GRID_SIZE, PIXEL_GRID_SIZE);
  }, [useProgrammaticRendering]);

  // Calculate which pixels should show new image based on scanline progress
  // Optimized: use direct index calculation instead of findIndex
  const scannedPixelIndex = useMemo(() => {
    if (!useProgrammaticRendering || !isAnimating) return -1;
    const totalPixels = PIXEL_GRID_SIZE * PIXEL_GRID_SIZE;
    return Math.floor(scanlineProgress * totalPixels);
  }, [useProgrammaticRendering, isAnimating, scanlineProgress]);

  const _getPixelState = useCallback(
    (row: number, col: number) => {
      if (!useProgrammaticRendering || !isAnimating || scannedPixelIndex < 0) return "old";

      // Calculate pixel index in scanline order (row-major: row * width + col)
      const pixelIndex = row * PIXEL_GRID_SIZE + col;

      if (pixelIndex < scannedPixelIndex) {
        return "new"; // Already scanned - show new image
      } else if (pixelIndex === scannedPixelIndex) {
        return "scanning"; // Currently being scanned - animate
      } else {
        return "old"; // Not yet scanned - show old image
      }
    },
    [useProgrammaticRendering, isAnimating, scannedPixelIndex]
  );

  // Hooks must be called unconditionally - move before conditional return
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgPixelSize = getSVGPixelSize();
  const gridSize = PIXEL_GRID_SIZE;
  const canvasSize = gridSize * svgPixelSize;

  // Render to canvas - responds to scanlineProgress changes
  useEffect(() => {
    // Only render if conditions are met
    if (!useProgrammaticRendering || !currentPixelData || !themeColors || !canvasRef.current)
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Render function - called whenever scanlineProgress changes
    const render = () => {
      if (!ctx || !currentPixelData) return;

      const totalPixels = gridSize * gridSize;
      const currentScannedPixel = Math.min(Math.ceil(scanlineProgress * totalPixels), totalPixels);

      // Clear canvas
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      // Render pixels based on scanline progress
      let currentColor = "";
      ctx.fillStyle = "";

      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const pixelIndex = row * gridSize + col;
          const pixelState =
            pixelIndex < currentScannedPixel
              ? "new"
              : pixelIndex === currentScannedPixel
                ? "scanning"
                : "old";

          // Determine which pixel data to show
          let intensityLevel: number;
          if (pixelState === "new" && nextPixelData) {
            intensityLevel = nextPixelData[pixelIndex];
          } else {
            intensityLevel = currentPixelData[pixelIndex];
          }

          const color = mapIntensityToThemeColor(intensityLevel, themeColors);

          if (color !== currentColor) {
            ctx.fillStyle = color;
            currentColor = color;
          }

          // Draw pixel
          ctx.fillRect(col * svgPixelSize, row * svgPixelSize, svgPixelSize, svgPixelSize);

          // Add visual effect for scanning pixels (use theme text color with opacity)
          if (pixelState === "scanning") {
            // Use theme text color for scanline effect, convert to rgba
            const textColor = themeColors.text || "var(--text)";
            // Extract RGB values from hex color
            const hex = textColor.replace("#", "");
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
            ctx.fillRect(col * svgPixelSize, row * svgPixelSize, svgPixelSize, svgPixelSize);
            ctx.fillStyle = currentColor;
          }
        }
      }

      // If animation completed, ensure final frame shows all new pixels
      if (scanlineProgress >= 1 && nextPixelData) {
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        let currentColor = "";
        ctx.fillStyle = "";
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const pixelIndex = row * gridSize + col;
            const intensityLevel = nextPixelData[pixelIndex];
            const color = mapIntensityToThemeColor(intensityLevel, themeColors);
            if (color !== currentColor) {
              ctx.fillStyle = color;
              currentColor = color;
            }
            ctx.fillRect(col * svgPixelSize, row * svgPixelSize, svgPixelSize, svgPixelSize);
          }
        }
      }
    };

    // Render whenever scanlineProgress changes
    render();
  }, [
    useProgrammaticRendering,
    currentPixelData,
    nextPixelData,
    scanlineProgress,
    themeColors,
    gridSize,
    svgPixelSize,
    canvasSize,
  ]);

  // Render programmatic Canvas with CRT scanline animation (much faster than 16K DOM elements)
  if (useProgrammaticRendering && currentPixelData && themeColors) {
    return (
      <Widget size={size}>
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Canvas-based CRT scanline animation - much faster than 16K DOM elements */}
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            style={{
              width: "100%",
              height: "100%",
              imageRendering: "pixelated",
              objectFit: "contain",
            }}
          />
        </div>
      </Widget>
    );
  }

  // Fallback to image-based rendering (backward compatibility)
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

// Memoize PixelArt to prevent unnecessary re-renders
export const PixelArtMemo = React.memo(PixelArt);
