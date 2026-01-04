"use client";

import React, { useContext, useEffect } from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize, Song } from "@/lib/types";
import { YouTubePlayerContext } from "@/components/YouTubePlayer";

interface MusicPlayerProps {
  size: WidgetSize;
  songs?: Song[];
  selectedSongId?: string;
}

export function MusicPlayer({ size, songs = [], selectedSongId }: MusicPlayerProps) {
  const { isPlaying, currentVideoId, play, pause } = useContext(YouTubePlayerContext);

  // Auto-play selected song on page load (for all sizes)
  useEffect(() => {
    if (!selectedSongId || !songs || songs.length === 0) return;

    const selectedSong = songs.find((s) => s.id === selectedSongId);
    if (!selectedSong || !selectedSong.youtubeId) return;

    // Auto-play immediately on mount
    play(selectedSong.youtubeId);
  }, [selectedSongId, songs, play]);

  // Support 1x1, 3x1, and 4x2 sizes
  const isValidSize = size === "1x1" || size === "3x1" || size === "4x2";

  if (!isValidSize) {
    return (
      <Widget size={size}>
        <div className="widget-error-message">Music Player supports 1×1, 3×1, and 4×2 sizes</div>
      </Widget>
    );
  }

  const selectedSong = selectedSongId
    ? songs.find((s) => s.id === selectedSongId)
    : songs[0] || null;

  const handleTogglePlayPause = () => {
    if (!selectedSong || !selectedSong.youtubeId) return;

    if (isPlaying && currentVideoId === selectedSong.youtubeId) {
      pause();
    } else {
      play(selectedSong.youtubeId);
    }
  };

  // 1x1: Just play button
  if (size === "1x1") {
    return (
      <Widget size={size}>
        <div className="music-player-control" onClick={handleTogglePlayPause}>
          <i
            className={
              isPlaying && currentVideoId === selectedSong?.youtubeId
                ? "hn hn-pause-solid music-player-icon"
                : "hn hn-play-solid music-player-icon"
            }
          />
        </div>
      </Widget>
    );
  }

  // 3x1 and 4x2: Play button + song info
  return (
    <Widget size={size}>
      <div
        className="widget-clickable"
        onClick={handleTogglePlayPause}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: "var(--space-md)",
          padding: "var(--space-sm)",
          height: "100%",
          width: "100%",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "fit-content",
            paddingLeft: "var(--space-sm)",
          }}
        >
          <i
            className={
              isPlaying && currentVideoId === selectedSong?.youtubeId
                ? "hn hn-pause-solid"
                : "hn hn-play-solid"
            }
            style={{ fontSize: size === "4x2" ? "3rem" : "2rem" }}
          />
        </div>
        {selectedSong && (
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              overflow: "hidden",
            }}
          >
            <div
              className="widget-title"
              style={{
                marginBottom: "var(--space-xs)",
                textAlign: "left",
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {selectedSong.title}
            </div>
            <div
              className="widget-content"
              style={{
                fontSize: "var(--font-size-xs)",
                textAlign: "left",
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {selectedSong.artist}
            </div>
          </div>
        )}
      </div>
    </Widget>
  );
}
