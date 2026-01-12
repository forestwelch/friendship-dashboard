"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Grid, GridItem } from "@/components/Grid";
import { WidgetRenderer } from "@/components/WidgetRenderer";
import { AdminOverlay } from "@/components/admin/AdminOverlay";
import { ColorSettings } from "@/components/admin/ColorSettings";
import { WidgetLibrary } from "@/components/admin/WidgetLibrary";
import { WidgetConfigModal } from "@/components/admin/WidgetConfigModal";
import { Friend, WidgetSize, WidgetPosition } from "@/lib/types";
import { ThemeColors } from "@/lib/theme-context";
import { FriendWidget, getWidgetInteractions } from "@/lib/queries";
import { canPlaceWidget, findAvailablePosition } from "@/lib/widget-utils";
import { playSound } from "@/lib/sounds";
import { useThemeContext } from "@/lib/theme-context";
import { useUserContext } from "@/lib/use-user-context";
import { GRID_COLS, GRID_ROWS } from "@/lib/constants";
import { hasNewContent } from "@/lib/widget-notifications";

interface FriendPageClientProps {
  friend: Friend;
  initialWidgets: FriendWidget[];
  pixelArtMap: Map<string, string>;
  pixelArtBySize: Map<string, string>;
  forceViewMode?: boolean; // If true, always use view mode regardless of admin route
}

