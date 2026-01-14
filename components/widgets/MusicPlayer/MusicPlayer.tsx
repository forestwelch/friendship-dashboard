"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize, Song } from "@/lib/types";
import { Shimmer } from "@/components/shared";
import styles from "./MusicPlayer.module.css";

interface MusicPlayerProps {
  size: WidgetSize;
  playlistSongIds?: string[];
  selectedSongId?: string; // Backward compatibility
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function MusicPlayer({ size, playlistSongIds, selectedSongId }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongId, setCurrentSongId] = useState<string | null>(selectedSongId || null);
  const [loadedSongs, setLoadedSongs] = useState<Song[]>([]);
  const [shuffledPlaylist, setShuffledPlaylist] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMountedRef = useRef(true);
  const hasInitializedRef = useRef(false);
  const hasAutoPlayedRef = useRef(false);
  const shouldAutoPlayNextRef = useRef(false);

  // Fetch songs from API
  useEffect(() => {
    fetch("/api/content/songs")
      .then((res) => res.json())
      .then((data) => {
        if (data.songs && Array.isArray(data.songs)) {
          setLoadedSongs(data.songs);
        }
      })
      .catch((error) => {
        console.error("[MusicPlayer] Error fetching songs:", error);
      });
  }, []);

  // Build playlist from playlistSongIds or fallback to selectedSongId or all songs
  useEffect(() => {
    if (loadedSongs.length === 0) {
      return;
    }

    let playlistToUse: Song[] = [];

    if (playlistSongIds && playlistSongIds.length > 0) {
      // Use playlist from config
      playlistToUse = loadedSongs.filter((song) => playlistSongIds.includes(song.id));
    } else if (selectedSongId) {
      // Backward compatibility: use selectedSongId
      const song = loadedSongs.find((s) => s.id === selectedSongId);
      if (song) {
        playlistToUse = [song];
      } else {
        console.warn("[MusicPlayer] selectedSongId not found in loadedSongs:", selectedSongId);
      }
    } else if (loadedSongs.length > 0) {
      // Fallback: use all songs
      playlistToUse = loadedSongs;
    }

    // Shuffle the playlist
    if (playlistToUse.length > 0) {
      const shuffled = shuffleArray(playlistToUse);

      // Batch state updates
      requestAnimationFrame(() => {
        setShuffledPlaylist(shuffled);

        // Randomly pick initial song (only if not already set via selectedSongId)
        if (!hasInitializedRef.current) {
          const randomIndex = Math.floor(Math.random() * shuffled.length);
          const initialSong = shuffled[randomIndex];
          setCurrentIndex(randomIndex);
          setCurrentSongId(initialSong.id);
          hasInitializedRef.current = true;
        }
      });
    } else {
      console.warn("[MusicPlayer] No songs in playlist, clearing shuffled playlist");
      requestAnimationFrame(() => {
        setShuffledPlaylist([]);
      });
    }
  }, [loadedSongs, playlistSongIds, selectedSongId]);

  const currentSong = shuffledPlaylist[currentIndex] || null;

  // Define handleNext before useEffect that uses it
  const handleNext = useCallback(() => {
    if (shuffledPlaylist.length === 0 || !audioRef.current) {
      console.warn("[MusicPlayer] Cannot go to next: no playlist or audio ref");
      return;
    }

    // Move to next song in shuffled playlist (wrap around)
    const nextIndex = (currentIndex + 1) % shuffledPlaylist.length;
    const nextSong = shuffledPlaylist[nextIndex];

    if (!nextSong) {
      console.warn("[MusicPlayer] No next song found");
      return;
    }

    // Validate mp3Url
    if (!nextSong.mp3Url || nextSong.mp3Url.trim() === "") {
      console.warn("[MusicPlayer] Cannot play next song: no valid mp3Url", nextSong);
      return;
    }

    // Mark that we should auto-play after advancing
    shouldAutoPlayNextRef.current = true;

    // Update state - the effect will handle setting source and playing
    setCurrentIndex(nextIndex);
    setCurrentSongId(nextSong.id);
  }, [shuffledPlaylist, currentIndex]);

