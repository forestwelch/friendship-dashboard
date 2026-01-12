"use client";

import React, { useState, useEffect } from "react";
import { Friend } from "@/lib/types";
import { playSound } from "@/lib/sounds";
import { ColorPicker } from "./ColorPicker";
import { DEFAULT_THEME_COLORS } from "@/lib/theme-defaults";
import { FriendCard } from "@/components/FriendCard";
import styles from "./FriendManager.module.css";

export function FriendManager() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFriend, setNewFriend] = useState<{
    name: string;
    color_primary: string;
    color_secondary: string;
    color_accent: string;
    color_bg: string;
    color_text: string;
  }>({
    name: "",
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
    if (!newFriend.name) {
      playSound("error");
      alert("Please fill in name!");
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

  const handleDeleteFriend = async (friendId: string, friendSlug: string) => {
    // Find the friend to restore if deletion fails
    const friendToRestore = friends.find((f) => f.id === friendId);

    // Optimistic update - remove immediately from UI
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    playSound("delete");

    try {
      const response = await fetch(`/api/friends/${friendSlug}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete friend");
      }

      playSound("success");
    } catch (error) {
      playSound("error");
      console.error("Error deleting friend:", error);
      // Restore friend if API call failed
      if (friendToRestore) {
        setFriends((prev) =>
          [...prev, friendToRestore].sort((a, b) => a.display_name.localeCompare(b.display_name))
        );
      }
    }
  };

  const handleDeleteAll = async () => {
    // Optimistic update - clear immediately from UI
    const previousFriends = [...friends];
    setFriends([]);
    playSound("delete");

    try {
      const response = await fetch("/api/friends", {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete all friends");
      }

      playSound("success");
    } catch (error) {
      playSound("error");
      console.error("Error deleting all friends:", error);
      // Restore friends if API call failed
      setFriends(previousFriends);
    }
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

  // Listen for add friend event from navigation
  useEffect(() => {
    const handleAddFriend = () => {
      setShowAddForm(true);
      playSound("open");
    };
    const eventName = "admin-add-friend" as keyof WindowEventMap;
    window.addEventListener(eventName, handleAddFriend as EventListener);
    return () => {
      window.removeEventListener(eventName, handleAddFriend as EventListener);
    };
  }, []);

  return (
    <div className={`admin-page ${styles.pageContainer}`}>
      <div className={`game-container ${styles.contentContainer}`}>
        <div className={styles.header}>
          <h1 className={`game-heading-1 ${styles.title}`}>MANAGE FRIENDS</h1>
          {friends.length > 0 && (
            <button className={`game-button ${styles.deleteAllButton}`} onClick={handleDeleteAll}>
              <i className="hn hn-trash-alt-solid" />
              DELETE ALL
            </button>
          )}
        </div>

        {/* Add Friend Form - shown when triggered from nav */}
        {showAddForm && (
          <div className={`game-card ${styles.addFormCard}`}>
            <h2 className={`game-heading-2 ${styles.addFormTitle}`}>Add New Friend</h2>

            <div className={styles.formContainer}>
              <div>
                <label className={`game-heading-3 ${styles.nameLabel}`}>Name</label>
                <input
                  className="game-input"
                  type="text"
                  value={newFriend.name}
                  onChange={(e) =>
                    setNewFriend((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Daniel"
                />
              </div>

              {/* Color Settings */}
              <div>
                <div className={`game-flex game-flex-between ${styles.colorHeader}`}>
                  <label className={`game-heading-3 ${styles.colorLabel}`}>Colors</label>
                  <button
                    className={`game-button ${styles.randomizeButton}`}
                    onClick={generateRandomColors}
                  >
                    <i className={`hn hn-shuffle-solid ${styles.randomizeIcon}`} />
                    RANDOMIZE
                  </button>
                </div>

                <div className={styles.colorList}>
                  {[
                    { key: "primary", label: "Primary" },
                    { key: "secondary", label: "Secondary" },
                    { key: "accent", label: "Accent" },
                    { key: "bg", label: "Background" },
                    { key: "text", label: "Text" },
                  ].map(({ key, label }) => (
                    <div key={key} className={styles.colorRow}>
                      <div
                        className={styles.colorSwatch}
                        style={
                          {
                            "--color-swatch-bg": newFriend[key as keyof typeof newFriend],
                          } as React.CSSProperties
                        }
                        onClick={() => {
                          setSelectedColor(key as typeof selectedColor);
                          setShowColorPicker(true);
                        }}
                      />
                      <div className={styles.colorInfo}>
                        <div className={styles.colorInfoText}>{label}</div>
                        <div className={styles.colorInfoText}>
                          {newFriend[key as keyof typeof newFriend]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.buttonRow}>
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

        {/* Friends Grid */}
        <div className={styles.friendsGrid}>
          {loading ? (
            <div className={styles.loadingGridItem}>Loading friends...</div>
          ) : friends.length === 0 ? (
            <div className={styles.emptyGridItem}>
              No friends yet. Add one using the button above!
            </div>
          ) : (
            friends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} onDelete={handleDeleteFriend} />
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