export function FriendPageClient({
  friend,
  initialWidgets,
  pixelArtMap: initialPixelArtMap,
  pixelArtBySize,
  forceViewMode = false,
}: FriendPageClientProps) {
  const userContext = useUserContext();
  // Only allow edit mode if user is admin (detected from URL path) and not forced to view mode
  const [isEditMode, setIsEditMode] = useState(forceViewMode ? false : userContext.isAdmin);

  // If admin route, start in edit mode by default
  // If friend route, always stay in view mode
  const [widgets, setWidgets] = useState<FriendWidget[]>(initialWidgets);
  const [hoveredWidget, setHoveredWidget] = useState<string | null>(null);
  const [movingWidgetId, setMovingWidgetId] = useState<string | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<WidgetPosition | null>(null);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [configuringWidget, setConfiguringWidget] = useState<FriendWidget | null>(null);
  const [showColorSettings, setShowColorSettings] = useState(false);
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

  // State for widget interactions (for notification system)
  const [widgetInteractions, setWidgetInteractions] = useState<
    Record<string, { last_interacted_at: string }>
  >({});

  // Fetch widget interactions on mount
  useEffect(() => {
    const fetchInteractions = async () => {
      // For now, use the dashboard's friend ID as the viewer
      // In a multi-user system, this would be the logged-in user's friend ID
      const viewerFriendId = friend.id;
      const widgetIds = widgets.map((w) => w.id);
      const interactions = await getWidgetInteractions(viewerFriendId, widgetIds);
      setWidgetInteractions(interactions);
    };
    fetchInteractions();
  }, [friend.id, widgets]);

  // Update widget interaction when user hovers or taps
  const handleWidgetInteraction = useCallback(
    async (widgetId: string) => {
      // Don't update interaction in edit mode
      if (isEditMode) return;

      // For now, use the dashboard's friend ID as the viewer
      const viewerFriendId = friend.id;

      try {
        const response = await fetch("/api/widgets/interactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            friend_widget_id: widgetId,
            viewer_friend_id: viewerFriendId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Update local state optimistically
          setWidgetInteractions((prev) => ({
            ...prev,
            [widgetId]: { last_interacted_at: data.last_interacted_at },
          }));
        }
      } catch (error) {
        console.error("Failed to update widget interaction:", error);
      }
    },
    [friend.id, isEditMode]
  );

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
      // Check for duplicate widget types (except pixel_art which allows multiple)
      const existingWidgetsOfType = widgets.filter((w) => w.widget_type === widgetType);
      if (widgetType !== "pixel_art" && existingWidgetsOfType.length > 0) {
        playSound("error");
        alert(`You can only have one ${widgetType.replace(/_/g, " ")} widget per friend.`);
        return;
      }

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
        console.error("Save error details:", errorData);
        throw new Error(errorData.details || errorData.error || "Failed to save");
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
    // Improved default palettes with more distinct primary/secondary colors
    const defaultPalettes = [
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

    let randomPalette;

    try {
      // Try to fetch saved palettes first
      const response = await fetch("/api/content/color-palettes");
      const data = await response.json();
      const savedPalettes = data.palettes || [];

      if (savedPalettes.length > 0) {
        // Use saved palettes
        const randomIndex = Math.floor(Math.random() * savedPalettes.length);
        const selected = savedPalettes[randomIndex];
        randomPalette = {
          primary: selected.primary,
          secondary: selected.secondary,
          accent: selected.accent,
          bg: selected.bg,
          text: selected.text,
        };
      } else {
        // Fall back to defaults
        randomPalette = defaultPalettes[Math.floor(Math.random() * defaultPalettes.length)];
      }
    } catch (error) {
      // On error, use defaults
      console.error("Error fetching palettes, using defaults:", error);
      randomPalette = defaultPalettes[Math.floor(Math.random() * defaultPalettes.length)];
    }

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

  // Listen for admin navigation events (only in admin mode)
  useEffect(() => {
    if (!userContext.isAdmin) return;

    const handleAddWidget = () => {
      setShowWidgetLibrary(true);
    };

    const handleAdminSave = () => {
      handleSave();
    };

    const handleSetEditMode = (e: Event) => {
      if (forceViewMode) return; // Don't allow changing edit mode if forced to view mode
      const customEvent = e as CustomEvent<boolean>;
      setIsEditMode(customEvent.detail);
    };

    const handleToggleColors = () => {
      setShowColorSettings((prev) => !prev);
    };

    window.addEventListener("admin-add-widget", handleAddWidget);
    window.addEventListener("admin-save", handleAdminSave);
    window.addEventListener("admin-set-edit-mode", handleSetEditMode);
    window.addEventListener("admin-toggle-colors", handleToggleColors);

    // Notify navigation of edit mode changes
    window.dispatchEvent(new CustomEvent("admin-edit-mode-changed", { detail: isEditMode }));

    return () => {
      window.removeEventListener("admin-add-widget", handleAddWidget);
      window.removeEventListener("admin-save", handleAdminSave);
      window.removeEventListener("admin-set-edit-mode", handleSetEditMode);
      window.removeEventListener("admin-toggle-colors", handleToggleColors);
    };
  }, [userContext.isAdmin, handleSave, isEditMode, forceViewMode]);

  // Sync edit mode changes to navigation whenever it changes
  useEffect(() => {
    if (!userContext.isAdmin) return;
    window.dispatchEvent(new CustomEvent("admin-edit-mode-changed", { detail: isEditMode }));
  }, [isEditMode, userContext.isAdmin]);

  return (
    <div
      style={{
        ...themeStyle,
        paddingTop: "0", // No padding - nav is fixed and doesn't affect layout
        width: "100%",
        maxWidth: "100%",
        minHeight: "100vh",
        background: themeColors.bg,
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Grid container - allows scrolling and scaling */}
      <div
        ref={gridRef}
        data-grid-container-wrapper
        className="grid-container-wrapper"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "100%",
          height: "100vh",
          minHeight: "100vh",
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

              // Calculate notification state (only in view mode, not edit mode)
              // hasNotification = widget.last_updated_at > user.last_interacted_at
              const widgetInteraction = widgetInteractions[widget.id];
              const widgetHasNewContent =
                !isEditMode &&
                hasNewContent(widget.last_updated_at, widgetInteraction?.last_interacted_at);

              // #region agent log
              if (!isEditMode) {
                fetch("http://127.0.0.1:7242/ingest/08ba6ecb-f05f-479b-b2cd-50cb668f1262", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    location: "app/[friend]/FriendPageClient.tsx:625",
                    message: "Widget notification check",
                    data: {
                      widgetId: widget.id,
                      widgetType: widget.widget_type,
                      lastUpdatedAt: widget.last_updated_at,
                      lastInteractedAt: widgetInteraction?.last_interacted_at || null,
                      hasNewContent: widgetHasNewContent,
                    },
                    timestamp: Date.now(),
                    sessionId: "debug-session",
                    runId: "run1",
                    hypothesisId: "B",
                  }),
                }).catch(() => {});
              }
              // #endregion

              // Build container class names - only add "has-new-content" if there's actually new content
              const containerClasses = ["widget-container"];
              if (widgetHasNewContent) {
                containerClasses.push("has-new-content");
              }
              // No special styling for widgets without new content - they look normal

              return (
                <GridItem
                  key={widget.id}
                  position={{ x: widget.position_x, y: widget.position_y }}
                  size={widget.size}
                >
                  <div
                    data-widget-item={widget.id}
                    className={containerClasses.join(" ")}
                    style={
                      {
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        // Add glow effect for new content widgets using inline style
                        // ...(widgetHasNewContent
                        //   ? {
                        //       boxShadow: `0 0 8px ${themeColors.secondary}40`, // 40 = ~25% opacity in hex
                        //     }
                        //   : {}),
                      } as React.CSSProperties
                    }
                    onMouseEnter={() => {
                      if (isEditMode && !movingWidgetId) {
                        setHoveredWidget(widget.id);
                      } else if (!isEditMode) {
                        // Track interaction on hover (for notification system)
                        handleWidgetInteraction(widget.id);
                      }
                    }}
                    onMouseLeave={() => setHoveredWidget(null)}
                    onTouchStart={() => {
                      if (!isEditMode) {
                        // Track interaction on tap (for notification system)
                        handleWidgetInteraction(widget.id);
                      }
                    }}
                  >
                    <WidgetRenderer
                      widget={widget}
                      pixelArtImageUrl={pixelArtImageUrl}
                      onUploadImage={(file) => handleUploadImage(file, widget.id)}
                      friendId={friend.id}
                      friendName={friend.display_name}
                      onUpdateWidgetConfig={handleUpdateWidgetConfig}
                    />
                    {/* Star icon for new content widgets */}
                    {/*{widgetHasNewContent && (
                      <div className="widget-new-content-indicator">
                        <i className="hn hn-star-solid" />
                      </div>
                    )}*/}
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
              for (let y = 0; y < GRID_ROWS; y++) {
                for (let x = 0; x < GRID_COLS; x++) {
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
                            onTouchStart={() => {
                              if (isValid) {
                                setHoveredPosition(pos);
                              }
                            }}
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              if (isValid) {
                                handlePlaceWidget(pos);
                              }
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
                              opacity: isHovered ? 1 : isValid ? 0.4 : 0.2,
                              borderRadius: "var(--radius-sm)",
                              cursor: isValid ? "pointer" : "not-allowed",
                              boxShadow: isHovered && isValid ? "var(--game-glow-blue)" : "none",
                              touchAction: "manipulation",
                              minHeight: "44px",
                              minWidth: "44px",
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
                      }}
                    >
                      <WidgetRenderer
                        widget={movingWidget}
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
              <i className="hn hn-times-solid" style={{ marginRight: "var(--space-xs)" }} /> Cancel
              Move (ESC)
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
          onSave={async (newConfig, newSize) => {
            // Saving widget config

            // Update widget config and size locally first for immediate feedback
            const updatedWidgets = widgets.map((w) =>
              w.id === configuringWidget.id
                ? { ...w, config: newConfig, size: newSize || w.size }
                : w
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
                console.error("[FriendPage] Widgets being saved:", updatedWidgets);
                const errorMsg = errorData.details || errorData.error || "Unknown error";
                alert(`Failed to save: ${errorMsg}`);
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

      {/* Color settings modal - shown when triggered from nav */}
      {isEditMode && showColorSettings && (
        <ColorSettings
          friendId={friend.id}
          currentColors={themeColors}
          onColorChange={handleColorChange}
          onRandomizeAll={handleRandomizeAll}
          onClose={() => setShowColorSettings(false)}
        />
      )}
    </div>
  );
}
