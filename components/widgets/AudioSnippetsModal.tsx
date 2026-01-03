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
    const audio = new Audio(audioUrl);
    audio.play();
    playSound("click");
  };

  const getIconColor = (recordedBy: "admin" | "friend") => {
    return recordedBy === identity ? "var(--primary)" : "var(--secondary)";
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
                style={{
                  backgroundColor: getIconColor(snippet.recorded_by),
                }}
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
