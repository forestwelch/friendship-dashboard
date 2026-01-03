"use client";

import React from "react";
import { Modal } from "@/components/Modal";
import { useUIStore } from "@/lib/store/ui-store";
import { useAudioSnippets } from "@/lib/queries-audio-hooks";
import { useIdentity } from "@/lib/identity-utils";
import { playSound } from "@/lib/sounds";

interface AudioSnippetsModalProps {
  friendId: string;
}

export function AudioSnippetsModal({ friendId }: AudioSnippetsModalProps) {
  const { setOpenModal } = useUIStore();
  const identity = useIdentity();
  const modalId = `audiosnippets-${friendId}`;

  const { data: snippets = [] } = useAudioSnippets(friendId);

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

    audio.play().catch((error) => {
      console.error("Error playing audio:", {
        error,
        url: audioUrl,
        message: error.message,
      });
      playSound("error");
    });

    playSound("click");
  };

  return (
    <Modal id={modalId} title="Audio Snippets Soundboard" onClose={() => setOpenModal(null)}>
      <div className="modal-content">
        <div className="form-title-small">Total clips: {snippets.length}</div>
        <div className="snippets-grid">
          {snippets.length === 0 ? (
            <div className="empty-state">No clips yet. Record your first snippet!</div>
          ) : (
            snippets.map((snippet) => (
              <button
                key={snippet.id}
                onClick={() => handlePlay(snippet.audio_url)}
                className="snippet-button"
                data-recorded-by={snippet.recorded_by}
                data-is-owner={snippet.recorded_by === identity ? "true" : "false"}
              >
                <i className={`hn ${snippet.icon_name} snippet-icon`} />
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
