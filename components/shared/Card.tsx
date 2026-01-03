"use client";

import React from "react";
import clsx from "clsx";
import styles from "./Card.module.css";

interface CardProps {
  variant?: "default" | "primary" | "accent" | "secondary";
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ variant = "default", children, className, onClick }: CardProps) {
  const variantClass = variant !== "default" ? styles[`card-${variant}`] : "";

  return (
    <div
      className={clsx(styles.card, variantClass, className)}
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      {children}
    </div>
  );
}
