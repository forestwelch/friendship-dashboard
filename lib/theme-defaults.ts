/**
 * Default theme colors - Sleek Grayscale Dark Mode
 * Modern, minimalist grayscale palette for a sleek dark mode aesthetic
 */
export const DEFAULT_THEME_COLORS = {
  primary: "#5a5a5a", // Medium gray - main interactive elements (more distinct from secondary)
  secondary: "#3a3a3a", // Darker gray - secondary elements (swapped with primary for better contrast)
  accent: "#2a2a2a", // Darkest gray - accents and borders
  bg: "#0a0a0a", // Near black background
  text: "#e8e8e8", // Soft white text
} as const;

/**
 * Alternative default theme colors (for ImageManager preview)
 * These match the "daniel" theme from the database seed data
 */
export const DEFAULT_THEME_COLORS_ALT = {
  primary: "#2a52be",
  secondary: "#7cb9e8",
  accent: "#00308f",
  bg: "#e6f2ff",
  text: "#001f3f",
} as const;
