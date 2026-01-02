"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Grid, GridItem } from "@/components/Grid";
import { WidgetRenderer } from "@/components/WidgetRenderer";
import { ViewEditToggle } from "@/components/admin/ViewEditToggle";
import { AdminOverlay } from "@/components/admin/AdminOverlay";
import { ColorSettings } from "@/components/admin/ColorSettings";
import { WidgetLibrary } from "@/components/admin/WidgetLibrary";
import { WidgetConfigModal } from "@/components/admin/WidgetConfigModal";
import { Friend, WidgetSize, WidgetPosition, Song } from "@/lib/types";
import { ThemeColors } from "@/lib/theme-context";
import { FriendWidget } from "@/lib/queries";
import { canPlaceWidget, findAvailablePosition } from "@/lib/widget-utils";
import { playSound } from "@/lib/sounds";
import { GamepadNavigation } from "@/components/GamepadNavigation";
import { useThemeContext } from "@/lib/theme-context";
import { useUserContext } from "@/lib/use-user-context";

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
  const userContext = useUserContext();
  // Only allow edit mode if user is admin (detected from URL path)
  const [isEditMode, setIsEditMode] = useState(userContext.isAdmin);

  // If admin route, start in edit mode by default
  // If friend route, always stay in view mode
  const [widgets, setWidgets] = useState<FriendWidget[]>(initialWidgets);
  const [hoveredWidget, setHoveredWidget] = useState<string | null>(null);
  const [movingWidgetId, setMovingWidgetId] = useState<string | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<WidgetPosition | null>(null);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [configuringWidget, setConfiguringWidget] = useState<FriendWidget | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { colors: themeColors, setTheme } = useThemeContext();

  // Initialize theme with friend's colors on mount
  useEffect(() => {
    const friendTheme: ThemeColors = {
      primary: friend.color_primary,
      secondary: friend.color_secondary,
      accent: friend.color_accent,
      bg: friend.color_bg,
      text: friend.color_text,
    };

    // Only update theme if colors have actually changed
    // Compare against current theme to avoid unnecessary updates
    if (
      themeColors.primary !== friendTheme.primary ||
      themeColors.secondary !== friendTheme.secondary ||
      themeColors.accent !== friendTheme.accent ||
      themeColors.bg !== friendTheme.bg ||
      themeColors.text !== friendTheme.text
    ) {
      setTheme(friendTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    friend.color_primary,
    friend.color_secondary,
    friend.color_accent,
    friend.color_bg,
    friend.color_text,
    setTheme,
  ]);

  // State for pixel art/images map to allow updates
  const [pixelArtMap, setPixelArtMap] = useState<Map<string, string>>(initialPixelArtMap);

  const handleDelete = useCallback(
    (widgetId: string) => {
      if (!isEditMode) return;
      // Instant delete - no confirmation (optimistic update pattern)
      setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
      playSound("delete");
      // TODO: Sync to DB in background (will be handled by TanStack Query mutation)
    },
    [isEditMode]
  );

  // Handle starting move mode
  const handleStartMove = useCallback(
    (widgetId: string) => {
      if (!isEditMode) return;
      setMovingWidgetId(widgetId);
      setHoveredPosition(null);
      setHoveredWidget(null); // Hide the overlay
      playSound("pop");
    },
    [isEditMode]
  );

  // Handle canceling move mode
  const handleCancelMove = useCallback(() => {
    setMovingWidgetId(null);
    setHoveredPosition(null);
  }, []);

  // Handle placing widget at position
  const handlePlaceWidget = useCallback(
    (position: WidgetPosition) => {
      if (!movingWidgetId) return;

      setWidgets((prevWidgets) => {
        const widget = prevWidgets.find((w) => w.id === movingWidgetId);
        if (!widget) {
          return prevWidgets;
        }

        // Check if position is valid
        const isValid = canPlaceWidget(prevWidgets, movingWidgetId, position, widget.size);

        if (isValid) {
          const newWidgets = prevWidgets.map((w) =>
            w.id === movingWidgetId
              ? {
                  ...w,
                  position_x: position.x,
                  position_y: position.y,
                }
              : w
          );
          playSound("success");
          setMovingWidgetId(null);
          setHoveredPosition(null);
          return newWidgets;
        } else {
          playSound("error");
          return prevWidgets;
        }
      });
    },
    [movingWidgetId]
  );

  // Handle ESC key to cancel move
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && movingWidgetId) {
        handleCancelMove();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movingWidgetId, handleCancelMove]);

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
        widget_name: widgetType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        position_x: newPosition.x,
        position_y: newPosition.y,
        size: size,
        config: {},
      };

      setWidgets((prev) => [...prev, newWidget]);
      setShowWidgetLibrary(false);
      playSound("select");
    },
    [widgets]
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
      alert(`Failed to save layout: ${error instanceof Error ? error.message : "Unknown error"}`);
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

  const gridTileBg = hexToRgba(themeColors.accent, 0.08);
  const gridTileBorder = hexToRgba(themeColors.secondary, 0.12);

  const themeStyle: React.CSSProperties = {
    "--grid-tile-bg": gridTileBg,
    "--grid-tile-border": gridTileBorder,
  } as React.CSSProperties;

  const handleColorChange = useCallback(
    async (colorKey: string, value: string) => {
      // Update theme immediately for live preview
      const newColors = {
        ...themeColors,
        [colorKey]: value,
      };
      setTheme(newColors);

      // Save to database
      try {
        const response = await fetch(`/api/friends/${friend.slug}/colors`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            colors: newColors,
          }),
        });

        if (!response.ok) {
          console.error("Failed to save color");
        }
      } catch (error) {
        console.error("Error saving color:", error);
      }
    },
    [friend.slug, themeColors, setTheme]
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
    setTheme(randomPalette);

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
  }, [friend.slug, setTheme]);

  const handleUploadImage = useCallback(async (file: File, widgetId: string) => {
    // Mock upload for now or real implementation if API existed
    // For now, just use local object URL to preview
    const objectUrl = URL.createObjectURL(file);

    // Update local state
    setPixelArtMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(widgetId, objectUrl);
      return newMap;
    });

    // Note: Upload handled via API route
    // const formData = new FormData();
    // formData.append("file", file);
    // formData.append("widgetId", widgetId);
    // await fetch("/api/images/upload", { method: "POST", body: formData });
  }, []);

  // Gamepad button handlers
  const handleGamepadButton = useCallback(
    (button: string) => {
      // Only allow edit mode toggle for admin routes
      if (!userContext.isAdmin) {
        return;
      }

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
    [isEditMode, handleSave, userContext]
  );

  // Define onUpdateWidgetConfig callback at component level (not inside map)
  const handleUpdateWidgetConfig = useCallback(
    async (widgetId: string, config: Record<string, unknown>) => {
      // Update widget config in database
      try {
        const response = await fetch(`/api/widgets/${friend.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            widgets: widgets
              .map((w) => (w.id === widgetId ? { ...w, config } : w))
              .map((w) => ({
                widget_type: w.widget_type,
                size: w.size,
                position_x: w.position_x,
                position_y: w.position_y,
                config: w.config || {},
              })),
          }),
        });
        if (response.ok) {
          setWidgets((prev) => prev.map((w) => (w.id === widgetId ? { ...w, config } : w)));
        }
      } catch (error) {
        console.error("Failed to update widget config:", error);
      }
    },
    [friend.id, widgets]
  );

  return (
    <div
      style={{
        ...themeStyle,
        paddingTop: userContext.isAdmin ? "2.25rem" : "0",
        width: "100%",
        maxWidth: "100%",
        minHeight: "100vh",
        background: themeColors.bg,
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <GamepadNavigation
        onButtonPress={handleGamepadButton}
        onStickMove={(stick, x, y) => {
          // Note: Stick-based navigation can be implemented here if needed
          if (Math.abs(x) > 0.5 || Math.abs(y) > 0.5) {
            playSound("move");
          }
        }}
      />
      {/* Top bar with toggle - hidden on non-admin pages */}
      <div
        className={userContext.isAdmin ? "" : "friend-page-header"}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "var(--space-md) var(--space-lg)",
          background: themeColors.bg,
          borderBottom: `var(--border-width-md) solid ${themeColors.accent}`,
          position: "relative",
          zIndex: 10,
          flexWrap: "nowrap",
          gap: "var(--space-sm)",
          overflow: "visible",
        }}
      >
        <h1 className="game-heading-1" style={{ margin: 0, color: themeColors.text }}>
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
                background: themeColors.primary,
                border: `var(--border-width-md) solid ${themeColors.accent}`,
                color: themeColors.bg,
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
              <i className="hn hn-plus-solid" style={{ fontSize: "var(--font-size-xs)" }} />
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
                background: themeColors.secondary,
                border: `var(--border-width-md) solid ${themeColors.accent}`,
                color: themeColors.bg,
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
              <i className="hn hn-save-solid" style={{ fontSize: "var(--font-size-xs)" }} />
              SAVE
            </button>
          </div>
          {/* Only show edit toggle for admin routes */}
          {userContext.isAdmin && (
            <ViewEditToggle
              isEditMode={isEditMode}
              onToggle={(edit) => {
                setIsEditMode(edit);
                playSound(edit ? "open" : "close");
              }}
            />
          )}
        </div>
      </div>

      {/* Grid container - no padding, no borders, maximize space, no scroll */}
      <div
        ref={gridRef}
        data-grid-container-wrapper
        className="grid-container-wrapper"
        style={{
          position: "relative",
          overflow: "auto",
          width: "100%",
          maxWidth: "100%",
          height: "calc(100vh - 2.25rem - 3.75rem)", // Full height minus nav and header
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Grid>
          {/* Render widgets, excluding the one being moved */}
          {widgets
            .filter((w) => w.id !== movingWidgetId)
            .map((widget) => {
              let pixelArtImageUrl: string | undefined;
              // Handle both pixel_art and image widgets for the image URL
              if (widget.widget_type === "pixel_art" || widget.widget_type === "image") {
                pixelArtImageUrl = pixelArtMap.get(widget.id) || pixelArtBySize.get(widget.size);
              }

              const isHovered = hoveredWidget === widget.id && isEditMode && !movingWidgetId;

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
                    onMouseEnter={() =>
                      isEditMode && !movingWidgetId && setHoveredWidget(widget.id)
                    }
                    onMouseLeave={() => setHoveredWidget(null)}
                  >
                    <WidgetRenderer
                      widget={widget}
                      songs={songs}
                      pixelArtImageUrl={pixelArtImageUrl}
                      onUploadImage={(file) => handleUploadImage(file, widget.id)}
                      friendId={friend.id}
                      friendName={friend.display_name}
                      onUpdateWidgetConfig={handleUpdateWidgetConfig}
                    />
                    {isHovered && (
                      <AdminOverlay
                        widgetId={widget.id}
                        onDelete={() => handleDelete(widget.id)}
                        onMove={() => handleStartMove(widget.id)}
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

          {/* Show moveable tiles when a widget is being moved */}
          {movingWidgetId &&
            (() => {
              const movingWidget = widgets.find((w) => w.id === movingWidgetId);
              if (!movingWidget) return null;

              // Calculate occupied positions (excluding the moving widget)
              const occupiedPositions = new Set<string>();
              widgets
                .filter((w) => w.id !== movingWidgetId)
                .forEach((w) => {
                  const [cols, rows] = w.size.split("x").map(Number);
                  for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < cols; x++) {
                      occupiedPositions.add(`${w.position_x + x},${w.position_y + y}`);
                    }
                  }
                });

              // Generate all possible positions
              const allPositions: WidgetPosition[] = [];
              for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 6; x++) {
                  allPositions.push({ x, y });
                }
              }

              return (
                <>
                  {/* Show all empty positions as clickable tiles */}
                  {allPositions
                    .filter((pos) => !occupiedPositions.has(`${pos.x},${pos.y}`))
                    .map((pos) => {
                      const isValid = canPlaceWidget(
                        widgets,
                        movingWidgetId,
                        pos,
                        movingWidget.size
                      );

                      // Calculate which tiles would be occupied if widget is placed at hoveredPosition
                      const [cols, rows] = movingWidget.size.split("x").map(Number);
                      const hoveredOccupiedTiles = new Set<string>();
                      if (hoveredPosition) {
                        for (let y = 0; y < rows; y++) {
                          for (let x = 0; x < cols; x++) {
                            hoveredOccupiedTiles.add(
                              `${hoveredPosition.x + x},${hoveredPosition.y + y}`
                            );
                          }
                        }
                      }

                      // Check if this tile is the top-left (hovered position) or part of the hovered placement area
                      const isHovered =
                        hoveredPosition?.x === pos.x && hoveredPosition?.y === pos.y;
                      const isPartOfHoverArea =
                        hoveredPosition && hoveredOccupiedTiles.has(`${pos.x},${pos.y}`);

                      return (
                        <GridItem
                          key={`move-${pos.x}-${pos.y}`}
                          position={pos}
                          size="1x1"
                          style={{ zIndex: 5 }}
                        >
                          <div
                            onClick={() => {
                              if (isValid) {
                                handlePlaceWidget(pos);
                              }
                            }}
                            onMouseEnter={() => {
                              if (isValid) {
                                setHoveredPosition(pos);
                              }
                            }}
                            onMouseLeave={() => {
                              setHoveredPosition(null);
                            }}
                            style={{
                              width: "100%",
                              height: "100%",
                              border:
                                isHovered && isValid
                                  ? "3px solid var(--primary)"
                                  : isPartOfHoverArea && isValid && hoveredPosition
                                    ? "2px solid var(--primary)"
                                    : isValid
                                      ? "2px dashed var(--accent)"
                                      : "1px dashed var(--game-border)",
                              background:
                                isHovered && isValid
                                  ? "var(--game-overlay-primary-20)"
                                  : isPartOfHoverArea && isValid && hoveredPosition
                                    ? "var(--game-overlay-secondary-10)"
                                    : isValid
                                      ? "var(--game-overlay-secondary-10)"
                                      : "transparent",
                              transition: "all 0.15s ease-out",
                              opacity: isHovered ? 1 : isValid ? 0.4 : 0.2,
                              borderRadius: "var(--radius-sm)",
                              cursor: isValid ? "pointer" : "not-allowed",
                              boxShadow: isHovered && isValid ? "var(--game-glow-blue)" : "none",
                            }}
                          />
                        </GridItem>
                      );
                    })}

                  {/* Show moving widget preview at hovered position */}
                  {hoveredPosition && (
                    <GridItem
                      position={hoveredPosition}
                      size={movingWidget.size}
                      style={{
                        zIndex: 15,
                        opacity: 0.6,
                        pointerEvents: "none",
                        transition: "none",
                      }}
                    >
                      <WidgetRenderer
                        widget={movingWidget}
                        songs={songs}
                        pixelArtImageUrl={
                          pixelArtMap.get(movingWidget.id) || pixelArtBySize.get(movingWidget.size)
                        }
                        friendId={friend.id}
                        friendName={friend.display_name}
                      />
                    </GridItem>
                  )}
                </>
              );
            })()}
        </Grid>

        {/* Cancel move button */}
        {movingWidgetId && (
          <div
            style={{
              position: "absolute",
              top: "var(--space-md)",
              left: "var(--space-md)",
              zIndex: 100,
            }}
          >
            <button className="game-button game-button-danger" onClick={handleCancelMove}>
              ✕ Cancel Move (ESC)
            </button>
          </div>
        )}
      </div>

      {/* Widget Configuration Modal */}
      {configuringWidget && (
        <WidgetConfigModal
          widget={configuringWidget}
          friendColors={themeColors}
          onClose={() => {
            setConfiguringWidget(null);
            playSound("close");
          }}
          onSave={async (newConfig) => {
            // Saving widget config

            // Update widget config locally first for immediate feedback
            const updatedWidgets = widgets.map((w) =>
              w.id === configuringWidget.id ? { ...w, config: newConfig } : w
            );
            setWidgets(updatedWidgets);

            // Save to database - only update the specific widget, not all widgets
            try {
              // Sending PUT request to save widgets
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
                console.error("[FriendPage] Failed to save widget config:", errorData);
                alert(`Failed to save: ${errorData.error || "Unknown error"}`);
                playSound("error");
                return;
              }

              const _result = await response.json();
              // Widget config saved successfully
              playSound("success");
            } catch (error) {
              console.error("[FriendPage] Error saving widget config:", error);
              alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
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
            background: themeColors.bg,
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
                  background: themeColors.secondary,
                  borderColor: themeColors.accent,
                  color: themeColors.bg,
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
                color: themeColors.text,
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
          currentColors={themeColors}
          onColorChange={handleColorChange}
          onRandomizeAll={handleRandomizeAll}
        />
      )}
    </div>
  );
}
