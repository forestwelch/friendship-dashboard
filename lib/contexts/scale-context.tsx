"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Scale = 1 | 2 | 4;

interface ScaleContextType {
  scale: Scale;
  setScale: (scale: Scale) => void;
}

const ScaleContext = createContext<ScaleContextType | undefined>(undefined);

export function ScaleProvider({ children }: { children: ReactNode }) {
  const [scale, setScaleState] = useState<Scale>(() => {
    if (typeof window === "undefined") return 2;
    const saved = localStorage.getItem("global-scale");
    return saved === "1" || saved === "2" || saved === "4" ? (parseInt(saved) as Scale) : 2;
  });

  useEffect(() => {
    localStorage.setItem("global-scale", scale.toString());
    // Apply scale to root CSS variables
    const root = document.documentElement;
    root.setAttribute("data-scale", scale.toString());
  }, [scale]);

  const setScale = (newScale: Scale) => {
    setScaleState(newScale);
  };

  return <ScaleContext.Provider value={{ scale, setScale }}>{children}</ScaleContext.Provider>;
}

export function useScale() {
  const context = useContext(ScaleContext);
  if (!context) {
    throw new Error("useScale must be used within ScaleProvider");
  }
  return context;
}
