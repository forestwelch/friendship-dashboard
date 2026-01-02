// TypeScript types for Friendship Dashboard

export type WidgetSize = "1x1" | "2x2" | "3x3";

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
  youtubeId: string;
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
