"use client";

import React from "react";
import styles from "./Shimmer.module.css";
import clsx from "clsx";

interface ShimmerProps {
  className?: string;
  animation?: "blockfill" | "verticalwipe";
  height?: string;
}

export function Shimmer({ className, animation = "verticalwipe", height }: ShimmerProps) {
  const style = height ? { height } : undefined;

  // Build class names with animation
  const shimmerClasses = clsx(
    styles.shimmer,
    animation && styles[`animation-${animation}`],
    className
  );

  // Single consistent shimmer variant
  return (
    <div className={shimmerClasses} style={style}>
      <div className={styles.shimmerBar} />
    </div>
  );
}
