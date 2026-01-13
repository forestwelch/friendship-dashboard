"use client";

import React, { useState, useEffect } from "react";
import { playSound } from "@/lib/sounds";
import { ColorPicker } from "./ColorPicker";
import { DEFAULT_THEME_COLORS } from "@/lib/theme-defaults";
import { Modal } from "@/components/shared";
import { FormField, Input } from "@/components/shared";
import { useUIStore } from "@/lib/store/ui-store";
import { hslToHex, hexToHsl, isValidHex } from "@/lib/utils/color-utils";
import { Friend } from "@/lib/types";
import styles from "./AddFriendModal.module.css";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFriendAdded: () => void;
}

export function AddFriendModal({ isOpen, onClose, onFriendAdded }: AddFriendModalProps) {
  const { setOpenModal } = useUIStore();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  // Sync modal state with UI store
  useEffect(() => {
    if (isOpen) {
      setOpenModal("add-friend-modal");
    }
  }, [isOpen, setOpenModal]);

  // Fetch friends list when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchFriends = async () => {
        setIsLoadingFriends(true);
        try {
          const response = await fetch("/api/friends");
          if (response.ok) {
            const data = await response.json();
            setFriends(data.friends || []);
          }
        } catch (error) {
          console.error("Error fetching friends:", error);
        } finally {
          setIsLoadingFriends(false);
        }
      };
      fetchFriends();
    } else {
      // Reset template selection when modal closes
      setSelectedTemplateId("");
    }
  }, [isOpen]);

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

      const data = await response.json();
      const newFriendId = data.friend.id;

      // If a template is selected, copy widgets from template friend
      if (selectedTemplateId) {
        try {
          // Fetch widgets from template friend
          const widgetsResponse = await fetch(`/api/widgets/${selectedTemplateId}`);
          if (widgetsResponse.ok) {
            const widgetsData = await widgetsResponse.json();
            const templateWidgets = widgetsData.widgets || [];

            if (templateWidgets.length > 0) {
              // Copy widgets to new friend (only structure, not data)
              const widgetsToCopy = templateWidgets.map(
                (w: {
                  widget_type: string;
                  size: string;
                  position_x: number;
                  position_y: number;
                  config: Record<string, unknown>;
                }) => ({
                  widget_type: w.widget_type,
                  size: w.size,
                  position_x: w.position_x,
                  position_y: w.position_y,
                  // Copy config but clear any data-specific fields
                  config: {},
                })
              );

              // Save widgets to new friend
              const saveWidgetsResponse = await fetch(`/api/widgets/${newFriendId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ widgets: widgetsToCopy }),
              });

              if (!saveWidgetsResponse.ok) {
                console.warn("Failed to copy widgets from template, but friend was created");
              }
            }
          }
        } catch (widgetError) {
          console.error("Error copying widgets from template:", widgetError);
          // Don't fail the whole operation if widget copying fails
        }
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
      setSelectedTemplateId("");
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

          <FormField label="Template (Optional)">
            <select
              value={selectedTemplateId}
              onChange={(e) => {
                setSelectedTemplateId(e.target.value);
                playSound("select");
              }}
              className={styles.templateSelect}
              disabled={isLoadingFriends}
            >
              <option value="">None - Start from scratch</option>
              {friends.map((friend) => (
                <option key={friend.id} value={friend.id}>
                  {friend.display_name}
                </option>
              ))}
            </select>
            {selectedTemplateId && (
              <div className={styles.templateHelperText}>
                Widget layout will be copied from template (without data)
              </div>
            )}
          </FormField>

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
              ].map(({ key, label }) => {
                const colorKey = `color_${key}` as keyof typeof newFriend;
                const currentHsl = newFriend[colorKey];
                const derivedHex = hslToHex(currentHsl);
                const displayHex = hexInputs[key] ?? derivedHex;

                return (
                  <div key={key} className={styles.colorRow}>
                    <div
                      className={styles.colorSwatch}
                      style={{ "--color-swatch-bg": currentHsl } as React.CSSProperties}
                      onClick={() => {
                        setSelectedColor(key as typeof selectedColor);
                        setShowColorPicker(true);
                      }}
                    />
                    <div className={styles.colorLabelText}>{label}</div>
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
                      className={styles.hexInput}
                      placeholder="#000000"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.buttonRow}>
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
            {
              text: newFriend.color_text,
              primary: newFriend.color_primary,
              secondary: newFriend.color_secondary,
              accent: newFriend.color_accent,
              bg: newFriend.color_bg,
            }[selectedColor]
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
