"use client";

import React, { useState, useEffect, useRef } from "react";
import { FriendWidget } from "@/lib/queries";
import { WidgetConfig, WidgetSize } from "@/lib/types";
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
  onSave: (config: WidgetConfig, size?: WidgetSize) => void;
  friendColors?: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
  };
}

// Widget size options by type
const WIDGET_SIZES: Record<string, WidgetSize[]> = {
  music_player: ["1x1", "3x1", "4x2"],
  pixel_art: ["1x1", "2x2", "3x3", "4x4", "5x5"],
  personality_quiz: ["1x1", "2x2", "3x3", "4x4"],
  connect_four: ["2x1", "2x2", "3x3", "4x4"],
  consumption_log: ["3x1", "4x1", "5x1"],
  question_jar: ["2x2", "3x2", "4x2"],
  audio_snippets: ["1x2", "1x3", "2x1", "3x1", "4x1"],
  absurd_reviews: ["2x1", "3x1", "4x1"],
  fridge_magnets: ["2x3", "3x4", "4x6"],
};

export function WidgetConfigModal({
  widget,
  onClose,
  onSave,
  friendColors,
}: WidgetConfigModalProps) {
  const [config, setConfig] = useState<WidgetConfig>({});
  const [selectedSize, setSelectedSize] = useState<WidgetSize | null>(null);
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
      setSelectedSize(widget.size || null);
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

  const handleSave = () => {
    if (selectedSize && selectedSize !== widget?.size) {
      onSave(config, selectedSize);
    } else {
      onSave(config);
    }
    playSound("success");
    onClose();
  };

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

  // Music player song selection state - hooks must be called before conditional return
  const [availableSongs, setAvailableSongs] = useState<
    Array<{ id: string; title: string; artist: string }>
  >([]);
  const [loadingSongs, setLoadingSongs] = useState(false);

  useEffect(() => {
    if (widget?.widget_type === "music_player") {
      setLoadingSongs(true);
      fetch("/api/content/top_10_songs")
        .then((res) => res.json())
        .then((data) => {
          if (data.songs && Array.isArray(data.songs)) {
            setAvailableSongs(data.songs);
          }
          setLoadingSongs(false);
        })
        .catch(() => {
          setLoadingSongs(false);
        });
    }
  }, [widget?.widget_type]);

  const renderConfigFields = () => {
    if (!widget) return null;
    switch (widget.widget_type) {
      case "music_player": {
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-md)",
            }}
          >
            <label className="game-heading-3" style={{ margin: 0 }}>
              Select Song
            </label>
            {loadingSongs ? (
              <div
                className="game-text-muted"
                style={{ padding: "var(--space-lg)", textAlign: "center" }}
              >
                Loading songs...
              </div>
            ) : (
              <select
                className="game-input"
                value={(config.selectedSongId as string) || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    selectedSongId: e.target.value,
                  })
                }
                style={{
                  fontFamily: "inherit",
                  padding: "var(--space-md)",
                  minHeight: "2.5rem",
                }}
              >
                <option value="">-- Select a song --</option>
                {availableSongs.map((song) => (
                  <option key={song.id} value={song.id}>
                    {song.title} - {song.artist}
                  </option>
                ))}
              </select>
            )}
            <div className="game-text-muted" style={{ fontSize: "var(--font-size-xs)" }}>
              The selected song will auto-play when the friend visits the page.
            </div>
          </div>
        );
      }

      case "pixel_art":
        // Transition type selection
        const transitionType = (config.transitionType as string) || "scanline";

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
                  alignContent: "start",
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
                        width: "100%",
                        minHeight: "6.25rem",
                        border: isSelected
                          ? "0.125rem solid var(--primary)"
                          : "0.0625rem solid var(--game-border)",
                        borderRadius: "var(--radius-sm)",
                        overflow: "hidden",
                        backgroundColor: "var(--game-surface)",
                        cursor: "pointer",
                        opacity: isSelected ? 1 : 0.7,
                        /* Transition removed for performance */
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
                          <i className="hn hn-check-solid" />
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
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-sm)",
                marginTop: "var(--space-md)",
              }}
            >
              <label className="game-heading-3" style={{ margin: 0 }}>
                Transition Effect
              </label>
              <select
                className="game-input"
                value={transitionType}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    transitionType: e.target.value,
                  })
                }
                style={{
                  fontFamily: "inherit",
                  padding: "var(--space-md)",
                  minHeight: "2.5rem",
                }}
              >
                <option value="scanline">Scanline Sweep</option>
                <option value="dissolve">Random Dissolve</option>
                <option value="boot-up">Gameboy Boot-up</option>
              </select>
              <div className="game-text-muted" style={{ fontSize: "var(--font-size-xs)" }}>
                Transition effect runs on page load and when cycling to next image.
              </div>
            </div>
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

  if (!widget) return null;

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
          maxHeight: "calc(100vh - 2rem)" /* Ensure X button is always visible with padding */,
          overflow: "hidden" /* No scrolling - content must fit */,
          padding: "var(--space-xl)",
          position: "relative" /* Ensure close button positioning works */,
          display: "flex",
          flexDirection: "column",
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
            <i className="hn hn-times-solid" />
          </button>
        </div>

        {/* Size Selection */}
        {widget && WIDGET_SIZES[widget.widget_type] && (
          <div style={{ marginBottom: "var(--space-lg)" }}>
            <h3 className="game-heading-3" style={{ marginBottom: "var(--space-sm)" }}>
              Widget Size
            </h3>
            <div className="game-flex game-flex-gap-sm" style={{ flexWrap: "wrap" }}>
              {WIDGET_SIZES[widget.widget_type].map((size) => (
                <button
                  key={size}
                  className={`game-button ${selectedSize === size ? "game-button-primary" : ""}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

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