  const handleTogglePlayPause = useCallback(() => {
    if (!currentSong || !audioRef.current) {
      console.warn("[MusicPlayer] Cannot toggle: no current song or audio ref");
      return;
    }

    // Validate mp3Url
    if (!currentSong.mp3Url || currentSong.mp3Url.trim() === "") {
      console.warn("[MusicPlayer] Cannot play song: no valid mp3Url", currentSong);
      return;
    }

    const audio = audioRef.current;

    // If switching songs, update source
    if (currentSongId !== currentSong.id) {
      if (audio.src !== currentSong.mp3Url && isMountedRef.current) {
        try {
          audio.pause();
          audio.src = currentSong.mp3Url;
          // Load the new source before playing
          audio.load();
        } catch (error) {
          console.error("[MusicPlayer] Error setting audio source:", error);
          return;
        }
      }
      setCurrentSongId(currentSong.id);
    }

    if (isPlaying && currentSongId === currentSong.id) {
      audio.pause();
    } else {
      audio.play().catch((error) => {
        if (error.name !== "AbortError") {
          console.error("[MusicPlayer] Error playing song:", error);
        }
      });
    }
  }, [currentSong, currentSongId, isPlaying]);

  // Initialize audio element
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audio.preload = "none";

    const handlePlay = () => {
      setIsPlaying(true);
    };
    const handlePause = () => {
      setIsPlaying(false);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      // Auto-play next song when current song ends
      handleNext();
    };

