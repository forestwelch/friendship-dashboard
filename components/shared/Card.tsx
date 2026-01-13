"use client";

import React from "react";
import clsx from "clsx";
import styles from "./Card.module.css";

interface CardProps {
  variant?: "default" | "primary" | "accent" | "secondary";
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Card({ variant = "default", children, className, onClick, style }: CardProps) {
  const variantClass = variant !== "default" ? styles[`card-${variant}`] : "";

  // Extract borderColor from style if present, use CSS custom property
  const borderColor = style?.borderColor;
  const otherStyles = style ? { ...style } : {};
  if (borderColor && typeof borderColor === "string") {
    delete otherStyles.borderColor;
  }

  return (
    <div
      className={clsx(styles.card, variantClass, borderColor && styles.cardBorderColor, className)}
      onClick={onClick}
      style={
        borderColor
          ? ({
              "--card-border-color": borderColor,
              cursor: onClick ? "pointer" : undefined,
              ...otherStyles,
            } as React.CSSProperties)
          : { ...style, cursor: onClick ? "pointer" : undefined }
      }
    >
      {children}
    </div>
  );
}
