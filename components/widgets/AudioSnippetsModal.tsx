"use client";

import React, { useState } from "react";
import { Modal } from "@/components/Modal";
import { useUIStore } from "@/lib/store/ui-store";
import { useAudioSnippets, useDeleteAudioSnippet } from "@/lib/queries-audio-hooks";
import { useIdentity } from "@/lib/identity-utils";
import { playSound } from "@/lib/sounds";

interface AudioSnippetsModalProps {
  friendId: string;
}

export function AudioSnippetsModal({ friendId }: AudioSnippetsModalProps) {
  const { setOpenModal } = useUIStore();
  const identity = useIdentity();
  const modalId = `audiosnippets-${friendId}`;
  const isAdmin = identity === "admin";
  const [hoveredSnippet, setHoveredSnippet] = useState<string | null>(null);

  const { data: snippets = [] } = useAudioSnippets(friendId);
  const deleteMutation = useDeleteAudioSnippet(friendId);

  // Show all snippets in order (no deduplication - user wants all clips)
  // Sort by creation date to show newest last
  const sortedSnippets = React.useMemo(() => {
    return [...snippets].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateA - dateB;
    });
  }, [snippets]);

  const handlePlay = (audioUrl: string) => {
    // Validate URL before attempting to play (accepts both absolute and relative URLs)
    if (!audioUrl || (!audioUrl.startsWith("http") && !audioUrl.startsWith("/"))) {
      console.error("Invalid audio URL:", audioUrl);
      playSound("error");
      return;
    }

    const audio = new Audio();

    // Set up error handler before setting src
    audio.addEventListener("error", (e) => {
      console.error("Error loading audio:", {
        error: e,
        url: audioUrl,
        code: audio.error?.code,
        message: audio.error?.message,
      });
      playSound("error");
    });

    // Verify audio duration when metadata loads
    audio.addEventListener("loadedmetadata", () => {
      try {
        const duration = audio.duration;
        if (duration && !isNaN(duration)) {
          console.warn(`Playing audio snippet - Duration: ${duration.toFixed(2)}s`);
          if (duration < 4.0) {
            console.warn(`⚠️ Warning: Audio snippet is only ${duration.toFixed(2)}s, expected ~5s`);
          }
        }
      } catch (error) {
        console.error("Error reading audio metadata:", error);
      }
    });

    // Set src and play
    audio.src = audioUrl;

    // Preload for better mobile performance
    audio.preload = "auto";

    // For mobile, ensure we handle user interaction requirement
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          playSound("click");
        })
        .catch((error) => {
          console.error("Error playing audio:", {
            error,
            url: audioUrl,
            message: error.message,
          });
          playSound("error");
        });
    }
  };

  const handleDelete = (e: React.MouseEvent, snippetId: string) => {
    e.stopPropagation();
    if (isAdmin && confirm("Delete this audio snippet?")) {
      deleteMutation.mutate(snippetId);
    }
  };

  return (
    <Modal id={modalId} title="Audio Snippets Soundboard" onClose={() => setOpenModal(null)}>
      <div className="modal-content">
        <div className="form-title-small">Total clips: {snippets.length}</div>
        <div className="snippets-grid">
          {sortedSnippets.length === 0 ? (
            <div className="empty-state">No clips yet. Record your first snippet!</div>
          ) : (
            sortedSnippets.map((snippet) => (
              <div
                key={snippet.id}
                className="snippet-button-wrapper"
                onMouseEnter={() => setHoveredSnippet(snippet.id)}
                onMouseLeave={() => setHoveredSnippet(null)}
              >
                <button
                  onClick={() => handlePlay(snippet.audio_url)}
                  className="snippet-button"
                  data-recorded-by={snippet.recorded_by}
                  data-is-owner={snippet.recorded_by === identity ? "true" : "false"}
                >
                  <i className={`hn ${snippet.icon_name} snippet-icon`} />
                </button>
                {isAdmin && hoveredSnippet === snippet.id && (
                  <button
                    onClick={(e) => handleDelete(e, snippet.id)}
                    className="snippet-delete-button"
                    aria-label="Delete snippet"
                    title="Delete snippet"
                  >
                    <i className="hn hn-trash-solid" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
