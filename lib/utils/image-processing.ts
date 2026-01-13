// Image processing utilities for pixel art conversion

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
}

/**
 * Convert color (hex, hsl, rgb) to RGB tuple
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
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
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
 * Calculate color distance (Euclidean distance in RGB space)
 */
function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
}

/**
 * Find nearest color in palette
 */
function findNearestColor(r: number, g: number, b: number, palette: ColorPalette): string {
  const paletteColors = [
    hexToRgb(palette.primary),
    hexToRgb(palette.secondary),
    hexToRgb(palette.accent),
    hexToRgb(palette.bg),
    hexToRgb(palette.text),
  ];

  const paletteHex = [palette.primary, palette.secondary, palette.accent, palette.bg, palette.text];

  let minDistance = Infinity;
  let nearestColor = palette.primary;

  for (let i = 0; i < paletteColors.length; i++) {
    const [pr, pg, pb] = paletteColors[i];
    const distance = colorDistance(r, g, b, pr, pg, pb);
    if (distance < minDistance) {
      minDistance = distance;
      nearestColor = paletteHex[i];
    }
  }

  return nearestColor;
}

/**
 * Get theme colors from CSS variables
 * Only works in browser - returns defaults if called server-side
 */
export function getThemePalette(): ColorPalette {
  // Default palette for SSR or when document is not available
  const defaults: ColorPalette = {
    primary: "#2a52be",
    secondary: "#7cb9e8",
    accent: "#00308f",
    bg: "#e6f2ff",
    text: "#001f3f",
  };

  if (typeof window === "undefined" || typeof document === "undefined") {
    return defaults;
  }

  try {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);

    return {
      primary: computedStyle.getPropertyValue("--primary").trim() || defaults.primary,
      secondary: computedStyle.getPropertyValue("--secondary").trim() || defaults.secondary,
      accent: computedStyle.getPropertyValue("--accent").trim() || defaults.accent,
      bg: computedStyle.getPropertyValue("--bg").trim() || defaults.bg,
      text: computedStyle.getPropertyValue("--text").trim() || defaults.text,
    };
  } catch (error) {
    console.warn("Error getting theme palette:", error);
    return defaults;
  }
}

/**
 * Process image to pixel art with color quantization
 */
export async function processImageToPixelArt(
  imageFile: File,
  width: number,
  height: number,
  pixelSize: number = 4,
  palette: ColorPalette
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    img.onload = () => {
      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw image scaled down (this creates pixelation)
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, width / pixelSize, height / pixelSize);
      ctx.drawImage(canvas, 0, 0, width / pixelSize, height / pixelSize, 0, 0, width, height);

      // Get image data
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Quantize colors to palette
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const nearestColor = findNearestColor(r, g, b, palette);
        const [nr, ng, nb] = hexToRgb(nearestColor);

        data[i] = nr;
        data[i + 1] = ng;
        data[i + 2] = nb;
        // Keep alpha channel as is
      }

      // Put processed data back
      ctx.putImageData(imageData, 0, 0);

      // Convert to base64
      const base64 = canvas.toDataURL("image/png");
      resolve(base64);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Crop and resize image to fit widget size
 */
export async function cropImageToSize(
  imageFile: File,
  targetWidth: number,
  targetHeight: number,
  pixelSize: number = 4,
  palette: ColorPalette
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    img.onload = () => {
      // Calculate crop to maintain aspect ratio
      const imgAspect = img.width / img.height;
      const targetAspect = targetWidth / targetHeight;

      let cropWidth = img.width;
      let cropHeight = img.height;
      let cropX = 0;
      let cropY = 0;

      if (imgAspect > targetAspect) {
        // Image is wider - crop width
        cropWidth = img.height * targetAspect;
        cropX = (img.width - cropWidth) / 2;
      } else {
        // Image is taller - crop height
        cropHeight = img.width / targetAspect;
        cropY = (img.height - cropHeight) / 2;
      }

      // Set canvas size
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Draw cropped and scaled image
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        targetWidth / pixelSize,
        targetHeight / pixelSize
      );
      ctx.drawImage(
        canvas,
        0,
        0,
        targetWidth / pixelSize,
        targetHeight / pixelSize,
        0,
        0,
        targetWidth,
        targetHeight
      );

      // Get image data for color quantization
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const data = imageData.data;

      // Quantize colors to palette
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const nearestColor = findNearestColor(r, g, b, palette);
        const [nr, ng, nb] = hexToRgb(nearestColor);

        data[i] = nr;
        data[i + 1] = ng;
        data[i + 2] = nb;
      }

      // Put processed data back
      ctx.putImageData(imageData, 0, 0);

      // Convert to base64
      const base64 = canvas.toDataURL("image/png");
      resolve(base64);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = URL.createObjectURL(imageFile);
  });
}
