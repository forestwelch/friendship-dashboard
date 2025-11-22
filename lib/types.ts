// TypeScript types for Friendship Dashboard

export type WidgetSize = "1x1" | "2x2" | "3x3";

export interface WidgetPosition {
  x: number; // 0-7 for 8-column grid
  y: number; // 0-5 for 6-row grid
}

export interface WidgetData {
  [key: string]: any;
}

export interface Widget {
  id: string;
  name: string;
  sizes: WidgetSize[];
  render: (size: WidgetSize, data: WidgetData) => React.ReactNode;
  onInteraction?: (action: string, payload: any) => void;
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


