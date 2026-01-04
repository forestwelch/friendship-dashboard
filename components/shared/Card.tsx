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

  return (
    <div
      className={clsx(styles.card, variantClass, className)}
      onClick={onClick}
      style={{
        ...style,
        ...(onClick ? { cursor: "pointer" } : undefined),
      }}
    >
      {children}
    </div>
  );
}
