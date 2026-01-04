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

export interface Widget {
  id: string;
  name: string;
  sizes: WidgetSize[];
  render: (size: WidgetSize, data: WidgetData) => React.ReactNode;
  onInteraction?: (action: string, payload: unknown) => void;
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

export interface Top10SongsData {
  songs: Song[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type?: string;
}

export interface LinkItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  icon?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: "movie" | "show" | "book" | "music" | "game" | string;
  createdAt?: string;
  watched?: boolean;
  description?: string;
  thumbnail?: string;
  rating?: number;
}

export interface WidgetConfig {
  recommendations?: MediaItem[];
  pixelData?: string[];
  imageUrls?: string[];
  imageIds?: string[];
  notes?: Array<string | { id: string; content: string; created_at: string }>;
  events?: CalendarEvent[];
  links?: LinkItem[];
  [key: string]: unknown;
}
