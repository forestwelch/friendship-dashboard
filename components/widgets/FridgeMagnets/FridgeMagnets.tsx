"use client";

import React from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";
import { useUIStore } from "@/lib/store/ui-store";
import { FridgeMagnetsModal } from "./FridgeMagnetsModal";
import { useFridgeState, getCanvasDimensions } from "./queries";
import { GRID_TILE_SIZE_REM, GRID_GAP_REM } from "@/lib/constants";

interface FridgeMagnetsProps {
  size: WidgetSize;
  friendId: string;
}

export function FridgeMagnets({ size, friendId }: FridgeMagnetsProps) {
  const { setOpenModal } = useUIStore();
  const modalId = `fridgemagnets-${friendId}-${size}`;
  const previewRef = React.useRef<HTMLDivElement>(null);

  const { data: fridgeState } = useFridgeState(friendId);
  const magnets = fridgeState?.magnets || [];

  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = getCanvasDimensions(size);

  const [scale, setScale] = React.useState({ x: 1, y: 1 });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const tileSize = GRID_TILE_SIZE_REM * rootFontSize;
    const gap = GRID_GAP_REM * rootFontSize;

    const [cols, rows] = size.split("x").map(Number);
    const widgetWidth = tileSize * cols + gap * (cols - 1);
    const widgetHeight = tileSize * rows + gap * (rows - 1);

    setScale({
      x: widgetWidth / CANVAS_WIDTH,
      y: widgetHeight / CANVAS_HEIGHT,
    });
  }, [size, CANVAS_WIDTH, CANVAS_HEIGHT]);

  const handleClick = () => {
    setOpenModal(modalId);
  };

  // Support various sizes - validate that it's a reasonable size
  const [cols, rows] = size.split("x").map(Number);
  if (isNaN(cols) || isNaN(rows) || cols < 2 || rows < 3 || cols > 4 || rows > 6) {
    return (
      <Widget size={size}>
        <div className="widget-error-message">Fridge Magnets supports sizes from 2×3 to 4×6</div>
      </Widget>
    );
  }

  return (
    <>
      <Widget size={size}>
        <div
          ref={previewRef}
          onClick={handleClick}
          className="widget-clickable fridge-preview"
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          {magnets
            .filter((m) => !m.inBank)
            .map((magnet, idx) => {
              const magnetSize = 32 * Math.min(scale.x, scale.y);
              const maxX = CANVAS_WIDTH * scale.x - magnetSize;
              const maxY = CANVAS_HEIGHT * scale.y - magnetSize;
              const constrainedX = Math.max(0, Math.min(magnet.x * scale.x, maxX));
              const constrainedY = Math.max(0, Math.min(magnet.y * scale.y, maxY));

              return (
                <div
                  key={idx}
                  className="magnet-preview"
                  style={{
                    left: `${constrainedX}px`,
                    top: `${constrainedY}px`,
                    fontSize: `${magnetSize}px`,
                    color: magnet.color || "#FFFFFF",
                    transform: magnet.rotation ? `rotate(${magnet.rotation}deg)` : undefined,
                  }}
                >
                  {magnet.type === "icon" ? (
                    <i className={magnet.value} style={{ fontSize: "inherit" }} />
                  ) : (
                    magnet.value
                  )}
                </div>
              );
            })}
        </div>
      </Widget>
      <FridgeMagnetsModal friendId={friendId} size={size} />
    </>
  );
}
