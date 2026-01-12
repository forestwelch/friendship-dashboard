"use client";

import React, { useState, useEffect, useRef } from "react";
import { FriendWidget } from "@/lib/queries";
import { WidgetConfig, WidgetSize } from "@/lib/types";
import { playSound } from "@/lib/sounds";
import styles from "./WidgetConfigModal.module.css";

interface ImageItem {
  id: string;
  pixel_data?: string | null; // base64-encoded Uint8Array
  preview: string; // Required: Pre-generated grayscale PNG preview
  width?: number;
  height?: number;
  album_id?: string | null;
  created_at: string;
}

interface Album {
  id: string;
  name: string;
  created_at: string;
  imageCount: number;
}

interface WidgetConfigModalProps {
  widget: FriendWidget | null;
  onClose: () => void;
  onSave: (config: WidgetConfig, size?: WidgetSize) => void;
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

export function WidgetConfigModal({ widget, onClose, onSave }: WidgetConfigModalProps) {
  const [config, setConfig] = useState<WidgetConfig>({});
  const [selectedSize, setSelectedSize] = useState<WidgetSize | null>(null);
  const [availableImages, setAvailableImages] = useState<ImageItem[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const widgetIdRef = useRef<string | null>(null);
  const imagesFetchedRef = useRef(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "uncategorized" | string>("all");

  // Update config when widget changes (only when widget ID changes)
  useEffect(() => {
    if (widget && widget.id !== widgetIdRef.current) {
      widgetIdRef.current = widget.id;
      setConfig(widget.config || {});
      setSelectedSize(widget.size || null);
      imagesFetchedRef.current = false; // Reset fetch flag for new widget
    }
  }, [widget]);

  // Fetch albums on mount
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await fetch("/api/albums");
        if (response.ok) {
          const data = await response.json();
          setAlbums(data.albums || []);
        }
      } catch (err) {
        console.error("Failed to fetch albums:", err);
      }
    };
    fetchAlbums();
  }, []);

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

  // Filter out deleted images from selectedImageIds when availableImages changes
  useEffect(() => {
    if (
      widget?.widget_type === "pixel_art" &&
      availableImages.length > 0 &&
      config.imageIds &&
      config.imageIds.length > 0
    ) {
      const availableImageIds = new Set(availableImages.map((img) => img.id));
      const validImageIds = config.imageIds.filter((id: string) => availableImageIds.has(id));

      // If some images were deleted, update config to remove them
      if (validImageIds.length !== config.imageIds.length) {
        const validImages = availableImages.filter((img) => validImageIds.includes(img.id));
        setConfig((prev) => ({
          ...prev,
          imageIds: validImageIds,
          pixelData: validImages
            .map((i) => i.pixel_data)
            .filter((pd): pd is string => pd !== null && pd !== undefined),
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableImages, widget?.widget_type]);

  const handleSave = () => {
    if (selectedSize && selectedSize !== widget?.size) {
      onSave(config, selectedSize);
    } else {
      onSave(config);
    }
    playSound("success");
    onClose();
  };

  // Music player song selection state - hooks must be called before conditional return
  const [availableSongs, setAvailableSongs] = useState<
    Array<{ id: string; title: string; artist: string }>
  >([]);
  const [loadingSongs, setLoadingSongs] = useState(false);

  useEffect(() => {
    if (widget?.widget_type === "music_player") {
      setLoadingSongs(true);
      fetch("/api/content/songs")
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
        const selectedSongIds = (config.playlistSongIds as string[]) || [];

        const handleSongToggle = (songId: string) => {
          const currentIds = selectedSongIds;
          const newIds = currentIds.includes(songId)
            ? currentIds.filter((id) => id !== songId)
            : [...currentIds, songId];
          setConfig({
            ...config,
            playlistSongIds: newIds,
          });
        };

        return (
          <div className={styles.configSection}>
            <label className={`game-heading-3 ${styles.configLabel}`}>
              Select Songs for Playlist
            </label>
            {loadingSongs ? (
              <div className={`game-text-muted ${styles.configContent}`}>Loading songs...</div>
            ) : (
              <div className={styles.songList}>
                {availableSongs.length === 0 ? (
                  <div className={`game-text-muted ${styles.configContentSmall}`}>
                    No songs available
                  </div>
                ) : (
                  availableSongs.map((song) => (
                    <label key={song.id} className={styles.songItem}>
                      <input
                        type="checkbox"
                        checked={selectedSongIds.includes(song.id)}
                        onChange={() => handleSongToggle(song.id)}
                        className={styles.checkbox}
                      />
                      <span className={styles.songItemText}>
                        {song.title} - {song.artist}
                      </span>
                    </label>
                  ))
                )}
              </div>
            )}
            <div className={`game-text-muted ${styles.helperText}`}>
              {selectedSongIds.length > 0
                ? `${selectedSongIds.length} song${selectedSongIds.length === 1 ? "" : "s"} selected. A random song will start playing when the page loads, and songs will shuffle through.`
                : "Select songs to create a playlist. A random song will start playing when the page loads."}
            </div>
          </div>
        );
      }

      case "pixel_art":
        // Transition type selection
        const transitionType = (config.transitionType as string) || "scanline";

        // Get selected image IDs - check pixelData or imageIds
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

        // Filter images based on selected filter
        const filteredImages =
          selectedFilter === "all"
            ? availableImages
            : selectedFilter === "uncategorized"
              ? availableImages.filter((img) => !img.album_id)
              : availableImages.filter((img) => img.album_id === selectedFilter);

        const handleSelectAllInAlbum = () => {
          const allIds = filteredImages.map((img) => img.id);
          const allSelectedImages = availableImages.filter((i) => allIds.includes(i.id));
          setConfig((prev) => ({
            ...prev,
            imageIds: allIds,
            pixelData: allSelectedImages
              .map((i) => i.pixel_data)
              .filter((pd): pd is string => pd !== null && pd !== undefined),
          }));
          playSound("select");
        };

        return (
          <div className={styles.slideshowSection}>
            <div className={styles.slideshowControls}>
              <div className={styles.slideshowHeader}>
                <label className={`game-heading-3 ${styles.slideshowLabel}`}>
                  Select Images for Slideshow
                </label>
                {selectedImageIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      playSound("click");
                      setConfig((prev) => ({
                        ...prev,
                        imageIds: [],
                        pixelData: [],
                      }));
                    }}
                    className={styles.resetButton}
                  >
                    Reset Selection
                  </button>
                )}
              </div>
              <div className={styles.filterRow}>
                <select
                  value={selectedFilter}
                  onChange={(e) => {
                    playSound("click");
                    setSelectedFilter(e.target.value);
                  }}
                  className={styles.filterSelect}
                >
                  <option value="all">All Images</option>
                  <option value="uncategorized">Uncategorized</option>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.name} ({album.imageCount})
                    </option>
                  ))}
                </select>
                {selectedFilter !== "all" && filteredImages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllInAlbum}
                    className={styles.selectAllButton}
                  >
                    Select All ({filteredImages.length})
                  </button>
                )}
              </div>
            </div>
            {loadingImages ? (
              <div className={`game-text-muted ${styles.loadingContainer}`}>
                <div>Loading images...</div>
                <div className={styles.loadingSubtext}>Fetching from database...</div>
              </div>
            ) : (
              <div className={styles.imageGrid}>
                {filteredImages.map((img) => {
                  const isSelected = selectedImageIds.includes(img.id);

                  // Preview is required - all images must have preview
                  if (!img.preview) {
                    console.error(`Image ${img.id} is missing required preview property`);
                    return null;
                  }

                  const pixelPreview = (
                    <div className={styles.imagePreviewWrapper}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.preview}
                        alt="Pixel art preview"
                        className={styles.imagePreview}
                      />
                    </div>
                  );

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
                      }));
                      return;
                    }

                    // Selecting - update immediately
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
                    }
                  };

                  return (
                    <div
                      key={img.id}
                      onClick={handleImageClick}
                      className={`${styles.imageItemContainer} ${
                        isSelected
                          ? styles.imageItemContainerSelected
                          : styles.imageItemContainerUnselected
                      }`}
                      style={
                        {
                          "--image-border-width": isSelected ? "0.125rem" : "0.0625rem",
                          "--image-border-color": isSelected
                            ? "var(--primary)"
                            : "var(--game-border)",
                        } as React.CSSProperties
                      }
                    >
                      {pixelPreview}
                      {isSelected && (
                        <div className={styles.checkmarkContainer}>
                          <i className="hn hn-check-solid" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {selectedImageIds.length > 0 && (
              <div className={`game-text-muted ${styles.slideshowHelpText}`}>
                {selectedImageIds.length} image
                {selectedImageIds.length !== 1 ? "s" : ""} selected. Images will cycle with cascade
                animation.
              </div>
            )}
            <div className={styles.transitionSection}>
              <label className={`game-heading-3 ${styles.transitionLabel}`}>
                Transition Effect
              </label>
              <select
                className={`game-input ${styles.transitionSelect}`}
                value={transitionType}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    transitionType: e.target.value,
                  })
                }
              >
                <option value="scanline">Scanline Sweep</option>
                <option value="dissolve">Random Dissolve</option>
                <option value="boot-up">Gameboy Boot-up</option>
              </select>
              <div className={`game-text-muted ${styles.slideshowHelpText}`}>
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
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`game-card ${styles.modalContent}`} onClick={(e) => e.stopPropagation()}>
        <div className={`game-flex game-flex-between ${styles.modalHeader}`}>
          <h2 className={`game-heading-2 ${styles.modalTitle}`}>Configure {widget.widget_name}</h2>
          <button
            className={`game-button game-button-icon ${styles.closeButton}`}
            onClick={onClose}
          >
            <i className="hn hn-times-solid" />
          </button>
        </div>

        {/* Size Selection */}
        {widget && WIDGET_SIZES[widget.widget_type] && (
          <div className={styles.configSection}>
            <h3 className={`game-heading-3 ${styles.configSectionTitle}`}>Widget Size</h3>
            <div className={`game-flex game-flex-gap-sm ${styles.sizeButtons}`}>
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

        <div className={`game-flex game-flex-gap-md ${styles.buttonRow}`}>
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
