"use client";

import React from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";
import { useUIStore } from "@/lib/store/ui-store";
import { FridgeMagnetsModal } from "./FridgeMagnetsModal";
import { useFridgeState } from "@/lib/queries-fridge-hooks";

interface FridgeMagnetsProps {
  size: WidgetSize;
  friendId: string;
}

export function FridgeMagnets({ size, friendId }: FridgeMagnetsProps) {
  const { setOpenModal } = useUIStore();
  const modalId = `fridgemagnets-${friendId}`;

  const { data: fridgeState } = useFridgeState(friendId);
  const magnets = fridgeState?.magnets || [];

  const handleClick = () => {
    setOpenModal(modalId);
  };

  // Only support 2x3 size
  if (size !== "2x3") {
    return (
      <Widget size={size}>
        <div className="widget-error-message">Fridge Magnets only supports 2×3 size</div>
      </Widget>
    );
  }

  // Calculate preview scale (widget is 2x3, modal is also 2x3 but larger)
  const previewWidth = 100; // Approximate widget width in pixels
  const previewHeight = 150; // Approximate widget height in pixels
  const modalWidth = 400; // Approximate modal width
  const modalHeight = 600; // Approximate modal height
  const scaleX = previewWidth / modalWidth;
  const scaleY = previewHeight / modalHeight;

  return (
    <>
      <Widget size={size}>
        <div onClick={handleClick} className="widget-clickable fridge-preview">
          {/* Scaled preview of magnets */}
          {magnets.map((magnet, idx) => (
            <div
              key={idx}
              className="magnet-preview"
              style={{
                left: `${magnet.x * scaleX}px`,
                top: `${magnet.y * scaleY}px`,
                fontSize: `${10 * Math.min(scaleX, scaleY)}px`,
              }}
            >
              {magnet.type === "icon" ? (
                <i className="hn hn-bars-solid" style={{ fontSize: "inherit" }} />
              ) : (
                magnet.value
              )}
            </div>
          ))}
        </div>
      </Widget>
      <FridgeMagnetsModal friendId={friendId} />
    </>
  );
}
