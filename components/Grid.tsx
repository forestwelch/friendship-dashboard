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
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

// Base tile size (1x scale) - smaller to fit better
const BASE_TILE_SIZE = 60; // pixels (reduced from 80)
const BASE_GAP = 6; // pixels (reduced from 8)

// Grid dimensions
const GRID_COLS = 8;
const GRID_ROWS = 6;

// Calculate tile size based on scale
function getTileSize(scale: 1 | 2 | 4): number {
  return BASE_TILE_SIZE * scale;
}

function getGap(scale: 1 | 2 | 4): number {
  return BASE_GAP * scale;
}

interface GridProps {
  children: React.ReactNode;
  dragOverPosition?: { x: number; y: number } | null;
  draggedWidgetSize?: "1x1" | "2x2" | "3x3";
}

export function Grid({ children, dragOverPosition, draggedWidgetSize }: GridProps) {
  // Get scale from CSS variable (set by ScaleProvider)
  const scale = typeof window !== "undefined" 
    ? parseInt(document.documentElement.getAttribute("data-scale") || "2") as 1 | 2 | 4
    : 2;
  
  const tileSize = getTileSize(scale);
  const gap = getGap(scale);
  const gridWidth = GRID_COLS * tileSize + (GRID_COLS - 1) * gap;
  const gridHeight = GRID_ROWS * tileSize + (GRID_ROWS - 1) * gap;
  // Create array of all grid positions for background tiles
  const allTiles: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      allTiles.push({ x, y });
    }
  }

  // Calculate which tiles would be occupied by dragged widget
  const dragOverTiles: Set<string> = new Set();
  if (dragOverPosition && draggedWidgetSize) {
    const [cols, rows] = draggedWidgetSize.split("x").map(Number);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        dragOverTiles.add(`${dragOverPosition.x + x},${dragOverPosition.y + y}`);
      }
    }
  }

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${GRID_COLS}, ${tileSize}px)`,
    gridTemplateRows: `repeat(${GRID_ROWS}, ${tileSize}px)`,
    gap: `${gap}px`,
    width: `${gridWidth}px`,
    height: `${gridHeight}px`,
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    margin: 0,
    padding: 0,
  };

  return (
    <div style={gridStyle} data-grid-container>
      {/* Background grid tiles - muted squares using theme colors */}
      {allTiles.map((tile) => {
        const isDragOver = dragOverTiles.has(`${tile.x},${tile.y}`);
        return (
          <div
            key={`bg-${tile.x}-${tile.y}`}
            className="grid-tile-bg"
            style={{
              gridColumn: tile.x + 1,
              gridRow: tile.y + 1,
              width: `${tileSize}px`,
              height: `${tileSize}px`,
              pointerEvents: "none",
              zIndex: 0,
              position: "relative",
              backgroundColor: isDragOver 
                ? "var(--accent)" 
                : "var(--grid-tile-bg)",
              opacity: isDragOver ? 0.3 : 1,
              transition: "all 0.1s ease",
            }}
          />
        );
      })}
      {/* Actual widget content - above background tiles */}
      {children}
    </div>
  );
}

interface GridItemProps {
  position: WidgetPosition;
  size: "1x1" | "2x2" | "3x3";
  children: React.ReactNode;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export function GridItem({ position, size, children, onDragOver, onDrop }: GridItemProps) {
  const [cols, rows] = size.split("x").map(Number);
  const scale = typeof window !== "undefined" 
    ? parseInt(document.documentElement.getAttribute("data-scale") || "2") as 1 | 2 | 4
    : 2;
  const tileSize = getTileSize(scale);
  const gap = getGap(scale);
  const itemWidth = cols * tileSize + (cols - 1) * gap;
  const itemHeight = rows * tileSize + (rows - 1) * gap;

  const itemStyle: React.CSSProperties = {
    gridColumn: `${position.x + 1} / span ${cols}`,
    gridRow: `${position.y + 1} / span ${rows}`,
    width: `${itemWidth}px`,
    height: `${itemHeight}px`,
    position: "relative",
    zIndex: 1,
  };

  return (
    <div
      style={itemStyle}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {children}
    </div>
  );
}


