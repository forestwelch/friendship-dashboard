"use client";

import React from "react";
import { WidgetPosition } from "@/lib/types";
import { useIsMobile } from "@/lib/useMediaQuery";
import styles from "./Grid.module.css";

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

// Base tile size in rem (assuming 16px = 1rem base) - made bigger
const TILE_SIZE_REM = 5; // 80px at 16px base (increased from 60px)
const GAP_REM = 0.5; // 8px at 16px base (increased from 6px)
const TILE_SIZE = `${TILE_SIZE_REM}rem`;
const GAP = `${GAP_REM}rem`;

// Grid dimensions - changed to 6x8 (6 cols, 8 rows)
const GRID_COLS = 6;
const GRID_ROWS = 8;

interface GridProps {
  children: React.ReactNode;
  dragOverPosition?: { x: number; y: number } | null;
  draggedWidgetSize?: "1x1" | "2x2" | "3x3";
}

export function Grid({ children, dragOverPosition, draggedWidgetSize }: GridProps) {
  const isMobile = useIsMobile();
  const gridWidth = `calc(${GRID_COLS} * ${TILE_SIZE} + ${GRID_COLS - 1} * ${GAP})`;
  const gridHeight = `calc(${GRID_ROWS} * ${TILE_SIZE} + ${GRID_ROWS - 1} * ${GAP})`;
  
  // Create array of all grid positions for background tiles (desktop only)
  const allTiles: Array<{ x: number; y: number }> = [];
  if (!isMobile) {
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        allTiles.push({ x, y });
      }
    }
  }

  // Calculate which tiles would be occupied by dragged widget
  const dragOverTiles: Set<string> = new Set();
  if (dragOverPosition && draggedWidgetSize && !isMobile) {
    const [cols, rows] = draggedWidgetSize.split("x").map(Number);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        dragOverTiles.add(`${dragOverPosition.x + x},${dragOverPosition.y + y}`);
      }
    }
  }

  // Mobile: Stack layout
  if (isMobile) {
    return (
      <div className={styles.mobileGrid} data-grid-container>
        {children}
      </div>
    );
  }

  // Desktop: Grid layout
  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${GRID_COLS}, ${TILE_SIZE})`,
    gridTemplateRows: `repeat(${GRID_ROWS}, ${TILE_SIZE})`,
    gap: GAP,
    width: gridWidth,
    height: gridHeight,
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
              width: TILE_SIZE,
              height: TILE_SIZE,
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
  const isMobile = useIsMobile();
  const [cols, rows] = size.split("x").map(Number);
  const itemWidth = `calc(${cols} * ${TILE_SIZE} + ${cols - 1} * ${GAP})`;
  const itemHeight = `calc(${rows} * ${TILE_SIZE} + ${rows - 1} * ${GAP})`;

  // Mobile: Full-width stacked cards
  if (isMobile) {
    return (
      <div className={styles.mobileItem} onDragOver={onDragOver} onDrop={onDrop}>
        {children}
      </div>
    );
  }

  // Desktop: Grid positioning
  const itemStyle: React.CSSProperties = {
    gridColumn: `${position.x + 1} / span ${cols}`,
    gridRow: `${position.y + 1} / span ${rows}`,
    width: itemWidth,
    height: itemHeight,
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


