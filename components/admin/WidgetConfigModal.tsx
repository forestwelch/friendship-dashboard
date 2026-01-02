"use client";

import React, { useState, useEffect, useRef } from "react";
import { FriendWidget } from "@/lib/queries";
import { WidgetConfig } from "@/lib/types";
import { playSound } from "@/lib/sounds";
import {
  processImageToPixelData,
  pixelDataToBase64,
  base64ToPixelData,
  renderPixelDataAsWebP,
  PIXEL_GRID_SIZE,
  ThemeColors,
} from "@/lib/pixel-data-processing";

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
  onSave: (config: WidgetConfig) => void;
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
  const [config, setConfig] = useState<WidgetConfig>({});
  const [availableImages, setAvailableImages] = useState<ImageItem[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [processingImages, setProcessingImages] = useState<Set<string>>(new Set());
  const [previewCache, setPreviewCache] = useState<Map<string, string>>(new Map());
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

  // Generate WebP previews for pixel data images (async, non-blocking)
  useEffect(() => {
    if (!friendColors || availableImages.length === 0) return;

    const generatePreviews = async () => {
      const newCache = new Map(previewCache);
      const promises: Promise<void>[] = [];

      for (const img of availableImages) {
        const pixelDataStr = img.pixel_data;
        if (pixelDataStr && !newCache.has(img.id)) {
          promises.push(
            (async () => {
              try {
                const pixelData = base64ToPixelData(pixelDataStr);
                const gridSize = img.width || PIXEL_GRID_SIZE;
                const themeColors: ThemeColors = {
                  primary: friendColors?.primary || "#4a9eff",
                  secondary: friendColors?.secondary || "#6abfff",
                  accent: friendColors?.accent || "#2a7fff",
                  bg: friendColors?.bg || "#0a1a2e",
                  text: friendColors?.text || "#c8e0ff",
                };
                const webpDataUrl = await renderPixelDataAsWebP(
                  pixelData,
                  themeColors,
                  gridSize,
                  gridSize
                );
                newCache.set(img.id, webpDataUrl);
              } catch (error) {
                console.error(`Error generating preview for image ${img.id}:`, error);
              }
            })()
          );
        }
      }

      // Process in batches to avoid blocking
      const batchSize = 5;
      for (let i = 0; i < promises.length; i += batchSize) {
        const batch = promises.slice(i, i + batchSize);
        await Promise.all(batch);
        // Update cache after each batch for progressive loading
        setPreviewCache(new Map(newCache));
      }
    };

    generatePreviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableImages.map((img) => img.id).join(","), friendColors]);

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
              value={
                config.notes?.map((n) => (typeof n === "string" ? n : n.content)).join("\n") || ""
              }
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
          const pixelData = config.pixelData;
          selectedImageIds = availableImages
            .filter((img) => img.pixel_data && pixelData.includes(img.pixel_data))
            .map((img) => img.id);
        }

        // Backward compatibility: if we have imageUrls but no imageIds
        if (selectedImageIds.length === 0 && config.imageUrls && config.imageUrls.length > 0) {
          const imageUrls = config.imageUrls;
          selectedImageIds = availableImages
            .filter((img) => img.base_image_data && imageUrls.includes(img.base_image_data))
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

                  // Render pixel data preview using cached WebP
                  let pixelPreview: React.ReactNode = null;
                  if (img.pixel_data) {
                    const cachedPreview = previewCache.get(img.id);
                    if (cachedPreview) {
                      pixelPreview = (
                        <img
                          src={cachedPreview}
                          alt="Pixel art preview"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            imageRendering: "pixelated",
                          }}
                        />
                      );
                    } else {
                      // Show loading state while generating preview
                      pixelPreview = (
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
                          Loading...
                        </div>
                      );
                    }
                  }

                  const handleImageClick = () => {
                    playSound("click");
                    const newIds = isSelected
                      ? selectedImageIds.filter((id: string) => id !== img.id)
                      : [...selectedImageIds, img.id];

                    // Optimistically update UI immediately
                    if (isSelected) {
                      // Deselecting - simple and fast
                      const remainingImages = availableImages.filter((i) => newIds.includes(i.id));
                      setConfig((prev) => ({
                        ...prev,
                        imageIds: newIds,
                        pixelData: remainingImages
                          .map((i) => i.pixel_data)
                          .filter((pd): pd is string => pd !== null && pd !== undefined),
                        imageUrls: remainingImages
                          .map((i) => i.base_image_data)
                          .filter((url): url is string => url !== null && url !== undefined),
                      }));
                      return;
                    }

                    // Selecting - update immediately, process async if needed
                    if (img.pixel_data) {
                      // Already has pixel_data - fast path
                      setConfig((prev) => {
                        const selectedImages = availableImages.filter((i) => newIds.includes(i.id));
                        return {
                          ...prev,
                          imageIds: newIds,
                          pixelData: selectedImages
                            .map((i) => i.pixel_data)
                            .filter((pd): pd is string => pd !== null && pd !== undefined),
                        };
                      });
                    } else if (img.base_image_data && !isProcessing) {
                      // Need to process - do it async without blocking UI
                      setProcessingImages((prev) => new Set(prev).add(img.id));

                      // Update config immediately with placeholder
                      setConfig((prev) => ({
                        ...prev,
                        imageIds: newIds,
                      }));

                      // Process in background
                      (async () => {
                        try {
                          const response = await fetch(img.base_image_data!);
                          const blob = await response.blob();
                          const file = new File([blob], "image.png", { type: "image/png" });
                          const pixelDataArray = await processImageToPixelData(file);
                          const pixelDataBase64 = pixelDataToBase64(pixelDataArray);

                          // Update config with processed data
                          setConfig((prev) => {
                            const selectedImages = availableImages.filter((i) =>
                              newIds.includes(i.id)
                            );
                            return {
                              ...prev,
                              pixelData: selectedImages
                                .map((imageItem) => {
                                  if (imageItem.id === img.id) {
                                    return pixelDataBase64;
                                  }
                                  return imageItem.pixel_data || null;
                                })
                                .filter((pd): pd is string => pd !== null),
                            };
                          });
                        } catch (error) {
                          console.error(`Error processing image ${img.id}:`, error);
                          // Fallback to base_image_data
                          setConfig((prev) => {
                            const selectedImages = availableImages.filter((i) =>
                              newIds.includes(i.id)
                            );
                            return {
                              ...prev,
                              imageUrls: selectedImages
                                .map((i) => i.base_image_data)
                                .filter((url): url is string => url !== null && url !== undefined),
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
                  };

                  return (
                    <div
                      key={img.id}
                      onClick={handleImageClick}
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
                      ) : pixelPreview ? (
                        pixelPreview
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
