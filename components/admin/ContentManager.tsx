"use client";

import React, { useState, useEffect } from "react";
import { getGlobalContent } from "@/lib/queries";
import { Song, WidgetSize } from "@/lib/types";
import { SongManager } from "./SongManager";
import { ImageManager } from "./ImageManager";
import Link from "next/link";
import { playSound } from "@/lib/sounds";

type TabType = "songs" | "images";

interface ImageItem {
  id: string;
  base_image_data: string;
  size: WidgetSize;
  created_at: string;
}

export function ContentManager() {
  const [activeTab, setActiveTab] = useState<TabType>("songs");
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch songs
        const data = await getGlobalContent("top_10_songs");
        if (data && data.songs) {
          setTopSongs(data.songs);
        }
        // Fetch images
        await fetchImages();
      } catch (err) {
        console.error("Failed to fetch content:", err);
        setError("Failed to load content.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch("/api/images");
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
      }
    } catch (err) {
      console.error("Failed to fetch images:", err);
    }
  };

  const handleSaveSongs = async (songs: Song[]) => {
    const response = await fetch("/api/content/top_10_songs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songs }),
    });

    if (!response.ok) {
      throw new Error("Failed to save songs");
    }

    setTopSongs(songs);
  };

  return (
    <div
      className="admin-page"
      style={{
        paddingTop: `calc(var(--height-button) + var(--space-md))`,
        width: "100%",
        maxWidth: "100%",
        height: "calc(100vh - 2.25rem)",
        overflowX: "hidden",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="game-container"
        style={{
          padding: "var(--space-md)",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div className="game-breadcrumb" style={{ marginBottom: "var(--space-md)", flexShrink: 0 }}>
          <Link href="/" className="game-link">
            Home
          </Link>
          <span className="game-breadcrumb-separator">/</span>
          <span className="game-breadcrumb-current">Manage Global Content</span>
        </div>
        <h1 className="game-heading-1" style={{ marginBottom: "var(--space-md)", flexShrink: 0 }}>
          Manage Global Content
        </h1>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "var(--space-sm)",
            marginBottom: "var(--space-md)",
            borderBottom: "var(--border-width-md) solid var(--game-border)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => {
              setActiveTab("songs");
              playSound("click");
            }}
            style={{
              padding: "var(--space-sm) var(--space-lg)",
              fontSize: "var(--font-size-sm)",
              fontWeight: "bold",
              background: activeTab === "songs" ? "var(--primary)" : "transparent",
              color: activeTab === "songs" ? "var(--bg)" : "var(--text)",
              border: "none",
              borderBottom:
                activeTab === "songs"
                  ? `var(--border-width-md) solid var(--primary)`
                  : `var(--border-width-md) solid transparent`,
              cursor: "pointer",
              textTransform: "uppercase",
              transition: "all var(--transition-fast)",
            }}
          >
            Songs
          </button>
          <button
            onClick={() => {
              setActiveTab("images");
              playSound("click");
            }}
            style={{
              padding: "var(--space-sm) var(--space-lg)",
              fontSize: "var(--font-size-sm)",
              fontWeight: "bold",
              background: activeTab === "images" ? "var(--primary)" : "transparent",
              color: activeTab === "images" ? "var(--bg)" : "var(--text)",
              border: "none",
              borderBottom:
                activeTab === "images"
                  ? `var(--border-width-md) solid var(--primary)`
                  : `var(--border-width-md) solid transparent`,
              cursor: "pointer",
              textTransform: "uppercase",
              transition: "all var(--transition-fast)",
            }}
          >
            Images
          </button>
        </div>

        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--admin-text)" }}>
              Loading...
            </div>
          ) : error ? (
            <div style={{ padding: "2rem", color: "var(--admin-accent)" }}>Error: {error}</div>
          ) : activeTab === "songs" ? (
            <SongManager initialSongs={topSongs} onSave={handleSaveSongs} />
          ) : (
            <ImageManager initialImages={images} onImagesChange={setImages} />
          )}
        </div>
      </div>
    </div>
  );
}
