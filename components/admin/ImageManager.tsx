"use client";

import React, { useState, useRef, useEffect } from "react";
import { playSound } from "@/lib/sounds";
import { WidgetSize } from "@/lib/types";

interface ImageItem {
  id: string;
  base_image_data: string; // Base64 or URL
  size: WidgetSize;
  created_at: string;
}

interface ImageManagerProps {
  initialImages: ImageItem[];
  onImagesChange?: (images: ImageItem[]) => void;
}

export function ImageManager({
  initialImages,
  onImagesChange,
}: ImageManagerProps) {
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
        const formData = new FormData();
        formData.append("file", file);
        // No size parameter - images work for all sizes

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

    if (confirm(`Delete ${selectedImages.size} images?`)) {
      try {
        const idsToDelete = Array.from(selectedImages);
        const response = await fetch(
          `/api/images?ids=${idsToDelete.join(",")}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete images");
        }

        const newImages = images.filter((img) => !selectedImages.has(img.id));
        updateImages(newImages);
        setSelectedImages(new Set());
        playSound("cancel");
      } catch (error) {
        console.error("Error deleting images:", error);
        playSound("error");
        alert("Failed to delete images. Please try again.");
      }
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
          <i
            className="hn hn-upload-solid"
            style={{ marginRight: "var(--space-sm)" }}
          />
          {isUploading ? "UPLOADING..." : "UPLOAD IMAGES"}
        </button>

        <button
          className="game-button game-button-danger"
          onClick={handleDelete}
          disabled={selectedImages.size === 0}
        >
          <i
            className="hn hn-trash-solid"
            style={{ marginRight: "var(--space-sm)" }}
          />
          DELETE SELECTED ({selectedImages.size})
        </button>

        <div
          style={{
            marginLeft: "auto",
            fontSize: "var(--font-size-xs)",
            color: "var(--game-text-muted)",
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
        {images.map((img) => (
          <div
            key={img.id}
            onClick={() => toggleSelection(img.id)}
            style={{
              position: "relative",
              aspectRatio: "1/1",
              border: selectedImages.has(img.id)
                ? "0.125rem solid var(--game-accent-blue)"
                : "0.0625rem solid var(--game-border)",
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              cursor: "pointer",
              transition: "all 0.2s",
              transform: selectedImages.has(img.id)
                ? "scale(0.95)"
                : "scale(1)",
              boxShadow: selectedImages.has(img.id)
                ? "var(--game-glow-blue)"
                : "none",
            }}
          >
            <img
              src={img.base_image_data}
              alt="Asset"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                imageRendering: "pixelated",
                opacity: selectedImages.has(img.id) ? 0.8 : 1,
              }}
            />
            {selectedImages.has(img.id) && (
              <div
                style={{
                  position: "absolute",
                  top: "var(--space-xs)",
                  right: "var(--space-xs)",
                  background: "var(--game-accent-blue)",
                  color: "white",
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
        ))}

        {images.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "12.5rem",
              color: "var(--game-text-muted)",
              flexDirection: "column",
              gap: "var(--space-md)",
            }}
          >
            <i
              className="hn hn-image"
              style={{ fontSize: "2rem", opacity: 0.5 }}
            />
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
