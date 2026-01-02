"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { createYouTubePlayer, YouTubePlayer } from "@/lib/youtube";

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

// Global singleton to ensure only one player instance exists
let globalPlayerInstance: YouTubePlayer | null = null;
let globalInitialized = false;

export function YouTubePlayerProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<Array<{ youtubeId: string }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const playlistRef = useRef<Array<{ youtubeId: string }>>([]);
  const currentIndexRef = useRef(0);
  const initPromiseRef = useRef<Promise<YouTubePlayer | null> | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Use global singleton if available
  useEffect(() => {
    if (globalPlayerInstance && !player) {
      setPlayer(globalPlayerInstance);
    }
  }, [player]);

  const initPlayer = useCallback(async (): Promise<YouTubePlayer | null> => {
    // Return existing promise if initialization is in progress
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    // Return existing player if already initialized
    if (globalPlayerInstance) {
      setPlayer(globalPlayerInstance);
      return globalPlayerInstance;
    }

    if (typeof window === "undefined" || globalInitialized) {
      return null;
    }

    // Create initialization promise
    initPromiseRef.current = (async () => {
      try {
        // Wait for container to be ready
        let retries = 0;
        while ((!containerRef.current || !containerRef.current.isConnected) && retries < 20) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }

        if (!containerRef.current || !containerRef.current.isConnected) {
          throw new Error("Container not available");
        }

        // CRITICAL: Ensure container is completely empty
        // YouTube API uses insertBefore internally - container MUST be empty
        const container = containerRef.current;
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }

        // Ensure container has ID
        const containerId = "youtube-player-container";
        if (!container.id) {
          container.id = containerId;
        }

        // Wait for YouTube API to be ready
        let apiRetries = 0;
        while ((!window.YT || !window.YT.Player) && apiRetries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          apiRetries++;
        }

        if (!window.YT || !window.YT.Player) {
          throw new Error("YouTube API not loaded");
        }

        globalInitialized = true;

        const handleStateChange = (event: { data: number }) => {
          if (event.data === 1) {
            setIsPlaying(true);
          } else if (event.data === 2 || event.data === 0) {
            setIsPlaying(false);
            if (event.data === 0) {
              // Video ended, play next
              setTimeout(() => {
                const currentPlaylist = playlistRef.current;
                const currentIdx = currentIndexRef.current;
                const currentPlayer = globalPlayerInstance;

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

        // Create player - container is guaranteed to be empty
        const ytPlayer = await createYouTubePlayer(containerId, {
          width: 1,
          height: 1,
          onStateChange: handleStateChange,
        });

        globalPlayerInstance = ytPlayer;
        setPlayer(ytPlayer);
        initPromiseRef.current = null;
        return ytPlayer;
      } catch (error) {
        console.error("Error initializing YouTube player:", error);
        globalInitialized = false;
        initPromiseRef.current = null;
        return null;
      }
    })();

    return initPromiseRef.current;
  }, []);

  const handlePlay = useCallback(
    async (videoId: string) => {
      if (!videoId) return;

      // Initialize player lazily on first play
      if (!globalPlayerInstance) {
        await initPlayer();
      }

      if (!globalPlayerInstance) {
        console.error("Failed to initialize YouTube player");
        return;
      }

      try {
        setCurrentVideoId(videoId);
        globalPlayerInstance.loadVideoById(videoId);
        globalPlayerInstance.playVideo();
        setIsPlaying(true);
      } catch (error) {
        console.error("Error playing video:", error);
      }
    },
    [initPlayer]
  );

  const handlePause = useCallback(() => {
    if (!globalPlayerInstance) return;
    try {
      globalPlayerInstance.pauseVideo();
      setIsPlaying(false);
    } catch (error) {
      console.error("Error pausing video:", error);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (playlist.length === 0) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);
    const nextSong = playlist[nextIndex];
    if (nextSong && nextSong.youtubeId) {
      handlePlay(nextSong.youtubeId);
    }
  }, [playlist, currentIndex, handlePlay]);

  const handleSetPlaylist = useCallback(
    (songs: Array<{ youtubeId: string }>) => {
      if (!songs || !Array.isArray(songs)) return;
      setPlaylist(songs);
      setCurrentIndex(0);
      if (songs.length > 0 && songs[0] && songs[0].youtubeId) {
        handlePlay(songs[0].youtubeId);
      }
    },
    [handlePlay]
  );

  return (
    <YouTubePlayerContext.Provider
      value={{
        player: globalPlayerInstance,
        isPlaying,
        currentVideoId,
        play: handlePlay,
        pause: handlePause,
        next: handleNext,
        setPlaylist: handleSetPlaylist,
      }}
    >
      {children}
      {/* Container MUST be empty - YouTube API will insert iframe here */}
      <div
        ref={containerRef}
        id="youtube-player-container"
        data-youtube-container="true"
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
        suppressHydrationWarning
      />
    </YouTubePlayerContext.Provider>
  );
}
