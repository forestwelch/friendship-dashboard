"use client";

import React, { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import Link from "next/link";
import { base64ToPixelData, ThemeColors, PIXEL_GRID_SIZE } from "@/lib/pixel-data-processing";
import { DEFAULT_THEME_COLORS } from "@/lib/theme-defaults";

interface ImageItem {
  id: string;
  pixel_data?: string | null;
  preview?: string | null;
  width?: number;
  height?: number;
  created_at: string;
}

interface TuningParams {
  quantizationLevels: number;
  colorStop1: number;
  colorStop2: number;
  colorStop3: number;
  colorStop4: number;
  contrastGamma: number;
}

// Helper function to convert hex to RGB (handles hex, hsl, rgb formats)
function hexToRgb(color: string): [number, number, number] {
  if (color.startsWith("#")) {
    const cleanHex = color.replace("#", "").trim();
    if (cleanHex.length === 3) {
      const r = parseInt(cleanHex[0] + cleanHex[0], 16);
      const g = parseInt(cleanHex[1] + cleanHex[1], 16);
      const b = parseInt(cleanHex[2] + cleanHex[2], 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        return [r, g, b];
      }
    }
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        return [r, g, b];
      }
    }
  }

  if (color.startsWith("hsl")) {
    const match = color.match(/hsl\(?\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)?/i);
    if (match) {
      const h = parseInt(match[1], 10) / 360;
      const s = parseInt(match[2], 10) / 100;
      const l = parseInt(match[3], 10) / 100;
      if (!isNaN(h) && !isNaN(s) && !isNaN(l)) {
        let r, g, b;
        if (s === 0) {
          r = g = b = l;
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
          r = hue2rgb(p, q, h + 1 / 3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1 / 3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
      }
    }
  }

  if (color.startsWith("rgb")) {
    const match = color.match(/rgba?\(?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        return [r, g, b];
      }
    }
  }

  console.warn("Invalid color format in hexToRgb:", color);
  return [0, 0, 0];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function getLuminance(color: string): number {
  const [r, g, b] = hexToRgb(color);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Default parameters
const DEFAULT_PARAMS: TuningParams = {
  quantizationLevels: 64,
  colorStop1: 0.0,
  colorStop2: 0.5,
  colorStop3: 0.8,
  colorStop4: 1.0,
  contrastGamma: 0.9,
};

function mapIntensityToThemeColorTunable(
  intensityLevel: number,
  themeColors: ThemeColors,
  params: TuningParams
): string {
  const normalized = Math.max(0, Math.min(1, intensityLevel / (params.quantizationLevels - 1)));
  const contrastAdjusted = Math.pow(normalized, params.contrastGamma);

  const availableColors = [
    themeColors.primary,
    themeColors.secondary,
    themeColors.accent,
    themeColors.text || themeColors.secondary,
    themeColors.bg || themeColors.accent,
  ];

  const sortedColors = [...availableColors].sort((a, b) => getLuminance(a) - getLuminance(b));
  const darkest = sortedColors[0];
  const lightest = sortedColors[sortedColors.length - 1];
  const uniqueColors = Array.from(new Set(sortedColors));
  const midDark =
    uniqueColors.length > 2
      ? uniqueColors[Math.floor(uniqueColors.length / 3)]
      : uniqueColors[1] || darkest;
  const midLight =
    uniqueColors.length > 3
      ? uniqueColors[Math.floor((uniqueColors.length * 2) / 3)]
      : uniqueColors[uniqueColors.length - 2] || lightest;

  const colorStops = [
    { pos: params.colorStop1, color: darkest },
    { pos: params.colorStop2, color: midDark },
    { pos: params.colorStop3, color: midLight },
    { pos: params.colorStop4, color: lightest },
  ].sort((a, b) => a.pos - b.pos);

  const lastStop = colorStops[colorStops.length - 1];
  const firstStop = colorStops[0];

  if (contrastAdjusted >= lastStop.pos) {
    return lastStop.color;
  }
  if (contrastAdjusted <= firstStop.pos) {
    return firstStop.color;
  }

  let stopIndex = 0;
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (contrastAdjusted >= colorStops[i].pos && contrastAdjusted <= colorStops[i + 1].pos) {
      stopIndex = i;
      break;
    }
  }

  const segmentStart = colorStops[stopIndex].pos;
  const segmentEnd = colorStops[stopIndex + 1].pos;
  const segmentRange = segmentEnd - segmentStart;
  const segmentProgress = segmentRange > 0 ? (contrastAdjusted - segmentStart) / segmentRange : 0;

  const [r1, g1, b1] = hexToRgb(colorStops[stopIndex].color);
  const [r2, g2, b2] = hexToRgb(colorStops[stopIndex + 1].color);
  const r = Math.round(r1 + (r2 - r1) * segmentProgress);
  const g = Math.round(g1 + (g2 - g1) * segmentProgress);
  const b = Math.round(b1 + (b2 - b1) * segmentProgress);

  return rgbToHex(r, g, b);
}

function requantizePixelData(
  pixelData: Uint8Array,
  params: TuningParams,
  width: number,
  height: number
): Uint8Array {
  const requantized = new Uint8Array(width * height);
  const maxOldValue = 127;

  for (let i = 0; i < pixelData.length; i++) {
    const normalizedIntensity = pixelData[i] / maxOldValue;
    const quantized = Math.round(normalizedIntensity * (params.quantizationLevels - 1));
    requantized[i] = Math.min(quantized, params.quantizationLevels - 1);
  }

  return requantized;
}

function resizePixelData(
  pixelData: Uint8Array,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): Uint8Array {
  const resized = new Uint8Array(targetWidth * targetHeight);
  const xRatio = sourceWidth / targetWidth;
  const yRatio = sourceHeight / targetHeight;

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const srcX = Math.floor(x * xRatio);
      const srcY = Math.floor(y * yRatio);
      const srcIndex = srcY * sourceWidth + srcX;
      const dstIndex = y * targetWidth + x;
      resized[dstIndex] = pixelData[srcIndex];
    }
  }

  return resized;
}

