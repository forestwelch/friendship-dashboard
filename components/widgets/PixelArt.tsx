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
import { GRID_TILE_SIZE_REM, GRID_GAP_REM } from "@/lib/constants";

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
  pixelSize = 8,
  transitionDelay = 3000,
  transitionType = "scanline",
}: PixelArtProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [scanlineProgress, setScanlineProgress] = useState(0); // 0 to 1, tracks scanline position
  const [dissolveProgress, setDissolveProgress] = useState(0); // 0 to 1, tracks dissolve progress
  const [bootUpProgress, setBootUpProgress] = useState(0); // 0 to 1, tracks boot-up progress
  const [randomOrder, setRandomOrder] = useState<number[]>([]); // Random pixel order for dissolve

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

  // Calculate grid dimensions based on widget size
  const getGridDimensions = useCallback(() => {
    // Get actual widget dimensions using constants
    // Default to 16px if window not available (SSR)
    const rootFontSize =
      typeof window !== "undefined" && typeof document !== "undefined"
        ? parseFloat(getComputedStyle(document.documentElement).fontSize)
        : 16;
    const tileSize = GRID_TILE_SIZE_REM * rootFontSize;
    const gap = GRID_GAP_REM * rootFontSize;

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
    // Don't cycle during any animation
    if (
      (transitionType === "scanline" && scanlineProgress > 0 && scanlineProgress < 1) ||
      (transitionType === "dissolve" && dissolveProgress > 0 && dissolveProgress < 1) ||
      (transitionType === "boot-up" && bootUpProgress > 0 && bootUpProgress < 1)
    ) {
      return;
    }

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
      const noAnimation =
        (transitionType === "scanline" && scanlineProgress === 0) ||
        (transitionType === "dissolve" && dissolveProgress === 0) ||
        (transitionType === "boot-up" && bootUpProgress === 0);
      if (isMountedRef.current && !isAnimating && noAnimation) {
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
    dissolveProgress,
    bootUpProgress,
    transitionType,
    useProgrammaticRendering,
  ]);

  // Animation trigger: Wait before starting animation after image change
  useEffect(() => {
    if (!useProgrammaticRendering || !currentPixelData) {
      // Reset state if no pixel data - defer to avoid sync setState
      setTimeout(() => {
        setIsAnimating(false);
        setScanlineProgress(0);
        setDissolveProgress(0);
        setBootUpProgress(0);
        setRandomOrder([]);
      }, 0);
      scanlineStartTimeRef.current = null;
      return;
    }

    // Only animate if we have multiple images
    const hasMultiple = pixelData && pixelData.length > 1;
    if (!hasMultiple || !nextPixelData) {
      // Single image - no animation needed
      setTimeout(() => {
        setIsAnimating(false);
        setScanlineProgress(0);
        setDissolveProgress(0);
        setBootUpProgress(0);
        setRandomOrder([]);
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
      setDissolveProgress(0);
      setBootUpProgress(0);
      setRandomOrder([]);
      scanlineStartTimeRef.current = Date.now();
    }, 3000);

    return () => {
      if (animationStartDelayRef.current) {
        clearTimeout(animationStartDelayRef.current);
        animationStartDelayRef.current = null;
      }
    };
  }, [
    currentImageIndex,
    useProgrammaticRendering,
    currentPixelData,
    nextPixelData,
    isAnimating,
    pixelData,
    transitionType,
  ]);

  // Animation progress loop: Updates progress based on transitionType
  useEffect(() => {
    if (!isAnimating || !scanlineStartTimeRef.current) return;

    const ANIMATION_DURATION = 4000; // 4 seconds for slower, smoother animation

    const animate = () => {
      if (!scanlineStartTimeRef.current || !isMountedRef.current) return;

      const elapsed = Date.now() - scanlineStartTimeRef.current;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      // Update progress based on transition type
      if (transitionType === "scanline") {
        setScanlineProgress(progress);
      } else if (transitionType === "dissolve") {
        setDissolveProgress(progress);
        // Initialize random order for dissolve if not set
        if (progress === 0 && randomOrder.length === 0) {
          const { cols, rows } = getGridDimensions();
          const totalPixels = cols * rows;
          const order = Array.from({ length: totalPixels }, (_, i) => i);
          // Shuffle array
          for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
          }
          setRandomOrder(order);
        }
      } else if (transitionType === "boot-up") {
        setBootUpProgress(progress);
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        if (transitionType === "scanline") {
          setScanlineProgress(1.0);
        } else if (transitionType === "dissolve") {
          setDissolveProgress(1.0);
        } else if (transitionType === "boot-up") {
          setBootUpProgress(1.0);
        }
        setIsAnimating(false);
        scanlineStartTimeRef.current = null;

        // Wait 3 seconds, then move to next image
        setTimeout(() => {
          if (isMountedRef.current) {
            setScanlineProgress(0);
            setDissolveProgress(0);
            setBootUpProgress(0);
            setRandomOrder([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, pixelData?.length, transitionType]);

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

  // Generate scanline order for CRT animation
  const _scanlineOrder = useMemo(() => {
    if (!useProgrammaticRendering) return [];
    return generateScanlineOrder(gridSize, gridSize);
  }, [useProgrammaticRendering, gridSize]);

  // Calculate which pixels should show new image based on transition type and progress
  const scannedPixelIndex = useMemo(() => {
    if (!useProgrammaticRendering || !isAnimating) return -1;
    const totalPixels = gridSize * gridSize;

    if (transitionType === "scanline") {
      return Math.floor(scanlineProgress * totalPixels);
    } else if (transitionType === "dissolve") {
      return Math.floor(dissolveProgress * totalPixels);
    } else if (transitionType === "boot-up") {
      // Boot-up: reveal from top to bottom
      return Math.floor(bootUpProgress * totalPixels);
    }
    return Math.floor(scanlineProgress * totalPixels); // Fallback
  }, [
    useProgrammaticRendering,
    isAnimating,
    scanlineProgress,
    dissolveProgress,
    bootUpProgress,
    gridSize,
    transitionType,
  ]);

  const _getPixelState = useCallback(
    (row: number, col: number) => {
      if (!useProgrammaticRendering || !isAnimating || scannedPixelIndex < 0) return "old";

      const pixelIndex = row * gridSize + col;
      let shouldShowNew = false;

      if (transitionType === "scanline") {
        // Scanline: reveal top to bottom, left to right
        shouldShowNew = pixelIndex < scannedPixelIndex;
      } else if (transitionType === "dissolve") {
        // Dissolve: reveal in random order
        const revealIndex = randomOrder.indexOf(pixelIndex);
        shouldShowNew = revealIndex >= 0 && revealIndex < scannedPixelIndex;
      } else if (transitionType === "boot-up") {
        // Boot-up: reveal from top to bottom (row by row)
        const currentRow = Math.floor(scannedPixelIndex / gridSize);
        shouldShowNew =
          row < currentRow || (row === currentRow && col < scannedPixelIndex % gridSize);
      }

      if (shouldShowNew) {
        return "new"; // Already revealed - show new image
      } else if (
        pixelIndex === scannedPixelIndex ||
        (transitionType === "dissolve" && randomOrder[scannedPixelIndex] === pixelIndex)
      ) {
        return "scanning"; // Currently being revealed - animate
      } else {
        return "old"; // Not yet revealed - show old image
      }
    },
    [
      useProgrammaticRendering,
      isAnimating,
      scannedPixelIndex,
      gridSize,
      transitionType,
      randomOrder,
    ]
  );

  // Render to canvas - responds to scanlineProgress changes
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

    // Render function - called whenever progress changes
    const render = () => {
      if (!ctx || !currentPixelData) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      // Render pixels based on transition type and progress
      let currentColor = "";
      ctx.fillStyle = "";

      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const pixelIndex = row * gridSize + col;
          // Ensure we don't go out of bounds
          if (pixelIndex >= currentPixelData.length) continue;

          // Determine pixel state based on transition type using the helper function
          const pixelState = _getPixelState(row, col);

          // Determine which pixel data to show
          let intensityLevel: number;

          if (pixelState === "new" && nextPixelData && pixelIndex < nextPixelData.length) {
            intensityLevel = nextPixelData[pixelIndex];
          } else if (pixelIndex < currentPixelData.length) {
            intensityLevel = currentPixelData[pixelIndex];
          } else {
            continue; // Skip if out of bounds
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
            const textColor = themeColors.text || "#e8e8e8";
            // Convert color to RGB (handles hex, hsl, rgb formats)
            let r = 232,
              g = 232,
              b = 232; // Default light gray

            if (textColor.startsWith("#")) {
              const cleanHex = textColor.replace("#", "").trim();
              if (cleanHex.length === 6) {
                r = parseInt(cleanHex.substring(0, 2), 16) || 232;
                g = parseInt(cleanHex.substring(2, 4), 16) || 232;
                b = parseInt(cleanHex.substring(4, 6), 16) || 232;
              }
            } else if (textColor.startsWith("hsl")) {
              const match = textColor.match(/hsl\(?\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)?/i);
              if (match) {
                const h = parseInt(match[1], 10) / 360;
                const s = parseInt(match[2], 10) / 100;
                const l = parseInt(match[3], 10) / 100;
                if (!isNaN(h) && !isNaN(s) && !isNaN(l)) {
                  let rgbR, rgbG, rgbB;
                  if (s === 0) {
                    rgbR = rgbG = rgbB = l;
                  } else {
                    const hue2rgb = (p: number, q: number, t: number) => {
                      if (t < 0) t += 1;
                      if (t > 1) t -= 1;
                      if (t < 1 / 6) return p + (q - p) * 6 * t;
                      if (t < 1 / 2) return q;
                      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                      return p;
                    };
                    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                    const p = 2 * l - q;
                    rgbR = hue2rgb(p, q, h + 1 / 3);
                    rgbG = hue2rgb(p, q, h);
                    rgbB = hue2rgb(p, q, h - 1 / 3);
                  }
                  r = Math.round(rgbR * 255);
                  g = Math.round(rgbG * 255);
                  b = Math.round(rgbB * 255);
                }
              }
            } else if (textColor.startsWith("rgb")) {
              const match = textColor.match(/rgba?\(?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
              if (match) {
                r = parseInt(match[1], 10) || 232;
                g = parseInt(match[2], 10) || 232;
                b = parseInt(match[3], 10) || 232;
              }
            }

            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
            ctx.fillRect(col * svgPixelSize, row * svgPixelSize, svgPixelSize, svgPixelSize);
            ctx.fillStyle = currentColor;
          }
        }
      }

      // If animation completed, ensure final frame shows all new pixels
      const isComplete =
        (transitionType === "scanline" && scanlineProgress >= 1) ||
        (transitionType === "dissolve" && dissolveProgress >= 1) ||
        (transitionType === "boot-up" && bootUpProgress >= 1);

      if (isComplete && nextPixelData) {
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        let currentColor = "";
        ctx.fillStyle = "";
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const pixelIndex = row * gridSize + col;
            // Ensure we don't go out of bounds
            if (pixelIndex >= nextPixelData.length) continue;
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

    // Render whenever progress changes
    render();
  }, [
    useProgrammaticRendering,
    currentPixelData,
    nextPixelData,
    scanlineProgress,
    dissolveProgress,
    bootUpProgress,
    transitionType,
    randomOrder,
    themeColors,
    gridSize,
    svgPixelSize,
    canvasSize,
    scannedPixelIndex,
    _getPixelState,
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
              /* Transition removed for performance */
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
