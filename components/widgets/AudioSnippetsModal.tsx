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
    if (!audioUrl || (!audioUrl.startsWith("http") && !audioUrl.startsWith("/"))) {
      playSound("error");
      return;
    }

    const audio = new Audio(audioUrl);

    audio.onerror = () => {
      playSound("error");
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          playSound("click");
        })
        .catch(() => {
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
