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
export const PIXEL_GRID_SIZE = 128; // Increased from 64 for more detail
export const QUANTIZATION_LEVELS = 32; // Increased from 16 for more granularity and color variety

/**
 * Process image file to 128x128 pixel data array
 * Steps: Upload → Crop to square → Resize to 128x128 → Extract grayscale intensities → Quantize to 16 levels
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

        // Resize to 128x128 for more detail
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
          
          // Quantize to 16 levels (0-15) for more color variety
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
 * Map quantized intensity level (0-31) to theme color with more granularity
 * Uses 5-6 colors from theme palette for smoother gradients:
 * Levels 0-5 → Primary (darkest)
 * Levels 6-11 → Secondary (medium-dark)
 * Levels 12-17 → Accent (medium)
 * Levels 18-23 → Text or Secondary light (medium-light)
 * Levels 24-31 → Bg or Accent light (lightest)
 */
export function mapIntensityToThemeColor(
  intensityLevel: number,
  themeColors: ThemeColors
): string {
  // Map 32 levels to 5-6 colors for more granularity
  if (intensityLevel <= 5) {
    return themeColors.primary; // Darkest
  } else if (intensityLevel <= 11) {
    return themeColors.secondary; // Medium-dark
  } else if (intensityLevel <= 17) {
    return themeColors.accent; // Medium
  } else if (intensityLevel <= 23) {
    // Use text color if available, otherwise lighter secondary
    return themeColors.text || themeColors.secondary; // Medium-light
  } else {
    // Use bg color if available, otherwise lighter accent
    return themeColors.bg || themeColors.accent; // Lightest
  }
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
  
  return `<svg width="${width * pixelSize}" height="${height * pixelSize}" xmlns="http://www.w3.org/2000/svg">${svgPixels.join("")}</svg>`;
}

