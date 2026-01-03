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

  // Auto-play selected song on page load (only for 1x1 size)
  useEffect(() => {
    if (size !== "1x1") return;
    if (!selectedSongId || !songs || songs.length === 0) return;

    const selectedSong = songs.find((s) => s.id === selectedSongId);
    if (!selectedSong || !selectedSong.youtubeId) return;

    // Auto-play immediately on mount
    play(selectedSong.youtubeId);
  }, [size, selectedSongId, songs, play]);

  // Only support 1x1 size
  if (size !== "1x1") {
    return (
      <Widget size={size}>
        <div className="widget-error-message">Music Player only supports 1×1 size</div>
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

  return (
    <>
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
    </>
  );
}
