"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Friend, WidgetSize, WidgetPosition } from "@/lib/types";
import { FriendWidget } from "@/lib/queries";
import { Grid, GridItem } from "@/components/Grid";
import { WidgetRenderer } from "@/components/WidgetRenderer";
import { playSound } from "@/lib/sounds";
import {
  canPlaceWidget,
  findAvailablePosition,
  getWidgetPositions,
} from "@/lib/widget-utils";
import { WidgetConfigModal } from "./WidgetConfigModal";
import { WidgetLibrary } from "./WidgetLibrary";
import { useUndoRedo } from "./UndoRedo";
import { useKeyboardShortcuts } from "@/lib/keyboard";
import Link from "next/link";

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

  const [localWidgets, setLocalWidgets] =
    useState<FriendWidget[]>(initialWidgets);

  // Sync local widgets with undo/redo state
  useEffect(() => {
    setLocalWidgets(widgets);
  }, [widgets]);

  const setWidgets = useCallback(
    (updater: FriendWidget[] | ((prev: FriendWidget[]) => FriendWidget[])) => {
      const newWidgets =
        typeof updater === "function" ? updater(localWidgets) : updater;
      setLocalWidgets(newWidgets);
      saveState(newWidgets);
    },
    [localWidgets, saveState]
  );

  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] =
    useState<WidgetPosition | null>(null);
  const [editingWidget, setEditingWidget] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [configuringWidget, setConfiguringWidget] =
    useState<FriendWidget | null>(null);

  // Use localWidgets for rendering
  const displayWidgets = localWidgets;

  const handleDragStart = useCallback(
    (e: React.DragEvent, widgetId: string) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", widgetId);
      setDraggedWidget(widgetId);
      playSound("pop");
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, position: WidgetPosition) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";
      setDragOverPosition(position);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, position: WidgetPosition) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggedWidget) return;

      const widget = displayWidgets.find((w) => w.id === draggedWidget);
      if (widget) {
        // Check if position is valid and doesn't overlap with other widgets
        if (
          canPlaceWidget(displayWidgets, draggedWidget, position, widget.size)
        ) {
          const newWidgets = displayWidgets.map((w) =>
            w.id === draggedWidget
              ? {
                  ...w,
                  position_x: position.x,
                  position_y: position.y,
                }
              : w
          );
          setWidgets(newWidgets);
          playSound("success");
        } else {
          playSound("error");
          alert(
            "Cannot place widget here - it would overlap with another widget!"
          );
        }
      }

      setDraggedWidget(null);
      setDragOverPosition(null);
    },
    [draggedWidget, displayWidgets, setWidgets]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedWidget(null);
    setDragOverPosition(null);
  }, []);

  const handleAddWidget = useCallback(
    (widgetType: string, size: WidgetSize) => {
      // Find first available position using proper collision detection
      const foundPosition = findAvailablePosition(displayWidgets, size);

      if (foundPosition) {
        const newWidget: FriendWidget = {
          id: `temp-${Date.now()}`,
          widget_id: "", // Will be set when saving - API will look up by widget_type
          widget_type: widgetType,
          widget_name: widgetType
            .replace("_", " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
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
      if (confirm("Delete this widget?")) {
        const newWidgets = displayWidgets.filter((w) => w.id !== widgetId);
        setWidgets(newWidgets);
        playSound("click");
      }
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

  // Create grid of all positions for drop zones
  const allPositions: WidgetPosition[] = [];
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 8; x++) {
      allPositions.push({ x, y });
    }
  }

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

              // Filter out temp widgets and prepare for save
              const widgetsToSave = displayWidgets.filter(
                (w) => !w.id.startsWith("temp-")
              );

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
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
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
          <WidgetLibrary
            onSelectWidget={(type, size) => handleAddWidget(type, size)}
          />
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
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDragEnd();
          }}
        >
          <Grid>
            {displayWidgets.map((widget) => (
              <GridItem
                key={widget.id}
                position={{ x: widget.position_x, y: widget.position_y }}
                size={widget.size}
              >
                <div
                  draggable={true}
                  onDragStart={(e) => {
                    e.stopPropagation();
                    handleDragStart(e, widget.id);
                  }}
                  onDragEnd={handleDragEnd}
                  onTouchStart={(e) => {
                    // Enable touch dragging
                    const touch = e.touches[0];
                    const element = e.currentTarget;
                    const rect = element.getBoundingClientRect();
                    const startX = touch.clientX - rect.left;
                    const startY = touch.clientY - rect.top;

                    const handleTouchMove = (moveEvent: TouchEvent) => {
                      moveEvent.preventDefault();
                      const moveTouch = moveEvent.touches[0];
                      const deltaX = moveTouch.clientX - touch.clientX;
                      const deltaY = moveTouch.clientY - touch.clientY;

                      // Visual feedback
                      element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                      element.style.opacity = "0.7";
                    };

                    const handleTouchEnd = () => {
                      element.style.transform = "";
                      element.style.opacity = "";
                      document.removeEventListener(
                        "touchmove",
                        handleTouchMove
                      );
                      document.removeEventListener("touchend", handleTouchEnd);
                    };

                    document.addEventListener("touchmove", handleTouchMove, {
                      passive: false,
                    });
                    document.addEventListener("touchend", handleTouchEnd);
                  }}
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    cursor: draggedWidget === widget.id ? "grabbing" : "grab",
                    opacity: draggedWidget === widget.id ? 0.5 : 1,
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    touchAction: "none",
                    WebkitTouchCallout: "none",
                    transition:
                      draggedWidget === widget.id
                        ? "none"
                        : "transform 0.1s ease-out, opacity 0.1s",
                    // Ensure drag works even with child elements
                    pointerEvents: "auto",
                  }}
                  onPointerDown={(e) => {
                    // Allow dragging from anywhere on the widget
                    if (e.button === 0) {
                      // Left mouse button
                      e.currentTarget.setPointerCapture(e.pointerId);
                    }
                  }}
                  onPointerMove={(e) => {
                    // Visual feedback during drag
                    if (e.buttons === 1) {
                      e.currentTarget.style.cursor = "grabbing";
                    }
                  }}
                  onPointerUp={(e) => {
                    e.currentTarget.style.cursor = "grab";
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  }}
                  onMouseEnter={() => setEditingWidget(widget.id)}
                  onMouseLeave={() => setEditingWidget(null)}
                  onClick={(e) => {
                    // Prevent clicks during drag
                    if (draggedWidget === widget.id) {
                      e.stopPropagation();
                    }
                  }}
                >
                  <div
                    style={{
                      pointerEvents:
                        draggedWidget === widget.id ? "none" : "auto",
                      width: "100%",
                      height: "100%",
                    }}
                    onClick={(e) => {
                      // Prevent clicks during drag
                      if (draggedWidget === widget.id) {
                        e.stopPropagation();
                        e.preventDefault();
                      }
                    }}
                  >
                    <WidgetRenderer widget={widget} songs={[]} />
                  </div>
                  {editingWidget === widget.id && (
                    <div
                      className="game-card"
                      style={{
                        position: "absolute",
                        top: "var(--space-md)",
                        right: "var(--space-md)",
                        padding: "var(--space-sm) var(--space-md)",
                        fontSize: "11px",
                        zIndex: 10,
                        display: "flex",
                        gap: "var(--space-sm)",
                        alignItems: "center",
                      }}
                    >
                      <span>
                        {widget.widget_name} ({widget.size})
                      </span>
                      <button
                        className="game-button game-button-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setConfiguringWidget(widget);
                        }}
                        style={{
                          padding: "var(--space-xs)",
                          minWidth: "24px",
                          minHeight: "24px",
                        }}
                        title="Configure"
                      >
                        ⚙️
                      </button>
                      <button
                        className="game-button game-button-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleDuplicateWidget(widget.id);
                        }}
                        style={{
                          padding: "var(--space-xs)",
                          minWidth: "24px",
                          minHeight: "24px",
                        }}
                        title="Duplicate"
                      >
                        📋
                      </button>
                      <button
                        className="game-button game-button-danger game-button-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleDeleteWidget(widget.id);
                        }}
                        style={{
                          padding: "var(--space-xs)",
                          minWidth: "24px",
                          minHeight: "24px",
                        }}
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </GridItem>
            ))}

            {/* Drop zone indicators - show valid positions for dragged widget */}
            {draggedWidget &&
              (() => {
                const draggedWidgetData = displayWidgets.find(
                  (w) => w.id === draggedWidget
                );
                if (!draggedWidgetData) return null;

                // Show drop zones for all valid positions
                return allPositions
                  .filter((pos) =>
                    canPlaceWidget(
                      displayWidgets,
                      draggedWidget,
                      pos,
                      draggedWidgetData.size
                    )
                  )
                  .map((pos) => {
                    const isDragOver =
                      dragOverPosition?.x === pos.x &&
                      dragOverPosition?.y === pos.y;

                    return (
                      <GridItem
                        key={`drop-${pos.x}-${pos.y}`}
                        position={pos}
                        size="1x1"
                      >
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDragOver(e, pos);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDrop(e, pos);
                          }}
                          onDragEnter={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOverPosition(pos);
                          }}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: isDragOver
                              ? "3px dashed var(--primary)"
                              : "2px dashed var(--accent)",
                            background: isDragOver
                              ? "var(--game-overlay-primary-20)"
                              : "var(--game-overlay-secondary-10)",
                            transition: "all var(--transition-normal)",
                            opacity: isDragOver ? 1 : 0.3,
                            pointerEvents: "auto",
                            zIndex: 100,
                            borderRadius: "var(--radius-sm)",
                            boxShadow: isDragOver
                              ? "var(--game-glow-blue)"
                              : "none",
                          }}
                        />
                      </GridItem>
                    );
                  });
              })()}
          </Grid>
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
