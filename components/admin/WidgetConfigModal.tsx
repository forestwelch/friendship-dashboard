"use client";

import React, { useState, useEffect, useRef } from "react";
import { FriendWidget } from "@/lib/queries";
import { playSound } from "@/lib/sounds";
import { cropImageToSize, getThemePalette } from "@/lib/image-processing";

interface ImageItem {
  id: string;
  base_image_data: string;
  size: string;
  created_at: string;
}

interface WidgetConfigModalProps {
  widget: FriendWidget | null;
  onClose: () => void;
  onSave: (config: Record<string, any>) => void;
  friendColors?: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
  };
}

export function WidgetConfigModal({
  widget,
  onClose,
  onSave,
  friendColors,
}: WidgetConfigModalProps) {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [availableImages, setAvailableImages] = useState<ImageItem[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [processingImages, setProcessingImages] = useState<Set<string>>(
    new Set()
  );
  const widgetIdRef = useRef<string | null>(null);
  const imagesFetchedRef = useRef(false);

  // Update config when widget changes (only when widget ID changes)
  useEffect(() => {
    if (widget && widget.id !== widgetIdRef.current) {
      widgetIdRef.current = widget.id;
      setConfig(widget.config || {});
      imagesFetchedRef.current = false; // Reset fetch flag for new widget
    }
  }, [widget?.id]);

  // Fetch available images for pixel_art widgets (only once per widget type)
  useEffect(() => {
    if (widget?.widget_type === "pixel_art" && !imagesFetchedRef.current) {
      imagesFetchedRef.current = true;
      setLoadingImages(true);
      fetch("/api/images")
        .then((res) => res.json())
        .then((data) => {
          setAvailableImages(data.images || []);
          setLoadingImages(false);
        })
        .catch(() => {
          setLoadingImages(false);
        });
    }
  }, [widget?.widget_type]);

  if (!widget) return null;

  const handleSave = () => {
    onSave(config);
    playSound("success");
    onClose();
  };

  const renderConfigFields = () => {
    switch (widget.widget_type) {
      case "notes":
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-md)",
            }}
          >
            <label className="game-heading-3" style={{ margin: 0 }}>
              Initial Notes (one per line)
            </label>
            <textarea
              className="game-input"
              value={(config.notes || []).join("\n")}
              onChange={(e) =>
                setConfig({
                  ...config,
                  notes: e.target.value.split("\n").filter((n) => n.trim()),
                })
              }
              style={{
                minHeight: "6.25rem",
                fontFamily: "inherit",
              }}
            />
          </div>
        );

      case "links":
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-md)",
            }}
          >
            <label className="game-heading-3" style={{ margin: 0 }}>
              Links (JSON format)
            </label>
            <textarea
              className="game-input"
              value={JSON.stringify(config.links || [], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setConfig({ ...config, links: parsed });
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              style={{
                fontFamily: "monospace",
                minHeight: "9.375rem",
              }}
            />
            <div
              className="game-text-muted"
              style={{ fontSize: "var(--font-size-xs)" }}
            >
              Format: [{"{"}"id": "1", "title": "Example", "url": "https://...",
              "icon": "hn-link-solid"{"}"}]
            </div>
          </div>
        );

      case "calendar":
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-md)",
            }}
          >
            <label className="game-heading-3" style={{ margin: 0 }}>
              Events (JSON format)
            </label>
            <textarea
              className="game-input"
              value={JSON.stringify(config.events || [], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setConfig({ ...config, events: parsed });
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              style={{
                fontFamily: "monospace",
                minHeight: "9.375rem",
              }}
            />
            <div
              className="game-text-muted"
              style={{ fontSize: "var(--font-size-xs)" }}
            >
              Format: [{"{"}"id": "1", "title": "Event", "date": "2024-01-15",
              "time": "3:00 PM"{"}"}]
            </div>
          </div>
        );

      case "media_recommendations":
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-md)",
            }}
          >
            <label className="game-heading-3" style={{ margin: 0 }}>
              Recommendations (JSON format)
            </label>
            <textarea
              className="game-input"
              value={JSON.stringify(config.recommendations || [], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setConfig({ ...config, recommendations: parsed });
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              style={{
                fontFamily: "monospace",
                minHeight: "9.375rem",
              }}
            />
            <div
              className="game-text-muted"
              style={{ fontSize: "var(--font-size-xs)" }}
            >
              Format: [{"{"}"id": "1", "title": "Movie", "type": "movie",
              "description": "..."{"}"}]
            </div>
          </div>
        );

      case "pixel_art":
        // Get selected image IDs - check both imageIds and imageUrls (for backward compatibility)
        let selectedImageIds: string[] = config.imageIds || [];

        // If we have imageUrls but no imageIds, try to match them to available images
        if (
          selectedImageIds.length === 0 &&
          config.imageUrls &&
          config.imageUrls.length > 0
        ) {
          selectedImageIds = availableImages
            .filter((img) => config.imageUrls.includes(img.base_image_data))
            .map((img) => img.id);
        }
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-md)",
            }}
          >
            <label className="game-heading-3" style={{ margin: 0 }}>
              Select Images for Slideshow
            </label>
            {loadingImages ? (
              <div
                className="game-text-muted"
                style={{ padding: "var(--space-lg)", textAlign: "center" }}
              >
                <div>Loading images...</div>
                <div
                  style={{
                    fontSize: "var(--font-size-xs)",
                    marginTop: "var(--space-xs)",
                    opacity: 0.7,
                  }}
                >
                  Fetching from database...
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(6.25rem, 1fr))",
                  gap: "var(--space-sm)",
                  maxHeight: "18.75rem",
                  overflowY: "auto",
                  padding: "var(--space-sm)",
                  border: "var(--border-width-md) solid var(--game-border)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {availableImages.map((img) => {
                  const isSelected = selectedImageIds.includes(img.id);
                  return (
                    <div
                      key={img.id}
                      onClick={async () => {
                        playSound("click");
                        const newIds = isSelected
                          ? selectedImageIds.filter(
                              (id: string) => id !== img.id
                            )
                          : [...selectedImageIds, img.id];

                        // If deselecting, just remove it
                        if (isSelected) {
                          const remainingImages = availableImages.filter((i) =>
                            newIds.includes(i.id)
                          );
                          setConfig({
                            ...config,
                            imageIds: newIds,
                            imageUrls: remainingImages.map((i) => {
                              // Keep processed URLs if they exist in config
                              const existingUrls = config.imageUrls || [];
                              const existingIndex = existingUrls.findIndex(
                                (url: string) =>
                                  url.includes(
                                    i.base_image_data.substring(0, 50)
                                  ) // Match by first part
                              );
                              return existingIndex >= 0
                                ? existingUrls[existingIndex]
                                : i.base_image_data;
                            }),
                          });
                          return;
                        }

                        // If selecting, process the image through pixelation (async, non-blocking)
                        if (!processingImages.has(img.id)) {
                          setProcessingImages((prev) =>
                            new Set(prev).add(img.id)
                          );

                          // Process in background
                          (async () => {
                            try {
                              console.log(
                                `[WidgetConfig] Processing image ${img.id}...`
                              );
                              const processStartTime = Date.now();

                              // Convert base64 to File for processing
                              const response = await fetch(img.base_image_data);
                              const blob = await response.blob();
                              const file = new File([blob], "image.png", {
                                type: "image/png",
                              });

                              // Get widget size dimensions
                              const rootFontSize =
                                typeof window !== "undefined"
                                  ? parseFloat(
                                      getComputedStyle(document.documentElement)
                                        .fontSize
                                    )
                                  : 16;
                              const tileSize = 5 * rootFontSize; // 5rem
                              const gap = 0.5 * rootFontSize; // 0.5rem

                              // Determine size based on widget (default to 2x2)
                              const widgetSize = widget?.size || "2x2";
                              let width = tileSize;
                              let height = tileSize;

                              if (widgetSize === "2x2") {
                                width = tileSize * 2 + gap;
                                height = tileSize * 2 + gap;
                              } else if (widgetSize === "3x3") {
                                width = tileSize * 3 + gap * 2;
                                height = tileSize * 3 + gap * 2;
                              }

                              // Use friend's colors if provided, otherwise fall back to CSS variables
                              const palette = friendColors
                                ? {
                                    primary: friendColors.primary,
                                    secondary: friendColors.secondary,
                                    accent: friendColors.accent,
                                    bg: friendColors.bg,
                                    text: friendColors.text,
                                  }
                                : getThemePalette();

                              console.log(
                                `[WidgetConfig] Processing with palette:`,
                                palette
                              );
                              const pixelated = await cropImageToSize(
                                file,
                                width,
                                height,
                                4,
                                palette
                              );

                              const processTime = Date.now() - processStartTime;
                              console.log(
                                `[WidgetConfig] Image ${img.id} processed in ${processTime}ms`
                              );

                              // Update config with processed image (use functional update to avoid stale closure)
                              setConfig((prevConfig) => {
                                const selectedImages = availableImages.filter(
                                  (i) => newIds.includes(i.id)
                                );
                                const existingUrls = prevConfig.imageUrls || [];

                                // Map to processed URLs
                                const processedUrls = selectedImages.map(
                                  (imageItem) => {
                                    if (imageItem.id === img.id) {
                                      return pixelated; // Use newly processed image
                                    }
                                    // For other images, check if already processed
                                    const existingIndex =
                                      existingUrls.findIndex((url: string) =>
                                        url.includes(
                                          imageItem.base_image_data.substring(
                                            0,
                                            50
                                          )
                                        )
                                      );
                                    return existingIndex >= 0
                                      ? existingUrls[existingIndex]
                                      : imageItem.base_image_data;
                                  }
                                );

                                return {
                                  ...prevConfig,
                                  imageIds: newIds,
                                  imageUrls: processedUrls,
                                };
                              });
                            } catch (error) {
                              console.error(
                                `[WidgetConfig] Error processing image ${img.id}:`,
                                error
                              );
                              // Fallback to original image if processing fails
                              setConfig((prevConfig) => {
                                const selectedImages = availableImages.filter(
                                  (i) => newIds.includes(i.id)
                                );
                                return {
                                  ...prevConfig,
                                  imageIds: newIds,
                                  imageUrls: selectedImages.map(
                                    (i) => i.base_image_data
                                  ),
                                };
                              });
                            } finally {
                              setProcessingImages((prev) => {
                                const next = new Set(prev);
                                next.delete(img.id);
                                return next;
                              });
                            }
                          })();
                        }
                      }}
                      style={{
                        position: "relative",
                        aspectRatio: "1/1",
                        border: isSelected
                          ? "0.125rem solid var(--game-accent-blue)"
                          : "0.0625rem solid var(--game-border)",
                        borderRadius: "var(--radius-sm)",
                        overflow: "hidden",
                        cursor: "pointer",
                        opacity: isSelected ? 1 : 0.7,
                        transition: "all 0.2s",
                      }}
                    >
                      <img
                        src={img.base_image_data}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          imageRendering: "pixelated",
                        }}
                      />
                      {isSelected && (
                        <div
                          style={{
                            position: "absolute",
                            top: "0.25rem",
                            right: "0.25rem",
                            background: "var(--game-accent-blue)",
                            color: "white",
                            borderRadius: "50%",
                            width: "1.25rem",
                            height: "1.25rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "var(--font-size-xs)",
                            fontWeight: "bold",
                          }}
                        >
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {selectedImageIds.length > 0 && (
              <div
                className="game-text-muted"
                style={{ fontSize: "var(--font-size-xs)" }}
              >
                {selectedImageIds.length} image
                {selectedImageIds.length !== 1 ? "s" : ""} selected. Images will
                cycle with cascade animation.
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="game-text-muted">
            No configuration options available for this widget type.
          </div>
        );
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="game-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "37.5rem",
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
          padding: "var(--space-xl)",
        }}
      >
        <div
          className="game-flex game-flex-between"
          style={{ marginBottom: "var(--space-lg)" }}
        >
          <h2 className="game-heading-2" style={{ margin: 0 }}>
            Configure {widget.widget_name}
          </h2>
          <button
            className="game-button game-button-icon"
            onClick={onClose}
            style={{ minWidth: "2rem", minHeight: "2rem" }}
          >
            ×
          </button>
        </div>

        {renderConfigFields()}

        <div
          className="game-flex game-flex-gap-md"
          style={{ marginTop: "var(--space-xl)", justifyContent: "flex-end" }}
        >
          <button className="game-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="game-button game-button-success"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
