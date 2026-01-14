"use client";

import React, { useCallback } from "react";
import { Shimmer } from "@/components/shared";
import { Widget } from "@/components/Widget";
import { Grid, GridItem } from "@/components/Grid";
import { useThemeContext } from "@/lib/contexts/theme-context";
import { ThemeColors } from "@/lib/types";
import { Button } from "@/components/shared";
import styles from "./page.module.css";

const animations = ["blockfill", "verticalwipe"] as const;

const sizes = [
  { label: "Small", height: "100px" },
  { label: "Medium", height: "200px" },
  { label: "Large", height: "300px" },
  { label: "Extra Large", height: "400px" },
] as const;

export default function ShimmerTestPage() {
  const { colors: themeColors, setTheme } = useThemeContext();

  const handleRandomizeTheme = useCallback(() => {
    const defaultPalettes: ThemeColors[] = [
      {
        primary: "#4a9eff",
        secondary: "#ff6b6b",
        accent: "#2a7fff",
        bg: "#0a1a2e",
        text: "#c8e0ff",
      }, // Blue/Red
      {
        primary: "#ff6b6b",
        secondary: "#8bac0f",
        accent: "#ff4a4a",
        bg: "#2e0a0a",
        text: "#ffd0d0",
      }, // Red/Green
      {
        primary: "#8bac0f",
        secondary: "#fbbf24",
        accent: "#6a8a0a",
        bg: "#0f380f",
        text: "#c8e890",
      }, // Green/Yellow
      {
        primary: "#da4167",
        secondary: "#4a9eff",
        accent: "#c8325a",
        bg: "#1e0f1a",
        text: "#ffd0e0",
      }, // Pink/Blue
      {
        primary: "#fbbf24",
        secondary: "#da4167",
        accent: "#f59e0b",
        bg: "#1a0f0a",
        text: "#fef3c7",
      }, // Yellow/Pink
      {
        primary: "#9b59b6",
        secondary: "#e67e22",
        accent: "#8e44ad",
        bg: "#1a0f1a",
        text: "#e8d5f0",
      }, // Purple/Orange
      {
        primary: "#e67e22",
        secondary: "#3498db",
        accent: "#d35400",
        bg: "#1a0f0a",
        text: "#ffe8d5",
      }, // Orange/Blue
      {
        primary: "#3498db",
        secondary: "#e74c3c",
        accent: "#2980b9",
        bg: "#0a1a2e",
        text: "#d5e8ff",
      }, // Blue/Red
      {
        primary: "#e74c3c",
        secondary: "#f39c12",
        accent: "#c0392b",
        bg: "#2e0a0a",
        text: "#ffd0d0",
      }, // Red/Yellow
      {
        primary: "#16a085",
        secondary: "#e74c3c",
        accent: "#138d75",
        bg: "#0a1a1a",
        text: "#d0ffe8",
      }, // Teal/Red
      {
        primary: "#f39c12",
        secondary: "#9b59b6",
        accent: "#e67e22",
        bg: "#1a0f0a",
        text: "#fff3d5",
      }, // Yellow/Purple
      {
        primary: "#1abc9c",
        secondary: "#e74c3c",
        accent: "#16a085",
        bg: "#0a1a1a",
        text: "#d0fff8",
      }, // Cyan/Red
      {
        primary: "#34495e",
        secondary: "#e67e22",
        accent: "#2c3e50",
        bg: "#0a0a0a",
        text: "#ecf0f1",
      }, // Dark Gray/Orange
      {
        primary: "#e91e63",
        secondary: "#00bcd4",
        accent: "#c2185b",
        bg: "#1a0f14",
        text: "#ffd0e0",
      }, // Pink/Cyan
      {
        primary: "#00bcd4",
        secondary: "#ff9800",
        accent: "#0097a7",
        bg: "#0a1a1a",
        text: "#d0f8ff",
      }, // Cyan/Orange
    ];

    const randomPalette = defaultPalettes[Math.floor(Math.random() * defaultPalettes.length)];
    setTheme(randomPalette);
  }, [setTheme]);

  return (
    <div
      className={styles.container}
      style={
        {
          background: themeColors.bg,
          color: themeColors.text,
        } as React.CSSProperties
      }
    >
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>8-Bit Shimmer Component Test</h1>
          <p className={styles.description}>Testing animations with consistent shimmer</p>
        </div>
        <Button onClick={handleRandomizeTheme} className={styles.randomizeButton}>
          <i className="hn hn-shuffle-solid" /> RANDOMIZE THEME
        </Button>
      </div>

      <div className={styles.grid}>
        {animations.map((animation) => (
          <div key={animation} className={styles.animationSection}>
            <h2 className={styles.animationTitle}>Animation: {animation}</h2>

            {/* Different Sizes Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionSubtitle}>Different Sizes</h3>
              <div className={styles.sizesGrid}>
                {sizes.map((size) => (
                  <div key={size.label} className={styles.sizeCard}>
                    <h4 className={styles.sizeTitle}>{size.label}</h4>
                    <div className={styles.shimmerContainer}>
                      <Shimmer animation={animation} height={size.height} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid Layout Test */}
      <div className={styles.gridLayoutSection}>
        <h2 className={styles.sectionTitle}>Grid Layout Test</h2>
        <div className={styles.gridWrapper}>
          <Grid>
            {animations.map((animation, idx) => (
              <GridItem
                key={animation}
                position={{ x: (idx % 2) * 2, y: Math.floor(idx / 2) * 2 }}
                size="2x2"
              >
                <Widget size="2x2">
                  <div className={styles.widgetContent}>
                    <h4>{animation}</h4>
                    <Shimmer animation={animation} />
                  </div>
                </Widget>
              </GridItem>
            ))}
          </Grid>
        </div>
      </div>
    </div>
  );
}
