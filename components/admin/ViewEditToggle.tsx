"use client";

import React from "react";
import { useTheme } from "@/lib/theme-context";
import styles from "./ViewEditToggle.module.css";
import clsx from "clsx";

interface ViewEditToggleProps {
  isEditMode: boolean;
  onToggle: (isEdit: boolean) => void;
}

export function ViewEditToggle({ isEditMode, onToggle }: ViewEditToggleProps) {
  const _theme = useTheme();

  return (
    <div className={styles.toggleContainer}>
      <button
        onClick={() => onToggle(false)}
        className={clsx(
          styles.toggleButton,
          styles.toggleButtonView,
          !isEditMode && styles.toggleButtonViewActive
        )}
      >
        VIEW
      </button>
      <button
        onClick={() => onToggle(true)}
        className={clsx(
          styles.toggleButton,
          styles.toggleButtonEdit,
          isEditMode && styles.toggleButtonEditActive
        )}
      >
        EDIT
      </button>
    </div>
  );
}
