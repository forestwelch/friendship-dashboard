"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Friend, WidgetSize, WidgetPosition } from "@/lib/types";
import { FriendWidget } from "@/lib/queries";
import { Grid, GridItem } from "@/components/Grid";
import { WidgetRenderer } from "@/components/WidgetRenderer";
import { playSound } from "@/lib/sounds";
import { canPlaceWidget, findAvailablePosition } from "@/lib/widget-utils";
import { WidgetConfigModal } from "./WidgetConfigModal";
import { WidgetLibrary } from "./WidgetLibrary";
import { useUndoRedo } from "./UndoRedo";
import { useKeyboardShortcuts } from "@/lib/keyboard";
import Link from "next/link";
import { EditableWidget } from "./Widget";
import { GRID_COLS, GRID_ROWS } from "@/lib/constants";

interface WidgetManagerProps {
  friend: Friend;
  initialWidgets: FriendWidget[];
}

export function WidgetManager({ friend, initialWidgets }: WidgetManagerProps) {
  const {
    currentState: widgets,
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo(initialWidgets);

  const [localWidgets, setLocalWidgets] = useState<FriendWidget[]>(initialWidgets);

  // Sync local widgets with undo/redo state
  useEffect(() => {
    setLocalWidgets(widgets);
  }, [widgets]);

  const setWidgets = useCallback(
    (updater: FriendWidget[] | ((prev: FriendWidget[]) => FriendWidget[])) => {
      setLocalWidgets((prev) => {
        const newWidgets = typeof updater === "function" ? updater(prev) : updater;
        saveState(newWidgets);
        return newWidgets;
      });
    },
    [saveState]
  );

  const [movingWidgetId, setMovingWidgetId] = useState<string | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<WidgetPosition | null>(null);
  const [editingWidget, setEditingWidget] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [configuringWidget, setConfiguringWidget] = useState<FriendWidget | null>(null);

  // Use localWidgets for rendering, but exclude the widget being moved
  const displayWidgets = useMemo(() => {
    if (!movingWidgetId) return localWidgets;
    return localWidgets.filter((w) => w.id !== movingWidgetId);
  }, [localWidgets, movingWidgetId]);

  // Get the widget being moved
  const movingWidget = useMemo(() => {
    if (!movingWidgetId) return null;
    return localWidgets.find((w) => w.id === movingWidgetId) || null;
  }, [localWidgets, movingWidgetId]);

  // Handle starting move mode
  const handleStartMove = useCallback((widgetId: string) => {
    setMovingWidgetId(widgetId);
    setHoveredPosition(null);
    playSound("pop");
  }, []);

  // Handle canceling move mode
  const handleCancelMove = useCallback(() => {
    setMovingWidgetId(null);
    setHoveredPosition(null);
  }, []);

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

  // Handle placing widget at position
  const handlePlaceWidget = useCallback(
    (position: WidgetPosition) => {
      if (!movingWidgetId || !movingWidget) {
        return;
      }

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
    [movingWidgetId, movingWidget, setWidgets]
  );

  const handleAddWidget = useCallback(
    (widgetType: string, size: WidgetSize) => {
      const foundPosition = findAvailablePosition(displayWidgets, size);

      if (foundPosition) {
        const newWidget: FriendWidget = {
          id: `temp-${Date.now()}`,
          widget_id: "",
          widget_type: widgetType,
          widget_name: widgetType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          size,
          position_x: foundPosition.x,
          position_y: foundPosition.y,
          config: {},
        };

        const newWidgets = [...displayWidgets, newWidget];
        setWidgets(newWidgets);
        setShowAddMenu(false);
        playSound("success");
      } else {
        playSound("error");
        alert(`No available space on the grid for a ${size} widget!`);
      }
    },
    [displayWidgets, setWidgets]
  );

  const handleDeleteWidget = useCallback(
    (widgetId: string) => {
      const newWidgets = displayWidgets.filter((w) => w.id !== widgetId);
      setWidgets(newWidgets);
      playSound("delete");
    },
    [displayWidgets, setWidgets]
  );

  const handleDuplicateWidget = useCallback(
    (widgetId: string) => {
      const widget = displayWidgets.find((w) => w.id === widgetId);
      if (!widget) return;

      const foundPosition = findAvailablePosition(displayWidgets, widget.size);
      if (!foundPosition) {
        playSound("error");
        alert("No space available to duplicate widget!");
        return;
      }

      const duplicatedWidget: FriendWidget = {
        ...widget,
        id: `temp-${Date.now()}`,
        position_x: foundPosition.x,
        position_y: foundPosition.y,
      };

      const newWidgets = [...displayWidgets, duplicatedWidget];
      setWidgets(newWidgets);
      playSound("success");
    },
    [displayWidgets, setWidgets]
  );

  // Keyboard shortcuts for undo/redo
  useKeyboardShortcuts([
    {
      key: "z",
      ctrl: true,
      action: () => {
        if (canUndo) {
          undo();
        }
      },
      description: "Undo",
    },
    {
      key: "y",
      ctrl: true,
      action: () => {
        if (canRedo) {
          redo();
        }
      },
      description: "Redo",
    },
  ]);

  // Create grid of all positions for drop zones (memoized)
  const allPositions: WidgetPosition[] = useMemo(() => {
    const positions: WidgetPosition[] = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        positions.push({ x, y });
      }
    }
    return positions;
  }, []);

  // Get all positions occupied by existing widgets (excluding the widget being moved)
  const occupiedPositions = useMemo(() => {
    const occupied = new Set<string>();
    displayWidgets.forEach((w) => {
      const [cols, rows] = w.size.split("x").map(Number);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          occupied.add(`${w.position_x + x},${w.position_y + y}`);
        }
      }
    });
    return occupied;
  }, [displayWidgets]);

  // Apply friend theme colors to widget preview area
  const hexToRgba = (hex: string, alpha: number): string => {
    const cleanHex = hex.replace("#", "");
    const hexLength = cleanHex.length;
    const rgbHex = hexLength === 8 ? cleanHex.slice(0, 6) : cleanHex;
    const r = parseInt(rgbHex.slice(0, 2), 16);
    const g = parseInt(rgbHex.slice(2, 4), 16);
    const b = parseInt(rgbHex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const gridTileBg = hexToRgba(friend.color_accent, 0.05);
  const gridTileBorder = hexToRgba(friend.color_secondary, 0.1);

  const widgetPreviewTheme: React.CSSProperties = {
    "--primary": friend.color_primary,
    "--secondary": friend.color_secondary,
    "--accent": friend.color_accent,
    "--bg": friend.color_bg,
    "--text": friend.color_text,
    "--grid-tile-bg": gridTileBg,
    "--grid-tile-border": gridTileBorder,
  } as React.CSSProperties;

  return (
    <div
      className="admin-page"
      style={{
        width: "100%",
        height: "100vh",
        padding: "0",
        background: "var(--admin-bg)",
        color: "var(--admin-text)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Compact header bar */}
      <div
        className="game-flex game-flex-between"
        style={{
          padding: "var(--space-md) var(--space-lg)",
          borderBottom: "2px solid var(--game-border)",
          flexShrink: 0,
          background: "var(--bg)",
        }}
      >
        <div className="game-breadcrumb">
          <Link href="/admin" className="game-link">
            Admin
          </Link>
          <span className="game-breadcrumb-separator">/</span>
          <span className="game-breadcrumb-current">{friend.display_name}</span>
        </div>
        <Link href={`/${friend.slug}`} className="game-link">
          View Page →
        </Link>
      </div>

      {/* Compact button bar */}
      <div
        className="game-flex game-flex-gap-sm"
        style={{
          padding: "var(--space-md) var(--space-lg)",
          flexWrap: "wrap",
          flexShrink: 0,
          borderBottom: "2px solid var(--game-border)",
          background: "var(--bg)",
        }}
      >
        <button
          className="game-button game-button-primary"
          onClick={() => setShowAddMenu(!showAddMenu)}
        >
          + Add Widget
        </button>
        <button
          className="game-button game-button-icon"
          onClick={() => {
            const undone = undo();
            if (undone) {
              // State is updated automatically via useEffect
            }
          }}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          className="game-button game-button-icon"
          onClick={() => {
            const redone = redo();
            if (redone) {
              // State is updated automatically via useEffect
            }
          }}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          ↷
        </button>
        <button
          className="game-button game-button-success"
          onClick={async () => {
            try {
              playSound("click");

              const widgetsToSave = localWidgets.filter((w) => !w.id.startsWith("temp-"));

              if (widgetsToSave.length === 0) {
                playSound("error");
                alert("No widgets to save. Add some widgets first!");
                return;
              }

              const response = await fetch(`/api/widgets/${friend.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ widgets: widgetsToSave }),
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to save widgets");
              }

              playSound("success");
              alert("Layout saved successfully! 🎉");
            } catch (error) {
              console.error("Error saving widgets:", error);
              playSound("error");
              const errorMessage = error instanceof Error ? error.message : "Unknown error";
              alert(`Failed to save layout: ${errorMessage}`);
            }
          }}
          style={{ marginLeft: "auto" }}
        >
          💾 Save Layout
        </button>
      </div>

      {showAddMenu && (
        <div
          className="game-card"
          style={{ margin: "var(--space-md) var(--space-lg)", flexShrink: 0 }}
        >
          <WidgetLibrary onSelectWidget={(type, size) => handleAddWidget(type, size)} />
        </div>
      )}

      {/* Widget preview area with friend theme */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "var(--space-lg)",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          background: "var(--bg)",
        }}
      >
        <div
          style={{
            ...widgetPreviewTheme,
            border: "3px solid var(--game-border)",
            padding: "var(--space-lg)",
            background: friend.color_bg,
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "var(--game-shadow-lg)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <Grid>
            {/* Render all widgets except the one being moved */}
            {displayWidgets.map((widget) => (
              <EditableWidget
                key={widget.id}
                widget={widget}
                onEdit={() => {
                  if (!movingWidgetId) {
                    setEditingWidget(widget.id);
                  }
                }}
                onConfigure={() => setConfiguringWidget(widget)}
                onDuplicate={() => handleDuplicateWidget(widget.id)}
                onDelete={() => handleDeleteWidget(widget.id)}
                onMove={() => handleStartMove(widget.id)}
                editingWidget={editingWidget}
              />
            ))}

            {/* Show moveable tiles when a widget is being moved */}
            {movingWidgetId && movingWidget && (
              <>
                {/* Show all empty positions as clickable tiles */}
                {allPositions
                  .filter((pos) => !occupiedPositions.has(`${pos.x},${pos.y}`))
                  .map((pos) => {
                    const isValid = canPlaceWidget(
                      localWidgets,
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
                    const isHovered = hoveredPosition?.x === pos.x && hoveredPosition?.y === pos.y;
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
                    <WidgetRenderer widget={movingWidget} songs={[]} />
                  </GridItem>
                )}
              </>
            )}
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
      </div>

      {/* Widget Configuration Modal */}
      {configuringWidget && (
        <WidgetConfigModal
          widget={configuringWidget}
          onClose={() => setConfiguringWidget(null)}
          onSave={(newConfig) => {
            const newWidgets = displayWidgets.map((w) =>
              w.id === configuringWidget.id ? { ...w, config: newConfig } : w
            );
            setWidgets(newWidgets);
            setConfiguringWidget(null);
          }}
        />
      )}
    </div>
  );
}
