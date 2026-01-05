"use client";

import React, { useState, useEffect, useRef } from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize, Song } from "@/lib/types";

interface MusicPlayerProps {
  size: WidgetSize;
  songs?: Song[];
  selectedSongId?: string;
}

export function MusicPlayer({ size, songs = [], selectedSongId }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongId, setCurrentSongId] = useState<string | null>(selectedSongId || null);
  const [loadedSongs, setLoadedSongs] = useState<Song[]>(songs);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMountedRef = useRef(true);

  // Update loadedSongs when songs prop changes (only if different)
  useEffect(() => {
    if (songs.length > 0 && JSON.stringify(songs) !== JSON.stringify(loadedSongs)) {
      // Use requestAnimationFrame to avoid synchronous setState
      requestAnimationFrame(() => {
        setLoadedSongs(songs);
      });
    }
  }, [songs, loadedSongs]);

  // Fetch songs if not provided
  useEffect(() => {
    if (songs.length > 0) {
      return; // Don't fetch if songs are provided
    }

    // Fetch from API if no songs provided
    fetch("/api/content/top_10_songs")
      .then((res) => res.json())
      .then((data) => {
        if (data.songs && Array.isArray(data.songs)) {
          setLoadedSongs(data.songs);
        }
      })
      .catch((error) => {
        console.error("Error fetching songs:", error);
      });
  }, [songs]);

  // Initialize audio element
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    // Use "none" instead of "auto" to prevent automatic loading that can cause abort errors
    audio.preload = "none";

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    // Add error handler to suppress abort errors
    const handleError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      // Suppress abort errors - they're harmless during cleanup or src changes
      if (audioElement.error && audioElement.error.code === MediaError.MEDIA_ERR_ABORTED) {
        return;
      }
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    audioRef.current = audio;

    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;

      // Remove event listeners first
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);

      // Only pause if audio is actually playing to minimize abort errors
      // Pausing while loading can cause abort errors, but they're harmless
      if (!audio.paused) {
        audio.pause();
      }

      // Don't clear src here - it can cause abort errors if media is still loading
      // Pausing and removing listeners is sufficient cleanup.
      // The audio element will be garbage collected when the component unmounts.

      audioRef.current = null;
    };
  }, []);

  // Update currentSongId when selectedSongId prop changes
  useEffect(() => {
    if (selectedSongId && selectedSongId !== currentSongId) {
      requestAnimationFrame(() => {
        setCurrentSongId(selectedSongId);
      });
    }
  }, [selectedSongId, currentSongId]);

  // Auto-play selected song on page load
  useEffect(() => {
    if (!selectedSongId || !loadedSongs || loadedSongs.length === 0 || !audioRef.current) return;
    if (currentSongId !== selectedSongId) return; // Wait for currentSongId to update
    if (!isMountedRef.current) return; // Don't set src if component is unmounting

    const selectedSong = loadedSongs.find((s) => s.id === selectedSongId);
    if (!selectedSong || !selectedSong.mp3Url) return;

    // Auto-play immediately on mount
    const audio = audioRef.current;

    // Only set src if it's different to avoid abort errors
    if (audio.src !== selectedSong.mp3Url && isMountedRef.current) {
      // Pause before changing src to prevent abort errors
      audio.pause();
      audio.src = selectedSong.mp3Url;
    }

    if (isMountedRef.current) {
      audio.play().catch((error) => {
        // Ignore abort errors - they're harmless
        if (error.name !== "AbortError") {
          console.error("Error auto-playing song:", error);
        }
        // Auto-play might be blocked by browser, that's okay
      });
    }
  }, [selectedSongId, loadedSongs, currentSongId]);

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
    ? loadedSongs.find((s) => s.id === selectedSongId)
    : loadedSongs[0] || null;

  const handleTogglePlayPause = () => {
    if (!selectedSong || !selectedSong.mp3Url || !audioRef.current) return;

    const audio = audioRef.current;

    // If switching songs, update source
    if (currentSongId !== selectedSong.id) {
      // Only set src if it's different to avoid abort errors
      if (audio.src !== selectedSong.mp3Url) {
        audio.src = selectedSong.mp3Url;
      }
      setCurrentSongId(selectedSong.id);
    }

    if (isPlaying && currentSongId === selectedSong.id) {
      audio.pause();
    } else {
      audio.play().catch((error) => {
        // Ignore abort errors - they're harmless
        if (error.name !== "AbortError") {
          console.error("Error playing song:", error);
        }
      });
    }
  };

  // 1x1: Just play button
  if (size === "1x1") {
    return (
      <Widget size={size}>
        <div className="music-player-control" onClick={handleTogglePlayPause}>
          <i
            className={
              isPlaying && currentSongId === selectedSong?.id
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
              isPlaying && currentSongId === selectedSong?.id
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
