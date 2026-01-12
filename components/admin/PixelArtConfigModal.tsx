"use client";

import React, { useState, useEffect, useRef } from "react";
import { FriendWidget } from "@/lib/queries";
import { WidgetConfig, WidgetSize } from "@/lib/types";
import { playSound } from "@/lib/sounds";
import { BaseWidgetConfigModal } from "./BaseWidgetConfigModal";
import styles from "./WidgetConfigModal.module.css";

interface ImageItem {
  id: string;
  pixel_data?: string | null;
  preview: string;
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

interface PixelArtConfigModalProps {
  widget: FriendWidget;
  onClose: () => void;
  onSave: (config: WidgetConfig, size?: WidgetSize) => void;
}

const WIDGET_SIZES: WidgetSize[] = ["1x1", "2x2", "3x3", "4x4", "5x5"];

export function PixelArtConfigModal({ widget, onClose, onSave }: PixelArtConfigModalProps) {
  const [config, setConfig] = useState<WidgetConfig>(widget.config || {});
  const [selectedSize, setSelectedSize] = useState<WidgetSize | null>(widget.size || null);
  const [availableImages, setAvailableImages] = useState<ImageItem[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "uncategorized" | string>("all");
  const imagesFetchedRef = useRef(false);

  // Fetch albums
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

  // Fetch available images
  useEffect(() => {
    if (!imagesFetchedRef.current) {
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
  }, []);

  // Filter out deleted images from selectedImageIds when availableImages changes
  useEffect(() => {
    if (availableImages.length > 0 && config.imageIds && config.imageIds.length > 0) {
      const availableImageIds = new Set(availableImages.map((img) => img.id));
      const validImageIds = config.imageIds.filter((id: string) => availableImageIds.has(id));

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
  }, [availableImages]);

  const handleSave = () => {
    if (selectedSize && selectedSize !== widget.size) {
      onSave(config, selectedSize);
    } else {
      onSave(config);
    }
    onClose();
  };

  const selectedImageIds = (config.imageIds as string[]) || [];
  const transitionType = (config.transitionType as string) || "scanline";

  // Filter images based on selected filter
  const filteredImages =
    selectedFilter === "all"
      ? availableImages
      : selectedFilter === "uncategorized"
        ? availableImages.filter((img) => !img.album_id)
        : availableImages.filter((img) => img.album_id === selectedFilter);

  return (
    <BaseWidgetConfigModal
      title={`Configure ${widget.widget_name}`}
      widgetType={widget.widget_type}
      selectedSize={selectedSize}
      availableSizes={WIDGET_SIZES}
      onSizeChange={setSelectedSize}
      onClose={onClose}
      onSave={handleSave}
    >
      <div className={styles.slideshowSection}>
        <div className={styles.slideshowControls}>
          <div className={styles.slideshowHeader}>
            <h3 className={`game-heading-3 ${styles.slideshowLabel}`}>
              Select Images for Slideshow
            </h3>
            {selectedImageIds.length > 0 && (
              <button
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
            {filteredImages.length > 0 && (
              <button
                onClick={() => {
                  playSound("click");
                  const allIds = filteredImages.map((img) => img.id);
                  const selectedImages = filteredImages.filter((img) => allIds.includes(img.id));
                  setConfig((prev) => ({
                    ...prev,
                    imageIds: allIds,
                    pixelData: selectedImages
                      .map((i) => i.pixel_data)
                      .filter((pd): pd is string => pd !== null && pd !== undefined),
                  }));
                }}
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

              if (!img.preview) {
                console.error(`Image ${img.id} is missing required preview property`);
                return null;
              }

              const pixelPreview = (
                <div className={styles.imagePreviewWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.preview} alt="Pixel art preview" className={styles.imagePreview} />
                </div>
              );

              const handleImageClick = () => {
                playSound("click");
                const newIds = isSelected
                  ? selectedImageIds.filter((id: string) => id !== img.id)
                  : [...selectedImageIds, img.id];

                if (isSelected) {
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

                if (img.pixel_data) {
                  const selectedImages = availableImages.filter((i) => newIds.includes(i.id));
                  setConfig((prev) => ({
                    ...prev,
                    imageIds: newIds,
                    pixelData: selectedImages
                      .map((i) => i.pixel_data)
                      .filter((pd): pd is string => pd !== null && pd !== undefined),
                  }));
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
                      "--image-border-color": isSelected ? "var(--primary)" : "var(--game-border)",
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
          <label className={`game-heading-3 ${styles.transitionLabel}`}>Transition Effect</label>
          <select
            className={`game-input ${styles.transitionSelect}`}
            value={transitionType}
            onChange={(e) => {
              playSound("click");
              setConfig({
                ...config,
                transitionType: e.target.value,
              });
            }}
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
    </BaseWidgetConfigModal>
  );
}
