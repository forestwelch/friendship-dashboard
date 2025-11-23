"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";
import { 
  base64ToPixelData, 
  renderPixelDataAsSVG, 
  ThemeColors,
  PIXEL_GRID_SIZE,
  mapIntensityToThemeColor
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
  transitionDelay = 3000 
}: PixelArtProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Use refs to track previous values and prevent loops
  const prevImagesRef = useRef<string[]>([]);
  const isMountedRef = useRef(true);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const slideshowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Determine rendering mode: programmatic (pixelData) or image-based (backward compatibility)
  const useProgrammaticRendering = pixelData && pixelData.length > 0 && themeColors;
  
  // Use imageUrls if provided, otherwise fall back to single imageUrl (memoized to prevent re-renders)
  const images = useMemo(() => {
    return imageUrls && imageUrls.length > 0 ? imageUrls : (imageUrl ? [imageUrl] : []);
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

  // Reset image index when images array changes (but not on every render)
  useEffect(() => {
    const imagesChanged = JSON.stringify(prevImagesRef.current) !== JSON.stringify(images);
    if (imagesChanged && images.length > 0) {
      setCurrentImageIndex(0);
      setImageLoaded(false);
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
    };
  }, []);

  // Trigger animation when image loads
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    if (imageLoaded && currentImage) {
      setIsAnimating(true);
      // Reset animation after it completes
      const animationDuration = (cols + rows) * 20 + 500;
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setIsAnimating(false);
        }
      }, animationDuration);
    } else if (!currentImage) {
      setIsAnimating(false);
      setImageLoaded(false);
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
      ? (pixelData && pixelData.length > 1)
      : (images.length > 1);
    
    if (!hasMultiple) return;
    if (!imageLoaded && !useProgrammaticRendering) return; // For image-based, wait for load
    if (isAnimating) return; // Don't cycle during animation

    // Calculate animation duration
    const animationDuration = useProgrammaticRendering
      ? (PIXEL_GRID_SIZE * 2) * 5 + 500 // For 128x128 grid
      : (cols + rows) * 20 + 500; // For image-based
    
    const showDuration = Math.max(transitionDelay - animationDuration, 2000); // Minimum 2 seconds

    if (slideshowTimeoutRef.current) clearTimeout(slideshowTimeoutRef.current);
    slideshowTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setCurrentImageIndex((prev) => {
          const maxIndex = useProgrammaticRendering 
            ? (pixelData?.length || 1) - 1
            : images.length - 1;
          const next = (prev + 1) % (maxIndex + 1);
          console.log(`[PixelArt] Cycling to ${useProgrammaticRendering ? 'pixel data' : 'image'} ${next} of ${maxIndex + 1}`);
          return next;
        });
        setIsAnimating(true); // Trigger cascade animation
        setImageLoaded(false); // For image-based rendering
      }
    }, showDuration);

    return () => {
      if (slideshowTimeoutRef.current) {
        clearTimeout(slideshowTimeoutRef.current);
        slideshowTimeoutRef.current = null;
      }
    };
  }, [currentImageIndex, images.length, pixelData?.length, cols, rows, transitionDelay, imageLoaded, isAnimating, useProgrammaticRendering]);
  
  // Trigger cascade animation for programmatic rendering when image changes
  useEffect(() => {
    if (!useProgrammaticRendering || !currentPixelData) return;
    
    setIsAnimating(true);
    const animationDuration = (PIXEL_GRID_SIZE * 2) * 5 + 500;
    
    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    animationTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setIsAnimating(false);
      }
    }, animationDuration);
    
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [currentImageIndex, useProgrammaticRendering, currentPixelData]);

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
    const rootFontSize = typeof window !== "undefined" && typeof document !== "undefined"
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
  
  // Generate cascade animation tiles for programmatic rendering
  const programmaticTiles = useMemo(() => {
    if (!useProgrammaticRendering) return [];
    const tiles = [];
    const gridSize = PIXEL_GRID_SIZE;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const delay = (x + y) * 5; // Faster stagger for 128x128 grid
        tiles.push({ x, y, delay });
      }
    }
    return tiles;
  }, [useProgrammaticRendering]);

  // Render programmatic SVG with cascade animation
  if (useProgrammaticRendering && currentPixelData && themeColors) {
    const svgPixelSize = getSVGPixelSize();
    const gridSize = PIXEL_GRID_SIZE;
    
    // Render base SVG (current image)
    const baseSvg = renderPixelDataAsSVG(currentPixelData, themeColors, gridSize, gridSize, svgPixelSize);
    
    // Render next SVG for cascade animation
    const nextSvg = nextPixelData && isAnimating
      ? renderPixelDataAsSVG(nextPixelData, themeColors, gridSize, gridSize, svgPixelSize)
      : null;
    
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
          {/* Base image (hidden during animation) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: isAnimating ? 0 : 1,
              transition: "opacity 0.3s",
            }}
            dangerouslySetInnerHTML={{ __html: baseSvg }}
          />
          
          {/* Cascade animation tiles */}
          {isAnimating && nextSvg && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "grid",
                gridTemplateColumns: `repeat(${gridSize}, ${svgPixelSize}px)`,
                gridTemplateRows: `repeat(${gridSize}, ${svgPixelSize}px)`,
              }}
            >
              {programmaticTiles.map((tile) => {
                const index = tile.y * gridSize + tile.x;
                const intensityLevel = nextPixelData![index];
                const color = mapIntensityToThemeColor(intensityLevel, themeColors);
                
                return (
                  <div
                    key={`${tile.x}-${tile.y}`}
                    className="pixel-tile"
                    style={{
                      width: `${svgPixelSize}px`,
                      height: `${svgPixelSize}px`,
                      backgroundColor: color,
                      animationDelay: `${tile.delay}ms`,
                    }}
                  />
                );
              })}
            </div>
          )}
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

