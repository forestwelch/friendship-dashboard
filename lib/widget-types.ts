/**
 * Widget type constants
 * Single source of truth for all widget types in the application
 */

export const WIDGET_TYPES = {
  MUSIC_PLAYER: "music_player",
  PIXEL_ART: "pixel_art",
  CONNECT_FOUR: "connect_four",
  CONSUMPTION_LOG: "consumption_log",
  QUESTION_JAR: "question_jar",
  AUDIO_SNIPPETS: "audio_snippets",
  ABSURD_REVIEWS: "absurd_reviews",
  FRIDGE_MAGNETS: "fridge_magnets",
} as const;

// Type for widget type values
export type WidgetType = (typeof WIDGET_TYPES)[keyof typeof WIDGET_TYPES];

/**
 * Widget types that allow multiple instances per friend
 * Most widgets are limited to one per friend, but these can have multiple
 */
export const MULTI_INSTANCE_WIDGET_TYPES: WidgetType[] = [WIDGET_TYPES.PIXEL_ART];

/**
 * Check if a widget type allows multiple instances
 */
export function allowsMultipleInstances(widgetType: string): boolean {
  return MULTI_INSTANCE_WIDGET_TYPES.includes(widgetType as WidgetType);
}
