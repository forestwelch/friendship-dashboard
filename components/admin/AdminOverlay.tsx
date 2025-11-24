"use client";

import React from "react";

interface AdminOverlayProps {
  widgetId: string;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onEdit?: () => void;
}

export function AdminOverlay({
  widgetId,
  onDelete,
  onDragStart,
  onEdit,
}: AdminOverlayProps) {
  return (
    <div
      data-widget-item={widgetId}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "var(--game-overlay-bg-70)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        cursor: "grab",
        border: "var(--border-width-lg) dashed var(--secondary)",
        borderRadius: "var(--radius-sm)",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      draggable={true}
      onDragStart={onDragStart}
      onDragEnd={(e) => {
        // Reset opacity
        if (e.currentTarget instanceof HTMLElement) {
          e.currentTarget.style.opacity = "";
        }
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-xs)",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
        }}
      >
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={{
              padding: "var(--space-xs) var(--space-sm)",
              background: "var(--secondary)",
              color: "var(--text)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              fontSize: "var(--font-size-xs)",
              fontWeight: "bold",
              textTransform: "uppercase",
              boxShadow: "var(--game-shadow-md)",
              minWidth: "60px",
            }}
          >
            <i
              className="hn hn-cog-solid"
              style={{
                fontSize: "var(--font-size-xs)",
                marginRight: "var(--space-xs)",
              }}
            />
            EDIT
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            padding: "var(--space-xs) var(--space-sm)",
            background: "var(--accent)",
            color: "var(--text)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
            fontSize: "var(--font-size-xs)",
            fontWeight: "bold",
            textTransform: "uppercase",
            boxShadow: "var(--game-shadow-md)",
            minWidth: "60px",
          }}
        >
          <i
            className="hn hn-trash-solid"
            style={{
              fontSize: "var(--font-size-xs)",
              marginRight: "var(--space-xs)",
            }}
          />
          DEL
        </button>
        <div
          style={{
            color: "var(--text)",
            fontSize: "var(--font-size-xs)",
            fontWeight: "bold",
            textShadow: `calc(var(--border-width-md) * 1) calc(var(--border-width-md) * 1) 0 var(--game-overlay-bg-80)`,
            textAlign: "center",
          }}
        >
          DRAG
        </div>
      </div>
    </div>
  );
}
