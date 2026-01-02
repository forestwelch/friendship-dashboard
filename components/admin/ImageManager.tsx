"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { playSound } from "@/lib/sounds";
import { WidgetSize } from "@/lib/types";
import {
  base64ToPixelData,
  renderPixelDataAsWebP,
  PIXEL_GRID_SIZE,
} from "@/lib/pixel-data-processing";
import { DEFAULT_THEME_COLORS_ALT } from "@/lib/theme-defaults";
import clsx from "clsx";
import styles from "./ImageManager.module.css";

interface ImageItem {
  id: string;
  pixel_data?: string | null; // New format: base64-encoded Uint8Array
  base_image_data?: string | null; // Old format: base64 image (for backward compatibility)
  size: WidgetSize;
  width?: number;
  height?: number;
  created_at: string;
}

interface ImageManagerProps {
  initialImages: ImageItem[];
  onImagesChange?: (images: ImageItem[]) => void;
  onUploadRef?: (fn: () => void) => void;
  onDeleteRef?: (fn: () => void) => void;
  onSelectedCountRef?: (fn: () => number) => void;
}

export function ImageManager({
  initialImages,
  onImagesChange,
  onUploadRef,
  onDeleteRef,
  onSelectedCountRef,
}: ImageManagerProps) {
  const [images, setImages] = useState<ImageItem[]>(initialImages);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewCache, setPreviewCache] = useState<Map<string, string>>(new Map());

  const updateImages = useCallback(
    (newImages: ImageItem[]) => {
      setImages(newImages);
      onImagesChange?.(newImages);
    },
    [onImagesChange]
  );

  const handleDelete = useCallback(async () => {
    if (selectedImages.size === 0) return;

    // Instant delete - no confirmation (optimistic update pattern)
    const idsToDelete = Array.from(selectedImages);
    const originalImages = images;

    // Optimistic update: remove from UI immediately
    const newImages = images.filter((img) => !selectedImages.has(img.id));
    updateImages(newImages);
    setSelectedImages(new Set());
    playSound("delete");

    // Sync to DB in background
    try {
      const response = await fetch(`/api/images?ids=${idsToDelete.join(",")}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete images");
      }
    } catch (error) {
      // Revert on failure
      console.error("Error deleting images:", error);
      updateImages(originalImages);
      playSound("error");
      // Note: Consider adding toast notification for better UX
    }
  }, [selectedImages, images, updateImages]);

  // Expose methods to parent via refs
  useEffect(() => {
    if (onUploadRef) {
      onUploadRef(() => fileInputRef.current?.click());
    }
    if (onDeleteRef) {
      onDeleteRef(handleDelete);
    }
    if (onSelectedCountRef) {
      onSelectedCountRef(() => selectedImages.size);
    }
  }, [onUploadRef, onDeleteRef, onSelectedCountRef, selectedImages.size, handleDelete]);

  // Generate WebP previews for pixel data images (only for new images)
  useEffect(() => {
    const generatePreviews = async () => {
      const newCache = new Map(previewCache);
      const promises: Promise<void>[] = [];

      for (const img of images) {
        const pixelDataStr = img.pixel_data;
        if (pixelDataStr && !newCache.has(img.id)) {
          const pixelDataBase64 = pixelDataStr; // Type narrowing
          promises.push(
            (async () => {
              try {
                const pixelData = base64ToPixelData(pixelDataBase64);
                const gridSize = img.width || PIXEL_GRID_SIZE;
                const themeColors = {
                  primary: DEFAULT_THEME_COLORS_ALT.primary,
                  secondary: DEFAULT_THEME_COLORS_ALT.secondary,
                  accent: DEFAULT_THEME_COLORS_ALT.accent,
                  bg: DEFAULT_THEME_COLORS_ALT.bg,
                  text: DEFAULT_THEME_COLORS_ALT.text,
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

      // Clean up cache for removed images
      const currentImageIds = new Set(images.map((img) => img.id));
      for (const cachedId of newCache.keys()) {
        if (!currentImageIds.has(cachedId)) {
          newCache.delete(cachedId);
        }
      }

      if (promises.length > 0 || newCache.size !== previewCache.size) {
        await Promise.all(promises);
        setPreviewCache(newCache);
      }
    };

    generatePreviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    playSound("select");

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Process image to pixel_data client-side
        const { processImageToPixelData, pixelDataToBase64 } = await import(
          "@/lib/pixel-data-processing"
        );
        const pixelDataArray = await processImageToPixelData(file);
        const pixelDataBase64 = pixelDataToBase64(pixelDataArray);

        const formData = new FormData();
        formData.append("pixel_data", pixelDataBase64);

        const response = await fetch("/api/images", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();
        return data.image;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const newImages = [...uploadedImages, ...images];
      updateImages(newImages);
      playSound("success");
    } catch (error) {
      console.error("Error uploading images:", error);
      playSound("error");
      alert("Failed to upload images. Please try again.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      playSound("close");
    } else {
      newSelected.add(id);
      playSound("select");
    }
    setSelectedImages(newSelected);
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Image Grid */}
      <div className={clsx("game-card", styles.imageGrid)}>
        {images.map((img) => {
          // Render pixel_data as WebP preview (cached), or fall back to base_image_data
          let imagePreview: React.ReactNode;

          if (img.pixel_data) {
            const cachedPreview = previewCache.get(img.id);
            if (cachedPreview) {
              imagePreview = (
                <img
                  src={cachedPreview}
                  alt="Pixel art preview"
                  className={styles.imagePreviewImg}
                />
              );
            } else {
              // Show loading state while generating preview
              imagePreview = (
                <div
                  className={styles.imagePreviewError}
                  style={{ fontSize: "var(--font-size-xs)" }}
                >
                  Loading...
                </div>
              );
            }
          } else if (img.base_image_data) {
            imagePreview = (
              <img src={img.base_image_data} alt="Asset" className={styles.imagePreviewImg} />
            );
          } else {
            imagePreview = <div className={styles.imagePreviewError}>No preview</div>;
          }

          const isSelected = selectedImages.has(img.id);
          return (
            <div
              key={img.id}
              onClick={() => toggleSelection(img.id)}
              className={clsx(styles.imageItem, isSelected && styles.selected)}
            >
              <div className={clsx(styles.imagePreviewInner, isSelected && styles.selected)}>
                {imagePreview}
              </div>
              {isSelected && <div className={styles.checkmark}>✓</div>}
            </div>
          );
        })}

        {images.length === 0 && (
          <div className={styles.emptyState}>
            <i className={clsx("hn", "hn-image", styles.emptyStateIcon)} />
            <span>No images found. Upload some!</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className={styles.hiddenInput}
        onChange={handleUpload}
      />
    </div>
  );
}
