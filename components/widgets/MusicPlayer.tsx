"use client";

import React, { useContext, useState, useEffect } from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize, Song } from "@/lib/types";
import { YouTubePlayerContext } from "@/components/YouTubePlayer";

interface MusicPlayerProps {
  size: WidgetSize;
  songs?: Song[];
}

// Sample top 10 songs (will be replaced with database data later)
const DEFAULT_SONGS: Song[] = [
  { id: "1", title: "Bohemian Rhapsody", artist: "Queen", youtubeId: "fJ9rUzIMcZQ" },
  { id: "2", title: "Stairway to Heaven", artist: "Led Zeppelin", youtubeId: "QkF3oxziUI4" },
  { id: "3", title: "Hotel California", artist: "Eagles", youtubeId: "BciS5krYL80" },
  { id: "4", title: "Sweet Child O' Mine", artist: "Guns N' Roses", youtubeId: "1w7OgIMMRc4" },
  { id: "5", title: "Comfortably Numb", artist: "Pink Floyd", youtubeId: "YlUKcNNmywk" },
  { id: "6", title: "Thunderstruck", artist: "AC/DC", youtubeId: "v2AC41dglnM" },
  { id: "7", title: "Back in Black", artist: "AC/DC", youtubeId: "pAgnJDJN4VA" },
  { id: "8", title: "Smells Like Teen Spirit", artist: "Nirvana", youtubeId: "hTWKbfoikeg" },
  { id: "9", title: "Enter Sandman", artist: "Metallica", youtubeId: "CD-E-LDc384" },
  { id: "10", title: "Paranoid", artist: "Black Sabbath", youtubeId: "0qanF-91aJo" },
];

export function MusicPlayer({ size, songs = DEFAULT_SONGS }: MusicPlayerProps) {
  const { player, isPlaying, currentVideoId, play, pause, next, setPlaylist } =
    useContext(YouTubePlayerContext);
  const [shuffledSongs, setShuffledSongs] = useState<Song[]>([]);

  useEffect(() => {
    // Shuffle songs on mount
    if (songs && songs.length > 0) {
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      setShuffledSongs(shuffled);
    }
  }, [songs]);

  const handlePlayClick = () => {
    if (shuffledSongs.length > 0 && shuffledSongs[0]) {
      setPlaylist(shuffledSongs);
      play(shuffledSongs[0].youtubeId);
    }
  };

  const handleSongClick = (song: Song) => {
    if (song && song.youtubeId) {
      play(song.youtubeId);
    }
  };

  // 1x1 version: Just a play/pause button
  if (size === "1x1") {
    const handleTogglePlayPause = () => {
      if (isPlaying) {
        if (pause) pause();
      } else {
        handlePlayClick();
      }
    };

    return (
      <>
        <style>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.6;
            }
          }
        `}</style>
        <Widget size={size}>
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
            onClick={handleTogglePlayPause}
          >
            <i
              className={isPlaying ? "hn hn-pause-solid" : "hn hn-play-solid"}
              style={{
                fontSize: "32px",
                animation: isPlaying ? "pulse 1s infinite" : "none",
                display: "inline-block",
                width: "32px",
                height: "32px",
                lineHeight: "32px",
              }}
            />
          </div>
        </Widget>
      </>
    );
  }

  // 2x2 version: Album art, song info, controls
  if (size === "2x2") {
    const currentSong = songs.find((s) => s.youtubeId === currentVideoId) || songs[0] || null;

    return (
      <Widget size={size}>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "4px",
            gap: "4px",
          }}
        >
          <div
            style={{
              flex: 1,
              backgroundColor: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 0, // Prevent flex shrink issues
            }}
          >
            <i
              className="hn hn-music-solid"
              style={{
                fontSize: "48px",
                display: "inline-block",
                width: "48px",
                height: "48px",
                lineHeight: "48px",
              }}
            />
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {currentSong?.title || "No song"}
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "var(--text)",
              opacity: 0.8,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {currentSong?.artist || "No artist"}
          </div>
          <div style={{ display: "flex", gap: "4px", minHeight: "40px" }}>
            <button
              className="widget-button"
              onClick={() => {
                if (isPlaying) {
                  pause();
                } else {
                  handlePlayClick();
                }
              }}
              style={{ flex: 1, fontSize: "12px", padding: "4px" }}
            >
              <i className={isPlaying ? "hn hn-pause-solid" : "hn hn-play-solid"} style={{ fontSize: "12px" }} />
            </button>
            <button
              className="widget-button"
              onClick={() => {
                if (next) next();
              }}
              style={{ flex: 1, fontSize: "12px", padding: "4px" }}
            >
              <i className="hn hn-arrow-alt-circle-right-solid" style={{ fontSize: "12px" }} />
            </button>
          </div>
        </div>
      </Widget>
    );
  }

  // 3x3 version: Full playlist with all controls
  return (
    <Widget size={size}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "4px",
          gap: "4px",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            color: "var(--text)",
            marginBottom: "0",
          }}
        >
          Top 10 Songs
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {songs && songs.length > 0 ? (
            songs.map((song) => {
              if (!song || !song.id) return null;
              const isCurrent = song.youtubeId === currentVideoId;
              return (
                <div
                  key={song.id}
                  className={`song-item ${isCurrent ? "selected" : ""}`}
                  onClick={() => {
                    if (song && song.youtubeId) {
                      handleSongClick(song);
                    }
                  }}
                  style={{
                    backgroundColor: isCurrent ? "var(--primary)" : "transparent",
                    color: isCurrent ? "var(--bg)" : "var(--text)",
                  }}
                >
                  <div style={{ fontSize: "12px" }}>
                    {song.title || "Unknown"}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      opacity: 0.8,
                      marginTop: "2px",
                    }}
                  >
                    {song.artist || "Unknown"}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: "6px", fontSize: "12px", color: "var(--text)", minHeight: "40px", display: "flex", alignItems: "center" }}>
              No songs available
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "4px", marginTop: "4px", minHeight: "40px" }}>
          <button
            className="widget-button"
            onClick={() => {
              if (isPlaying) {
                if (pause) pause();
              } else {
                handlePlayClick();
              }
            }}
            style={{ flex: 1, fontSize: "12px", padding: "6px" }}
          >
            <i className={isPlaying ? "hn hn-pause" : "hn hn-play"} style={{ fontSize: "12px", marginRight: "4px" }} />
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            className="widget-button"
            onClick={() => {
              if (next) next();
            }}
            style={{ flex: 1, fontSize: "12px", padding: "6px" }}
          >
            <i className="hn hn-arrow-circle-right" style={{ fontSize: "12px", marginRight: "4px" }} />
            Next
          </button>
        </div>
      </div>
    </Widget>
  );
}


