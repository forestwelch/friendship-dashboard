"use client";

import React from "react";
import { WidgetSize } from "@/lib/types";
import { playSound } from "@/lib/sounds";
import styles from "./WidgetConfigModal.module.css";

interface BaseWidgetConfigModalProps {
  title: string;
  selectedSize: WidgetSize | null;
  availableSizes: WidgetSize[];
  onSizeChange: (size: WidgetSize) => void;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
}

export function BaseWidgetConfigModal({
  title,
  selectedSize,
  availableSizes,
  onSizeChange,
  onClose,
  onSave,
  children,
}: BaseWidgetConfigModalProps) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`game-card ${styles.modalContent}`} onClick={(e) => e.stopPropagation()}>
        <div className={`game-flex game-flex-between ${styles.modalHeader}`}>
          <h2 className={`game-heading-2 ${styles.modalTitle}`}>{title}</h2>
          <button
            className={`game-button game-button-icon ${styles.closeButton}`}
            onClick={() => {
              playSound("close");
              onClose();
            }}
            aria-label="Close"
          >
            <i className="hn hn-times-solid" />
          </button>
        </div>

        {/* Widget Size Selector */}
        {availableSizes.length > 0 && (
          <div className={styles.configSection}>
            <h3 className={`game-heading-3 ${styles.configSectionTitle}`}>Widget Size</h3>
            <div className={`game-flex game-flex-gap-sm ${styles.sizeButtons}`}>
              {availableSizes.map((size) => (
                <button
                  key={size}
                  className={`game-button ${selectedSize === size ? "game-button-primary" : ""}`}
                  onClick={() => {
                    playSound("click");
                    onSizeChange(size);
                  }}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Widget-specific config content */}
        {children}

        {/* Action Buttons */}
        <div className={`game-flex game-flex-gap-sm ${styles.buttonRow}`}>
          <button className="game-button" onClick={onClose}>
            Cancel
          </button>
          <button className="game-button game-button-primary" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
