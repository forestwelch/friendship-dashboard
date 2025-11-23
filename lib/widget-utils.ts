// Utility functions for widget positioning and collision detection

import { WidgetSize, WidgetPosition } from "./types";
import { FriendWidget } from "./queries";

/**
 * Get all grid positions occupied by a widget
 */
export function getWidgetPositions(
  position: WidgetPosition,
  size: WidgetSize
): WidgetPosition[] {
  const [cols, rows] = size.split("x").map(Number);
  const positions: WidgetPosition[] = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      positions.push({
        x: position.x + x,
        y: position.y + y,
      });
    }
  }

  return positions;
}

/**
 * Check if two widgets overlap
 */
export function widgetsOverlap(
  widget1: { position: WidgetPosition; size: WidgetSize },
  widget2: { position: WidgetPosition; size: WidgetSize }
): boolean {
  const pos1 = getWidgetPositions(widget1.position, widget1.size);
  const pos2 = getWidgetPositions(widget2.position, widget2.size);

  // Check if any positions overlap
  for (const p1 of pos1) {
    for (const p2 of pos2) {
      if (p1.x === p2.x && p1.y === p2.y) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if a widget position is valid (within grid bounds)
 */
export function isValidPosition(
  position: WidgetPosition,
  size: WidgetSize
): boolean {
  const [cols, rows] = size.split("x").map(Number);
  return (
    position.x >= 0 &&
    position.y >= 0 &&
    position.x + cols <= 6 && // 6 cols
    position.y + rows <= 8    // 8 rows
  );
}

/**
 * Check if a widget can be placed at a position without overlapping others
 */
export function canPlaceWidget(
  widgets: FriendWidget[],
  widgetId: string,
  position: WidgetPosition,
  size: WidgetSize
): boolean {
  // Check bounds
  if (!isValidPosition(position, size)) {
    return false;
  }

  // Check overlap with other widgets
  const otherWidgets = widgets.filter((w) => w.id !== widgetId);
  for (const widget of otherWidgets) {
    if (
      widgetsOverlap(
        { position, size },
        { position: { x: widget.position_x, y: widget.position_y }, size: widget.size }
      )
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Find first available position for a widget of given size
 */
export function findAvailablePosition(
  widgets: FriendWidget[],
  size: WidgetSize
): WidgetPosition | null {
  const [cols, rows] = size.split("x").map(Number);

  for (let y = 0; y <= 8 - rows; y++) { // 8 rows
    for (let x = 0; x <= 6 - cols; x++) { // 6 cols
      const position: WidgetPosition = { x, y };
      if (canPlaceWidget(widgets, "", position, size)) {
        return position;
      }
    }
  }

  return null;
}


