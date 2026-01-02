"use client";

import React from "react";
import { FriendWidget } from "@/lib/queries";
import { GridItem } from "@/components/Grid";
import { WidgetRenderer } from "@/components/WidgetRenderer";

interface EditableWidgetProps {
  widget: FriendWidget;
  onEdit: () => void;
  onConfigure: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: () => void;
  editingWidget: string | null;
}

export function EditableWidget({
  widget,
  onEdit,
  onConfigure,
  onDuplicate,
  onDelete,
  onMove,
  editingWidget,
}: EditableWidgetProps) {
  return (
    <GridItem
      position={{ x: widget.position_x, y: widget.position_y }}
      size={widget.size}
      style={{
        zIndex: 10,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
        }}
        onMouseEnter={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        onMouseLeave={(e) => {
          e.stopPropagation();
          // Don't clear editingWidget on mouse leave - let it persist
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            pointerEvents: "auto",
          }}
        >
          <WidgetRenderer widget={widget} songs={[]} />
        </div>
        {editingWidget === widget.id && (
          <div
            className="game-card"
            style={{
              position: "absolute",
              top: "var(--space-md)",
              right: "var(--space-md)",
              padding: "var(--space-sm) var(--space-md)",
              fontSize: "11px",
              zIndex: 1000,
              display: "flex",
              gap: "var(--space-sm)",
              alignItems: "center",
              pointerEvents: "auto",
            }}
          >
            <span>
              {widget.widget_name} ({widget.size})
            </span>
            <button
              className="game-button game-button-icon"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onConfigure();
              }}
              style={{
                padding: "var(--space-xs)",
                minWidth: "24px",
                minHeight: "24px",
              }}
              title="Configure"
            >
              ⚙️
            </button>
            <button
              className="game-button game-button-icon"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDuplicate();
              }}
              style={{
                padding: "var(--space-xs)",
                minWidth: "24px",
                minHeight: "24px",
              }}
              title="Duplicate"
            >
              📋
            </button>
            <button
              className="game-button game-button-icon"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onMove();
              }}
              style={{
                padding: "var(--space-xs)",
                minWidth: "24px",
                minHeight: "24px",
                cursor: "pointer",
              }}
              title="Move"
            >
              <i className="hn hn-arrow-up-solid" />
            </button>
            <button
              className="game-button game-button-danger game-button-icon"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete();
              }}
              style={{
                padding: "var(--space-xs)",
                minWidth: "24px",
                minHeight: "24px",
              }}
              title="Delete"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </GridItem>
  );
}
