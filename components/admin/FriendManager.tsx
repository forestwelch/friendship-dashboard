"use client";

import React, { useState, useEffect } from "react";
import { Friend } from "@/lib/types";
import { playSound } from "@/lib/sounds";
import Link from "next/link";
import { ColorPicker } from "./ColorPicker";
import { DEFAULT_THEME_COLORS } from "@/lib/theme-defaults";

export function FriendManager() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFriend, setNewFriend] = useState<{
    name: string;
    slug: string;
    display_name: string;
    color_primary: string;
    color_secondary: string;
    color_accent: string;
    color_bg: string;
    color_text: string;
  }>({
    name: "",
    slug: "",
    display_name: "",
    color_primary: DEFAULT_THEME_COLORS.primary,
    color_secondary: DEFAULT_THEME_COLORS.secondary,
    color_accent: DEFAULT_THEME_COLORS.accent,
    color_bg: DEFAULT_THEME_COLORS.bg,
    color_text: DEFAULT_THEME_COLORS.text,
  });
  const [selectedColor, setSelectedColor] = useState<
    "primary" | "secondary" | "accent" | "bg" | "text"
  >("primary");
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/friends");
      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!newFriend.name || !newFriend.slug || !newFriend.display_name) {
      playSound("error");
      alert("Please fill in name, slug, and display name!");
      return;
    }

    try {
      playSound("select");
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFriend),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create friend");
      }

      playSound("success");
      setNewFriend({
        name: "",
        slug: "",
        display_name: "",
        color_primary: DEFAULT_THEME_COLORS.primary,
        color_secondary: DEFAULT_THEME_COLORS.secondary,
        color_accent: DEFAULT_THEME_COLORS.accent,
        color_bg: DEFAULT_THEME_COLORS.bg,
        color_text: DEFAULT_THEME_COLORS.text,
      });
      setShowAddForm(false);
      fetchFriends();
    } catch (error) {
      playSound("error");
      console.error("Error creating friend:", error);
      alert(error instanceof Error ? error.message : "Failed to create friend");
    }
  };

  const handleColorChange = (colorKey: string, value: string) => {
    setNewFriend((prev) => ({ ...prev, [colorKey]: value }));
  };

  const generateRandomColors = () => {
    const hues = [200, 0, 120, 300, 40];
    const hue = hues[Math.floor(Math.random() * hues.length)];
    const saturation = 70 + Math.random() * 20;
    const lightness1 = 30 + Math.random() * 40;
    const lightness2 = Math.min(lightness1 + 20, 80);
    const lightness3 = Math.max(lightness1 - 10, 10);
    const bgLightness = Math.max(lightness3 - 20, 5);
    const textLightness = Math.min(lightness2 + 30, 95);

    setNewFriend((prev) => ({
      ...prev,
      color_primary: `hsl(${hue}, ${saturation}%, ${lightness1}%)`,
      color_secondary: `hsl(${hue}, ${saturation}%, ${lightness2}%)`,
      color_accent: `hsl(${hue}, ${saturation}%, ${lightness3}%)`,
      color_bg: `hsl(${hue}, ${saturation}%, ${bgLightness}%)`,
      color_text: `hsl(${hue}, ${saturation}%, ${textLightness}%)`,
    }));
    playSound("blip");
  };

  return (
    <div
      className="admin-page"
      style={{
        paddingTop: `calc(var(--height-button) + var(--space-md))`,
        width: "100%",
        maxWidth: "100%",
        minHeight: "100vh",
        overflowX: "hidden",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="game-container"
        style={{
          padding: "var(--space-md)",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div className="game-breadcrumb" style={{ marginBottom: "var(--space-md)", flexShrink: 0 }}>
          <Link href="/" className="game-link">
            Home
          </Link>
          <span className="game-breadcrumb-separator">/</span>
          <span className="game-breadcrumb-current">Manage Friends</span>
        </div>
        <h1 className="game-heading-1" style={{ marginBottom: "var(--space-md)", flexShrink: 0 }}>
          Manage Friends
        </h1>

        {/* Add Friend Button */}
        {!showAddForm && (
          <div style={{ marginBottom: "var(--space-md)", flexShrink: 0 }}>
            <button
              className="game-button game-button-primary"
              onClick={() => {
                setShowAddForm(true);
                playSound("open");
              }}
            >
              <i className="hn hn-plus-solid" style={{ marginRight: "var(--space-sm)" }} />
              ADD FRIEND
            </button>
          </div>
        )}

        {/* Add Friend Form */}
        {showAddForm && (
          <div
            className="game-card"
            style={{
              marginBottom: "var(--space-md)",
              padding: "var(--space-lg)",
              flexShrink: 0,
            }}
          >
            <h2 className="game-heading-2" style={{ marginBottom: "var(--space-md)" }}>
              Add New Friend
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-md)",
              }}
            >
              <div>
                <label
                  className="game-heading-3"
                  style={{ marginBottom: "var(--space-xs)", display: "block" }}
                >
                  Name (lowercase, no spaces)
                </label>
                <input
                  className="game-input"
                  type="text"
                  value={newFriend.name}
                  onChange={(e) =>
                    setNewFriend((prev) => ({
                      ...prev,
                      name: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                      slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    }))
                  }
                  placeholder="daniel"
                />
              </div>

              <div>
                <label
                  className="game-heading-3"
                  style={{ marginBottom: "var(--space-xs)", display: "block" }}
                >
                  Display Name
                </label>
                <input
                  className="game-input"
                  type="text"
                  value={newFriend.display_name}
                  onChange={(e) =>
                    setNewFriend((prev) => ({
                      ...prev,
                      display_name: e.target.value,
                    }))
                  }
                  placeholder="Daniel"
                />
              </div>

              {/* Color Settings */}
              <div>
                <div
                  className="game-flex game-flex-between"
                  style={{ marginBottom: "var(--space-sm)" }}
                >
                  <label className="game-heading-3" style={{ margin: 0 }}>
                    Colors
                  </label>
                  <button
                    className="game-button"
                    onClick={generateRandomColors}
                    style={{
                      fontSize: "var(--font-size-xs)",
                      padding: "var(--space-xs) var(--space-sm)",
                    }}
                  >
                    <i className="hn hn-dice-solid" style={{ marginRight: "var(--space-xs)" }} />
                    RANDOMIZE
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-sm)",
                  }}
                >
                  {[
                    { key: "primary", label: "Primary" },
                    { key: "secondary", label: "Secondary" },
                    { key: "accent", label: "Accent" },
                    { key: "bg", label: "Background" },
                    { key: "text", label: "Text" },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-md)",
                      }}
                    >
                      <div
                        style={{
                          width: "3rem",
                          height: "1.5rem",
                          background: newFriend[key as keyof typeof newFriend],
                          border: "var(--border-width-md) solid var(--game-border)",
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setSelectedColor(key as typeof selectedColor);
                          setShowColorPicker(true);
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "var(--font-size-xs)",
                            color: "var(--text)",
                          }}
                        >
                          {label}
                        </div>
                        <div
                          style={{
                            fontSize: "var(--font-size-xs)",
                            color: "var(--text)",
                          }}
                        >
                          {newFriend[key as keyof typeof newFriend]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "var(--space-md)",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="game-button"
                  onClick={() => {
                    setShowAddForm(false);
                    playSound("close");
                  }}
                >
                  CANCEL
                </button>
                <button className="game-button game-button-success" onClick={handleAddFriend}>
                  CREATE FRIEND
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Friends List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(17.5rem, 1fr))",
            gap: "var(--space-xl)",
          }}
        >
          {loading ? (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "var(--space-xl)",
                textAlign: "center",
              }}
            >
              Loading friends...
            </div>
          ) : friends.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "var(--space-xl)",
                textAlign: "center",
                color: "var(--text)",
              }}
            >
              No friends yet. Add one above!
            </div>
          ) : (
            friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/admin/${friend.slug}`}
                className="game-card game-card-hover"
                style={{
                  textDecoration: "none",
                  padding: "var(--space-xl)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "var(--space-lg)",
                  borderColor: friend.color_accent,
                  background: friend.color_bg,
                  borderWidth: "var(--border-width-lg)",
                }}
                onMouseEnter={() => {
                  // Prefetch theme on hover
                  if ((window as { __prefetchTheme?: (slug: string) => void }).__prefetchTheme) {
                    (window as { __prefetchTheme: (slug: string) => void }).__prefetchTheme(
                      friend.slug
                    );
                  }
                }}
              >
                <div
                  style={{
                    width: "4rem",
                    height: "4rem",
                    borderRadius: "var(--radius-sm)",
                    background: friend.color_primary,
                    border: `var(--border-width-lg) solid ${friend.color_accent}`,
                    boxShadow: "var(--game-shadow-md)",
                  }}
                />
                <span
                  className="game-heading-2"
                  style={{
                    margin: 0,
                    color: friend.color_text,
                    fontSize: "var(--font-size-xl)",
                  }}
                >
                  {friend.display_name.toUpperCase()}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Color Picker Modal */}
      {showColorPicker && (
        <ColorPicker
          currentColor={
            selectedColor === "text"
              ? newFriend.color_text
              : selectedColor === "primary"
                ? newFriend.color_primary
                : selectedColor === "secondary"
                  ? newFriend.color_secondary
                  : selectedColor === "accent"
                    ? newFriend.color_accent
                    : newFriend.color_bg
          }
          onColorChange={(color) => {
            handleColorChange(selectedColor, color);
          }}
          onColorConfirm={(color) => {
            handleColorChange(selectedColor, color);
            setShowColorPicker(false);
            playSound("success");
          }}
        />
      )}
    </div>
  );
}
