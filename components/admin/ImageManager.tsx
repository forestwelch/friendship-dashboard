"use client";

import React, { useState, useRef, useEffect } from "react";
import { playSound } from "@/lib/sounds";
import { WidgetSize } from "@/lib/types";
import {
  base64ToPixelData,
  renderPixelDataAsSVG,
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
}

export function ImageManager({ initialImages, onImagesChange }: ImageManagerProps) {
  const [images, setImages] = useState<ImageItem[]>(initialImages);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const updateImages = (newImages: ImageItem[]) => {
    setImages(newImages);
    onImagesChange?.(newImages);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
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
      setIsUploading(false);
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

  const handleDelete = async () => {
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
  };

  return (
    <div className={clsx("game-container", styles.container)}>
      {/* Toolbar */}
      <div className={clsx("game-card", styles.toolbar)}>
        <button
          className="game-button game-button-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <i className={clsx("hn", "hn-upload-solid", styles.iconSpacing)} />
          {isUploading ? "UPLOADING..." : "UPLOAD IMAGES"}
        </button>

        <button
          className="game-button game-button-danger"
          onClick={handleDelete}
          disabled={selectedImages.size === 0}
        >
          <i className={clsx("hn", "hn-trash-solid", styles.iconSpacing)} />
          DELETE SELECTED ({selectedImages.size})
        </button>

        <div className={styles.toolbarInfo}>Total Images: {images.length}</div>
      </div>

      {/* Image Grid */}
      <div className={clsx("game-card", styles.imageGrid)}>
        {images.map((img) => {
          // Render pixel_data as SVG preview, or fall back to base_image_data
          let imagePreview: React.ReactNode;

          if (img.pixel_data) {
            try {
              const pixelData = base64ToPixelData(img.pixel_data);
              const gridSize = img.width || PIXEL_GRID_SIZE;
              // Use default theme colors for preview (can be any colors)
              const themeColors = {
                primary: DEFAULT_THEME_COLORS_ALT.primary,
                secondary: DEFAULT_THEME_COLORS_ALT.secondary,
                accent: DEFAULT_THEME_COLORS_ALT.accent,
                bg: DEFAULT_THEME_COLORS_ALT.bg,
                text: DEFAULT_THEME_COLORS_ALT.text,
              };
              // Calculate pixel size for preview (smaller for grid display)
              const previewSize = 150; // Fixed preview size
              const pixelSize = previewSize / gridSize;
              const svgContent = renderPixelDataAsSVG(
                pixelData,
                themeColors,
                gridSize,
                gridSize,
                pixelSize
              );
              imagePreview = (
                <div
                  className={styles.imagePreview}
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              );
            } catch (error) {
              console.error("Error rendering pixel data preview:", error);
              imagePreview = <div className={styles.imagePreviewError}>Pixel Data</div>;
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
