"use client";

import React from "react";
import { WidgetPosition, WidgetSize } from "@/lib/types";
import { GRID_COLS, GRID_ROWS } from "@/lib/constants";

interface GridProps {
  children: React.ReactNode;
}

interface GridItemProps {
  position: WidgetPosition;
  size: WidgetSize;
  children: React.ReactNode;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

interface GridProps {
  children: React.ReactNode;
}

export function Grid({ children }: GridProps) {
  // Use CSS variables for dimensions
  const gridWidth = "var(--grid-width)";
  const gridHeight = "var(--grid-height)";

  // Create array of all grid positions for background tiles
  const allTiles: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      allTiles.push({ x, y });
    }
  }

  // Always use grid layout - scale proportionally to fit viewport
  // Dimensions are calculated from CSS variables
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${GRID_COLS}, var(--grid-tile-size))`,
    gridTemplateRows: `repeat(${GRID_ROWS}, var(--grid-tile-size))`,
    gap: "var(--grid-gap)",
    width: gridWidth,
    height: gridHeight,
    position: "relative",
    margin: 0,
    padding: 0,
    boxSizing: "border-box",
    // Allow overflow for scrolling when content is larger than viewport
    overflow: "visible",
  };

  return (
    <div style={gridStyle} data-grid-container className="grid-layout">
      {/* Background grid tiles - muted squares using theme colors */}
      {allTiles.map((tile) => (
        <div
          key={`bg-${tile.x}-${tile.y}`}
          className="grid-tile-bg"
          style={{
            gridColumn: tile.x + 1,
            gridRow: tile.y + 1,
            width: "var(--grid-tile-size)",
            height: "var(--grid-tile-size)",
            pointerEvents: "none",
            zIndex: 0,
            position: "relative",
            backgroundColor: "var(--grid-tile-bg)",
          }}
        />
      ))}
      {/* Actual widget content - above background tiles */}
      {children}
    </div>
  );
}

interface GridItemProps {
  position: WidgetPosition;
  size: WidgetSize;
  children: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
}

export const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(function GridItem(
  { position, size, children, style: customStyle },
  ref
) {
  const [cols, rows] = size.split("x").map(Number);
  // Calculate item dimensions using CSS variables
  const itemWidth = `calc(${cols} * var(--grid-tile-size) + ${cols - 1} * var(--grid-gap))`;
  const itemHeight = `calc(${rows} * var(--grid-tile-size) + ${rows - 1} * var(--grid-gap))`;

  // Always use grid positioning - scale on mobile via CSS
  const itemStyle: React.CSSProperties = {
    gridColumn: `${position.x + 1} / span ${cols}`,
    gridRow: `${position.y + 1} / span ${rows}`,
    width: itemWidth,
    height: itemHeight,
    position: "relative",
    zIndex: 1,
    ...customStyle,
  };

  return (
    <div ref={ref} style={itemStyle}>
      {children}
    </div>
  );
});
