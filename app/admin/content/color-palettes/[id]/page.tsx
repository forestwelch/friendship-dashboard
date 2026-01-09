"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { playSound } from "@/lib/sounds";
import { Navigation } from "@/components/Navigation";
import { FriendPageClient } from "@/app/[friend]/FriendPageClient";
import { Friend, Song } from "@/lib/types";
import { FriendWidget } from "@/lib/queries";
import { ColorPalette } from "@/lib/queries-color-palettes";
import { ColorSettings } from "@/components/admin/ColorSettings";
import { ThemeProvider, useThemeContext } from "@/lib/theme-context";
import { hexToHsl, hslToHex } from "@/lib/color-utils";
import "@/styles/content-page.css";

// Default colors for new palettes (in hex)
const DEFAULT_COLORS_HEX = {
  primary: "#4a9eff",
  secondary: "#6abfff",
  accent: "#2a7fff",
  bg: "#0a1a2e",
  text: "#c8e0ff",
};

// Convert to HSL for ColorSettings component
const DEFAULT_COLORS = {
  primary: hexToHsl(DEFAULT_COLORS_HEX.primary) || "hsl(210, 100%, 65%)",
  secondary: hexToHsl(DEFAULT_COLORS_HEX.secondary) || "hsl(210, 100%, 75%)",
  accent: hexToHsl(DEFAULT_COLORS_HEX.accent) || "hsl(210, 100%, 60%)",
  bg: hexToHsl(DEFAULT_COLORS_HEX.bg) || "hsl(220, 60%, 10%)",
  text: hexToHsl(DEFAULT_COLORS_HEX.text) || "hsl(210, 100%, 85%)",
};

// Preview panel component that manages theme
function PreviewPanel({
  draftColors,
  previewFriend,
  mockWidgets,
  mockSongs,
}: {
  draftColors: typeof DEFAULT_COLORS;
  previewFriend: Friend;
  mockWidgets: FriendWidget[];
  mockSongs: Song[];
}) {
  const { setTheme } = useThemeContext();

  // Update theme whenever draft colors change (convert HSL to hex for theme)
  React.useEffect(() => {
    setTheme({
      primary: hslToHex(draftColors.primary),
      secondary: hslToHex(draftColors.secondary),
      accent: hslToHex(draftColors.accent),
      bg: hslToHex(draftColors.bg),
      text: hslToHex(draftColors.text),
    });
  }, [draftColors, setTheme]);

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        background: hslToHex(draftColors.bg),
      }}
    >
      <FriendPageClient
        friend={previewFriend}
        initialWidgets={mockWidgets}
        songs={mockSongs}
        pixelArtMap={new Map()}
        pixelArtBySize={new Map()}
        forceViewMode={true}
      />
    </div>
  );
}

