"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Song } from "@/lib/types";
import { SongManager } from "./SongManager";
import { ImageManager } from "./ImageManager";
import { usePathname } from "next/navigation";
import { AddContentNav } from "@/app/admin/content/AddContentNav";
import styles from "./ContentManager.module.css";

interface ImageItem {
  id: string;
  pixel_data?: string | null;
  preview?: string | null;
  width?: number;
  height?: number;
  created_at: string;
}

export function ContentManager() {
  const pathname = usePathname();
  const activeTab = pathname?.includes("/images") ? "images" : "songs";

  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedImagesCount, setSelectedImagesCount] = useState(0);
  const [albums, setAlbums] = useState<
    Array<{ id: string; name: string; created_at: string; imageCount: number }>
  >([]);

  // Refs for child component methods
  const addSongRef = useRef<(() => void) | null>(null);
  const saveSongsRef = useRef<(() => void) | null>(null);
  const uploadImagesRef = useRef<(() => void) | null>(null);
  const deleteImagesRef = useRef<(() => void) | null>(null);
  const addToAlbumRef = useRef<((albumId: string | null) => void) | null>(null);
  const selectedCountRef = useRef<(() => number) | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch songs from API
        const songsResponse = await fetch("/api/content/songs");
        const songsData = await songsResponse.json();
        setTopSongs(songsData.songs || []);
        // Fetch images
        await fetchImages();
        // Fetch albums
        const albumsResponse = await fetch("/api/albums");
        if (albumsResponse.ok) {
          const albumsData = await albumsResponse.json();
          setAlbums(albumsData.albums || []);
        }
      } catch (err) {
        console.error("Failed to fetch content:", err);
        setError("Failed to load content.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Listen for add content events from navigation
  useEffect(() => {
    const handleAddSongs = () => {
      if (activeTab === "songs") {
        setShowAddForm(true);
      }
    };
    const handleAddImages = () => {
      if (activeTab === "images") {
        // Trigger file input click for images
        const fileInput = document.querySelector<HTMLInputElement>(
          'input[type="file"][accept="image/*"]'
        );
        fileInput?.click();
      }
    };

    window.addEventListener("admin-add-songs", handleAddSongs);
    window.addEventListener("admin-add-images", handleAddImages);

    return () => {
      window.removeEventListener("admin-add-songs", handleAddSongs);
      window.removeEventListener("admin-add-images", handleAddImages);
    };
  }, [activeTab]);

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
    setSaving(true);
    try {
      const response = await fetch("/api/content/songs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songs }),
      });

      if (!response.ok) {
        throw new Error("Failed to save songs");
      }

      setTopSongs(songs);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSongsClick = useCallback(() => {
    if (saveSongsRef.current) {
      saveSongsRef.current();
    }
  }, []);

  const handleAddSongClick = useCallback(() => {
    if (addSongRef.current) {
      addSongRef.current();
    }
  }, []);

  const handleUploadImagesClick = useCallback(() => {
    if (uploadImagesRef.current) {
      uploadImagesRef.current();
    }
  }, []);

  const handleDeleteImagesClick = useCallback(() => {
    if (deleteImagesRef.current) {
      deleteImagesRef.current();
    }
  }, []);

  const handleAddToAlbumClick = useCallback((albumId: string | null) => {
    if (addToAlbumRef.current) {
      addToAlbumRef.current(albumId);
    }
  }, []);

  // Update selected images count
  useEffect(() => {
    const updateCount = () => {
      if (selectedCountRef.current) {
        setSelectedImagesCount(selectedCountRef.current());
      }
    };
    const interval = setInterval(updateCount, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <AddContentNav
        onAddSong={handleAddSongClick}
        onSaveSongs={handleSaveSongsClick}
        onUploadImages={handleUploadImagesClick}
        onDeleteImages={handleDeleteImagesClick}
        onAddToAlbum={handleAddToAlbumClick}
        selectedImagesCount={selectedImagesCount}
        albums={albums}
        saving={saving}
      />
      <div className={`admin-page ${styles.pageContainer}`}>
        <div className={`game-container ${styles.contentContainer}`}>
          <h1 className={`game-heading-1 ${styles.title}`}>
            {activeTab === "songs" ? "MANAGE SONGS" : "MANAGE IMAGES"}
          </h1>

          {loading ? (
            <div className={styles.loadingMessage}>Loading...</div>
          ) : error ? (
            <div className={styles.errorMessage}>Error: {error}</div>
          ) : activeTab === "songs" ? (
            <SongManager
              initialSongs={topSongs}
              onSave={handleSaveSongs}
              showAddForm={showAddForm}
              onAddFormChange={setShowAddForm}
              onAddSongRef={(fn) => {
                addSongRef.current = fn;
              }}
              onSaveRef={(fn) => {
                saveSongsRef.current = fn;
              }}
              savingRef={setSaving}
            />
          ) : (
            <ImageManager
              initialImages={images}
              onImagesChange={(newImages) => {
                setImages(newImages);
                // Refresh albums to update counts
                fetch("/api/albums")
                  .then((res) => res.json())
                  .then((data) => setAlbums(data.albums || []))
                  .catch(() => {});
              }}
              onUploadRef={(fn) => {
                uploadImagesRef.current = fn;
              }}
              onDeleteRef={(fn) => {
                deleteImagesRef.current = fn;
              }}
              onAddToAlbumRef={(fn) => {
                addToAlbumRef.current = fn;
              }}
              onSelectedCountRef={(fn) => {
                selectedCountRef.current = fn;
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}
