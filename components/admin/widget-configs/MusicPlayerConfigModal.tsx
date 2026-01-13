"use client";

import React, { useState, useEffect } from "react";
import { FriendWidget } from "@/lib/queries";
import { WidgetConfig, WidgetSize } from "@/lib/types";
import { playSound } from "@/lib/sounds";
import { BaseWidgetConfigModal } from "./BaseWidgetConfigModal";
import styles from "./WidgetConfigModal.module.css";

interface MusicPlayerConfigModalProps {
  widget: FriendWidget;
  onClose: () => void;
  onSave: (config: WidgetConfig, size?: WidgetSize) => void;
}

const WIDGET_SIZES: WidgetSize[] = ["1x1", "3x1", "4x2"];

export function MusicPlayerConfigModal({ widget, onClose, onSave }: MusicPlayerConfigModalProps) {
  const [config, setConfig] = useState<WidgetConfig>(widget.config || {});
  const [selectedSize, setSelectedSize] = useState<WidgetSize | null>(widget.size || null);
  const [availableSongs, setAvailableSongs] = useState<
    Array<{ id: string; title: string; artist: string }>
  >([]);
  const [loadingSongs, setLoadingSongs] = useState(true);

  useEffect(() => {
    fetch("/api/content/songs")
      .then((res) => res.json())
      .then((data) => {
        if (data.songs && Array.isArray(data.songs)) {
          setAvailableSongs(data.songs);
        }
        setLoadingSongs(false);
      })
      .catch(() => {
        setLoadingSongs(false);
      });
  }, []);

  const handleSave = () => {
    if (selectedSize && selectedSize !== widget.size) {
      onSave(config, selectedSize);
    } else {
      onSave(config);
    }
    onClose();
  };

  const selectedSongIds = (config.playlistSongIds as string[]) || [];

  const handleSongToggle = (songId: string) => {
    playSound("click");
    const currentIds = selectedSongIds;
    const newIds = currentIds.includes(songId)
      ? currentIds.filter((id) => id !== songId)
      : [...currentIds, songId];
    setConfig({
      ...config,
      playlistSongIds: newIds,
    });
  };

  return (
    <BaseWidgetConfigModal
      title={`Configure ${widget.widget_name}`}
      selectedSize={selectedSize}
      availableSizes={WIDGET_SIZES}
      onSizeChange={setSelectedSize}
      onClose={onClose}
      onSave={handleSave}
    >
      <div className={styles.configSection}>
        <label className={`game-heading-3 ${styles.configLabel}`}>Select Songs for Playlist</label>
        {loadingSongs ? (
          <div className={`game-text-muted ${styles.loadingContainer}`}>
            <div>Loading songs...</div>
          </div>
        ) : (
          <>
            <div className={styles.songList}>
              {availableSongs.map((song) => {
                const isSelected = selectedSongIds.includes(song.id);
                return (
                  <div
                    key={song.id}
                    className={styles.songItem}
                    onClick={() => handleSongToggle(song.id)}
                  >
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={isSelected}
                      onChange={() => handleSongToggle(song.id)}
                    />
                    <span className={styles.songItemText}>
                      {song.title} - {song.artist}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className={`game-text-muted ${styles.helperText}`}>
              {selectedSongIds.length > 0
                ? `${selectedSongIds.length} song${selectedSongIds.length === 1 ? "" : "s"} selected. A random song will start playing when the page loads, and songs will shuffle through.`
                : "Select songs to create a playlist. A random song will start playing when the page loads."}
            </div>
          </>
        )}
      </div>
    </BaseWidgetConfigModal>
  );
}
