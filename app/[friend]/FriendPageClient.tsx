"use client";

import React, { useState, useCallback, useRef } from "react";
import { Grid, GridItem } from "@/components/Grid";
import { WidgetRenderer } from "@/components/WidgetRenderer";
import { ViewEditToggle } from "@/components/admin/ViewEditToggle";
import { AdminOverlay } from "@/components/admin/AdminOverlay";
import { ColorSettings } from "@/components/admin/ColorSettings";
import { WidgetLibrary } from "@/components/admin/WidgetLibrary";
import { WidgetConfigModal } from "@/components/admin/WidgetConfigModal";
import { Friend, WidgetSize, WidgetPosition } from "@/lib/types";
import { FriendWidget } from "@/lib/queries";
import { Song } from "@/lib/types";
import { canPlaceWidget, findAvailablePosition } from "@/lib/widget-utils";
import { playSound } from "@/lib/sounds";
import { GamepadNavigation } from "@/components/GamepadNavigation";

interface FriendPageClientProps {
  friend: Friend;
  initialWidgets: FriendWidget[];
  songs: Song[];
  pixelArtMap: Map<string, string>;
  pixelArtBySize: Map<string, string>;
}

export function FriendPageClient({
  friend,
  initialWidgets,
  songs,
  pixelArtMap: initialPixelArtMap,
  pixelArtBySize,
}: FriendPageClientProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets, setWidgets] = useState<FriendWidget[]>(initialWidgets);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [hoveredWidget, setHoveredWidget] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] =
    useState<WidgetPosition | null>(null);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [configuringWidget, setConfiguringWidget] =
    useState<FriendWidget | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [localColors, setLocalColors] = useState({
    primary: friend.color_primary || "#4a9eff",
    secondary: friend.color_secondary || "#6abfff",
    accent: friend.color_accent || "#2a7fff",
    bg: friend.color_bg || "#0a1a2e",
    text: friend.color_text || "#c8e0ff",
  });

  // State for pixel art/images map to allow updates
  const [pixelArtMap, setPixelArtMap] =
    useState<Map<string, string>>(initialPixelArtMap);

  const handleDragStart = useCallback(
    (e: React.DragEvent, widgetId: string) => {
      if (!isEditMode) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", widgetId);
      setDraggedWidget(widgetId);
      playSound("open");

      // Add visual feedback - make dragged element semi-transparent
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.opacity = "0.5";
      }
    },
    [isEditMode]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedWidget(null);
    setDragOverPosition(null);

    // Reset opacity on all widgets
    document.querySelectorAll("[data-widget-item]").forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.opacity = "";
      }
    });
  }, []);

  const calculateGridPosition = useCallback(
    (
      clientX: number,
      clientY: number,
      widgetSize?: WidgetSize
    ): WidgetPosition | null => {
      // Grid constants in rem (must match Grid.tsx)
      // Convert rem to pixels using computed font size
      const rootFontSize = parseFloat(
        getComputedStyle(document.documentElement).fontSize
      );
      const TILE_SIZE_REM = 5; // 80px at 16px base - must match Grid.tsx
      const GAP_REM = 0.5; // 8px at 16px base - must match Grid.tsx
      const tileSize = TILE_SIZE_REM * rootFontSize;
      const gap = GAP_REM * rootFontSize;

      // Find the grid container
      const gridElement = document.querySelector("[data-grid-container]");
      if (!gridElement) return null;

      const gridRect = gridElement.getBoundingClientRect();

      // Account for grid being centered (transform: translate(-50%, -50%))
      const gridWidth = 6 * tileSize + 5 * gap; // 6 cols
      const gridHeight = 8 * tileSize + 7 * gap; // 8 rows

      const gridLeft = gridRect.left + (gridRect.width - gridWidth) / 2;
      const gridTop = gridRect.top + (gridRect.height - gridHeight) / 2;

      const relativeX = clientX - gridLeft;
      const relativeY = clientY - gridTop;

      // Calculate based on top-left corner of widget (not cursor position)
      // This makes it much more predictable
      const x = Math.floor(relativeX / (tileSize + gap));
      const y = Math.floor(relativeY / (tileSize + gap));

      // Validate bounds - 6 cols, 8 rows
      if (x < 0 || x >= 6 || y < 0 || y >= 8) return null;

      // If widget size provided, ensure it fits
      if (widgetSize) {
        const [cols, rows] = widgetSize.split("x").map(Number);
        if (x + cols > 6 || y + rows > 8) return null;
      }

      return { x, y };
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!isEditMode || !draggedWidget) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      const widget = widgets.find((w) => w.id === draggedWidget);
      if (!widget) return;

      // Calculate position based on widget top-left, accounting for drag offset
      const dragElement = e.currentTarget.querySelector(
        `[data-widget-item="${draggedWidget}"]`
      );
      let offsetX = 0;
      let offsetY = 0;

      if (dragElement instanceof HTMLElement) {
        const rect = dragElement.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
      }

      const position = calculateGridPosition(
        e.clientX - offsetX,
        e.clientY - offsetY,
        widget.size
      );

      if (position) {
        const canPlace = canPlaceWidget(
          widgets,
          draggedWidget,
          position,
          widget.size
        );
        e.dataTransfer.dropEffect = canPlace ? "move" : "none";
        setDragOverPosition(canPlace ? position : null);
      } else {
        e.dataTransfer.dropEffect = "none";
        setDragOverPosition(null);
      }
    },
    [isEditMode, draggedWidget, calculateGridPosition, widgets]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (!isEditMode || !draggedWidget) return;
      e.preventDefault();
      e.stopPropagation();

      const widget = widgets.find((w) => w.id === draggedWidget);
      if (!widget) {
        handleDragEnd();
        return;
      }

      // Use the dragOverPosition if available (more accurate)
      const position =
        dragOverPosition ||
        calculateGridPosition(e.clientX, e.clientY, widget.size);
      if (!position) {
        handleDragEnd();
        return;
      }

      // Try exact position first
      let finalPosition = position;
      let placed = canPlaceWidget(
        widgets,
        draggedWidget,
        position,
        widget.size
      );

      // If exact position doesn't work, try nearby positions (more lenient)
      if (!placed) {
        const offsets = [
          { x: 0, y: 0 }, // Original
          { x: -1, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: -1 },
          { x: 0, y: 1 }, // Adjacent
          { x: -1, y: -1 },
          { x: 1, y: 1 },
          { x: -1, y: 1 },
          { x: 1, y: -1 }, // Diagonal
        ];

        for (const offset of offsets) {
          const tryPosition = {
            x: Math.max(0, Math.min(7, position.x + offset.x)),
            y: Math.max(0, Math.min(5, position.y + offset.y)),
          };

          // Check if widget fits at this position
          const [cols, rows] = widget.size.split("x").map(Number);
          if (tryPosition.x + cols <= 6 && tryPosition.y + rows <= 8) {
            if (
              canPlaceWidget(widgets, draggedWidget, tryPosition, widget.size)
            ) {
              finalPosition = tryPosition;
              placed = true;
              break;
            }
          }
        }
      }

      if (placed) {
        setWidgets((prev) =>
          prev.map((w) =>
            w.id === draggedWidget
              ? {
                  ...w,
                  position_x: finalPosition.x,
                  position_y: finalPosition.y,
                }
              : w
          )
        );
        playSound("success");
      } else {
        playSound("error");
      }

      handleDragEnd();
    },
    [isEditMode, draggedWidget, widgets, calculateGridPosition]
  );

  const handleDelete = useCallback(
    (widgetId: string) => {
      if (!isEditMode) return;
      if (confirm("Delete this widget?")) {
        setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
        playSound("cancel");
      } else {
        playSound("close");
      }
    },
    [isEditMode]
  );

  const handleAddWidget = useCallback(
    (widgetType: string, size: WidgetSize) => {
      const newPosition = findAvailablePosition(widgets, size);
      if (!newPosition) {
        alert("No space available for this widget size!");
        return;
      }

      const newWidget: FriendWidget = {
        id: `temp-${Date.now()}`,
        widget_id: widgetType, // Will be resolved to UUID by API
        widget_type: widgetType,
        widget_name: widgetType
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        position_x: newPosition.x,
        position_y: newPosition.y,
        size: size,
        config: {},
      };

      setWidgets((prev) => [...prev, newWidget]);
      setShowWidgetLibrary(false);
      playSound("select");
    },
    [widgets, friend.id]
  );

  const handleSave = useCallback(async () => {
    try {
      // Include ALL widgets - temp widgets will be saved with proper widget_id resolution
      // The API will resolve widget_type strings to widget_id UUIDs
      const widgetsToSave = widgets.map((w) => ({
        widget_type: w.widget_type,
        size: w.size,
        position_x: w.position_x,
        position_y: w.position_y,
        config: w.config || {},
      }));

      const response = await fetch(`/api/widgets/${friend.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets: widgetsToSave }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save");
      }

      playSound("success");
      // Reload page to get fresh widget IDs from database
      window.location.reload();
    } catch (error) {
      playSound("error");
      console.error("Save error:", error);
      alert(
        `Failed to save layout: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [widgets, friend.id]);

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const cleanHex = hex.replace("#", "");
    const rgbHex = cleanHex.length === 8 ? cleanHex.slice(0, 6) : cleanHex;
    const r = parseInt(rgbHex.slice(0, 2), 16);
    const g = parseInt(rgbHex.slice(2, 4), 16);
    const b = parseInt(rgbHex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const gridTileBg = hexToRgba(localColors.accent, 0.08);
  const gridTileBorder = hexToRgba(localColors.secondary, 0.12);

  const themeStyle: React.CSSProperties = {
    "--primary": localColors.primary,
    "--secondary": localColors.secondary,
    "--accent": localColors.accent,
    "--bg": localColors.bg,
    "--text": localColors.text,
    "--grid-tile-bg": gridTileBg,
    "--grid-tile-border": gridTileBorder,
  } as React.CSSProperties;

  const handleColorChange = useCallback(
    async (colorKey: string, value: string) => {
      // Update local state immediately for live preview
      setLocalColors((prev) => ({
        ...prev,
        [colorKey]: value,
      }));

      // Save to database
      try {
        const response = await fetch(`/api/friends/${friend.slug}/colors`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            colors: {
              ...localColors,
              [colorKey]: value,
            },
          }),
        });

        if (!response.ok) {
          console.error("Failed to save color");
        }
      } catch (error) {
        console.error("Error saving color:", error);
      }
    },
    [friend.slug, localColors]
  );

  const handleRandomizeAll = useCallback(async () => {
    // Generate harmonious colors (Game Boy style - limited palette)
    const palettes = [
      {
        primary: "#4a9eff",
        secondary: "#6abfff",
        accent: "#2a7fff",
        bg: "#0a1a2e",
        text: "#c8e0ff",
      }, // Blue
      {
        primary: "#ff6b6b",
        secondary: "#ff8e8e",
        accent: "#ff4a4a",
        bg: "#2e0a0a",
        text: "#ffd0d0",
      }, // Red
      {
        primary: "#8bac0f",
        secondary: "#9bbc0f",
        accent: "#6a8a0a",
        bg: "#0f380f",
        text: "#c8e890",
      }, // Green
      {
        primary: "#da4167",
        secondary: "#e85a7a",
        accent: "#c8325a",
        bg: "#1e0f1a",
        text: "#ffd0e0",
      }, // Pink
      {
        primary: "#fbbf24",
        secondary: "#fcd34d",
        accent: "#f59e0b",
        bg: "#1a0f0a",
        text: "#fef3c7",
      }, // Yellow
    ];

    const randomPalette = palettes[Math.floor(Math.random() * palettes.length)];
    setLocalColors(randomPalette);

    // Save to database
    try {
      const response = await fetch(`/api/friends/${friend.slug}/colors`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colors: randomPalette }),
      });

      if (!response.ok) {
        console.error("Failed to save colors");
      }
    } catch (error) {
      console.error("Error saving colors:", error);
    }
  }, [friend.slug]);

  const handleUploadImage = useCallback(
    async (file: File, widgetId: string) => {
      // Mock upload for now or real implementation if API existed
      // For now, just use local object URL to preview
      const objectUrl = URL.createObjectURL(file);

      // Update local state
      setPixelArtMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(widgetId, objectUrl);
        return newMap;
      });

      // TODO: Implement real upload
      // const formData = new FormData();
      // formData.append("file", file);
      // formData.append("widgetId", widgetId);
      // await fetch("/api/images/upload", { method: "POST", body: formData });
    },
    []
  );

  // Gamepad button handlers
  const handleGamepadButton = useCallback(
    (button: string) => {
      if (!isEditMode) {
        if (button === "a" || button === "start") {
          // Toggle edit mode
          setIsEditMode(true);
          playSound("open");
        }
      } else {
        switch (button) {
          case "b":
          case "y":
            // Exit edit mode
            setIsEditMode(false);
            playSound("close");
            break;
          case "a":
            // Add widget
            setShowWidgetLibrary(true);
            playSound("open");
            break;
          case "x":
            // Save
            handleSave();
            break;
          case "r":
            // Open widget library
            setShowWidgetLibrary(true);
            playSound("open");
            break;
          case "l":
            // Close widget library
            setShowWidgetLibrary(false);
            playSound("close");
            break;
        }
      }
    },
    [isEditMode, handleSave]
  );

  return (
    <div
      style={{
        ...themeStyle,
        paddingTop: "2.25rem",
        width: "100vw",
        minHeight: "100vh",
        background: localColors.bg,
        position: "relative",
      }}
    >
      <GamepadNavigation
        onButtonPress={handleGamepadButton}
        onStickMove={(stick, x, y) => {
          // TODO: Implement stick-based navigation
          if (Math.abs(x) > 0.5 || Math.abs(y) > 0.5) {
            playSound("move");
          }
        }}
      />
      {/* Top bar with toggle - always present, just visibility changes */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "var(--space-md) var(--space-lg)",
          background: localColors.bg,
          borderBottom: `var(--border-width-md) solid ${localColors.accent}`,
          position: "relative",
          zIndex: 10,
        }}
      >
        <h1
          className="game-heading-1"
          style={{ margin: 0, color: localColors.text }}
        >
          {friend.display_name.toUpperCase()}
        </h1>
        <div
          style={{
            display: "flex",
            gap: "var(--space-md)",
            alignItems: "center",
          }}
        >
          {/* Admin buttons - always in DOM, visibility controlled */}
          <div
            style={{
              display: isEditMode ? "flex" : "none",
              gap: "var(--space-md)",
              height: "var(--height-button)",
              minHeight: "var(--height-button)",
              visibility: isEditMode ? "visible" : "hidden",
            }}
          >
            <button
              onClick={() => {
                setShowWidgetLibrary(true);
                playSound("open");
              }}
              style={{
                fontSize: "var(--font-size-sm)",
                padding: "var(--space-xs) var(--space-sm)",
                height: "var(--height-button)",
                minHeight: "var(--height-button)",
                background: localColors.primary,
                border: `var(--border-width-md) solid ${localColors.accent}`,
                color: localColors.bg,
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                fontWeight: "bold",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-xs)",
              }}
            >
              <i
                className="hn hn-plus-solid"
                style={{ fontSize: "var(--font-size-xs)" }}
              />
              ADD
            </button>
            <button
              onClick={() => {
                playSound("select");
                handleSave();
              }}
              style={{
                fontSize: "var(--font-size-sm)",
                padding: "var(--space-xs) var(--space-sm)",
                height: "var(--height-button)",
                minHeight: "var(--height-button)",
                background: localColors.secondary,
                border: `var(--border-width-md) solid ${localColors.accent}`,
                color: localColors.bg,
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                fontWeight: "bold",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-xs)",
              }}
            >
              <i
                className="hn hn-save-solid"
                style={{ fontSize: "var(--font-size-xs)" }}
              />
              SAVE
            </button>
          </div>
          <ViewEditToggle
            isEditMode={isEditMode}
            onToggle={(edit) => {
              setIsEditMode(edit);
              playSound(edit ? "open" : "close");
            }}
            themeColors={{
              primary: localColors.primary,
              secondary: localColors.secondary,
              accent: localColors.accent,
              text: localColors.text,
            }}
          />
        </div>
      </div>

      {/* Grid container - no padding, no borders, maximize space, no scroll */}
      <div
        ref={gridRef}
        style={{
          position: "relative",
          overflow: "hidden",
          width: "100vw",
          height: "calc(100vh - 2.25rem - 3.75rem)", // Full height minus nav and header
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={(e) => {
          // Only clear if we're leaving the grid area entirely
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverPosition(null);
          }
        }}
      >
        <Grid
          dragOverPosition={dragOverPosition}
          draggedWidgetSize={
            draggedWidget
              ? widgets.find((w) => w.id === draggedWidget)?.size
              : undefined
          }
        >
          {widgets.map((widget) => {
            let pixelArtImageUrl: string | undefined;
            // Handle both pixel_art and image widgets for the image URL
            if (
              widget.widget_type === "pixel_art" ||
              widget.widget_type === "image"
            ) {
              pixelArtImageUrl =
                pixelArtMap.get(widget.id) || pixelArtBySize.get(widget.size);
            }

            const isHovered = hoveredWidget === widget.id && isEditMode;

            return (
              <GridItem
                key={widget.id}
                position={{ x: widget.position_x, y: widget.position_y }}
                size={widget.size}
              >
                <div
                  data-widget-item={widget.id}
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                  }}
                  onMouseEnter={() => isEditMode && setHoveredWidget(widget.id)}
                  onMouseLeave={() => setHoveredWidget(null)}
                  onDragEnd={handleDragEnd}
                >
                  <WidgetRenderer
                    widget={widget}
                    songs={songs}
                    pixelArtImageUrl={pixelArtImageUrl}
                    onUploadImage={(file) => handleUploadImage(file, widget.id)}
                    friendId={friend.id}
                    themeColors={{
                      primary: localColors.primary,
                      secondary: localColors.secondary,
                      accent: localColors.accent,
                      bg: localColors.bg,
                      text: localColors.text,
                    }}
                    onUpdateWidgetConfig={async (widgetId, config) => {
                      // Update widget config in database
                      try {
                        const response = await fetch(
                          `/api/widgets/${friend.id}`,
                          {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              widgets: widgets
                                .map((w) =>
                                  w.id === widgetId ? { ...w, config } : w
                                )
                                .map((w) => ({
                                  widget_type: w.widget_type,
                                  size: w.size,
                                  position_x: w.position_x,
                                  position_y: w.position_y,
                                  config: w.config || {},
                                })),
                            }),
                          }
                        );
                        if (response.ok) {
                          setWidgets((prev) =>
                            prev.map((w) =>
                              w.id === widgetId ? { ...w, config } : w
                            )
                          );
                        }
                      } catch (error) {
                        console.error("Failed to update widget config:", error);
                      }
                    }}
                  />
                  {isHovered && (
                    <AdminOverlay
                      widgetId={widget.id}
                      onDelete={() => handleDelete(widget.id)}
                      onDragStart={(e) => handleDragStart(e, widget.id)}
                      onEdit={() => {
                        setConfiguringWidget(widget);
                        playSound("open");
                      }}
                    />
                  )}
                </div>
              </GridItem>
            );
          })}
        </Grid>
      </div>

      {/* Widget Configuration Modal */}
      {configuringWidget && (
        <WidgetConfigModal
          widget={configuringWidget}
          friendColors={localColors}
          onClose={() => {
            setConfiguringWidget(null);
            playSound("close");
          }}
          onSave={async (newConfig) => {
            console.log("[FriendPage] Saving widget config:", {
              widgetId: configuringWidget.id,
              config: newConfig,
            });

            // Update widget config locally first for immediate feedback
            const updatedWidgets = widgets.map((w) =>
              w.id === configuringWidget.id ? { ...w, config: newConfig } : w
            );
            setWidgets(updatedWidgets);

            // Save to database - only update the specific widget, not all widgets
            try {
              console.log(
                "[FriendPage] Sending PUT request to /api/widgets/" + friend.id
              );
              const response = await fetch(`/api/widgets/${friend.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  widgets: updatedWidgets.map((w) => ({
                    widget_type: w.widget_type,
                    size: w.size,
                    position_x: w.position_x,
                    position_y: w.position_y,
                    config: w.config || {},
                  })),
                }),
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(
                  "[FriendPage] Failed to save widget config:",
                  errorData
                );
                alert(`Failed to save: ${errorData.error || "Unknown error"}`);
                playSound("error");
                return;
              }

              const result = await response.json();
              console.log(
                "[FriendPage] Widget config saved successfully:",
                result
              );
              playSound("success");
            } catch (error) {
              console.error("[FriendPage] Error saving widget config:", error);
              alert(
                `Error: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`
              );
              playSound("error");
            }

            setConfiguringWidget(null);
          }}
        />
      )}

      {/* Widget Library - Navigate to page instead of modal */}
      {showWidgetLibrary && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: localColors.bg,
            zIndex: 2000,
            overflow: "auto",
          }}
        >
          <div style={{ padding: "var(--space-xl)" }}>
            <div style={{ marginBottom: "var(--space-lg)" }}>
              <button
                onClick={() => {
                  setShowWidgetLibrary(false);
                  playSound("close");
                }}
                className="game-button"
                style={{
                  background: localColors.secondary,
                  borderColor: localColors.accent,
                  color: localColors.bg,
                }}
              >
                <i
                  className="hn hn-arrow-left-solid"
                  style={{
                    fontSize: "var(--font-size-xs)",
                    marginRight: "var(--space-xs)",
                  }}
                />
                BACK
              </button>
            </div>
            <h1
              className="game-heading-1"
              style={{
                marginBottom: "var(--space-xl)",
                color: localColors.text,
              }}
            >
              WIDGET LIBRARY
            </h1>
            <WidgetLibrary onSelectWidget={handleAddWidget} />
          </div>
        </div>
      )}

      {/* Color settings cog */}
      {isEditMode && (
        <ColorSettings
          friendId={friend.id}
          currentColors={localColors}
          onColorChange={handleColorChange}
          onRandomizeAll={handleRandomizeAll}
          themeColors={localColors}
        />
      )}
    </div>
  );
}
