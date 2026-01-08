"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Song } from "@/lib/types";
import { playSound } from "@/lib/sounds";

// Component for playing a song in the admin panel
function SongPlayButton({ song }: { song: Song }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audio.preload = "none";

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      if (audioElement.error && audioElement.error.code === MediaError.MEDIA_ERR_ABORTED) {
        return;
      }
      console.error("[SongPlayButton] Audio error:", {
        code: audioElement.error?.code,
        message: audioElement.error?.message,
        src: audioElement.src,
      });
      setIsPlaying(false);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    audioRef.current = audio;

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);

      if (!audio.paused) {
        audio.pause();
      }

      audioRef.current = null;
    };
  }, []);

  const handleTogglePlay = () => {
    if (!song.mp3Url || !audioRef.current) {
      console.warn("[SongPlayButton] No mp3Url or audio ref");
      return;
    }

    const audio = audioRef.current;

    // Set source if needed
    if (audio.src !== song.mp3Url) {
      audio.pause();
      audio.src = song.mp3Url;
      audio.load();
    }

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((error) => {
        if (error.name !== "AbortError") {
          console.error("[SongPlayButton] Error playing song:", error);
        }
      });
    }
  };

  return (
    <button
      className="game-button"
      onClick={handleTogglePlay}
      style={{ fontSize: "var(--font-size-xs)" }}
      title={isPlaying ? "Pause" : "Play"}
    >
      <i className={isPlaying ? "hn hn-pause-solid" : "hn hn-play-solid"} />
    </button>
  );
}

interface SongManagerProps {
  initialSongs?: Song[];
  onSave?: (songs: Song[]) => Promise<void>;
  showAddForm?: boolean;
  onAddFormChange?: (show: boolean) => void;
  onAddSongRef?: (fn: () => void) => void;
  onSaveRef?: (fn: () => void) => void;
  savingRef?: (saving: boolean) => void;
}

