"use client";

import { useEffect, RefObject } from "react";

/**
 * Hook to calculate and apply grid scale factor dynamically
 * This ensures consistent scaling across all browsers, including Firefox
 *
 * @param gridRef - Ref to the grid container wrapper element
 */
export function useGridScale(gridRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const gridContainer = gridRef.current?.querySelector("[data-grid-container]") as HTMLElement;
    if (!gridContainer) return;

    // Always calculate scale with JavaScript for reliability across all browsers
    const calculateScale = () => {
      if (!gridContainer) return;

      // Get grid dimensions from CSS custom properties (in rem)
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const computedStyle = getComputedStyle(gridContainer);
      const gridWidthRem = parseFloat(computedStyle.getPropertyValue("--grid-width")) || 0;
      const gridHeightRem = parseFloat(computedStyle.getPropertyValue("--grid-height")) || 0;

      if (!gridWidthRem || !gridHeightRem) {
        // If CSS variables aren't available, try getBoundingClientRect as fallback
        const gridRect = gridContainer.getBoundingClientRect();
        if (gridRect.width && gridRect.height) {
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const rootStyle = getComputedStyle(document.documentElement);
          const buttonHeightRem = parseFloat(rootStyle.getPropertyValue("--height-button")) || 1.25;
          const spaceMdRem = parseFloat(rootStyle.getPropertyValue("--space-md")) || 0.625;
          const navHeight = (buttonHeightRem + spaceMdRem) * rootFontSize;
          const availableWidth = viewportWidth - 32;
          const availableHeight = viewportHeight - navHeight - 32;
          const scaleWidth = availableWidth / gridRect.width;
          const scaleHeight = availableHeight / gridRect.height;
          const scaleFactor = Math.min(scaleWidth, scaleHeight, 1);
          gridContainer.style.setProperty("--scale-factor-js", String(scaleFactor));
          gridContainer.style.transform = `scale(${scaleFactor})`;
          return;
        }
        return;
      }

      // Convert rem to pixels
      const gridWidthPx = gridWidthRem * rootFontSize;
      const gridHeightPx = gridHeightRem * rootFontSize;

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Get navigation height from CSS custom properties
      const rootStyle = getComputedStyle(document.documentElement);
      const buttonHeightRem = parseFloat(rootStyle.getPropertyValue("--height-button")) || 1.25;
      const spaceMdRem = parseFloat(rootStyle.getPropertyValue("--space-md")) || 0.625;
      const navHeight = (buttonHeightRem + spaceMdRem) * rootFontSize;

      // Calculate available space (accounting for padding: 2rem = 32px)
      const availableWidth = viewportWidth - 32;
      const availableHeight = viewportHeight - navHeight - 32;

      // Calculate scale factors
      const scaleWidth = availableWidth / gridWidthPx;
      const scaleHeight = availableHeight / gridHeightPx;

      // Use the smaller scale factor, capped at 1 (don't scale up)
      const scaleFactor = Math.min(scaleWidth, scaleHeight, 1);

      // Apply scale directly via inline style for maximum compatibility
      // Also set CSS custom property for CSS fallback
      gridContainer.style.setProperty("--scale-factor-js", String(scaleFactor));
      gridContainer.style.transform = `scale(${scaleFactor})`;
      gridContainer.style.transformOrigin = "center center";
    };

    // Calculate immediately and after a short delay to ensure DOM is fully rendered
    calculateScale();

    // Use requestAnimationFrame to ensure layout is complete
    let timeoutId: NodeJS.Timeout | null = null;
    const rafId = requestAnimationFrame(() => {
      calculateScale();
      // Also run after a small delay to catch any late layout changes
      timeoutId = setTimeout(calculateScale, 100);
    });

    // Calculate on resize and orientation change
    window.addEventListener("resize", calculateScale);
    window.addEventListener("orientationchange", calculateScale);

    return () => {
      cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("resize", calculateScale);
      window.removeEventListener("orientationchange", calculateScale);
    };
  }, [gridRef]);
}
