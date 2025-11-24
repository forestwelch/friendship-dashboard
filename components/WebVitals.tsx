"use client";

import { useEffect } from "react";
import { measureWebVitals } from "@/lib/web-vitals";

export function WebVitals() {
  useEffect(() => {
    measureWebVitals();
  }, []);

  return null;
}

