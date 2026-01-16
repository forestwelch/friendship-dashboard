"use client";

import { useState } from "react";
import { ThemeColors } from "@/lib/types";
import styles from "./TicTacToe.module.css";

interface IconPickerProps {
  onConfirm: (icon: string) => void;
  onCancel?: () => void;
  userColor: string;
  themeColors: ThemeColors;
  showCancel?: boolean;
}

const AVAILABLE_ICONS = [
  "hn-bullhorn-solid",
  "hn-crown-solid",
  "hn-heart-solid",
  "hn-music-solid",
  "hn-question-solid",
  "hn-trash-alt-solid",
  "hn-face-thinking-solid",
  "hn-eye-solid",
  "hn-people-carry-solid",
  "hn-star-crescent-solid",
];

export function IconPicker({
  onConfirm,
  onCancel,
  userColor,
  showCancel = false,
}: IconPickerProps) {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedIcon) {
      onConfirm(selectedIcon);
    }
  };

  return (
    <div className={styles.iconSelector}>
      <div className={styles.iconSelectorTitle}>CHOOSE YOUR ICON</div>

      <div className={styles.iconGrid}>
        {AVAILABLE_ICONS.map((iconClass) => (
          <button
            key={iconClass}
            type="button"
            className={`${styles.iconButton} ${selectedIcon === iconClass ? styles.iconButtonSelected : ""}`}
            onClick={() => setSelectedIcon(iconClass)}
          >
            <i
              className={`hn ${iconClass}`}
              style={
                {
                  "--icon-color": userColor,
                  fontSize: "2rem",
                } as React.CSSProperties
              }
            />
          </button>
        ))}
      </div>

      <div className={styles.iconSelectorFooter}>
        {selectedIcon && (
          <div className={styles.selectedIconDisplay}>
            <span className={styles.selectedLabel}>Selected:</span>
            <i
              className={`hn ${selectedIcon}`}
              style={
                {
                  "--icon-color": userColor,
                  fontSize: "2rem",
                } as React.CSSProperties
              }
            />
          </div>
        )}

        <div className={styles.iconSelectorActions}>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={!selectedIcon}
          >
            CONFIRM
          </button>
          {showCancel && onCancel && (
            <button type="button" className={styles.cancelButton} onClick={onCancel}>
              CANCEL
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
