/**
 * Programmatic pixel rendering utilities
 * Converts images to 128x128 grayscale intensity arrays and renders with theme colors
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  bg?: string; // Optional background color
  text?: string; // Optional text color
}

// Configuration constants
export const PIXEL_GRID_SIZE = 128; // Grid size for new images (can be increased for more detail)
export const QUANTIZATION_LEVELS = 128; // Increased from 64 for smoother gradients and more granularity

/**
 * Process image file to 256x256 pixel data array
 * Steps: Upload → Crop to square → Resize to 256x256 → Extract grayscale intensities → Quantize to 128 levels
 */
export async function processImageToPixelData(imageFile: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    img.onload = () => {
      try {
        // Crop to square (center crop)
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;

        // Resize to 256x256 for more detail
        canvas.width = PIXEL_GRID_SIZE;
        canvas.height = PIXEL_GRID_SIZE;

        // Draw cropped and resized image
        ctx.drawImage(img, x, y, size, size, 0, 0, PIXEL_GRID_SIZE, PIXEL_GRID_SIZE);

        // Extract pixel data
        const imageData = ctx.getImageData(0, 0, PIXEL_GRID_SIZE, PIXEL_GRID_SIZE);
        const pixelData = new Uint8Array(PIXEL_GRID_SIZE * PIXEL_GRID_SIZE);

        // Convert to grayscale and quantize
        for (let i = 0; i < imageData.data.length; i += 4) {
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];

          // Convert to grayscale intensity (0-255)
          const intensity = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

          // Quantize to 128 levels (0-127) for more color variety
          const quantized = quantizeIntensity(intensity, QUANTIZATION_LEVELS);

          // Store in pixel array (row-major order)
          const pixelIndex = Math.floor(i / 4);
          pixelData[pixelIndex] = quantized;
        }

        resolve(pixelData);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.onerror = () => {
      reject(new Error("Failed to read image file"));
    };
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Quantize intensity value (0-255) to specified number of levels
 */
export function quantizeIntensity(intensity: number, levels: number): number {
  // Clamp intensity to 0-255
  const clamped = Math.max(0, Math.min(255, intensity));
  // Quantize to levels (0 to levels-1)
  return Math.floor((clamped / 255) * levels);
}

/**
 * Convert hex color to RGB array
 */
function hexToRgb(color: string): [number, number, number] {
  // Handle hex format
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

  // Handle HSL format (hsl(200, 80%, 50%))
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

  // Handle RGB format
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

/**
 * Convert RGB array to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Blend two colors with a ratio (0-1, where 0 = color1, 1 = color2)
 */
function blendColors(color1: string, color2: string, ratio: number): string {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return rgbToHex(r, g, b);
}

// Note: hexToRgb now handles hex, hsl, and rgb formats (updated above)

/**
 * Calculate luminance of a color (0-1, where 0 is darkest, 1 is lightest)
 */
function getLuminance(color: string): number {
  const [r, g, b] = hexToRgb(color);
  // Using relative luminance formula (ITU-R BT.709)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Map quantized intensity level (0-127) to theme color with moderate granularity
 * Creates smooth gradients by blending theme colors programmatically
 * Uses fewer color stops for a more pixel-art aesthetic while maintaining detail
 * Improved contrast by ensuring proper dark-to-light mapping
 */
export function mapIntensityToThemeColor(intensityLevel: number, themeColors: ThemeColors): string {
  // Normalize intensity to 0-1 range
  const normalized = Math.max(0, Math.min(1, intensityLevel / 127));

  // Get all available theme colors and sort by luminance (darkest to lightest)
  const availableColors = [
    themeColors.primary,
    themeColors.secondary,
    themeColors.accent,
    themeColors.text || themeColors.secondary,
    themeColors.bg || themeColors.accent,
  ];

  // Sort colors by luminance to ensure proper dark-to-light mapping
  const sortedColors = [...availableColors].sort((a, b) => getLuminance(a) - getLuminance(b));

  // Use the darkest and lightest colors as anchors, and pick 2-3 intermediate colors
  const darkest = sortedColors[0];
  const lightest = sortedColors[sortedColors.length - 1];

  // Pick intermediate colors (avoid duplicates)
  const uniqueColors = Array.from(new Set(sortedColors));
  const midDark =
    uniqueColors.length > 2
      ? uniqueColors[Math.floor(uniqueColors.length / 3)]
      : uniqueColors[1] || darkest;
  const midLight =
    uniqueColors.length > 3
      ? uniqueColors[Math.floor((uniqueColors.length * 2) / 3)]
      : uniqueColors[uniqueColors.length - 2] || lightest;

  // Define color stops with better distribution for contrast
  // Use a curve that preserves more dark values and compresses mid-tones
  const colorStops = [
    { pos: 0.0, color: darkest }, // Darkest (0-40% of range)
    { pos: 0.4, color: midDark }, // Medium-dark
    { pos: 0.7, color: midLight }, // Medium-light
    { pos: 1.0, color: lightest }, // Lightest
  ];

  // Apply a slight gamma curve to improve contrast (darker values get more range)
  // This helps prevent washed-out appearance
  const contrastAdjusted = Math.pow(normalized, 0.85); // Slight gamma correction

  // Find which two color stops to blend between
  let stopIndex = 0;
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (contrastAdjusted >= colorStops[i].pos && contrastAdjusted <= colorStops[i + 1].pos) {
      stopIndex = i;
      break;
    }
  }

  // If contrastAdjusted is exactly at a stop position, return that color directly
  if (Math.abs(contrastAdjusted - colorStops[stopIndex].pos) < 0.001) {
    return colorStops[stopIndex].color;
  }
  if (Math.abs(contrastAdjusted - colorStops[stopIndex + 1].pos) < 0.001) {
    return colorStops[stopIndex + 1].color;
  }

  // Calculate blend ratio within the current segment
  const segmentStart = colorStops[stopIndex].pos;
  const segmentEnd = colorStops[stopIndex + 1].pos;
  const segmentRange = segmentEnd - segmentStart;
  const segmentProgress = segmentRange > 0 ? (contrastAdjusted - segmentStart) / segmentRange : 0;

  // Blend between the two colors
  const color1 = colorStops[stopIndex].color;
  const color2 = colorStops[stopIndex + 1].color;

  return blendColors(color1, color2, segmentProgress);
}

/**
 * Encode Uint8Array to base64 string for storage
 */
export function pixelDataToBase64(data: Uint8Array): string {
  // Convert Uint8Array to base64
  const binaryString = String.fromCharCode(...data);
  return btoa(binaryString);
}

/**
 * Decode base64 string back to Uint8Array
 */
export function base64ToPixelData(base64: string): Uint8Array {
  // Decode base64 to binary string
  const binaryString = atob(base64);
  // Convert to Uint8Array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate scanline order for CRT-style animation
 * Returns array of pixel positions in scanline order (row by row, left to right)
 */
export function generateScanlineOrder(
  width: number,
  height: number
): Array<{ row: number; col: number; index: number }> {
  const order: Array<{ row: number; col: number; index: number }> = [];
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const index = row * width + col;
      order.push({ row, col, index });
    }
  }
  return order;
}

/**
 * Render pixel data as SVG with theme colors
 */
export function renderPixelDataAsSVG(
  pixelData: Uint8Array,
  themeColors: ThemeColors,
  width: number = PIXEL_GRID_SIZE,
  height: number = PIXEL_GRID_SIZE,
  pixelSize: number = 1
): string {
  const svgPixels: string[] = [];
  const svgWidth = width * pixelSize;
  const svgHeight = height * pixelSize;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const intensityLevel = pixelData[index];
      const color = mapIntensityToThemeColor(intensityLevel, themeColors);

      svgPixels.push(
        `<rect x="${x * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}" />`
      );
    }
  }

  return `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${svgPixels.join("")}</svg>`;
}

/**
 * Render pixel data as WebP image data URL (much faster than SVG for previews)
 */
export function renderPixelDataAsWebP(
  pixelData: Uint8Array,
  themeColors: ThemeColors,
  width: number = PIXEL_GRID_SIZE,
  height: number = PIXEL_GRID_SIZE
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { alpha: false });

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.imageSmoothingEnabled = false;

      // Render pixels to canvas
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = y * width + x;
          const intensityLevel = pixelData[index];
          const color = mapIntensityToThemeColor(intensityLevel, themeColors);

          // Convert hex color to RGB using the helper function
          const [r, g, b] = hexToRgb(color);

          const pixelIndex = (y * width + x) * 4;
          data[pixelIndex] = r;
          data[pixelIndex + 1] = g;
          data[pixelIndex + 2] = b;
          data[pixelIndex + 3] = 255; // Alpha
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Convert to WebP
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        "image/webp",
        0.9 // Quality
      );
    } catch (error) {
      reject(error);
    }
  });
}
