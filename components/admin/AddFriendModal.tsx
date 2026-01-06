"use client";

import React, { useState, useEffect } from "react";
import { playSound } from "@/lib/sounds";
import { ColorPicker } from "./ColorPicker";
import { DEFAULT_THEME_COLORS } from "@/lib/theme-defaults";
import { Modal } from "@/components/Modal";
import { FormField, Input } from "@/components/shared";
import { useUIStore } from "@/lib/store/ui-store";
import { hslToHex, hexToHsl, isValidHex } from "@/lib/color-utils";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFriendAdded: () => void;
}

export function AddFriendModal({ isOpen, onClose, onFriendAdded }: AddFriendModalProps) {
  const { setOpenModal } = useUIStore();

  // Sync modal state with UI store
  useEffect(() => {
    if (isOpen) {
      setOpenModal("add-friend-modal");
    }
  }, [isOpen, setOpenModal]);

  const handleClose = () => {
    setOpenModal(null);
    onClose();
  };
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
  const [hexInputs, setHexInputs] = useState<Record<string, string>>({});

  const handleColorChange = (colorKey: string, value: string) => {
    setNewFriend((prev) => ({ ...prev, [colorKey]: value }));
  };

  const generateRandomColors = () => {
    const hues = [200, 0, 120, 300, 40];
    const saturations = [70, 80, 75, 65, 85];
    const lightnesses = [50, 45, 55, 40, 60];

    const randomIndex = Math.floor(Math.random() * hues.length);
    const h = hues[randomIndex];
    const s = saturations[randomIndex];
    const l = lightnesses[randomIndex];

    const primary = `hsl(${h}, ${s}%, ${l}%)`;
    const secondary = `hsl(${h}, ${s}%, ${l + 10}%)`;
    const accent = `hsl(${h}, ${s + 10}%, ${l - 10}%)`;
    const bg = `hsl(${h}, ${s}%, ${l - 30}%)`;
    const text = `hsl(${h}, ${s - 20}%, ${l + 30}%)`;

    setNewFriend({
      ...newFriend,
      color_primary: primary,
      color_secondary: secondary,
      color_accent: accent,
      color_bg: bg,
      color_text: text,
    });
    playSound("select");
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
      const resetFriend = {
        name: "",
        color_primary: DEFAULT_THEME_COLORS.primary,
        color_secondary: DEFAULT_THEME_COLORS.secondary,
        color_accent: DEFAULT_THEME_COLORS.accent,
        color_bg: DEFAULT_THEME_COLORS.bg,
        color_text: DEFAULT_THEME_COLORS.text,
      };
      setNewFriend(resetFriend);
      onFriendAdded();
      handleClose();
    } catch (error) {
      playSound("error");
      console.error("Error creating friend:", error);
      alert(error instanceof Error ? error.message : "Failed to create friend");
    }
  };

  return (
    <>
      <Modal id="add-friend-modal" title="ADD NEW FRIEND" onClose={handleClose}>
        <div className="modal-content">
          <FormField label="Name" required>
            <Input
              type="text"
              value={newFriend.name}
              onChange={(e) =>
                setNewFriend((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Daniel"
              autoFocus
            />
          </FormField>

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
                <i className="hn hn-shuffle-solid" style={{ marginRight: "var(--space-xs)" }} />
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
              ].map(({ key, label }) => {
                const colorKey = `color_${key}` as keyof typeof newFriend;
                const currentHsl = newFriend[colorKey];
                const derivedHex = hslToHex(currentHsl);
                const displayHex = hexInputs[key] ?? derivedHex;

                return (
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
                        background: currentHsl,
                        border: "var(--border-width-md) solid var(--game-border)",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setSelectedColor(key as typeof selectedColor);
                        setShowColorPicker(true);
                      }}
                    />
                    <div
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--text)",
                        width: "5rem",
                      }}
                    >
                      {label}
                    </div>
                    <input
                      type="text"
                      value={displayHex}
                      onChange={(e) => {
                        const value = e.target.value;
                        setHexInputs((prev) => ({ ...prev, [key]: value }));
                        if (isValidHex(value)) {
                          const hsl = hexToHsl(value);
                          if (hsl) {
                            handleColorChange(colorKey, hsl);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (isValidHex(value)) {
                          const hsl = hexToHsl(value);
                          if (hsl) {
                            handleColorChange(colorKey, hsl);
                          }
                          setHexInputs((prev) => {
                            const updated = { ...prev };
                            delete updated[key];
                            return updated;
                          });
                        } else {
                          playSound("error");
                          setHexInputs((prev) => {
                            const updated = { ...prev };
                            delete updated[key];
                            return updated;
                          });
                        }
                      }}
                      style={{
                        width: "5.5rem",
                        padding: "var(--space-xs)",
                        fontSize: "var(--font-size-xs)",
                        fontFamily: "monospace",
                        background: "var(--bg)",
                        border: "var(--border-width-md) solid var(--game-border)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text)",
                      }}
                      placeholder="#000000"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "var(--space-md)",
              justifyContent: "flex-end",
              marginTop: "var(--space-md)",
            }}
          >
            <button className="game-button" onClick={handleClose}>
              CANCEL
            </button>
            <button className="game-button game-button-success" onClick={handleAddFriend}>
              CREATE FRIEND
            </button>
          </div>
        </div>
      </Modal>

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
            handleColorChange(`color_${selectedColor}`, color);
          }}
          onColorConfirm={(color) => {
            handleColorChange(`color_${selectedColor}`, color);
            setShowColorPicker(false);
            playSound("success");
          }}
        />
      )}
    </>
  );
}
