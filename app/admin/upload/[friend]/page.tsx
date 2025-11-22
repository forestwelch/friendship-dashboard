"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  cropImageToSize,
  getThemePalette,
  ColorPalette,
} from "@/lib/image-processing";
import { WidgetSize } from "@/lib/types";
import heic2any from "heic2any";

// Get theme class helper (same as friend page)
function getThemeClass(slug: string): string {
  if (!slug || typeof slug !== "string") {
    return "theme-daniel";
  }
  
  switch (slug.toLowerCase()) {
    case "daniel":
      return "theme-daniel";
    case "max":
      return "theme-max";
    case "violet":
    case "plum":
      return "theme-violet-plum";
    case "gameboy":
    case "gb":
      return "theme-gameboy";
    default:
      return "theme-daniel";
  }
}

export default function AdminUploadPage() {
  const params = useParams();
  const friend = params?.friend as string;
  const themeClass = getThemeClass(friend);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<WidgetSize>("1x1");
  const [processing, setProcessing] = useState(false);
  const [palette, setPalette] = useState<ColorPalette | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get theme palette when component mounts
  React.useEffect(() => {
    setPalette(getThemePalette());
  }, []);

  // Calculate dimensions based on widget size
  const getDimensions = (size: WidgetSize) => {
    const tileSize = 80;
    const gap = 8;

    switch (size) {
      case "1x1":
        return { width: tileSize, height: tileSize };
      case "2x2":
        return { width: tileSize * 2 + gap, height: tileSize * 2 + gap };
      case "3x3":
        return {
          width: tileSize * 3 + gap * 2,
          height: tileSize * 3 + gap * 2,
        };
      default:
        return { width: tileSize, height: tileSize };
    }
  };

  const convertHeicToPng = async (file: File): Promise<File> => {
    // Check if file is HEIC/HEIF
    const isHeic = file.type === "image/heic" || 
                   file.type === "image/heif" ||
                   file.name.toLowerCase().endsWith(".heic") ||
                   file.name.toLowerCase().endsWith(".heif");

    if (!isHeic) {
      return file; // Return original file if not HEIC
    }

    try {
      // Convert HEIC to PNG using heic2any
      const convertedBlob = await heic2any({
        blob: file,
        toType: "image/png",
        quality: 0.92,
      });

      // heic2any can return an array, take the first result
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      
      // Create a new File object from the blob
      const pngFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, ".png"), {
        type: "image/png",
        lastModified: Date.now(),
      });

      return pngFile;
    } catch (error) {
      console.error("Error converting HEIC:", error);
      throw new Error("Failed to convert HEIC image. Please try a different format.");
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !palette) return;

    setProcessing(true);

    try {
      // Convert HEIC to PNG if needed
      const processedFile = await convertHeicToPng(file);
      setSelectedFile(processedFile);

      const { width, height } = getDimensions(selectedSize);
      const pixelArt = await cropImageToSize(processedFile, width, height, 4, palette);
      setPreview(pixelArt);
    } catch (error) {
      console.error("Error processing image:", error);
      alert(error instanceof Error ? error.message : "Error processing image. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleSizeChange = async (size: WidgetSize) => {
    setSelectedSize(size);
    if (selectedFile && palette) {
      setProcessing(true);
      try {
        const { width, height } = getDimensions(size);
        const pixelArt = await cropImageToSize(
          selectedFile,
          width,
          height,
          4,
          palette
        );
        setPreview(pixelArt);
      } catch (error) {
        console.error("Error processing image:", error);
        alert("Error processing image. Please try again.");
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleSave = () => {
    if (!preview) return;
    // For now, just log the base64 data
    // Later: Save to database/storage
    console.log("Saving pixel art:", {
      friend,
      size: selectedSize,
      imageData: preview,
    });
    alert("Pixel art saved! (Currently just logged to console)");
  };

  return (
    <div className={themeClass} style={{ width: "100vw", height: "100vh" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          padding: "32px",
          background: "var(--bg)",
          color: "var(--text)",
        }}
      >
      <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>
        Upload Pixel Art for {friend}
      </h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "600px",
          width: "100%",
        }}
      >
        {/* File input */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <button
            className="widget-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            style={{ width: "100%", padding: "16px" }}
          >
            {processing ? "Processing..." : "Choose Image (PNG, JPG, HEIC)"}
          </button>
        </div>

        {/* Size selector */}
        <div style={{ display: "flex", gap: "8px" }}>
          {(["1x1", "2x2", "3x3"] as WidgetSize[]).map((size) => (
            <button
              key={size}
              className="widget-button"
              onClick={() => handleSizeChange(size)}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor:
                  selectedSize === size ? "var(--primary)" : "var(--secondary)",
              }}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Preview */}
        {preview && (
          <div
            style={{
              border: "4px solid var(--accent)",
              padding: "16px",
              background: "var(--bg)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                marginBottom: "8px",
                color: "var(--text)",
              }}
            >
              Preview ({selectedSize})
            </div>
            <img
              src={preview}
              alt="Pixel art preview"
              style={{
                maxWidth: "100%",
                imageRendering: "pixelated",
                border: "2px solid var(--accent)",
              }}
            />
            <button
              className="widget-button"
              onClick={handleSave}
              disabled={processing}
              style={{ width: "100%", padding: "12px" }}
            >
              {processing ? "Processing..." : "Save Pixel Art"}
            </button>
          </div>
        )}

        {/* Color palette display */}
        {palette && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              border: "2px solid var(--accent)",
              fontSize: "12px",
            }}
          >
            <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
              Theme Palette:
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {Object.entries(palette).map(([name, color]) => (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      backgroundColor: color,
                      border: "2px solid var(--text)",
                    }}
                  />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

