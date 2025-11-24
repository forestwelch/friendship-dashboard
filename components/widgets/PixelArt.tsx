"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";
import { 
  base64ToPixelData, 
  renderPixelDataAsSVG, 
  ThemeColors,
  PIXEL_GRID_SIZE,
  mapIntensityToThemeColor,
  generateScanlineOrder
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
  const [scanlineProgress, setScanlineProgress] = useState(0); // 0 to 1, tracks scanline position
  
  // Use refs to track previous values and prevent loops
  const prevImagesRef = useRef<string[]>([]);
  const isMountedRef = useRef(true);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const slideshowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanlineStartTimeRef = useRef<number | null>(null);
  
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
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
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

    // For programmatic rendering: wait 3 seconds after animation completes, then start next
    // For image-based: wait transitionDelay
    const waitDuration = useProgrammaticRendering ? 3000 : transitionDelay;

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
        setImageLoaded(false); // For image-based rendering
      }
    }, waitDuration);

    return () => {
      if (slideshowTimeoutRef.current) {
        clearTimeout(slideshowTimeoutRef.current);
        slideshowTimeoutRef.current = null;
      }
    };
  }, [currentImageIndex, images.length, pixelData?.length, cols, rows, transitionDelay, imageLoaded, isAnimating, useProgrammaticRendering]);
  
  // CRT Scanline animation for programmatic rendering
  // Only trigger when transitioning to a new image (nextPixelData exists)
  useEffect(() => {
    if (!useProgrammaticRendering || !currentPixelData || !nextPixelData) {
      // No transition needed - reset animation state
      setIsAnimating(false);
      setScanlineProgress(0);
      return;
    }
    
    // Small delay to ensure state is ready, then start scanline animation
    const startDelay = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      setIsAnimating(true);
      setScanlineProgress(0);
      scanlineStartTimeRef.current = Date.now();
      
      const SCANLINE_DURATION = 1000; // Fixed 1 second duration
      
      const animate = () => {
        if (!scanlineStartTimeRef.current || !isMountedRef.current) return;
        
        const elapsed = Date.now() - scanlineStartTimeRef.current;
        const progress = Math.min(elapsed / SCANLINE_DURATION, 1);
        
        setScanlineProgress(progress);
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete - update to new image
          setIsAnimating(false);
          setScanlineProgress(0);
          scanlineStartTimeRef.current = null;
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    }, 50); // Small delay to ensure smooth transition
    
    return () => {
      clearTimeout(startDelay);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      scanlineStartTimeRef.current = null;
    };
  }, [currentImageIndex, useProgrammaticRendering, currentPixelData, nextPixelData]);

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
  
  // Generate scanline order for CRT animation
  const scanlineOrder = useMemo(() => {
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
  
  const getPixelState = useCallback((row: number, col: number) => {
    if (!useProgrammaticRendering || !isAnimating || scannedPixelIndex < 0) return 'old';
    
    // Calculate pixel index in scanline order (row-major: row * width + col)
    const pixelIndex = row * PIXEL_GRID_SIZE + col;
    
    if (pixelIndex < scannedPixelIndex) {
      return 'new'; // Already scanned - show new image
    } else if (pixelIndex === scannedPixelIndex) {
      return 'scanning'; // Currently being scanned - animate
    } else {
      return 'old'; // Not yet scanned - show old image
    }
  }, [useProgrammaticRendering, isAnimating, scannedPixelIndex]);

  // Render programmatic Canvas with CRT scanline animation (much faster than 16K DOM elements)
  if (useProgrammaticRendering && currentPixelData && themeColors) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const svgPixelSize = getSVGPixelSize();
    const gridSize = PIXEL_GRID_SIZE;
    const canvasSize = gridSize * svgPixelSize;
    
    // Render to canvas - optimized with requestAnimationFrame for smooth 60fps updates
    useEffect(() => {
      if (!canvasRef.current || !currentPixelData) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for performance
      if (!ctx) return;
      
      // Use image smoothing for better quality
      ctx.imageSmoothingEnabled = false;
      
      let animationFrameId: number | null = null;
      let lastScannedPixel = -1;
      
      const render = () => {
        if (!ctx || !currentPixelData) return;
        
        // Calculate current scanline position
        const totalPixels = gridSize * gridSize;
        const currentScannedPixel = Math.floor(scanlineProgress * totalPixels);
        
        // Only re-render if scanline has progressed (optimization)
        if (currentScannedPixel === lastScannedPixel && !isAnimating) {
          return;
        }
        
        lastScannedPixel = currentScannedPixel;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        
        // Render pixels based on scanline progress
        // Optimize: batch color changes
        let currentColor = '';
        ctx.fillStyle = '';
        
        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const pixelIndex = row * gridSize + col;
            const pixelState = pixelIndex < currentScannedPixel ? 'new' : 
                              pixelIndex === currentScannedPixel ? 'scanning' : 'old';
            
            // Determine which pixel data to show
            let intensityLevel: number;
            if (pixelState === 'new' && nextPixelData) {
              intensityLevel = nextPixelData[pixelIndex];
            } else {
              intensityLevel = currentPixelData[pixelIndex];
            }
            
            const color = mapIntensityToThemeColor(intensityLevel, themeColors);
            
            // Only update fillStyle if color changed (optimization)
            if (color !== currentColor) {
              ctx.fillStyle = color;
              currentColor = color;
            }
            
            // Draw pixel
            ctx.fillRect(col * svgPixelSize, row * svgPixelSize, svgPixelSize, svgPixelSize);
            
            // Add visual effect for scanning pixels (slight brightness)
            if (pixelState === 'scanning') {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.fillRect(col * svgPixelSize, row * svgPixelSize, svgPixelSize, svgPixelSize);
              ctx.fillStyle = currentColor; // Reset
            }
          }
        }
        
        // Continue animation if scanning
        if (isAnimating && scanlineProgress < 1) {
          animationFrameId = requestAnimationFrame(render);
        }
      };
      
      // Initial render
      render();
      
      // Start animation loop if animating
      if (isAnimating) {
        animationFrameId = requestAnimationFrame(render);
      }
      
      return () => {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }, [currentPixelData, nextPixelData, scanlineProgress, isAnimating, themeColors, gridSize, svgPixelSize, canvasSize]);
    
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
