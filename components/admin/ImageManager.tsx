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
      // TODO: Show error toast instead of alert
    }
  };

  return (
    <div
      className="game-container"
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      {/* Toolbar */}
      <div
        className="game-card"
        style={{
          marginBottom: "var(--space-md)",
          padding: "var(--space-md)",
          display: "flex",
          gap: "var(--space-md)",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          className="game-button game-button-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <i className="hn hn-upload-solid" style={{ marginRight: "var(--space-sm)" }} />
          {isUploading ? "UPLOADING..." : "UPLOAD IMAGES"}
        </button>

        <button
          className="game-button game-button-danger"
          onClick={handleDelete}
          disabled={selectedImages.size === 0}
        >
          <i className="hn hn-trash-solid" style={{ marginRight: "var(--space-sm)" }} />
          DELETE SELECTED ({selectedImages.size})
        </button>

        <div
          style={{
            marginLeft: "auto",
            fontSize: "var(--font-size-xs)",
            color: "var(--text)",
          }}
        >
          Total Images: {images.length}
        </div>
      </div>

      {/* Image Grid */}
      <div
        className="game-card"
        style={{
          flex: 1,
          overflowY: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(9.375rem, 1fr))",
          gap: "var(--space-md)",
          alignContent: "start",
        }}
      >
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
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              );
            } catch (error) {
              console.error("Error rendering pixel data preview:", error);
              imagePreview = (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--game-surface)",
                    color: "var(--text)",
                    fontSize: "var(--font-size-xs)",
                  }}
                >
                  Pixel Data
                </div>
              );
            }
          } else if (img.base_image_data) {
            imagePreview = (
              <img
                src={img.base_image_data}
                alt="Asset"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  imageRendering: "pixelated",
                }}
              />
            );
          } else {
            imagePreview = (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--game-surface)",
                  color: "var(--text)",
                  fontSize: "var(--font-size-xs)",
                }}
              >
                No preview
              </div>
            );
          }

          return (
            <div
              key={img.id}
              onClick={() => toggleSelection(img.id)}
              style={{
                position: "relative",
                aspectRatio: "1/1",
                border: selectedImages.has(img.id)
                  ? "0.125rem solid var(--primary)"
                  : "0.0625rem solid var(--game-border)",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.2s",
                opacity: selectedImages.has(img.id) ? 0.8 : 1,
                boxShadow: selectedImages.has(img.id) ? "var(--game-glow-blue)" : "none",
                background: "var(--game-surface)",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  opacity: selectedImages.has(img.id) ? 0.8 : 1,
                }}
              >
                {imagePreview}
              </div>
              {selectedImages.has(img.id) && (
                <div
                  style={{
                    position: "absolute",
                    top: "var(--space-xs)",
                    right: "var(--space-xs)",
                    background: "var(--primary)",
                    color: "var(--bg)",
                    borderRadius: "50%",
                    width: "1.25rem",
                    height: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: "bold",
                  }}
                >
                  ✓
                </div>
              )}
            </div>
          );
        })}

        {images.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "12.5rem",
              color: "var(--text)",
              flexDirection: "column",
              gap: "var(--space-md)",
            }}
          >
            <i className="hn hn-image" style={{ fontSize: "2rem", opacity: 0.5 }} />
            <span>No images found. Upload some!</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleUpload}
      />
    </div>
  );
}
