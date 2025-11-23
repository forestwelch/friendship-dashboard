"use client";

import React, { useState, useRef } from "react";
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
}

export function ImageManager({ initialImages }: ImageManagerProps) {
  const [images, setImages] = useState<ImageItem[]>(initialImages);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    playSound("select");

    // TODO: Implement actual upload to API
    // For now, mock it
    const newImages: ImageItem[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      await new Promise<void>((resolve) => {
        reader.onload = (ev) => {
          if (ev.target?.result) {
            newImages.push({
              id: `temp-${Date.now()}-${i}`,
              base_image_data: ev.target.result as string,
              size: "2x2", // Default size, maybe prompt?
              created_at: new Date().toISOString(),
            });
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    setImages((prev) => [...newImages, ...prev]);
    setIsUploading(false);
    playSound("success");
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

  const handleDelete = () => {
    if (selectedImages.size === 0) return;
    
    if (confirm(`Delete ${selectedImages.size} images?`)) {
      setImages((prev) => prev.filter((img) => !selectedImages.has(img.id)));
      setSelectedImages(new Set());
      playSound("cancel");
    }
  };

  return (
    <div className="game-container" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <div className="game-card" style={{ marginBottom: "var(--space-md)", padding: "var(--space-md)", display: "flex", gap: "var(--space-md)", alignItems: "center" }}>
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
        
        <div style={{ marginLeft: "auto", fontSize: "var(--font-size-xs)", color: "var(--game-text-muted)" }}>
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
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", 
          gap: "var(--space-md)",
          alignContent: "start"
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
                ? "2px solid var(--game-accent-blue)" 
                : "1px solid var(--game-border)",
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              cursor: "pointer",
              transition: "all 0.2s",
              transform: selectedImages.has(img.id) ? "scale(0.95)" : "scale(1)",
              boxShadow: selectedImages.has(img.id) ? "var(--game-glow-blue)" : "none",
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
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "bold"
                }}
              >
                ✓
              </div>
            )}
            <div 
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "rgba(0,0,0,0.7)",
                padding: "4px",
                fontSize: "8px",
                color: "white",
                textAlign: "center"
              }}
            >
              {img.size}
            </div>
          </div>
        ))}
        
        {images.length === 0 && (
          <div 
            style={{ 
              gridColumn: "1 / -1", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              height: "200px",
              color: "var(--game-text-muted)",
              flexDirection: "column",
              gap: "var(--space-md)"
            }}
          >
            <i className="hn hn-image" style={{ fontSize: "32px", opacity: 0.5 }} />
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


