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
