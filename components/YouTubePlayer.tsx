"use client";

import React, { useEffect, useState, useRef } from "react";
import { createYouTubePlayer, getPlayerInstance, YouTubePlayer } from "@/lib/youtube";

interface YouTubePlayerContextValue {
  player: YouTubePlayer | null;
  isPlaying: boolean;
  currentVideoId: string | null;
  play: (videoId: string) => void;
  pause: () => void;
  next: () => void;
  setPlaylist: (songs: Array<{ youtubeId: string }>) => void;
}

export const YouTubePlayerContext = React.createContext<YouTubePlayerContextValue>({
  player: null,
  isPlaying: false,
  currentVideoId: null,
  play: () => {},
  pause: () => {},
  next: () => {},
  setPlaylist: () => {},
});

export function YouTubePlayerProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<Array<{ youtubeId: string }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const playlistRef = useRef<Array<{ youtubeId: string }>>([]);
  const currentIndexRef = useRef(0);
  const playerRef = useRef<YouTubePlayer | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    if (initializedRef.current || !containerRef.current || typeof window === "undefined") return;
    initializedRef.current = true;

    const initPlayer = async () => {
      if (!containerRef.current || typeof window === "undefined") return;
      
      // Ensure container exists and has ID
      const containerId = "youtube-player-container";
      if (!containerRef.current.id) {
        containerRef.current.id = containerId;
      }
      
      const handleStateChange = (event: any) => {
        // YT.PlayerState.PLAYING = 1
        // YT.PlayerState.PAUSED = 2
        // YT.PlayerState.ENDED = 0
        if (event.data === 1) {
          setIsPlaying(true);
        } else if (event.data === 2 || event.data === 0) {
          setIsPlaying(false);
          if (event.data === 0) {
            // Video ended, play next
            setTimeout(() => {
              const currentPlaylist = playlistRef.current;
              const currentIdx = currentIndexRef.current;
              const currentPlayer = playerRef.current;
              
              if (currentPlaylist.length > 0 && currentPlayer) {
                const nextIndex = (currentIdx + 1) % currentPlaylist.length;
                const nextSong = currentPlaylist[nextIndex];
                if (nextSong) {
                  setCurrentIndex(nextIndex);
                  currentPlayer.loadVideoById(nextSong.youtubeId);
                  currentPlayer.playVideo();
                }
              }
            }, 100);
          }
        }
      };

      const ytPlayer = await createYouTubePlayer(containerId, {
        width: 1,
        height: 1,
        onStateChange: handleStateChange,
      });

      setPlayer(ytPlayer);
    };

    initPlayer();

    // Cleanup function to destroy player on unmount
    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch (error) {
          // Ignore cleanup errors
          console.warn("Error destroying YouTube player:", error);
        }
      }
      // Reset initialization flag so player can be recreated if component remounts
      initializedRef.current = false;
    };
  }, []);

  const handlePlay = (videoId: string) => {
    if (!player || !videoId) return;
    try {
      setCurrentVideoId(videoId);
      player.loadVideoById(videoId);
      player.playVideo();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing video:", error);
    }
  };

  const handlePause = () => {
    if (!player) return;
    try {
      player.pauseVideo();
      setIsPlaying(false);
    } catch (error) {
      console.error("Error pausing video:", error);
    }
  };

  const handleNext = () => {
    if (playlist.length === 0) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);
    const nextSong = playlist[nextIndex];
    if (nextSong && nextSong.youtubeId) {
      handlePlay(nextSong.youtubeId);
    }
  };

  const handleSetPlaylist = (songs: Array<{ youtubeId: string }>) => {
    if (!songs || !Array.isArray(songs)) return;
    setPlaylist(songs);
    setCurrentIndex(0);
    if (songs.length > 0 && songs[0] && songs[0].youtubeId) {
      handlePlay(songs[0].youtubeId);
    }
  };

  return (
    <YouTubePlayerContext.Provider
      value={{
        player,
        isPlaying,
        currentVideoId,
        play: handlePlay,
        pause: handlePause,
        next: handleNext,
        setPlaylist: handleSetPlaylist,
      }}
    >
      {children}
      <div
        ref={containerRef}
        id="youtube-player-container"
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </YouTubePlayerContext.Provider>
  );
}