export default function ColorPaletteEditPage() {
  const params = useParams();
  const router = useRouter();
  const paletteId = params.id as string;
  const isNew = paletteId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [editingPalette, setEditingPalette] = useState<ColorPalette | null>(null);
  const [draftColors, setDraftColors] = useState(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`color-palette-draft-${paletteId}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Invalid JSON, use defaults
        }
      }
    }
    return DEFAULT_COLORS;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testFriendData, setTestFriendData] = useState<{
    friend: Friend;
    widgets: FriendWidget[];
    songs: Song[];
  } | null>(null);
  const [previewWidgets, setPreviewWidgets] = useState<FriendWidget[]>([]);

  // Fetch test friend data from database
  useEffect(() => {
    const loadTestFriendData = async () => {
      try {
        // Fetch friend page data (includes widgets)
        const friendResponse = await fetch("/api/friends/test");
        if (!friendResponse.ok) {
          console.error("Failed to fetch test friend data");
          return;
        }
        const friendData = await friendResponse.json();

        // Fetch songs (global content)
        const songsResponse = await fetch("/api/content/top_10_songs");
        const songsData = await songsResponse.json();

        setTestFriendData({
          friend: friendData.friend,
          widgets: friendData.widgets || [],
          songs: songsData.songs || [],
        });
        setPreviewWidgets(friendData.widgets || []);
      } catch (err) {
        console.error("Error loading test friend data:", err);
      }
    };

    loadTestFriendData();
  }, []);

  // Load palette function - defined before useEffect that uses it
  const loadPalette = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/content/color-palettes");
      const data = await response.json();
      const palettes = data.palettes || [];
      const palette = palettes.find((p: ColorPalette) => p.id === paletteId);

      if (!palette) {
        setError("Palette not found");
        return;
      }

      setEditingPalette(palette);
      // Convert hex to HSL for ColorSettings component
      setDraftColors({
        primary: hexToHsl(palette.primary) || palette.primary,
        secondary: hexToHsl(palette.secondary) || palette.secondary,
        accent: hexToHsl(palette.accent) || palette.accent,
        bg: hexToHsl(palette.bg) || palette.bg,
        text: hexToHsl(palette.text) || palette.text,
      });
    } catch (err) {
      console.error("Error loading palette:", err);
      setError("Failed to load palette");
    } finally {
      setLoading(false);
    }
  }, [paletteId]);

  // Preview friend with current draft colors (convert HSL to hex)
  // Use test friend as base, but override colors with draft colors
  // IMPORTANT: Keep the real test friend ID so widgets can load their data from the database
  const previewFriend: Friend | null = testFriendData
    ? {
        ...testFriendData.friend,
        // Keep the real friend ID so widgets can fetch their state (Connect Four, Fridge Magnets, etc.)
        id: testFriendData.friend.id,
        name: testFriendData.friend.name,
        slug: testFriendData.friend.slug,
        // Override colors with draft colors for preview
        color_primary: hslToHex(draftColors.primary),
        color_secondary: hslToHex(draftColors.secondary),
        color_accent: hslToHex(draftColors.accent),
        color_bg: hslToHex(draftColors.bg),
        color_text: hslToHex(draftColors.text),
      }
    : null;

  // Load palette if editing existing
  useEffect(() => {
    if (!isNew) {
      loadPalette();
    }
  }, [isNew, loadPalette]);

  // Persist draft colors to localStorage
  useEffect(() => {
    localStorage.setItem(`color-palette-draft-${paletteId}`, JSON.stringify(draftColors));
  }, [draftColors, paletteId]);

  // Refresh widgets from test friend when test friend data changes
  useEffect(() => {
    if (testFriendData) {
      setPreviewWidgets([...testFriendData.widgets]);
    }
  }, [testFriendData]);

  const handleColorChange = useCallback((colorKey: string, value: string) => {
    setDraftColors((prev: typeof DEFAULT_COLORS) => ({
      ...prev,
      [colorKey]: value,
    }));
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Convert HSL to hex for API
      const hexColors = {
        primary: hslToHex(draftColors.primary),
        secondary: hslToHex(draftColors.secondary),
        accent: hslToHex(draftColors.accent),
        bg: hslToHex(draftColors.bg),
        text: hslToHex(draftColors.text),
      };

      if (editingPalette) {
        // Update existing palette
        const response = await fetch("/api/content/color-palettes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingPalette.id,
            ...hexColors,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to update palette");
        }
      } else {
        // Create new palette
        const response = await fetch("/api/content/color-palettes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(hexColors),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to save palette");
        }

        const data = await response.json();
        // Navigate to the new palette's edit page
        router.push(`/admin/content/color-palettes/${data.palette.id}`);
        return;
      }

      playSound("success");
      // Clear localStorage
      localStorage.removeItem(`color-palette-draft-${paletteId}`);
      localStorage.removeItem(`color-palette-widgets-${paletteId}`);
      // Navigate back to list
      router.push("/admin/content/color-palettes");
    } catch (err) {
      console.error("Error saving palette:", err);
      setError(err instanceof Error ? err.message : "Failed to save palette");
      playSound("error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingPalette) return;
    if (!confirm("Are you sure you want to delete this palette?")) {
      return;
    }

    try {
      const response = await fetch(`/api/content/color-palettes?id=${editingPalette.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete palette");
      }

      playSound("success");
      // Clear localStorage
      localStorage.removeItem(`color-palette-draft-${paletteId}`);
      localStorage.removeItem(`color-palette-widgets-${paletteId}`);
      // Navigate back to list
      router.push("/admin/content/color-palettes");
    } catch (err) {
      console.error("Error deleting palette:", err);
      setError(err instanceof Error ? err.message : "Failed to delete palette");
      playSound("error");
    }
  };

  const handleClonePalette = () => {
    if (!editingPalette) return;
    // Navigate to new palette with cloned colors
    const clonedColors = {
      primary: hexToHsl(editingPalette.primary) || editingPalette.primary,
      secondary: hexToHsl(editingPalette.secondary) || editingPalette.secondary,
      accent: hexToHsl(editingPalette.accent) || editingPalette.accent,
      bg: hexToHsl(editingPalette.bg) || editingPalette.bg,
      text: hexToHsl(editingPalette.text) || editingPalette.text,
    };
    localStorage.setItem("color-palette-draft-new", JSON.stringify(clonedColors));
    router.push("/admin/content/color-palettes/new");
    playSound("blip");
  };

  const handleCancel = () => {
    // Clear localStorage
    localStorage.removeItem(`color-palette-draft-${paletteId}`);
    router.push("/admin/content/color-palettes");
    playSound("close");
  };

  const handleShuffleColors = () => {
    // Get current color values
    const colorValues = [
      draftColors.primary,
      draftColors.secondary,
      draftColors.accent,
      draftColors.bg,
      draftColors.text,
    ];

    // Shuffle the array using Fisher-Yates algorithm
    const shuffled = [...colorValues];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Assign shuffled values back to color keys
    setDraftColors({
      primary: shuffled[0],
      secondary: shuffled[1],
      accent: shuffled[2],
      bg: shuffled[3],
      text: shuffled[4],
    });

    playSound("blip");
  };

  if (loading || !testFriendData || !previewFriend) {
    return (
      <>
        <Navigation />
        <div className="admin-page content-page">
          <div className="game-container content-container">
            <div>Loading palette and test friend data...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <ThemeProvider>
      <Navigation />
      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Left Panel - Color Editor */}
        <div
          style={{
            width: "400px",
            flexShrink: 0,
            background: "var(--bg)",
            borderRight: "var(--border-width-lg) solid var(--accent)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            paddingTop: "calc(var(--space-xl) + 60px)",
          }}
        >
          <div style={{ padding: "var(--space-lg)" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--space-lg)",
              }}
            >
              <h2 className="game-heading-2">{isNew ? "NEW PALETTE" : "EDIT PALETTE"}</h2>
              <button
                onClick={handleCancel}
                className="game-button"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text)",
                  fontSize: "var(--font-size-xl)",
                  padding: "var(--space-xs)",
                }}
              >
                <i className="hn hn-times-solid" />
              </button>
            </div>

            {error && (
              <div
                style={{
                  color: "var(--accent)",
                  marginBottom: "var(--space-md)",
                  padding: "var(--space-sm)",
                  background: "var(--secondary)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {error}
              </div>
            )}

            <ColorSettings
              friendId="preview"
              currentColors={draftColors}
              onColorChange={handleColorChange}
              themeColors={draftColors}
              onRandomizeAll={undefined}
            />

            <button
              onClick={handleShuffleColors}
              className="game-button"
              style={{
                width: "100%",
                marginTop: "var(--space-md)",
                background: "var(--secondary)",
                color: "var(--bg)",
                borderColor: "var(--accent)",
              }}
            >
              SHUFFLE COLORS
            </button>

            <div
              style={{
                display: "flex",
                gap: "var(--space-sm)",
                marginTop: "var(--space-lg)",
              }}
            >
              {editingPalette && (
                <button
                  onClick={handleClonePalette}
                  className="game-button"
                  style={{
                    flex: 1,
                    background: "var(--secondary)",
                    color: "var(--bg)",
                    borderColor: "var(--accent)",
                  }}
                  disabled={saving}
                >
                  CLONE
                </button>
              )}
              <button
                onClick={handleSave}
                className="game-button"
                style={{
                  flex: 1,
                  background: "var(--primary)",
                  color: "var(--bg)",
                  borderColor: "var(--accent)",
                }}
                disabled={saving}
              >
                {saving ? "SAVING..." : "SAVE"}
              </button>
              {editingPalette && (
                <button
                  onClick={handleDelete}
                  className="game-button"
                  style={{
                    background: "var(--accent)",
                    color: "var(--bg)",
                    borderColor: "var(--accent)",
                  }}
                  disabled={saving}
                >
                  DELETE
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <PreviewPanel
          draftColors={draftColors}
          previewFriend={previewFriend}
          mockWidgets={previewWidgets}
          mockSongs={testFriendData.songs}
        />
      </div>
    </ThemeProvider>
  );
}
