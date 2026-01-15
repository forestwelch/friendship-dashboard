import { ADMIN_USER_ID } from "../constants";

/**
 * Convert HSL string to hex color
 * @param hslString - HSL string like "hsl(200, 70%, 50%)"
 * @returns Hex color string like "#4d94b3"
 */
export function hslToHex(hslString: string): string {
  const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return "#000000";

  const h = parseInt(match[1]) / 360;
  const s = parseInt(match[2]) / 100;
  const l = parseInt(match[3]) / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert hex color to HSL string
 * @param hex - Hex color string like "#4d94b3" or "4d94b3"
 * @returns HSL string like "hsl(200, 70%, 50%)" or null if invalid
 */
export function hexToHsl(hex: string): string | null {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Handle 3-character hex
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  if (hex.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(hex)) {
    return null;
  }

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

/**
 * Validate if a string is a valid hex color
 * @param hex - String to validate
 * @returns true if valid hex color
 */
export function isValidHex(hex: string): boolean {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex);
}

/**
 * Color assignment utilities
 * Friend (Max) = Always Primary (Pink)
 * Admin (Forest) = Always Secondary (Green)
 * Regardless of who is viewing
 */

/**
 * Get the color for a user ID
 * @param userId - The user ID ("admin" or friend ID)
 * @param friendId - The friend's ID (to determine if userId is the friend)
 * @param themeColors - Theme colors object
 * @returns The color string (primary for friend, secondary for admin)
 */
export function getUserColor(
  userId: string,
  friendId: string,
  themeColors: { primary: string; secondary: string }
): string {
  // Admin is always secondary (green)
  if (userId === ADMIN_USER_ID) {
    return themeColors.secondary;
  }
  // Friend is always primary (pink)
  return themeColors.primary;
}

/**
 * Get CSS variable for user color
 * @param userId - The user ID ("admin" or friend ID)
 * @param friendId - The friend's ID (to determine if userId is the friend)
 * @returns CSS variable string ("var(--primary)" for friend, "var(--secondary)" for admin)
 */
export function getUserColorVar(userId: string, _friendId: string): string {
  // Admin is always secondary (green)
  if (userId === ADMIN_USER_ID) {
    return "var(--secondary)";
  }
  // Friend is always primary (pink)
  return "var(--primary)";
}
