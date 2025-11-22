"use client";

import React from "react";
import { WidgetPosition } from "@/lib/types";

interface GridProps {
  children: React.ReactNode;
}

interface GridItemProps {
  position: WidgetPosition;
  size: "1x1" | "2x2" | "3x3";
  children: React.ReactNode;
}

// Fixed tile size - not responsive
const FIXED_TILE_SIZE = 80; // pixels
const FIXED_GAP = 8; // pixels

// Grid dimensions
const GRID_COLS = 8;
const GRID_ROWS = 6;

// Calculate total grid dimensions
const GRID_WIDTH = GRID_COLS * FIXED_TILE_SIZE + (GRID_COLS - 1) * FIXED_GAP;
const GRID_HEIGHT = GRID_ROWS * FIXED_TILE_SIZE + (GRID_ROWS - 1) * FIXED_GAP;

export function Grid({ children }: GridProps) {
  // Create array of all grid positions for background tiles
  const allTiles: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      allTiles.push({ x, y });
    }
  }

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${GRID_COLS}, ${FIXED_TILE_SIZE}px)`,
    gridTemplateRows: `repeat(${GRID_ROWS}, ${FIXED_TILE_SIZE}px)`,
    gap: `${FIXED_GAP}px`,
    width: `${GRID_WIDTH}px`,
    height: `${GRID_HEIGHT}px`,
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    margin: 0,
    padding: 0,
  };

  return (
    <div style={gridStyle}>
      {/* Background grid tiles - muted squares using theme colors */}
      {allTiles.map((tile) => (
        <div
          key={`bg-${tile.x}-${tile.y}`}
          className="grid-tile-bg"
          style={{
            gridColumn: tile.x + 1,
            gridRow: tile.y + 1,
            width: `${FIXED_TILE_SIZE}px`,
            height: `${FIXED_TILE_SIZE}px`,
            pointerEvents: "none",
            zIndex: 0,
            position: "relative",
          }}
        />
      ))}
      {/* Actual widget content - above background tiles */}
      {children}
    </div>
  );
}

export function GridItem({ position, size, children }: GridItemProps) {
  const [cols, rows] = size.split("x").map(Number);
  const itemWidth = cols * FIXED_TILE_SIZE + (cols - 1) * FIXED_GAP;
  const itemHeight = rows * FIXED_TILE_SIZE + (rows - 1) * FIXED_GAP;

  const itemStyle: React.CSSProperties = {
    gridColumn: `${position.x + 1} / span ${cols}`,
    gridRow: `${position.y + 1} / span ${rows}`,
    width: `${itemWidth}px`,
    height: `${itemHeight}px`,
    position: "relative",
    zIndex: 1,
  };

  return <div style={itemStyle}>{children}</div>;
}