    const handleError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      if (audioElement.error && audioElement.error.code === MediaError.MEDIA_ERR_ABORTED) {
        return;
      }
      console.error("[MusicPlayer] Audio error:", {
        code: audioElement.error?.code,
        message: audioElement.error?.message,
        src: audioElement.src,
      });
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    audioRef.current = audio;
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);

      if (!audio.paused) {
        audio.pause();
      }

      audioRef.current = null;
    };
  }, [handleNext]);

  // Update audio source when currentSong changes
  useEffect(() => {
    if (!currentSong || !audioRef.current || !isMountedRef.current) {
      return;
    }

    // Validate mp3Url
    if (!currentSong.mp3Url || currentSong.mp3Url.trim() === "") {
      console.warn("[MusicPlayer] Song has no valid mp3Url:", currentSong);
      return;
    }

    const audio = audioRef.current;
    const shouldAutoPlay = shouldAutoPlayNextRef.current;
    shouldAutoPlayNextRef.current = false; // Reset flag

    // Only update if the source is different
    try {
      if (audio.src !== currentSong.mp3Url) {
        audio.pause();
        audio.src = currentSong.mp3Url;
        audio.load();

        // If we're advancing to next song, wait for it to load then play
        if (shouldAutoPlay) {
          const handleCanPlay = () => {
            audio.removeEventListener("canplay", handleCanPlay);
            if (isMountedRef.current) {
              audio.play().catch((error) => {
                if (error.name !== "AbortError") {
                  console.error("[MusicPlayer] Error playing next song:", error);
                }
              });
            }
          };

          audio.addEventListener("canplay", handleCanPlay);

          // If already loaded, play immediately
          if (audio.readyState >= 2) {
            audio.removeEventListener("canplay", handleCanPlay);
            if (isMountedRef.current) {
              audio.play().catch((error) => {
                if (error.name !== "AbortError") {
                  console.error("[MusicPlayer] Error playing next song:", error);
                }
              });
            }
          }
        }
      } else if (shouldAutoPlay) {
        // Source is already set, just play
        if (isMountedRef.current) {
          audio.play().catch((error) => {
            if (error.name !== "AbortError") {
              console.error("[MusicPlayer] Error playing next song:", error);
            }
          });
        }
      }
    } catch (error) {
      console.error("[MusicPlayer] Error setting audio source:", error);
    }
  }, [currentSong]);

  // Auto-play selected song on page load (restore original behavior)
  useEffect(() => {
    if (!currentSong || !currentSong.mp3Url || !audioRef.current) {
      return;
    }
    if (currentSongId !== currentSong.id) {
      return; // Wait for currentSongId to update
    }
    if (!isMountedRef.current) {
      return; // Don't set src if component is unmounting
    }
    if (hasAutoPlayedRef.current) {
      return; // Already auto-played
    }

    const audio = audioRef.current;

    // Only set src if it's different to avoid abort errors
    if (audio.src !== currentSong.mp3Url && isMountedRef.current) {
      // Pause before changing src to prevent abort errors
      audio.pause();
      audio.src = currentSong.mp3Url;
    }

    if (isMountedRef.current) {
      hasAutoPlayedRef.current = true;
      audio.play().catch((error) => {
        // Ignore abort errors - they're harmless
        if (error.name !== "AbortError") {
          console.error("[MusicPlayer] Error auto-playing song:", error);
        }
        // Auto-play might be blocked by browser, that's okay
      });
    }
  }, [currentSong, currentSongId]);

  // Support 1x1, 3x1, and 4x2 sizes
  const isValidSize = size === "1x1" || size === "3x1" || size === "4x2";

  if (!isValidSize) {
    return (
      <Widget size={size}>
        <div className="widget-error-message">Music Player supports 1×1, 3×1, and 4×2 sizes</div>
      </Widget>
    );
  }

  // Show shimmer while loading songs
  const isLoading = loadedSongs.length === 0 || shuffledPlaylist.length === 0;

  if (isLoading) {
    return (
      <Widget size={size}>
        <Shimmer animation="verticalwipe" />
      </Widget>
    );
  }

  // 1x1: Just play button
  if (size === "1x1") {
    return (
      <Widget size={size}>
        <div className="music-player-control" onClick={handleTogglePlayPause}>
          <i
            className={
              isPlaying && currentSongId === currentSong?.id
                ? "hn hn-pause-solid music-player-icon"
                : "hn hn-play-solid music-player-icon"
            }
          />
        </div>
      </Widget>
    );
  }

  // 3x1: Three columns - Play button, Title/Artist, Next button
  if (size === "3x1") {
    return (
      <Widget size={size}>
        <div className={styles.musicPlayerContainer}>
          {/* Play/Pause button - Left column (absolutely positioned) */}
          <div
            className={`widget-clickable ${styles.playButtonContainer}`}
            onClick={handleTogglePlayPause}
          >
            <i
              className={`${
                isPlaying && currentSongId === currentSong?.id
                  ? "hn hn-pause-solid"
                  : "hn hn-play-solid"
              } ${styles.iconSmall}`}
            />
          </div>

          {/* Song info - Middle column (centered, constrained by button positions) */}
          {currentSong ? (
            <div className={styles.songInfoContainer}>
              <div className={`widget-title ${styles.songTitle}`}>
                {currentSong.title || "Untitled"}
              </div>
              <div className={`widget-content ${styles.songArtist}`}>
                {currentSong.artist || "Unknown Artist"}
              </div>
            </div>
          ) : (
            <div className={styles.noSongContainer}>No song selected</div>
          )}

          {/* Next button - Right column (absolutely positioned) */}
          <div
            className={`widget-clickable ${styles.nextButtonContainer}`}
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          >
            <i className={`hn hn-shuffle-solid ${styles.iconSmall}`} />
          </div>
        </div>
      </Widget>
    );
  }

  // 4x2: Original layout (play button + song info)
  return (
    <Widget size={size}>
      <div className={`widget-clickable ${styles.musicPlayerRow}`} onClick={handleTogglePlayPause}>
        <div className={styles.iconContainer}>
          <i
            className={`${
              isPlaying && currentSongId === currentSong?.id
                ? "hn hn-pause-solid"
                : "hn hn-play-solid"
            } ${styles.iconLarge}`}
          />
        </div>
        {currentSong && (
          <div className={styles.songInfoFlex}>
            <div className={`widget-title ${styles.songTitleRow}`}>{currentSong.title}</div>
            <div className={`widget-content ${styles.songArtistRow}`}>{currentSong.artist}</div>
          </div>
        )}
      </div>
    </Widget>
  );
}
