"use client";

import React from "react";
import { WidgetSize } from "@/lib/types";

interface WidgetProps {
  size: WidgetSize;
  children: React.ReactNode;
  className?: string;
}

export function Widget({ size: _size, children, className = "" }: WidgetProps) {
  return (
    <div 
      className={`widget ${className}`} 
      style={{ 
        width: "100%", 
        height: "100%",
        position: "relative",
        zIndex: 2,
        pointerEvents: "auto", // Allow interactions within widget
      }}
    >
      {children}
    </div>
  );
}


