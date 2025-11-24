"use client";

import React from "react";
import { useTheme } from "@/lib/theme-context";

interface ViewEditToggleProps {
  isEditMode: boolean;
  onToggle: (isEdit: boolean) => void;
}

export function ViewEditToggle({ isEditMode, onToggle }: ViewEditToggleProps) {
  const _theme = useTheme();
  
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-xs)",
        background: "transparent",
        border: "var(--border-width-md) solid var(--accent)",
        borderRadius: "var(--radius-sm)",
        padding: "2px",
      }}
    >
      <button
        onClick={() => onToggle(false)}
        style={{
          padding: "var(--space-xs) var(--space-sm)",
          fontSize: "var(--font-size-sm)",
          fontWeight: "bold",
          background: !isEditMode ? "var(--primary)" : "transparent",
          color: !isEditMode ? "var(--bg)" : "var(--text)",
          border: "none",
          borderRadius: "var(--radius-sm)",
          cursor: "pointer",
          transition: "all var(--transition-fast)",
          textTransform: "uppercase",
          height: "var(--height-button)",
          minHeight: "var(--height-button)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        VIEW
      </button>
      <button
        onClick={() => onToggle(true)}
        style={{
          padding: "var(--space-xs) var(--space-sm)",
          fontSize: "var(--font-size-sm)",
          fontWeight: "bold",
          background: isEditMode ? "var(--secondary)" : "transparent",
          color: isEditMode ? "var(--text)" : "var(--text)",
          border: "none",
          borderRadius: "var(--radius-sm)",
          cursor: "pointer",
          transition: "all var(--transition-fast)",
          textTransform: "uppercase",
          height: "var(--height-button)",
          minHeight: "var(--height-button)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        EDIT
      </button>
    </div>
  );
}

