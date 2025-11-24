"use client";

import React, { useState, useEffect } from "react";
import { Song } from "@/lib/types";
import { playSound } from "@/lib/sounds";

interface SongManagerProps {
  initialSongs?: Song[];
  onSave?: (songs: Song[]) => Promise<void>;
}

export function SongManager({ initialSongs = [], onSave }: SongManagerProps) {
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editSong, setEditSong] = useState<Partial<Song>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSong, setNewSong] = useState<Partial<Song>>({
    title: "",
    artist: "",
    youtubeId: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSongs(initialSongs);
  }, [initialSongs]);

  const handleAddSong = () => {
    if (!newSong.title || !newSong.artist || !newSong.youtubeId) {
      playSound("error");
      alert("Please fill in all fields!");
      return;
    }

    const song: Song = {
      id: `song-${Date.now()}`,
      title: newSong.title!,
      artist: newSong.artist!,
      youtubeId: newSong.youtubeId!,
    };

    setSongs((prev) => [...prev, song]);
    setNewSong({ title: "", artist: "", youtubeId: "" });
    setShowAddForm(false);
    playSound("success");
  };

  const handleEditSong = (index: number) => {
    setEditingIndex(index);
    setEditSong(songs[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    if (!editSong.title || !editSong.artist || !editSong.youtubeId) {
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
              youtubeId: editSong.youtubeId!,
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
    // TODO: Sync to DB in background (will be handled by TanStack Query mutation)
  };

  const handleSave = async () => {
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
  };

  const extractYouTubeId = (url: string): string => {
    // Extract YouTube ID from various URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return url; // Return as-is if no pattern matches
  };

  const handlePasteYouTubeUrl = (field: "youtubeId" | "newYoutubeId", value: string) => {
    const id = extractYouTubeId(value);
    if (field === "youtubeId") {
      setEditSong({ ...editSong, youtubeId: id });
    } else {
      setNewSong({ ...newSong, youtubeId: id });
    }
  };

  return (
    <div style={{ 
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
      gap: "var(--space-md)",
    }}>
      <div className="game-flex game-flex-between" style={{ flexShrink: 0 }}>
        <h2 className="game-heading-2" style={{ margin: 0, color: "var(--admin-text)" }}>Manage Songs</h2>
        <div className="game-flex game-flex-gap-sm">
          <button
            className="game-button"
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              background: "var(--admin-primary)",
              borderColor: "var(--admin-accent)",
              color: "var(--admin-text)",
            }}
          >
            {showAddForm ? "Cancel" : "+ Add Song"}
          </button>
          {onSave && (
            <button
              className="game-button"
              onClick={handleSave}
              disabled={saving}
              style={{
                background: "var(--admin-secondary)",
                borderColor: "var(--admin-accent)",
                color: "var(--admin-text)",
              }}
            >
              {saving ? "Saving..." : "💾 Save"}
            </button>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="game-card" style={{ 
          flexShrink: 0,
          background: "var(--admin-surface)",
          borderColor: "var(--admin-accent)",
        }}>
          <h3 className="game-heading-3" style={{ marginBottom: "var(--space-md)", color: "var(--admin-text)" }}>Add New Song</h3>
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
            <input
              type="text"
              className="game-input"
              placeholder="YouTube ID or URL"
              value={newSong.youtubeId || ""}
              onChange={(e) => {
                const value = e.target.value;
                setNewSong({ ...newSong, youtubeId: value });
                if (value.includes("youtube.com") || value.includes("youtu.be")) {
                  handlePasteYouTubeUrl("newYoutubeId", value);
                }
              }}
              style={{
                background: "var(--admin-bg)",
                borderColor: "var(--admin-accent)",
                color: "var(--admin-text)",
                gridColumn: "1 / -1",
              }}
            />
            <button
              className="game-button"
              onClick={handleAddSong}
              style={{
                background: "var(--admin-primary)",
                borderColor: "var(--admin-accent)",
                color: "var(--admin-text)",
                gridColumn: "1 / -1",
              }}
            >
              Add Song
            </button>
          </div>
        </div>
      )}

      <div className="game-card" style={{ 
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "var(--admin-surface)",
        borderColor: "var(--admin-accent)",
      }}>
        {songs.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "var(--space-2xl)",
            color: "var(--admin-text)",
            opacity: 0.6,
          }}>
            No songs yet. Click &quot;Add Song&quot; to get started!
          </div>
        ) : (
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "var(--space-sm)",
            overflowY: "auto",
            flex: 1,
          }}>
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
                      onChange={(e) =>
                        setEditSong({ ...editSong, title: e.target.value })
                      }
                      placeholder="Title"
                      style={{ fontSize: "var(--font-size-xs)", padding: "var(--space-sm)" }}
                    />
                    <input
                      type="text"
                      className="game-input"
                      value={editSong.artist || ""}
                      onChange={(e) =>
                        setEditSong({ ...editSong, artist: e.target.value })
                      }
                      placeholder="Artist"
                      style={{ fontSize: "var(--font-size-xs)", padding: "var(--space-sm)" }}
                    />
                    <input
                      type="text"
                      className="game-input"
                      value={editSong.youtubeId || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditSong({ ...editSong, youtubeId: value });
                        if (value.includes("youtube.com") || value.includes("youtu.be")) {
                          handlePasteYouTubeUrl("youtubeId", value);
                        }
                      }}
                      placeholder="YouTube ID"
                      style={{ fontSize: "var(--font-size-xs)", padding: "var(--space-sm)" }}
                    />
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
                      <div className="game-heading-3" style={{ marginBottom: "var(--space-xs)", fontSize: "var(--font-size-sm)" }}>
                        {song.title}
                      </div>
                      <div className="game-text-muted" style={{ marginBottom: "var(--space-xs)" }}>
                        {song.artist}
                      </div>
                      <div className="game-text-muted" style={{ fontSize: "var(--font-size-xs)", marginTop: "var(--space-xs)" }}>
                        YouTube ID: {song.youtubeId}
                      </div>
                    </div>
                    <div className="game-flex game-flex-gap-sm">
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


