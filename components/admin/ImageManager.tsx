"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { playSound } from "@/lib/sounds";
import {
  base64ToPixelData,
  PIXEL_GRID_SIZE,
  processImageToPixelData,
  pixelDataToBase64,
  generatePreview,
} from "@/lib/pixel-data-processing";
import clsx from "clsx";
import styles from "./ImageManager.module.css";

interface ImageItem {
  id: string;
  pixel_data?: string | null; // base64-encoded Uint8Array
  preview?: string | null; // Pre-generated grayscale PNG preview
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

interface ImageManagerProps {
  initialImages: ImageItem[];
  onImagesChange?: (images: ImageItem[]) => void;
  onUploadRef?: (fn: () => void) => void;
  onDeleteRef?: (fn: () => void) => void;
  onAddToAlbumRef?: (fn: (albumId: string | null) => void) => void;
  onSelectedCountRef?: (fn: () => number) => void;
}

export function ImageManager({
  initialImages,
  onImagesChange,
  onUploadRef,
  onDeleteRef,
  onAddToAlbumRef,
  onSelectedCountRef,
}: ImageManagerProps) {
  const [images, setImages] = useState<ImageItem[]>(initialImages);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewCache, setPreviewCache] = useState<Map<string, string>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 20;
  const [albums, setAlbums] = useState<Album[]>([]);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [creatingAlbum, setCreatingAlbum] = useState(false);

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

  const handleAddToAlbum = useCallback(
    async (albumId: string | null) => {
      if (selectedImages.size === 0) return;

      const imageIds = Array.from(selectedImages);
      try {
        const response = await fetch("/api/images", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageIds, albumId }),
        });

