"use client";

import React from "react";
import { WidgetPosition, WidgetSize } from "@/lib/types";
import { GRID_COLS, GRID_ROWS } from "@/lib/constants";
import styles from "./Grid.module.css";

interface GridProps {
  children: React.ReactNode;
}

// Memoize grid tiles since they're derived from constants and never change
// Computed once when module loads instead of on every render
const GRID_TILES = Array.from({ length: GRID_ROWS * GRID_COLS }, (_, i) => ({
  x: i % GRID_COLS,
  y: Math.floor(i / GRID_COLS),
}));

export function Grid({ children }: GridProps) {
  return (
    <div
      data-grid-container
      className={styles.gridLayout}
      data-cols={GRID_COLS}
      data-rows={GRID_ROWS}
      // CSS custom properties are set inline because grid dimensions come from constants
      style={{ "--grid-cols": GRID_COLS, "--grid-rows": GRID_ROWS } as React.CSSProperties}
    >
      {/* Background grid tiles - muted squares using theme colors */}
      {/* CSS custom properties are set inline because each tile's position is dynamic */}
      {GRID_TILES.map((tile) => (
        <div
          key={`bg-${tile.x}-${tile.y}`}
          className={styles.gridTileBg}
          data-grid-col={tile.x + 1}
          data-grid-row={tile.y + 1}
          style={
            {
              "--grid-col": tile.x + 1,
              "--grid-row": tile.y + 1,
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
  className?: string;
}

export const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(function GridItem(
  { position, size, children, style: customStyle, className },
  ref
) {
  const [cols, rows] = size.split("x").map(Number);

  return (
    <div
      ref={ref}
      className={`${styles.gridItem} ${className || ""}`}
      data-col={position.x + 1}
      data-row={position.y + 1}
      data-cols={cols}
      data-rows={rows}
      // CSS custom properties are set inline because position and size are dynamic props
      style={
        {
          "--grid-col": position.x + 1,
          "--grid-row": position.y + 1,
          "--grid-cols-span": cols,
          "--grid-rows-span": rows,
          ...customStyle,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
});
