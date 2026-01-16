"use client";

import { useState } from "react";
import { playSound } from "@/lib/sounds";
import { ThemeColors } from "@/lib/types";
import { getUserColor } from "@/lib/utils/color-utils";
import styles from "./TicTacToe.module.css";

interface IconSelectorProps {
  currentUserId: string;
  friendId: string;
  themeColors: ThemeColors;
  currentIcon: string | null;
  onConfirm: (icon: string) => void;
  onCancel?: () => void;
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
] as const;

export function IconSelector({
  currentUserId,
  friendId,
  themeColors,
  currentIcon,
  onConfirm,
  onCancel,
}: IconSelectorProps) {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(currentIcon);

  const iconColor = getUserColor(currentUserId, friendId, themeColors);

  const handleIconClick = (icon: string) => {
    setSelectedIcon(icon);
    playSound("select");
  };

  const handleConfirm = () => {
    if (selectedIcon) {
      onConfirm(selectedIcon);
    }
  };

  return (
    <div className={styles.iconSelector}>
      <div className={styles.iconSelectorTitle}>PICK YOUR ICON</div>
      <div className={styles.iconGrid}>
        {AVAILABLE_ICONS.map((icon) => {
          const isSelected = selectedIcon === icon;
          return (
            <button
              key={icon}
              className={`${styles.iconButton} ${isSelected ? styles.iconButtonSelected : ""}`}
              onClick={() => handleIconClick(icon)}
              style={
                {
                  "--icon-color": iconColor,
                } as React.CSSProperties
              }
            >
              <i className={`hn ${icon} ${styles.iconDisplay}`} />
            </button>
          );
        })}
      </div>
      {selectedIcon && (
        <div className={styles.iconSelectorFooter}>
          <div className={styles.selectedIconDisplay}>
            <span className={styles.selectedLabel}>Selected:</span>
            <i
              className={`hn ${selectedIcon} ${styles.selectedIcon}`}
              style={
                {
                  "--icon-color": iconColor,
                } as React.CSSProperties
              }
            />
          </div>
          <div className={styles.iconSelectorActions}>
            {onCancel && (
              <button className={styles.cancelButton} onClick={onCancel}>
                CANCEL
              </button>
            )}
            <button className={styles.confirmButton} onClick={handleConfirm}>
              CONFIRM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
