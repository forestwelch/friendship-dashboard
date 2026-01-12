"use client";

import React from "react";
import { FriendWidget } from "@/lib/queries";
import { GridItem } from "@/components/Grid";
import { WidgetRenderer } from "@/components/WidgetRenderer";
import styles from "./Widget.module.css";

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
      style={
        {
          "--widget-z-index": 10,
        } as React.CSSProperties
      }
    >
      <div
        className={styles.editableWidgetContainer}
        onMouseEnter={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        onMouseLeave={(e) => {
          e.stopPropagation();
          // Don't clear editingWidget on mouse leave - let it persist
        }}
      >
        <div className={styles.editableWidgetContent}>
          <WidgetRenderer widget={widget} />
        </div>
        {editingWidget === widget.id && (
          <div className="widget-edit-menu">
            <span>
              {widget.widget_name} ({widget.size})
            </span>
            <button
              className="game-button game-button-icon widget-edit-button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onConfigure();
              }}
              title="Configure"
            >
              <i className="hn hn-cog-solid" />
            </button>
            <button
              className="game-button game-button-icon widget-edit-button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDuplicate();
              }}
              title="Duplicate"
            >
              <i className="hn hn-clipboard-solid" />
            </button>
            <button
              className="game-button game-button-icon widget-edit-button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onMove();
              }}
              title="Move"
            >
              <i className="hn hn-arrow-up-solid" />
            </button>
            <button
              className="game-button game-button-danger game-button-icon widget-edit-button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete();
              }}
              title="Delete"
            >
              <i className="hn hn-times-solid" />
            </button>
          </div>
        )}
      </div>
    </GridItem>
  );
}
