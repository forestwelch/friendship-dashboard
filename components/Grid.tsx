"use client";

import React from "react";
import { WidgetPosition, WidgetSize } from "@/lib/types";
import { GRID_COLS, GRID_ROWS } from "@/lib/constants";
import "@/styles/grid.css";

interface GridProps {
  children: React.ReactNode;
}

export function Grid({ children }: GridProps) {
  // Create array of all grid positions for background tiles
  const allTiles: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      allTiles.push({ x, y });
    }
  }

  return (
    <div
      data-grid-container
      className="grid-layout"
      data-cols={GRID_COLS}
      data-rows={GRID_ROWS}
      style={{ "--grid-cols": GRID_COLS, "--grid-rows": GRID_ROWS } as React.CSSProperties}
    >
      {/* Background grid tiles - muted squares using theme colors */}
      {allTiles.map((tile) => (
        <div
          key={`bg-${tile.x}-${tile.y}`}
          className="grid-tile-bg"
          style={
            {
              gridColumn: `${tile.x + 1}`,
              gridRow: `${tile.y + 1}`,
            } as React.CSSProperties
          }
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

  return (
    <div
      ref={ref}
      className="grid-item"
      data-col={position.x + 1}
      data-row={position.y + 1}
      data-cols={cols}
      data-rows={rows}
      style={
        {
          "--grid-col": position.x + 1,
          "--grid-row": position.y + 1,
          "--grid-cols-span": cols,
          "--grid-rows-span": rows,
          gridColumn: `${position.x + 1} / span ${cols}`,
          gridRow: `${position.y + 1} / span ${rows}`,
          width: `calc(${cols} * var(--grid-tile-size) + ${cols - 1} * var(--grid-gap))`,
          height: `calc(${rows} * var(--grid-tile-size) + ${rows - 1} * var(--grid-gap))`,
          ...customStyle,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
});
