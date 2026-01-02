"use client";

import React, { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import Link from "next/link";
import { cropImageToSize, getThemePalette, ColorPalette } from "@/lib/image-processing";
import { WidgetSize } from "@/lib/types";
import { savePixelArtImage } from "@/lib/queries";

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
  const _themeClass = getThemeClass(friend);
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
    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif");

    if (!isHeic) {
      return file; // Return original file if not HEIC
    }

    // Only import heic2any in the browser when needed
    if (typeof window === "undefined") {
      throw new Error("HEIC conversion is only available in the browser.");
    }

    try {
      // Dynamically import heic2any only when needed (browser-only)
      const heic2any = (await import("heic2any")).default;

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
        const pixelArt = await cropImageToSize(selectedFile, width, height, 4, palette);
        setPreview(pixelArt);
      } catch (error) {
        console.error("Error processing image:", error);
        alert("Error processing image. Please try again.");
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleSave = async () => {
    if (!preview) return;

    setProcessing(true);
    try {
      // Fetch friend data to get friend_id - use fetch API since we're in client component
      const response = await fetch(`/api/friends/${friend}`);
      if (!response.ok) {
        throw new Error("Friend not found");
      }
      const pageData = await response.json();

      if (!pageData || !pageData.friend) {
        alert("Error: Friend not found");
        return;
      }

      // Save pixel art image to Supabase
      const imageId = await savePixelArtImage(
        pageData.friend.id,
        null, // widget_id - can be set later when linking to a widget
        selectedSize,
        preview // base64 image data
      );

      if (imageId) {
        alert("Pixel art saved successfully!");
        // Optionally reset the form
        setPreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        alert("Error: Failed to save pixel art");
      }
    } catch (error) {
      console.error("Error saving pixel art:", error);
      alert("Error saving pixel art. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Navigation />
      <div
        className="admin-page"
        style={{
          paddingTop: `calc(var(--height-button) + var(--space-md))`,
          width: "100vw",
          minHeight: "100vh",
          background: "var(--admin-bg)",
          color: "var(--admin-text)",
        }}
      >
        <div
          className="game-container"
          style={{ paddingTop: "var(--space-2xl)", paddingBottom: "var(--space-2xl)" }}
        >
          <div className="game-breadcrumb" style={{ marginBottom: "var(--space-xl)" }}>
            <Link href="/" className="game-link">
              Home
            </Link>
            <span className="game-breadcrumb-separator">/</span>
            <span className="game-breadcrumb-current">Upload Pixel Art</span>
            <span style={{ marginLeft: "auto" }}>
              <Link href={`/${friend}`} className="game-link">
                View {friend}&apos;s page →
              </Link>
            </span>
          </div>
          <h1 className="game-heading-1" style={{ marginBottom: "var(--space-xl)" }}>
            Upload Pixel Art for {friend}
          </h1>

          <div
            className="game-card"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-lg)",
              maxWidth: "37.5rem",
              width: "100%",
              margin: "0 auto",
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
                className="game-button game-button-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
                style={{ width: "100%" }}
              >
                {processing ? "Processing..." : "Choose Image (PNG, JPG, HEIC)"}
              </button>
            </div>

            {/* Size selector */}
            <div className="game-flex game-flex-gap-md">
              {(["1x1", "2x2", "3x3"] as WidgetSize[]).map((size) => (
                <button
                  key={size}
                  className={`game-button ${selectedSize === size ? "game-button-primary" : ""}`}
                  onClick={() => handleSizeChange(size)}
                  style={{
                    flex: 1,
                  }}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Preview */}
            {preview && (
              <div
                className="game-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-lg)",
                  alignItems: "center",
                }}
              >
                <div className="game-heading-3" style={{ margin: 0 }}>
                  Preview ({selectedSize})
                </div>
                <img
                  src={preview}
                  alt="Pixel art preview"
                  style={{
                    maxWidth: "100%",
                    imageRendering: "pixelated",
                    border: "var(--border-width-lg) solid var(--admin-accent)",
                    borderRadius: "var(--radius-sm)",
                  }}
                />
                <button
                  className="game-button game-button-success"
                  onClick={handleSave}
                  disabled={processing}
                  style={{ width: "100%" }}
                >
                  {processing ? "Processing..." : "💾 Save Pixel Art"}
                </button>
              </div>
            )}

            {/* Color palette display */}
            {palette && (
              <div
                className="game-card"
                style={{
                  marginTop: "var(--space-lg)",
                }}
              >
                <div className="game-heading-3" style={{ marginBottom: "var(--space-md)" }}>
                  Theme Palette
                </div>
                <div className="game-flex game-flex-gap-md" style={{ flexWrap: "wrap" }}>
                  {Object.entries(palette).map(([name, color]) => (
                    <div
                      key={name}
                      className="game-flex game-flex-gap-sm"
                      style={{ alignItems: "center" }}
                    >
                      <div
                        style={{
                          width: "2rem",
                          height: "2rem",
                          backgroundColor: color,
                          border: "var(--border-width-md) solid var(--admin-accent)",
                          borderRadius: "var(--radius-sm)",
                          boxShadow: "var(--game-shadow-sm)",
                        }}
                      />
                      <span className="game-text-muted" style={{ textTransform: "capitalize" }}>
                        {name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