function renderImageToCanvas(
  canvas: HTMLCanvasElement,
  pixelData: Uint8Array,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  themeColors: ThemeColors,
  params: TuningParams | Partial<TuningParams>,
  customMapFunction?: (
    intensityLevel: number,
    themeColors: ThemeColors,
    params: Partial<TuningParams>,
    quantizationLevels: number
  ) => string
): void {
  let processedData = pixelData;
  if (sourceWidth !== targetWidth || sourceHeight !== targetHeight) {
    processedData = resizePixelData(
      pixelData,
      sourceWidth,
      sourceHeight,
      targetWidth,
      targetHeight
    );
  }

  const fullParams: TuningParams = {
    quantizationLevels: params.quantizationLevels ?? DEFAULT_PARAMS.quantizationLevels,
    colorStop1: params.colorStop1 ?? DEFAULT_PARAMS.colorStop1,
    colorStop2: params.colorStop2 ?? DEFAULT_PARAMS.colorStop2,
    colorStop3: params.colorStop3 ?? DEFAULT_PARAMS.colorStop3,
    colorStop4: params.colorStop4 ?? DEFAULT_PARAMS.colorStop4,
    contrastGamma: params.contrastGamma ?? DEFAULT_PARAMS.contrastGamma,
  };

  const requantizedData = requantizePixelData(processedData, fullParams, targetWidth, targetHeight);

  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;
  const imageData = ctx.createImageData(targetWidth, targetHeight);
  const data = imageData.data;

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const index = y * targetWidth + x;
      const intensityLevel = requantizedData[index];

      const color = customMapFunction
        ? customMapFunction(intensityLevel, themeColors, params, fullParams.quantizationLevels)
        : mapIntensityToThemeColorTunable(intensityLevel, themeColors, fullParams);

      const [r, g, b] = hexToRgb(color);

      const pixelIndex = (y * targetWidth + x) * 4;
      data[pixelIndex] = r;
      data[pixelIndex + 1] = g;
      data[pixelIndex + 2] = b;
      data[pixelIndex + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// Define processing variations (moved outside component to avoid dependency issues)
const processingVariations: Array<{
  id: string;
  label: string;
  description: string;
  params: Partial<TuningParams>;
  mapFunction?: (
    intensityLevel: number,
    themeColors: ThemeColors,
    params: Partial<TuningParams>,
    quantizationLevels: number
  ) => string;
}> = [
  {
    id: "current",
    label: "A: Current (2-tone, gamma 1.2)",
    description: "Current method with 2-tone gradient, gamma 1.2",
    params: {
      quantizationLevels: 64,
      colorStop1: 0,
      colorStop2: 0.5,
      colorStop3: 0.8,
      colorStop4: 1.0,
      contrastGamma: 1.2,
    },
  },
  {
    id: "low-gamma",
    label: "B: Low Gamma (0.7)",
    description: "Softer, lighter with gamma 0.7",
    params: {
      quantizationLevels: 64,
      colorStop1: 0,
      colorStop2: 0.5,
      colorStop3: 0.8,
      colorStop4: 1.0,
      contrastGamma: 0.7,
    },
  },
  {
    id: "high-gamma",
    label: "C: High Gamma (1.5)",
    description: "Darker, more contrast with gamma 1.5",
    params: {
      quantizationLevels: 64,
      colorStop1: 0,
      colorStop2: 0.5,
      colorStop3: 0.8,
      colorStop4: 1.0,
      contrastGamma: 1.5,
    },
  },
  {
    id: "more-quant",
    label: "D: More Quantization (128)",
    description: "More detail with 128 levels",
    params: {
      quantizationLevels: 128,
      colorStop1: 0,
      colorStop2: 0.5,
      colorStop3: 0.8,
      colorStop4: 1.0,
      contrastGamma: 1.2,
    },
  },
  {
    id: "less-quant",
    label: "E: Less Quantization (32)",
    description: "Less detail, more posterized with 32 levels",
    params: {
      quantizationLevels: 32,
      colorStop1: 0,
      colorStop2: 0.5,
      colorStop3: 0.8,
      colorStop4: 1.0,
      contrastGamma: 1.2,
    },
  },
  {
    id: "wide-stops",
    label: "F: Wide Color Stops",
    description: "Colors spread wider (0, 0.3, 0.7, 1.0)",
    params: {
      quantizationLevels: 64,
      colorStop1: 0,
      colorStop2: 0.3,
      colorStop3: 0.7,
      colorStop4: 1.0,
      contrastGamma: 1.2,
    },
  },
  {
    id: "tight-stops",
    label: "G: Tight Color Stops",
    description: "Colors clustered (0, 0.6, 0.8, 1.0)",
    params: {
      quantizationLevels: 64,
      colorStop1: 0,
      colorStop2: 0.6,
      colorStop3: 0.8,
      colorStop4: 1.0,
      contrastGamma: 1.2,
    },
  },
];

export default function ImageTuningPage() {
  const live128Ref = useRef<HTMLCanvasElement>(null);
  const live256Ref = useRef<HTMLCanvasElement>(null);
  const reference128Ref = useRef<HTMLCanvasElement>(null);
  const reference256Ref = useRef<HTMLCanvasElement>(null);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [recentImages, setRecentImages] = useState<ImageItem[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [variationCanvases, setVariationCanvases] = useState<Map<string, HTMLCanvasElement>>(
    new Map()
  );
  const [friends, setFriends] = useState<
    Array<{
      id: string;
      slug: string;
      display_name: string;
      color_primary: string;
      color_secondary: string;
      color_accent: string;
      color_bg: string;
      color_text: string;
    }>
  >([]);
  const [selectedFriendSlug, setSelectedFriendSlug] = useState<string | null>(null);
  const [themeColors, setThemeColors] = useState<ThemeColors>(DEFAULT_THEME_COLORS);
  const [tuningParams, setTuningParams] = useState<TuningParams>(DEFAULT_PARAMS);
  const [editingParam, setEditingParam] = useState<keyof TuningParams | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch images and friends in parallel
        const [imagesResponse, friendsResponse] = await Promise.all([
          fetch("/api/images"),
          fetch("/api/friends"),
        ]);

        const imagesData = await imagesResponse.json();
        const friendsData = await friendsResponse.json();

        const fetchedImages = imagesData.images || [];
        setImages(fetchedImages);
        // Get 10 most recent images for variations
        setRecentImages(fetchedImages.slice(0, 10));

        const fetchedFriends = friendsData.friends || [];
        setFriends(fetchedFriends);

        if (fetchedImages.length > 0) {
          setSelectedImageId(fetchedImages[0].id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update theme colors when friend is selected
  useEffect(() => {
    if (selectedFriendSlug) {
      const friend = friends.find((f) => f.slug === selectedFriendSlug);
      if (friend) {
        setThemeColors({
          primary: friend.color_primary,
          secondary: friend.color_secondary,
          accent: friend.color_accent,
          bg: friend.color_bg,
          text: friend.color_text,
        });
      }
    } else {
      setThemeColors(DEFAULT_THEME_COLORS);
    }
  }, [selectedFriendSlug, friends]);

  // Render reference previews with default parameters
  useEffect(() => {
    if (!selectedImageId) return;

    const selectedImage = images.find((img) => img.id === selectedImageId);
    if (!selectedImage || !selectedImage.pixel_data) return;

    try {
      const pixelData = base64ToPixelData(selectedImage.pixel_data);
      const sourceWidth = selectedImage.width || PIXEL_GRID_SIZE;
      const sourceHeight = selectedImage.height || PIXEL_GRID_SIZE;

      if (reference128Ref.current) {
        renderImageToCanvas(
          reference128Ref.current,
          pixelData,
          sourceWidth,
          sourceHeight,
          128,
          128,
          themeColors,
          DEFAULT_PARAMS
        );
      }

      if (reference256Ref.current) {
        renderImageToCanvas(
          reference256Ref.current,
          pixelData,
          sourceWidth,
          sourceHeight,
          256,
          256,
          themeColors,
          DEFAULT_PARAMS
        );
      }
    } catch (error) {
      console.error("Error rendering reference previews:", error);
    }
  }, [selectedImageId, themeColors, images]);

  // Render live previews when params or selected image changes
  useEffect(() => {
    if (!selectedImageId) return;

    const selectedImage = images.find((img) => img.id === selectedImageId);
    if (!selectedImage || !selectedImage.pixel_data) return;

    try {
      const pixelData = base64ToPixelData(selectedImage.pixel_data);
      const sourceWidth = selectedImage.width || PIXEL_GRID_SIZE;
      const sourceHeight = selectedImage.height || PIXEL_GRID_SIZE;

      if (live128Ref.current) {
        renderImageToCanvas(
          live128Ref.current,
          pixelData,
          sourceWidth,
          sourceHeight,
          128,
          128,
          themeColors,
          tuningParams
        );
      }

      if (live256Ref.current) {
        renderImageToCanvas(
          live256Ref.current,
          pixelData,
          sourceWidth,
          sourceHeight,
          256,
          256,
          themeColors,
          tuningParams
        );
      }
    } catch (error) {
      console.error("Error rendering live previews:", error);
    }
  }, [selectedImageId, tuningParams, images, themeColors]);

  const updateParam = (key: keyof TuningParams, value: number) => {
    setTuningParams((prev) => ({ ...prev, [key]: value }));
  };

  const startEditing = (key: keyof TuningParams) => {
    setEditingParam(key);
    setEditValue(tuningParams[key].toString());
  };

  const finishEditing = (key: keyof TuningParams, submit: boolean = true) => {
    if (submit && editingParam === key) {
      const numValue = parseFloat(editValue);
      if (!isNaN(numValue)) {
        // Clamp values based on parameter type
        let clampedValue = numValue;
        if (key === "quantizationLevels") {
          clampedValue = Math.max(8, Math.min(256, Math.round(numValue)));
        } else if (key === "contrastGamma") {
          clampedValue = Math.max(0.1, Math.min(3.0, numValue));
        } else {
          // colorStops can be 0-2.0
          clampedValue = Math.max(0, Math.min(2.0, numValue));
        }
        updateParam(key, clampedValue);
      }
    }
    setEditingParam(null);
    setEditValue("");
  };

  const randomizeParams = () => {
    setTuningParams({
      quantizationLevels: Math.floor(Math.random() * (256 - 8 + 1)) + 8,
      colorStop1: 0,
      colorStop2: Math.random() * 2,
      colorStop3: Math.random() * 2,
      colorStop4: Math.random() * 1.5 + 0.5,
      contrastGamma: Math.random() * 2.9 + 0.1,
    });
  };

  const randomizeThemeColors = () => {
    const randomColor = () => {
      return `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`;
    };
    setThemeColors({
      primary: randomColor(),
      secondary: randomColor(),
      accent: randomColor(),
      bg: randomColor(),
      text: randomColor(),
    });
  };

  const resetToDefaults = () => {
    setTuningParams(DEFAULT_PARAMS);
    setThemeColors(DEFAULT_THEME_COLORS);
    setSelectedFriendSlug(null);
  };

  // Render all variations when images or theme colors change
  useEffect(() => {
    if (recentImages.length === 0) return;

    const canvasMap = new Map<string, HTMLCanvasElement>();

    recentImages.forEach((image) => {
      if (!image.pixel_data) return;

      try {
        const pixelData = base64ToPixelData(image.pixel_data);
        const sourceWidth = image.width || PIXEL_GRID_SIZE;
        const sourceHeight = image.height || PIXEL_GRID_SIZE;

        processingVariations.forEach((variation) => {
          const canvas = document.createElement("canvas");
          const key = `${image.id}-${variation.id}`;

          renderImageToCanvas(
            canvas,
            pixelData,
            sourceWidth,
            sourceHeight,
            128,
            128,
            themeColors,
            variation.params,
            variation.mapFunction
          );

          canvasMap.set(key, canvas);
        });
      } catch (error) {
        console.error(`Error rendering variation for image ${image.id}:`, error);
      }
    });

    setVariationCanvases(canvasMap);
  }, [recentImages, themeColors]);

  // Get colors actually being used
  const getUsedColors = (
    themeColors: ThemeColors
  ): Array<{ name: string; color: string; luminance: number }> => {
    const availableColors = [
      { name: "primary", color: themeColors.primary },
      { name: "secondary", color: themeColors.secondary },
      { name: "accent", color: themeColors.accent },
      { name: "text", color: themeColors.text || themeColors.secondary },
      { name: "bg", color: themeColors.bg || themeColors.accent },
    ];

    return availableColors
      .map((c) => ({
        ...c,
        luminance: getLuminance(c.color),
      }))
      .sort((a, b) => a.luminance - b.luminance);
  };

  return (
    <>
      <Navigation />
      <div
        className="admin-page"
        style={{
          paddingTop: `calc(var(--height-button) + var(--space-md))`,
          width: "100%",
          maxWidth: "100%",
          background: "var(--admin-bg)",
          color: "var(--admin-text)",
          overflowX: "hidden",
          overflowY: "scroll",
          height: "100vh",
        }}
      >
        <div
          className="game-container"
          style={{ paddingTop: "var(--space-2xl)", paddingBottom: "var(--space-2xl)" }}
        >
          <div className="game-breadcrumb" style={{ marginBottom: "var(--space-xl)" }}>
            <Link href="/" className="game-link">
              Home
            </Link>
            <span className="game-breadcrumb-separator">/</span>
            <Link href="/admin" className="game-link">
              Admin
            </Link>
            <span className="game-breadcrumb-separator">/</span>
            <span className="game-breadcrumb-current">Image Tuning</span>
          </div>

          <h1 className="game-heading-1" style={{ marginBottom: "var(--space-xl)" }}>
            Image Conversion Tuning
          </h1>

          <div
            className="game-card"
            style={{ marginBottom: "var(--space-lg)", padding: "var(--space-md)" }}
          >
            <p className="game-text-muted" style={{ margin: 0 }}>
              Adjust parameters to control how uploaded images are converted and displayed with
              theme colors. Changes affect how stored intensity values map to colors on the profile.
            </p>
            <div
              style={{
                marginTop: "var(--space-md)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-md)",
              }}
            >
              {/* Friend Selector */}
              <div>
                <label
                  className="game-heading-3"
                  style={{ marginBottom: "var(--space-sm)", display: "block" }}
                >
                  Theme Colors
                </label>
                <select
                  value={selectedFriendSlug || ""}
                  onChange={(e) => setSelectedFriendSlug(e.target.value || null)}
                  style={{
                    width: "100%",
                    padding: "var(--space-sm)",
                    fontSize: "var(--font-size-sm)",
                    border: "var(--border-width-md) solid var(--game-border)",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--game-surface)",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Default (Grayscale)</option>
                  {friends.map((friend) => (
                    <option key={friend.id} value={friend.slug}>
                      {friend.display_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Swatches */}
              <div
                style={{
                  display: "flex",
                  gap: "var(--space-sm)",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span className="game-text-muted" style={{ fontSize: "var(--font-size-sm)" }}>
                  Current colors:
                </span>
                <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                  {Object.entries(themeColors).map(([name, color]) => (
                    <div
                      key={name}
                      title={`${name}: ${color}`}
                      style={{
                        width: "1.5rem",
                        height: "1.5rem",
                        backgroundColor: color,
                        border: "var(--border-width-md) solid var(--game-border)",
                        borderRadius: "var(--radius-sm)",
                        boxShadow: "var(--game-shadow-sm)",
                      }}
                    />
                  ))}
                </div>
                <button
                  className="game-button"
                  onClick={randomizeThemeColors}
                  style={{ marginLeft: "auto", fontSize: "var(--font-size-xs)" }}
                >
                  Randomize Colors
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="game-text-muted">Loading...</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(300px, 1fr) 2fr",
                gap: "var(--space-xl)",
                alignItems: "start",
              }}
            >
              {/* Controls */}
              <div
                className="game-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-lg)",
                  position: "sticky",
                  top: "var(--space-md)",
                  maxHeight: "calc(100vh - var(--space-xl))",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <h2 className="game-heading-2" style={{ margin: 0 }}>
                    Parameters
                  </h2>
                  <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                    <button
                      className="game-button"
                      onClick={randomizeParams}
                      style={{
                        fontSize: "var(--font-size-xs)",
                        padding: "var(--space-xs) var(--space-sm)",
                      }}
                    >
                      Random
                    </button>
                    <button
                      className="game-button"
                      onClick={resetToDefaults}
                      style={{
                        fontSize: "var(--font-size-xs)",
                        padding: "var(--space-xs) var(--space-sm)",
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Image Selector */}
                <div>
                  <label
                    className="game-heading-3"
                    style={{ marginBottom: "var(--space-sm)", display: "block" }}
                  >
                    Select Image
                  </label>
                  <select
                    value={selectedImageId || ""}
                    onChange={(e) => setSelectedImageId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "var(--space-sm)",
                      fontSize: "var(--font-size-sm)",
                      border: "var(--border-width-md) solid var(--game-border)",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--game-surface)",
                      color: "var(--text)",
                      cursor: "pointer",
                    }}
                  >
                    {images.map((img) => (
                      <option key={img.id} value={img.id}>
                        Image {img.id.substring(0, 8)} ({img.width}x{img.height})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantization Levels */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--space-xs)",
                      fontSize: "var(--font-size-sm)",
                      fontWeight: "bold",
                    }}
                  >
                    Quantization Levels:{" "}
                    {editingParam === "quantizationLevels" ? (
                      <input
                        type="number"
                        min="8"
                        max="256"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => finishEditing("quantizationLevels")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            finishEditing("quantizationLevels");
                          } else if (e.key === "Escape") {
                            finishEditing("quantizationLevels", false);
                          }
                        }}
                        autoFocus
                        style={{
                          width: "4rem",
                          padding: "2px 4px",
                          fontSize: "var(--font-size-sm)",
                          border: "var(--border-width-md) solid var(--admin-accent)",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--game-surface)",
                          color: "var(--text)",
                        }}
                      />
                    ) : (
                      <span
                        onClick={() => startEditing("quantizationLevels")}
                        style={{
                          cursor: "pointer",
                          textDecoration: "underline",
                          textDecorationStyle: "dotted",
                        }}
                      >
                        {tuningParams.quantizationLevels}
                      </span>
                    )}
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="256"
                    step="1"
                    value={tuningParams.quantizationLevels}
                    onChange={(e) => updateParam("quantizationLevels", parseInt(e.target.value))}
                    style={{ width: "100%", cursor: "pointer" }}
                  />
                  <div
                    className="game-text-muted"
                    style={{ fontSize: "var(--font-size-xs)", marginTop: "var(--space-xs)" }}
                  >
                    Number of distinct intensity levels. Higher = more detail, less washed-out.
                    Current default: 64
                  </div>
                </div>

                {/* Color Stop 1 */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--space-xs)",
                      fontSize: "var(--font-size-sm)",
                      fontWeight: "bold",
                    }}
                  >
                    Darkest Stop:{" "}
                    {editingParam === "colorStop1" ? (
                      <input
                        type="number"
                        min="0"
                        max="2.0"
                        step="0.01"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => finishEditing("colorStop1")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            finishEditing("colorStop1");
                          } else if (e.key === "Escape") {
                            finishEditing("colorStop1", false);
                          }
                        }}
                        autoFocus
                        style={{
                          width: "4rem",
                          padding: "2px 4px",
                          fontSize: "var(--font-size-sm)",
                          border: "var(--border-width-md) solid var(--admin-accent)",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--game-surface)",
                          color: "var(--text)",
                        }}
                      />
                    ) : (
                      <span
                        onClick={() => startEditing("colorStop1")}
                        style={{
                          cursor: "pointer",
                          textDecoration: "underline",
                          textDecorationStyle: "dotted",
                        }}
                      >
                        {tuningParams.colorStop1.toFixed(2)}
                      </span>
                    )}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2.0"
                    step="0.01"
                    value={tuningParams.colorStop1}
                    onChange={(e) => updateParam("colorStop1", parseFloat(e.target.value))}
                    style={{ width: "100%", cursor: "pointer" }}
                  />
                </div>

                {/* Color Stop 2 */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--space-xs)",
                      fontSize: "var(--font-size-sm)",
                      fontWeight: "bold",
                    }}
                  >
                    Mid-Dark Stop:{" "}
                    {editingParam === "colorStop2" ? (
                      <input
                        type="number"
                        min="0"
                        max="2.0"
                        step="0.01"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => finishEditing("colorStop2")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            finishEditing("colorStop2");
                          } else if (e.key === "Escape") {
                            finishEditing("colorStop2", false);
                          }
                        }}
                        autoFocus
                        style={{
                          width: "4rem",
                          padding: "2px 4px",
                          fontSize: "var(--font-size-sm)",
                          border: "var(--border-width-md) solid var(--admin-accent)",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--game-surface)",
                          color: "var(--text)",
                        }}
                      />
                    ) : (
                      <span
                        onClick={() => startEditing("colorStop2")}
                        style={{
                          cursor: "pointer",
                          textDecoration: "underline",
                          textDecorationStyle: "dotted",
                        }}
                      >
                        {tuningParams.colorStop2.toFixed(2)}
                      </span>
                    )}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2.0"
                    step="0.01"
                    value={tuningParams.colorStop2}
                    onChange={(e) => updateParam("colorStop2", parseFloat(e.target.value))}
                    style={{ width: "100%", cursor: "pointer" }}
                  />
                </div>

                {/* Color Stop 3 */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--space-xs)",
                      fontSize: "var(--font-size-sm)",
                      fontWeight: "bold",
                    }}
                  >
                    Mid-Light Stop:{" "}
                    {editingParam === "colorStop3" ? (
                      <input
                        type="number"
                        min="0"
                        max="2.0"
                        step="0.01"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => finishEditing("colorStop3")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            finishEditing("colorStop3");
                          } else if (e.key === "Escape") {
                            finishEditing("colorStop3", false);
                          }
                        }}
                        autoFocus
                        style={{
                          width: "4rem",
                          padding: "2px 4px",
                          fontSize: "var(--font-size-sm)",
                          border: "var(--border-width-md) solid var(--admin-accent)",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--game-surface)",
                          color: "var(--text)",
                        }}
                      />
                    ) : (
                      <span
                        onClick={() => startEditing("colorStop3")}
                        style={{
                          cursor: "pointer",
                          textDecoration: "underline",
                          textDecorationStyle: "dotted",
                        }}
                      >
                        {tuningParams.colorStop3.toFixed(2)}
                      </span>
                    )}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2.0"
                    step="0.01"
                    value={tuningParams.colorStop3}
                    onChange={(e) => updateParam("colorStop3", parseFloat(e.target.value))}
                    style={{ width: "100%", cursor: "pointer" }}
                  />
                </div>

                {/* Color Stop 4 */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--space-xs)",
                      fontSize: "var(--font-size-sm)",
                      fontWeight: "bold",
                    }}
                  >
                    Lightest Stop:{" "}
                    {editingParam === "colorStop4" ? (
                      <input
                        type="number"
                        min="0"
                        max="2.0"
                        step="0.01"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => finishEditing("colorStop4")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            finishEditing("colorStop4");
                          } else if (e.key === "Escape") {
                            finishEditing("colorStop4", false);
                          }
                        }}
                        autoFocus
                        style={{
                          width: "4rem",
                          padding: "2px 4px",
                          fontSize: "var(--font-size-sm)",
                          border: "var(--border-width-md) solid var(--admin-accent)",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--game-surface)",
                          color: "var(--text)",
                        }}
                      />
                    ) : (
                      <span
                        onClick={() => startEditing("colorStop4")}
                        style={{
                          cursor: "pointer",
                          textDecoration: "underline",
                          textDecorationStyle: "dotted",
                        }}
                      >
                        {tuningParams.colorStop4.toFixed(2)}
                      </span>
                    )}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2.0"
                    step="0.01"
                    value={tuningParams.colorStop4}
                    onChange={(e) => updateParam("colorStop4", parseFloat(e.target.value))}
                    style={{ width: "100%", cursor: "pointer" }}
                  />
                </div>

                {/* Contrast Gamma */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "var(--space-xs)",
                      fontSize: "var(--font-size-sm)",
                      fontWeight: "bold",
                    }}
                  >
                    Contrast (Gamma):{" "}
                    {editingParam === "contrastGamma" ? (
                      <input
                        type="number"
                        min="0.1"
                        max="3.0"
                        step="0.1"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => finishEditing("contrastGamma")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            finishEditing("contrastGamma");
                          } else if (e.key === "Escape") {
                            finishEditing("contrastGamma", false);
                          }
                        }}
                        autoFocus
                        style={{
                          width: "4rem",
                          padding: "2px 4px",
                          fontSize: "var(--font-size-sm)",
                          border: "var(--border-width-md) solid var(--admin-accent)",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--game-surface)",
                          color: "var(--text)",
                        }}
                      />
                    ) : (
                      <span
                        onClick={() => startEditing("contrastGamma")}
                        style={{
                          cursor: "pointer",
                          textDecoration: "underline",
                          textDecorationStyle: "dotted",
                        }}
                      >
                        {tuningParams.contrastGamma.toFixed(2)}
                      </span>
                    )}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={tuningParams.contrastGamma}
                    onChange={(e) => updateParam("contrastGamma", parseFloat(e.target.value))}
                    style={{ width: "100%", cursor: "pointer" }}
                  />
                </div>

                {/* Current Values Display */}
                <div
                  className="game-card"
                  style={{
                    marginTop: "var(--space-md)",
                    padding: "var(--space-md)",
                    background: "var(--game-surface)",
                  }}
                >
                  <h3 className="game-heading-3" style={{ marginBottom: "var(--space-sm)" }}>
                    Current Values (JSON)
                  </h3>
                  <pre
                    style={{
                      fontSize: "var(--font-size-xs)",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      margin: 0,
                      padding: "var(--space-sm)",
                      background: "var(--bg)",
                      borderRadius: "var(--radius-sm)",
                      overflow: "auto",
                      maxHeight: "200px",
                    }}
                  >
                    {JSON.stringify({ ...tuningParams, themeColors }, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Preview Section - same layout as before */}
              <div
                className="game-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-lg)",
                }}
              >
                <h2 className="game-heading-2">Previews</h2>

                {/* Reference Previews */}
                <div>
                  <h3
                    className="game-heading-3"
                    style={{ marginBottom: "var(--space-md)", textAlign: "center" }}
                  >
                    Reference (Default Settings)
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "var(--space-lg)",
                      marginBottom: "var(--space-xl)",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div
                        className="game-text-muted"
                        style={{ marginBottom: "var(--space-xs)", fontSize: "var(--font-size-sm)" }}
                      >
                        128×128 (Default)
                      </div>
                      {selectedImageId ? (
                        <canvas
                          ref={reference128Ref}
                          style={{
                            maxWidth: "100%",
                            width: "auto",
                            height: "auto",
                            imageRendering: "pixelated",
                            border: "var(--border-width-lg) solid var(--game-border)",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--game-surface)",
                          }}
                        />
                      ) : (
                        <div className="game-text-muted">Select an image</div>
                      )}
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <div
                        className="game-text-muted"
                        style={{ marginBottom: "var(--space-xs)", fontSize: "var(--font-size-sm)" }}
                      >
                        256×256 (Default)
                      </div>
                      {selectedImageId ? (
                        <canvas
                          ref={reference256Ref}
                          style={{
                            maxWidth: "100%",
                            width: "auto",
                            height: "auto",
                            imageRendering: "pixelated",
                            border: "var(--border-width-lg) solid var(--game-border)",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--game-surface)",
                          }}
                        />
                      ) : (
                        <div className="game-text-muted">Select an image</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Live Previews */}
                <div>
                  <h3
                    className="game-heading-3"
                    style={{ marginBottom: "var(--space-md)", textAlign: "center" }}
                  >
                    Live Preview (Updates with Changes)
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "var(--space-lg)",
                      marginBottom: "var(--space-xl)",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div
                        className="game-text-muted"
                        style={{ marginBottom: "var(--space-xs)", fontSize: "var(--font-size-sm)" }}
                      >
                        128×128
                      </div>
                      {selectedImageId ? (
                        <canvas
                          ref={live128Ref}
                          style={{
                            maxWidth: "100%",
                            width: "auto",
                            height: "auto",
                            imageRendering: "pixelated",
                            border: "var(--border-width-lg) solid var(--admin-accent)",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--game-surface)",
                          }}
                        />
                      ) : (
                        <div className="game-text-muted">Select an image to preview</div>
                      )}
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <div
                        className="game-text-muted"
                        style={{ marginBottom: "var(--space-xs)", fontSize: "var(--font-size-sm)" }}
                      >
                        256×256
                      </div>
                      {selectedImageId ? (
                        <canvas
                          ref={live256Ref}
                          style={{
                            maxWidth: "100%",
                            width: "auto",
                            height: "auto",
                            imageRendering: "pixelated",
                            border: "var(--border-width-lg) solid var(--admin-accent)",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--game-surface)",
                          }}
                        />
                      ) : (
                        <div className="game-text-muted">Select an image to preview</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Original Grayscale Preview */}
                {selectedImageId && images.find((img) => img.id === selectedImageId)?.preview && (
                  <div style={{ marginTop: "var(--space-lg)", textAlign: "center", width: "100%" }}>
                    <h3 className="game-heading-3" style={{ marginBottom: "var(--space-md)" }}>
                      Original Grayscale Preview
                    </h3>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={images.find((img) => img.id === selectedImageId)?.preview || ""}
                      alt="Original"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "50vh",
                        width: "auto",
                        height: "auto",
                        imageRendering: "pixelated",
                        border: "var(--border-width-md) solid var(--game-border)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Processing Variations Section */}
          {recentImages.length > 0 && (
            <div
              className="game-card"
              style={{
                marginTop: "var(--space-2xl)",
                padding: "var(--space-lg)",
              }}
            >
              <h2 className="game-heading-1" style={{ marginBottom: "var(--space-lg)" }}>
                Processing Variations
              </h2>

              <div
                className="game-card"
                style={{
                  marginBottom: "var(--space-lg)",
                  padding: "var(--space-md)",
                  background: "var(--game-surface)",
                }}
              >
                <h3 className="game-heading-3" style={{ marginBottom: "var(--space-sm)" }}>
                  Colors Being Used:
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "var(--space-sm)",
                    alignItems: "center",
                  }}
                >
                  {getUsedColors(themeColors).map((colorInfo) => (
                    <div
                      key={colorInfo.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-xs)",
                        padding: "var(--space-xs) var(--space-sm)",
                        background: "var(--admin-surface)",
                        border: "var(--border-width-md) solid var(--game-border)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <div
                        style={{
                          width: "1.5rem",
                          height: "1.5rem",
                          backgroundColor: colorInfo.color,
                          border: "var(--border-width-sm) solid var(--game-border)",
                          borderRadius: "var(--radius-xs)",
                        }}
                      />
                      <span className="game-text-muted" style={{ fontSize: "var(--font-size-xs)" }}>
                        {colorInfo.name} (L:{colorInfo.luminance.toFixed(2)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "var(--space-lg)" }}>
                <p className="game-text-muted">
                  Showing the 10 most recent images processed with different methods. Click to view
                  full size.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${processingVariations.length}, 1fr)`,
                  gap: "var(--space-md)",
                  overflowX: "auto",
                  paddingBottom: "var(--space-md)",
                }}
              >
                {processingVariations.map((variation) => (
                  <div key={variation.id} style={{ minWidth: "200px" }}>
                    <div
                      style={{
                        padding: "var(--space-sm)",
                        background: "var(--game-surface)",
                        border: "var(--border-width-md) solid var(--game-border)",
                        borderRadius: "var(--radius-sm)",
                        marginBottom: "var(--space-sm)",
                      }}
                    >
                      <div
                        className="game-heading-3"
                        style={{
                          fontSize: "var(--font-size-xs)",
                          marginBottom: "var(--space-xs)",
                          textAlign: "center",
                        }}
                      >
                        {variation.label}
                      </div>
                      <div
                        className="game-text-muted"
                        style={{
                          fontSize: "var(--font-size-xs)",
                          textAlign: "center",
                          marginBottom: "var(--space-xs)",
                        }}
                      >
                        {variation.description}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: "var(--space-sm)",
                      }}
                    >
                      {recentImages.map((image) => {
                        const key = `${image.id}-${variation.id}`;
                        const canvas = variationCanvases.get(key);
                        if (!canvas) return null;

                        return (
                          <div
                            key={key}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              padding: "var(--space-xs)",
                              background: "var(--admin-surface)",
                              border: "var(--border-width-sm) solid var(--game-border)",
                              borderRadius: "var(--radius-sm)",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              const newWindow = window.open();
                              if (newWindow) {
                                newWindow.document.write(
                                  `<html><body style="margin:0;padding:20px;background:#000;"><img src="${canvas.toDataURL()}" style="image-rendering:pixelated;max-width:100%;height:auto;" /></body></html>`
                                );
                              }
                            }}
                          >
                            <img
                              src={canvas.toDataURL()}
                              alt={`${variation.label} - Image ${image.id.substring(0, 8)}`}
                              style={{
                                maxWidth: "100%",
                                height: "auto",
                                imageRendering: "pixelated",
                                border: "var(--border-width-sm) solid var(--game-border)",
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
