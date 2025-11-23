"use client";

import React from "react";

interface ViewEditToggleProps {
  isEditMode: boolean;
  onToggle: (isEdit: boolean) => void;
  themeColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    text?: string;
  };
}

export function ViewEditToggle({ isEditMode, onToggle, themeColors }: ViewEditToggleProps) {
  const primary = themeColors?.primary || "var(--game-accent-blue)";
  const secondary = themeColors?.secondary || "var(--game-accent-green)";
  const text = themeColors?.text || "var(--game-text-primary)";
  
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
          background: !isEditMode ? primary : "transparent",
          color: !isEditMode ? "white" : text,
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
          background: isEditMode ? secondary : "transparent",
          color: isEditMode ? "white" : text,
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

