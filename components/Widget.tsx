"use client";

import React from "react";
import { WidgetSize } from "@/lib/types";
import styles from "./Widget.module.css";

interface WidgetProps {
  size: WidgetSize;
  children: React.ReactNode;
  className?: string;
}

export function Widget({ size: _size, children, className = "" }: WidgetProps) {
  return <div className={`widget ${styles.widgetContainer} ${className}`}>{children}</div>;
}
