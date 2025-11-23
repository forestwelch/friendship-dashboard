"use client";

import React, { useState, useRef } from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";
import { playSound } from "@/lib/sounds";

interface ImageWidgetProps {
  size: WidgetSize;
  imageUrl?: string;
  onUpload?: (file: File) => Promise<void>;
  className?: string;
}

export function ImageWidget({ size, imageUrl, onUpload, className }: ImageWidgetProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      playSound("select");
      if (onUpload) {
        await onUpload(file);
      }
      playSound("success");
    } catch (error) {
      console.error("Upload failed:", error);
      playSound("error");
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Widget size={size} className={className}>
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--game-surface)",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Widget Image"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              imageRendering: "pixelated", // Enforce pixelated look
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--space-sm)",
              padding: "var(--space-md)",
              textAlign: "center",
            }}
          >
            {isUploading ? (
              <div className="game-animate-pulse">Uploading...</div>
            ) : (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="game-button game-button-primary"
                  style={{ fontSize: "var(--font-size-xs)" }}
                >
                  <i className="hn hn-upload-solid" style={{ marginRight: "4px" }} />
                  UPLOAD
                </button>
                <div style={{ fontSize: "var(--font-size-xs)", opacity: 0.7 }}>
                  PNG, JPG, GIF
                </div>
              </>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>
    </Widget>
  );
}


