"use client";

import React, { useState, useEffect } from "react";
import { getGlobalContent } from "@/lib/queries";
import { Song } from "@/lib/types";
import { SongManager } from "./SongManager";
import Link from "next/link";

export function ContentManager() {
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        const data = await getGlobalContent("top_10_songs");
        if (data && data.songs) {
          setTopSongs(data.songs);
        }
      } catch (err) {
        console.error("Failed to fetch top songs:", err);
        setError("Failed to load top songs.");
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
  }, []);

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
        width: "100vw",
        height: "calc(100vh - 36px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="game-container" style={{ 
        padding: "var(--space-md)",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        <div className="game-breadcrumb" style={{ marginBottom: "var(--space-md)", flexShrink: 0 }}>
          <Link href="/" className="game-link">Home</Link>
          <span className="game-breadcrumb-separator">/</span>
          <span className="game-breadcrumb-current">Manage Content</span>
        </div>
        <h1 className="game-heading-1" style={{ marginBottom: "var(--space-md)", flexShrink: 0 }}>
          Manage Global Content
        </h1>

        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--admin-text)" }}>
              Loading songs...
            </div>
          ) : error ? (
            <div style={{ padding: "32px", color: "var(--admin-accent)" }}>
              Error: {error}
            </div>
          ) : (
            <SongManager initialSongs={topSongs} onSave={handleSaveSongs} />
          )}
        </div>
      </div>
    </div>
  );
}
