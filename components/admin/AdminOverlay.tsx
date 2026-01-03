"use client";

import React from "react";
import styles from "./AdminOverlay.module.css";

interface AdminOverlayProps {
  widgetId: string;
  onDelete: () => void;
  onMove?: () => void;
  onEdit?: () => void;
}

export function AdminOverlay({ widgetId, onDelete, onMove, onEdit }: AdminOverlayProps) {
  return (
    <div data-widget-item={widgetId} className={styles.overlay}>
      <div className={styles.buttons}>
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className={`${styles.button} ${styles.buttonEdit}`}
          >
            <i className="hn hn-cog-solid" />
            EDIT
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={`${styles.button} ${styles.buttonDelete}`}
        >
          <i className="hn hn-trash-solid" />
          DEL
        </button>
        {onMove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMove();
            }}
            className={`${styles.button} ${styles.buttonMove}`}
          >
            <i className="hn hn-arrow-up-solid" />
            MOVE
          </button>
        )}
      </div>
    </div>
  );
}
