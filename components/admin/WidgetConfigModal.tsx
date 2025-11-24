"use client";

import React, { useState, useEffect, useRef } from "react";
import { FriendWidget } from "@/lib/queries";
import { playSound } from "@/lib/sounds";
import { processImageToPixelData, pixelDataToBase64 } from "@/lib/pixel-data-processing";

interface ImageItem {
  id: string;
  pixel_data?: string | null; // New format: base64-encoded Uint8Array
  base_image_data?: string | null; // Old format: base64 image (for backward compatibility)
  size: string;
  width?: number;
  height?: number;
  created_at: string;
}

interface WidgetConfigModalProps {
  widget: FriendWidget | null;
  onClose: () => void;
  onSave: (config: Record<string, unknown>) => void;
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
  friendColors: _friendColors,
}: WidgetConfigModalProps) {
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [availableImages, setAvailableImages] = useState<ImageItem[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [processingImages, setProcessingImages] = useState<Set<string>>(new Set());
  const widgetIdRef = useRef<string | null>(null);
  const imagesFetchedRef = useRef(false);

  // Update config when widget changes (only when widget ID changes)
  useEffect(() => {
    if (widget && widget.id !== widgetIdRef.current) {
      widgetIdRef.current = widget.id;
      setConfig(widget.config || {});
      imagesFetchedRef.current = false; // Reset fetch flag for new widget
    }
  }, [widget]);

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

      case "shared_links":
      case "links": // Backward compatibility
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
            <div className="game-text-muted" style={{ fontSize: "var(--font-size-xs)" }}>
              Format: JSON array of link objects with id, title, url, icon
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
            <div className="game-text-muted" style={{ fontSize: "var(--font-size-xs)" }}>
              Format: JSON array of event objects with id, title, date, time
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
            <div className="game-text-muted" style={{ fontSize: "var(--font-size-xs)" }}>
              Format: JSON array of recommendation objects with id, title, type, description
            </div>
          </div>
        );

      case "pixel_art":
        // Get selected image IDs - check pixelData (new format) or imageIds/imageUrls (backward compatibility)
        let selectedImageIds: string[] = config.imageIds || [];

        // If we have pixelData but no imageIds, extract IDs from pixelData array
        if (selectedImageIds.length === 0 && config.pixelData && config.pixelData.length > 0) {
          // Try to match pixelData to available images (this is a simplified approach)
          // In a real scenario, you'd want to store image IDs alongside pixelData
          selectedImageIds = availableImages
            .filter((img) => img.pixel_data && config.pixelData.includes(img.pixel_data))
            .map((img) => img.id);
        }

        // Backward compatibility: if we have imageUrls but no imageIds
        if (selectedImageIds.length === 0 && config.imageUrls && config.imageUrls.length > 0) {
          selectedImageIds = availableImages
            .filter((img) => img.base_image_data && config.imageUrls.includes(img.base_image_data))
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
                  gridTemplateColumns: "repeat(auto-fill, minmax(6.25rem, 1fr))",
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
                  const isProcessing = processingImages.has(img.id);

                  // Use pixel_data if available (new format), otherwise fall back to base_image_data (old format)
                  const imageSrc = img.pixel_data
                    ? null // Will render programmatically
                    : img.base_image_data || null;

                  return (
                    <div
                      key={img.id}
                      onClick={async () => {
                        playSound("click");
                        const newIds = isSelected
                          ? selectedImageIds.filter((id: string) => id !== img.id)
                          : [...selectedImageIds, img.id];

                        // If deselecting, just remove it
                        if (isSelected) {
                          const remainingImages = availableImages.filter((i) =>
                            newIds.includes(i.id)
                          );

                          // Update config with remaining pixel_data (new format) or imageUrls (old format)
                          const _existingPixelData = config.pixelData || [];
                          const _existingImageUrls = config.imageUrls || [];

                          setConfig({
                            ...config,
                            imageIds: newIds,
                            pixelData: remainingImages
                              .map((i) => i.pixel_data)
                              .filter((pd): pd is string => pd !== null && pd !== undefined),
                            imageUrls: remainingImages
                              .map((i) => i.base_image_data)
                              .filter((url): url is string => url !== null && url !== undefined),
                          });
                          return;
                        }

                        // If selecting and image doesn't have pixel_data, process it
                        if (!img.pixel_data && img.base_image_data && !isProcessing) {
                          setProcessingImages((prev) => new Set(prev).add(img.id));

                          // Process image to pixel data (async, non-blocking)
                          (async () => {
                            try {
                              // Processing image to pixel data
                              // Processing image to pixel data

                              // Convert base64 to File for processing
                              const response = await fetch(img.base_image_data!);
                              const blob = await response.blob();
                              const file = new File([blob], "image.png", {
                                type: "image/png",
                              });

                              // Process to 64x64 pixel data
                              const pixelDataArray = await processImageToPixelData(file);
                              const pixelDataBase64 = pixelDataToBase64(pixelDataArray);

                              // Image processed

                              // Update config with pixel_data
                              setConfig((prevConfig) => {
                                const selectedImages = availableImages.filter((i) =>
                                  newIds.includes(i.id)
                                );

                                // Collect pixel_data from selected images
                                const pixelDataArray = selectedImages
                                  .map((imageItem) => {
                                    if (imageItem.id === img.id) {
                                      return pixelDataBase64; // Use newly processed data
                                    }
                                    return imageItem.pixel_data || null;
                                  })
                                  .filter((pd): pd is string => pd !== null);

                                return {
                                  ...prevConfig,
                                  imageIds: newIds,
                                  pixelData: pixelDataArray,
                                };
                              });
                            } catch (error) {
                              console.error(
                                `[WidgetConfig] Error processing image ${img.id}:`,
                                error
                              );
                              // Fallback: use base_image_data if processing fails
                              setConfig((prevConfig) => {
                                const selectedImages = availableImages.filter((i) =>
                                  newIds.includes(i.id)
                                );
                                return {
                                  ...prevConfig,
                                  imageIds: newIds,
                                  imageUrls: selectedImages
                                    .map((i) => i.base_image_data)
                                    .filter(
                                      (url): url is string => url !== null && url !== undefined
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
                        } else if (img.pixel_data) {
                          // Image already has pixel_data, just add it to config
                          setConfig((prevConfig) => {
                            const selectedImages = availableImages.filter((i) =>
                              newIds.includes(i.id)
                            );
                            const pixelDataArray = selectedImages
                              .map((i) => i.pixel_data)
                              .filter((pd): pd is string => pd !== null && pd !== undefined);

                            return {
                              ...prevConfig,
                              imageIds: newIds,
                              pixelData: pixelDataArray,
                            };
                          });
                        }
                      }}
                      style={{
                        position: "relative",
                        aspectRatio: "1/1",
                        border: isSelected
                          ? "0.125rem solid var(--primary)"
                          : "0.0625rem solid var(--game-border)",
                        borderRadius: "var(--radius-sm)",
                        overflow: "hidden",
                        cursor: "pointer",
                        opacity: isSelected ? 1 : 0.7,
                        transition: "all 0.2s",
                      }}
                    >
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            imageRendering: "pixelated",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "var(--game-surface)",
                            fontSize: "var(--font-size-xs)",
                            color: "var(--text)",
                          }}
                        >
                          Pixel Data
                        </div>
                      )}
                      {isProcessing && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "var(--game-overlay-bg-50)",
                            color: "var(--text)",
                            fontSize: "var(--font-size-xs)",
                          }}
                        >
                          Processing...
                        </div>
                      )}
                      {isSelected && !isProcessing && (
                        <div
                          style={{
                            position: "absolute",
                            top: "0.25rem",
                            right: "0.25rem",
                            background: "var(--primary)",
                            color: "var(--bg)",
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
              <div className="game-text-muted" style={{ fontSize: "var(--font-size-xs)" }}>
                {selectedImageIds.length} image
                {selectedImageIds.length !== 1 ? "s" : ""} selected. Images will cycle with cascade
                animation.
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
        background: "var(--game-overlay-bg-80)",
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
        <div className="game-flex game-flex-between" style={{ marginBottom: "var(--space-lg)" }}>
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
          <button className="game-button game-button-success" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