        if (response.ok) {
          // Refresh images to show updated album assignments
          const refreshResponse = await fetch("/api/images");
          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            setImages(data.images || []);
            onImagesChange?.(data.images || []);
          }
          setSelectedImages(new Set());
          playSound("success");
        } else {
          playSound("error");
        }
      } catch (error) {
        console.error("Error adding images to album:", error);
        playSound("error");
      }
    },
    [selectedImages, onImagesChange]
  );

  // Expose methods to parent via refs
  useEffect(() => {
    if (onUploadRef) {
      onUploadRef(() => fileInputRef.current?.click());
    }
    if (onDeleteRef) {
      onDeleteRef(handleDelete);
    }
    if (onAddToAlbumRef) {
      onAddToAlbumRef(handleAddToAlbum);
    }
    if (onSelectedCountRef) {
      onSelectedCountRef(() => selectedImages.size);
    }
  }, [
    onUploadRef,
    onDeleteRef,
    onAddToAlbumRef,
    onSelectedCountRef,
    selectedImages.size,
    handleDelete,
    handleAddToAlbum,
  ]);

  // Calculate pagination
  const totalPages = Math.ceil(images.length / imagesPerPage);
  const startIndex = (currentPage - 1) * imagesPerPage;
  const endIndex = startIndex + imagesPerPage;
  const currentPageImages = useMemo(
    () => images.slice(startIndex, endIndex),
    [images, startIndex, endIndex]
  );

  // Generate previews on-demand only if preview is missing (fallback for old images)
  useEffect(() => {
    if (currentPageImages.length === 0) return;

    const generatePreviews = async () => {
      const newCache = new Map(previewCache);
      const promises: Promise<void>[] = [];

      for (const img of currentPageImages) {
        // Skip if preview already exists or already cached
        if (img.preview || newCache.has(img.id)) continue;

        // Only generate if pixel_data exists but preview doesn't
        if (img.pixel_data) {
          const pixelDataStr = img.pixel_data; // Capture for type narrowing
          promises.push(
            (async () => {
              try {
                const pixelData = base64ToPixelData(pixelDataStr);
                const gridSize = img.width || PIXEL_GRID_SIZE;
                const previewDataUrl = await generatePreview(pixelData, gridSize, gridSize);
                newCache.set(img.id, previewDataUrl);
              } catch (error) {
                console.error(`Error generating preview for image ${img.id}:`, error);
              }
            })()
          );
        }
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        setPreviewCache(newCache);
      }
    };

    generatePreviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageImages]);

  useEffect(() => {
    setImages(initialImages);
    // Reset to first page when images change
    setCurrentPage(1);
  }, [initialImages]);

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

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim() || creatingAlbum) return;

    setCreatingAlbum(true);
    try {
      const response = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAlbumName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setAlbums((prev) => [...prev, { ...data.album, imageCount: 0 }]);
        setNewAlbumName("");
        playSound("success");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create album");
        playSound("error");
      }
    } catch (error) {
      console.error("Error creating album:", error);
      playSound("error");
    } finally {
      setCreatingAlbum(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    playSound("select");

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Process image to 128x128 grayscale intensity array
        const pixelDataArray = await processImageToPixelData(file);
        const pixelDataBase64 = pixelDataToBase64(pixelDataArray);

        // Generate preview as grayscale
        const preview = await generatePreview(pixelDataArray, 256, 256);

        // Upload pixel_data and preview
        const formData = new FormData();
        formData.append("pixel_data", pixelDataBase64);
        formData.append("preview", preview);

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
      {/* Album Creation Section */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-md)",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={newAlbumName}
          onChange={(e) => setNewAlbumName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCreateAlbum();
            }
          }}
          placeholder="New album name..."
          style={{
            flex: 1,
            padding: "var(--space-sm)",
            fontSize: "var(--font-size-sm)",
            border: "var(--border-width-md) solid var(--game-border)",
            borderRadius: "var(--radius-sm)",
            background: "var(--game-surface)",
            color: "var(--text)",
          }}
        />
        <button
          className="game-button"
          onClick={handleCreateAlbum}
          disabled={!newAlbumName.trim() || creatingAlbum}
          style={{ opacity: !newAlbumName.trim() || creatingAlbum ? 0.5 : 1 }}
        >
          {creatingAlbum ? "Creating..." : "Create Album"}
        </button>
      </div>

      {/* Pagination Controls */}
      {images.length > imagesPerPage && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--space-md)",
            padding: "var(--space-sm)",
          }}
        >
          <button
            className="game-button"
            onClick={() => {
              setCurrentPage((prev) => Math.max(1, prev - 1));
              playSound("select");
            }}
            disabled={currentPage === 1}
            style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
          >
            Previous
          </button>
          <span
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--text)",
            }}
          >
            Page {currentPage} of {totalPages} ({images.length} total)
          </span>
          <button
            className="game-button"
            onClick={() => {
              setCurrentPage((prev) => Math.min(totalPages, prev + 1));
              playSound("select");
            }}
            disabled={currentPage === totalPages}
            style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
          >
            Next
          </button>
        </div>
      )}

      {/* Image Grid */}
      <div className={clsx("game-card", styles.imageGrid)}>
        {currentPageImages.map((img) => {
          // Use preview if available (fast path), fallback to cached or generate on-demand
          let imagePreview: React.ReactNode;

          if (img.preview) {
            // Use stored preview (fast)
            imagePreview = (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={img.preview} alt="Image preview" className={styles.imagePreviewImg} />
            );
          } else if (img.pixel_data) {
            // Fallback: use cached preview or show loading (will be generated by useEffect)
            const cachedPreview = previewCache.get(img.id);
            if (cachedPreview) {
              imagePreview = (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={cachedPreview}
                  alt="Pixel art preview"
                  className={styles.imagePreviewImg}
                />
              );
            } else {
              imagePreview = (
                <div
                  className={styles.imagePreviewError}
                  style={{ fontSize: "var(--font-size-xs)" }}
                >
                  Loading...
                </div>
              );
            }
          } else {
            imagePreview = <div className={styles.imagePreviewError}>No preview</div>;
          }

          const isSelected = selectedImages.has(img.id);
          const album = img.album_id ? albums.find((a) => a.id === img.album_id) : null;
          return (
            <div
              key={img.id}
              onClick={() => toggleSelection(img.id)}
              className={clsx(styles.imageItem, isSelected && styles.selected)}
              style={{ position: "relative" }}
            >
              <div className={clsx(styles.imagePreviewInner, isSelected && styles.selected)}>
                {imagePreview}
              </div>
              {isSelected && (
                <div className={styles.checkmark}>
                  <i className="hn hn-check-solid" />
                </div>
              )}
              {album && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "0.25rem",
                    left: "0.25rem",
                    background: "var(--game-overlay-bg-50)",
                    color: "var(--text)",
                    padding: "0.125rem 0.375rem",
                    borderRadius: "var(--radius-xs)",
                    fontSize: "var(--font-size-xs)",
                    maxWidth: "calc(100% - 0.5rem)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={album.name}
                >
                  {album.name}
                </div>
              )}
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