export function SongManager({
  initialSongs = [],
  onSave,
  showAddForm: externalShowAddForm,
  onAddFormChange,
  onAddSongRef,
  onSaveRef,
  savingRef,
}: SongManagerProps) {
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editSong, setEditSong] = useState<Partial<Song>>({});
  const [internalShowAddForm, setInternalShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use external showAddForm if provided, otherwise use internal state
  const showAddForm = externalShowAddForm !== undefined ? externalShowAddForm : internalShowAddForm;
  const setShowAddForm = onAddFormChange || setInternalShowAddForm;

  // Define handleSave before using it in useEffect
  const handleSave = useCallback(async () => {
    if (!onSave) return;

    setSaving(true);
    try {
      await onSave(songs);
      playSound("success");
      alert("Songs saved successfully! 🎉");
    } catch (error) {
      console.error("Error saving songs:", error);
      playSound("error");
      alert("Failed to save songs. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [onSave, songs]);

  // Expose methods to parent via refs
  useEffect(() => {
    if (onAddSongRef) {
      onAddSongRef(() => setShowAddForm(true));
    }
  }, [onAddSongRef, setShowAddForm]);

  useEffect(() => {
    if (onSaveRef) {
      onSaveRef(handleSave);
    }
  }, [onSaveRef, handleSave]);

  useEffect(() => {
    if (savingRef) {
      savingRef(saving);
    }
  }, [saving, savingRef]);

  const [newSong, setNewSong] = useState<Partial<Song>>({
    title: "",
    artist: "",
    mp3Url: "",
  });

  useEffect(() => {
    // Filter out songs that don't have mp3Url
    const validSongs = initialSongs.filter((song) => song.mp3Url);
    setSongs(validSongs);
  }, [initialSongs]);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("audio/")) {
      playSound("error");
      alert("Please select an audio file (MP3, etc.)");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("mp3", file);
      formData.append("title", newSong.title || "");
      formData.append("artist", newSong.artist || "");

      const response = await fetch("/api/content/top_10_songs/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to upload MP3");
      }

      const { mp3Url, title, artist } = await response.json();

      const song: Song = {
        id: `song-${Date.now()}`,
        title: title || newSong.title || "Untitled",
        artist: artist || newSong.artist || "Unknown Artist",
        mp3Url,
      };

      setSongs((prev) => [...prev, song]);
      setNewSong({ title: "", artist: "", mp3Url: "" });
      setShowAddForm(false);
      playSound("success");
    } catch (error) {
      console.error("Error uploading MP3:", error);
      playSound("error");
      alert(`Failed to upload MP3: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddSong = () => {
    if (!newSong.title || !newSong.artist) {
      playSound("error");
      alert("Please fill in title and artist!");
      return;
    }

    // Trigger file input
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEditSong = (index: number) => {
    setEditingIndex(index);
    setEditSong(songs[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    if (!editSong.title || !editSong.artist || !editSong.mp3Url) {
      playSound("error");
      alert("Please fill in all fields!");
      return;
    }

    setSongs((prev) =>
      prev.map((song, i) =>
        i === editingIndex
          ? {
              ...song,
              title: editSong.title!,
              artist: editSong.artist!,
              mp3Url: editSong.mp3Url!,
            }
          : song
      )
    );
    setEditingIndex(null);
    setEditSong({});
    playSound("success");
  };

  const handleDeleteSong = (index: number) => {
    // Instant delete - no confirmation (optimistic update pattern)
    setSongs((prev) => prev.filter((_, i) => i !== index));
    playSound("delete");
    // Note: DB sync handled by TanStack Query mutation
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        gap: "var(--space-md)",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {showAddForm && (
        <div
          className="game-card"
          style={{
            flexShrink: 0,
            background: "var(--admin-surface)",
            borderColor: "var(--admin-accent)",
          }}
        >
          <h3
            className="game-heading-3"
            style={{ marginBottom: "var(--space-md)", color: "var(--admin-text)" }}
          >
            Add New Song
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
            <input
              type="text"
              className="game-input"
              placeholder="Song Title"
              value={newSong.title || ""}
              onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
              style={{
                background: "var(--admin-bg)",
                borderColor: "var(--admin-accent)",
                color: "var(--admin-text)",
              }}
            />
            <input
              type="text"
              className="game-input"
              placeholder="Artist"
              value={newSong.artist || ""}
              onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
              style={{
                background: "var(--admin-bg)",
                borderColor: "var(--admin-accent)",
                color: "var(--admin-text)",
              }}
            />
            <button
              className="game-button"
              onClick={handleAddSong}
              disabled={uploading || !newSong.title || !newSong.artist}
              style={{
                background: uploading ? "var(--admin-accent)" : "var(--admin-primary)",
                borderColor: "var(--admin-accent)",
                color: "var(--admin-text)",
                gridColumn: "1 / -1",
                opacity: uploading || !newSong.title || !newSong.artist ? 0.6 : 1,
                cursor: uploading || !newSong.title || !newSong.artist ? "not-allowed" : "pointer",
              }}
            >
              {uploading ? "Uploading..." : "Select MP3 File"}
            </button>
          </div>
        </div>
      )}

      <div
        className="game-card"
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "var(--admin-surface)",
          borderColor: "var(--admin-accent)",
        }}
      >
        {songs.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-2xl)",
              color: "var(--admin-text)",
              opacity: 0.6,
            }}
          >
            No songs yet. Click &quot;Add Song&quot; to get started!
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-sm)",
              overflowY: "auto",
              flex: 1,
            }}
          >
            {songs.map((song, index) => (
              <div
                key={song.id || index}
                className="game-card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "var(--space-md)",
                  background: "var(--admin-bg)",
                  borderColor: "var(--admin-accent)",
                }}
              >
                {editingIndex === index ? (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="text"
                      className="game-input"
                      value={editSong.title || ""}
                      onChange={(e) => setEditSong({ ...editSong, title: e.target.value })}
                      placeholder="Title"
                      style={{ fontSize: "var(--font-size-xs)", padding: "var(--space-sm)" }}
                    />
                    <input
                      type="text"
                      className="game-input"
                      value={editSong.artist || ""}
                      onChange={(e) => setEditSong({ ...editSong, artist: e.target.value })}
                      placeholder="Artist"
                      style={{ fontSize: "var(--font-size-xs)", padding: "var(--space-sm)" }}
                    />
                    <div className="game-text-muted" style={{ fontSize: "var(--font-size-xs)" }}>
                      MP3 URL: {editSong.mp3Url || "N/A"}
                    </div>
                    <div className="game-flex game-flex-gap-sm">
                      <button
                        className="game-button game-button-success"
                        onClick={handleSaveEdit}
                        style={{ fontSize: "var(--font-size-xs)" }}
                      >
                        Save
                      </button>
                      <button
                        className="game-button"
                        onClick={() => {
                          setEditingIndex(null);
                          setEditSong({});
                        }}
                        style={{ fontSize: "var(--font-size-xs)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1 }}>
                      <div
                        className="game-heading-3"
                        style={{ marginBottom: "var(--space-xs)", fontSize: "var(--font-size-sm)" }}
                      >
                        {song.title}
                      </div>
                      <div className="game-text-muted" style={{ marginBottom: "var(--space-xs)" }}>
                        {song.artist}
                      </div>
                      {song.mp3Url && (
                        <div
                          className="game-text-muted"
                          style={{ fontSize: "var(--font-size-xs)", marginTop: "var(--space-xs)" }}
                        >
                          MP3 URL: {song.mp3Url.substring(0, 50)}...
                        </div>
                      )}
                    </div>
                    <div className="game-flex game-flex-gap-sm">
                      <SongPlayButton song={song} />
                      <button
                        className="game-button"
                        onClick={() => handleEditSong(index)}
                        style={{ fontSize: "var(--font-size-xs)" }}
                      >
                        Edit
                      </button>
                      <button
                        className="game-button game-button-danger"
                        onClick={() => handleDeleteSong(index)}
                        style={{ fontSize: "var(--font-size-xs)" }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
