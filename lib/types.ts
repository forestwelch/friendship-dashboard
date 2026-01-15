// TypeScript types for Friendship Dashboard

export type WidgetSize =
  | "1x1"
  | "1x2"
  | "1x3"
  | "1x4"
  | "1x5"
  | "1x6"
  | "2x1"
  | "2x2"
  | "2x3"
  | "2x4"
  | "2x5"
  | "2x6"
  | "3x1"
  | "3x2"
  | "3x3"
  | "3x4"
  | "3x5"
  | "3x6"
  | "4x1"
  | "4x2"
  | "4x3"
  | "4x4"
  | "4x5"
  | "4x6"
  | "5x1"
  | "5x2"
  | "5x3"
  | "5x4"
  | "5x5";

export interface WidgetPosition {
  x: number; // 0 to (GRID_COLS - 1)
  y: number; // 0 to (GRID_ROWS - 1)
}

export interface WidgetData {
  [key: string]: unknown;
}

export interface Friend {
  id: string;
  name: string;
  slug: string;
  display_name: string;
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  color_bg: string;
  color_text: string;
  created_at?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  mp3Url: string;
  thumbnail?: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
}

export interface WidgetConfig {
  pixelData?: string[];
  imageUrls?: string[];
  imageIds?: string[];
  notes?: Array<string | { id: string; content: string; created_at: string }>;
  [key: string]: unknown;
}
