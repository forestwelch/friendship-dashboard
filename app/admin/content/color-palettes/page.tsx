"use client";

import React, { useState, useEffect } from "react";
import { playSound } from "@/lib/sounds";
import { Navigation } from "@/components/Navigation";
import { ColorPalette } from "@/lib/queries-color-palettes";
import "@/styles/content-page.css";

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

          {error && (
            <div style={{ color: "var(--accent)", marginBottom: "var(--space-md)" }}>{error}</div>
          )}

          <button
            onClick={() => {
              window.location.href = `/admin/content/color-palettes/new`;
            }}
            className="game-button"
            style={{
              marginBottom: "var(--space-lg)",
              background: "var(--primary)",
              color: "var(--bg)",
              borderColor: "var(--accent)",
            }}
          >
            CREATE NEW PALETTE
          </button>

          {loading ? (
            <div>Loading palettes...</div>
          ) : palettes.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No palettes saved yet. Create one to get started!</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "var(--space-md)",
              }}
            >
              {palettes.map((palette) => (
                <div
                  key={palette.id}
                  className="game-card"
                  style={{
                    cursor: "pointer",
                    padding: "var(--space-md)",
                    border: "var(--border-width-md) solid var(--accent)",
                  }}
                  onClick={() => {
                    window.location.href = `/admin/content/color-palettes/${palette.id}`;
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "var(--space-xs)",
                      marginBottom: "var(--space-sm)",
                    }}
                  >
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        background: palette.primary,
                        border: "1px solid var(--game-border)",
                        borderRadius: "var(--radius-sm)",
                      }}
                      title="Primary"
                    />
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        background: palette.secondary,
                        border: "1px solid var(--game-border)",
                        borderRadius: "var(--radius-sm)",
                      }}
                      title="Secondary"
                    />
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        background: palette.accent,
                        border: "1px solid var(--game-border)",
                        borderRadius: "var(--radius-sm)",
                      }}
                      title="Accent"
                    />
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        background: palette.bg,
                        border: "1px solid var(--game-border)",
                        borderRadius: "var(--radius-sm)",
                      }}
                      title="Background"
                    />
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        background: palette.text,
                        border: "1px solid var(--game-border)",
                        borderRadius: "var(--radius-sm)",
                      }}
                      title="Text"
                    />
                  </div>
                  <div
                    style={{
                      fontSize: "var(--font-size-xs)",
                      opacity: 0.7,
                      marginBottom: "var(--space-sm)",
                    }}
                  >
                    {new Date(palette.created_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={(e) => handleDelete(palette.id, e)}
                    className="game-button"
                    style={{
                      width: "100%",
                      background: "var(--secondary)",
                      color: "var(--bg)",
                      borderColor: "var(--accent)",
                      fontSize: "var(--font-size-xs)",
                      padding: "var(--space-xs)",
                    }}
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
