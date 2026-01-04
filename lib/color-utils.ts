/**
 * Color utility functions for handling various color formats
 * Supports hex, hsl, rgb, and rgba formats
 */

/**
 * Convert any color format (hex, hsl, rgb, rgba) to RGB tuple
 * Returns [r, g, b] where each value is 0-255
 */
export function colorToRgb(color: string): [number, number, number] {
  if (!color || typeof color !== "string") {
    console.warn("Invalid color:", color);
    return [0, 0, 0]; // Default to black
  }

  const trimmed = color.trim();

  // Handle hex format (#RRGGBB or #RGB)
  if (trimmed.startsWith("#")) {
    return hexToRgb(trimmed);
  }

  // Handle hsl/hsla format (hsl(200, 80%, 50%) or hsla(200, 80%, 50%, 1))
  if (trimmed.startsWith("hsl")) {
    return hslToRgb(trimmed);
  }

  // Handle rgb/rgba format (rgb(255, 0, 0) or rgba(255, 0, 0, 1))
  if (trimmed.startsWith("rgb")) {
    return parseRgb(trimmed);
  }

  // Fallback: try to parse as hex without #
  console.warn("Unknown color format, attempting hex parse:", trimmed);
  return hexToRgb(`#${trimmed}`);
}

/**
 * Convert hex color to RGB tuple
 * Supports #RRGGBB and #RGB formats
 */
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace("#", "").trim();

  // Handle 3-character hex (#RGB -> #RRGGBB)
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return [r, g, b];
  }

  // Handle 6-character hex (#RRGGBB)
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    // Validate parsing
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      console.warn("Invalid hex color:", hex);
      return [0, 0, 0];
    }

    return [r, g, b];
  }

  console.warn("Invalid hex format:", hex);
  return [0, 0, 0];
}

/**
 * Convert HSL color to RGB tuple
 * Supports hsl(h, s%, l%) and hsla(h, s%, l%, a) formats
 */
function hslToRgb(hsl: string): [number, number, number] {
  // Extract HSL values using regex
  const match = hsl.match(/hsl\(?\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)?/i);

  if (!match) {
    console.warn("Invalid HSL format:", hsl);
    return [0, 0, 0];
  }

  const h = parseInt(match[1], 10) / 360; // Normalize to 0-1
  const s = parseInt(match[2], 10) / 100; // Normalize to 0-1
  const l = parseInt(match[3], 10) / 100; // Normalize to 0-1

  if (isNaN(h) || isNaN(s) || isNaN(l)) {
    console.warn("Invalid HSL values:", hsl);
    return [0, 0, 0];
  }

  // Convert HSL to RGB
  let r, g, b;

  if (s === 0) {
    // Achromatic (gray)
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

/**
 * Parse RGB/RGBA color string to RGB tuple
 * Supports rgb(r, g, b) and rgba(r, g, b, a) formats
 */
function parseRgb(rgb: string): [number, number, number] {
  const match = rgb.match(/rgba?\(?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);

  if (!match) {
    console.warn("Invalid RGB format:", rgb);
    return [0, 0, 0];
  }

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    console.warn("Invalid RGB values:", rgb);
    return [0, 0, 0];
  }

  return [r, g, b];
}

/**
 * Convert any color format to hex string
 * Useful for consistent storage/display
 */
export function colorToHex(color: string): string {
  const [r, g, b] = colorToRgb(color);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
