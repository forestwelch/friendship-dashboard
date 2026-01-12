"use client";

import React, { useState, useEffect } from "react";
import { playSound } from "@/lib/sounds";
import { Navigation } from "@/components/shared";
import { ColorPalette } from "@/lib/queries/color-palettes";
import "@/styles/content-page.css";
import styles from "./page.module.css";

export default function ColorPalettesPage() {
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load palettes on mount
  useEffect(() => {
    loadPalettes();
  }, []);

  const loadPalettes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/content/color-palettes");
      const data = await response.json();
      setPalettes(data.palettes || []);
    } catch (err) {
      console.error("Error loading palettes:", err);
      setError("Failed to load palettes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paletteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this palette?")) {
      return;
    }

    try {
      const response = await fetch(`/api/content/color-palettes?id=${paletteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete palette");
      }

      playSound("success");
      await loadPalettes();
    } catch (err) {
      console.error("Error deleting palette:", err);
      setError(err instanceof Error ? err.message : "Failed to delete palette");
      playSound("error");
    }
  };

  return (
    <>
      <Navigation />
      <div className="admin-page content-page">
        <div className="game-container content-container">
          <h1 className="game-heading-1 content-title">COLOR PALETTES</h1>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <button
            onClick={() => {
              window.location.href = `/admin/content/color-palettes/new`;
            }}
            className={`game-button ${styles.createButton}`}
          >
            CREATE NEW PALETTE
          </button>

          {loading ? (
            <div>Loading palettes...</div>
          ) : palettes.length === 0 ? (
            <div className={styles.emptyState}>
              No palettes saved yet. Create one to get started!
            </div>
          ) : (
            <div className={styles.palettesGrid}>
              {palettes.map((palette) => (
                <div
                  key={palette.id}
                  className={`game-card ${styles.paletteCard}`}
                  onClick={() => {
                    window.location.href = `/admin/content/color-palettes/${palette.id}`;
                  }}
                >
                  <div className={styles.colorSwatches}>
                    <div
                      className={styles.colorSwatch}
                      style={{ background: palette.primary } as React.CSSProperties}
                      title="Primary"
                    />
                    <div
                      className={styles.colorSwatch}
                      style={{ background: palette.secondary } as React.CSSProperties}
                      title="Secondary"
                    />
                    <div
                      className={styles.colorSwatch}
                      style={{ background: palette.accent } as React.CSSProperties}
                      title="Accent"
                    />
                    <div
                      className={styles.colorSwatch}
                      style={{ background: palette.bg } as React.CSSProperties}
                      title="Background"
                    />
                    <div
                      className={styles.colorSwatch}
                      style={{ background: palette.text } as React.CSSProperties}
                      title="Text"
                    />
                  </div>
                  <div className={styles.paletteDate}>
                    {new Date(palette.created_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={(e) => handleDelete(palette.id, e)}
                    className={`game-button ${styles.deleteButton}`}
                  >
                    DELETE
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
