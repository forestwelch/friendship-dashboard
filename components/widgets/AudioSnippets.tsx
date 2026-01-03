"use client";

import React, { useState } from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";
import { useUIStore } from "@/lib/store/ui-store";
import { AudioSnippetsModal } from "./AudioSnippetsModal";
import { useAudioSnippets, useUploadAudioSnippet } from "@/lib/queries-audio-hooks";
import { useIdentity } from "@/lib/identity-utils";
import { startRecording, recordForDuration } from "@/lib/audio-recorder";
import { playSound } from "@/lib/sounds";
import { Button } from "@/components/shared";

interface AudioSnippetsProps {
  size: WidgetSize;
  friendId: string;
}

export function AudioSnippets({ size, friendId }: AudioSnippetsProps) {
  const { setOpenModal } = useUIStore();
  const [isRecording, setIsRecording] = useState(false);
  const identity = useIdentity();
  const modalId = `audiosnippets-${friendId}`;

  const { data: snippets = [] } = useAudioSnippets(friendId);
  const uploadMutation = useUploadAudioSnippet(friendId);

  const handleRecord = async () => {
    if (isRecording) return;

    setIsRecording(true);
    playSound("click");

    const recorder = await startRecording();
    if (!recorder) {
      setIsRecording(false);
      return;
    }

    try {
      const blob = await recordForDuration(recorder, 2000); // Exactly 2 seconds
      const iconName = getRandomIcon();
      uploadMutation.mutate({
        audioBlob: blob,
        recordedBy: identity,
        iconName,
      });
    } catch (error) {
      console.error("Error recording:", error);
      playSound("error");
    } finally {
      setIsRecording(false);
    }
  };

  const handlePlayRandom = () => {
    if (snippets.length === 0) return;
    const randomSnippet = snippets[Math.floor(Math.random() * snippets.length)];
    const audio = new Audio(randomSnippet.audio_url);
    audio.play();
    playSound("click");
  };

  const handleOpenSoundboard = () => {
    setOpenModal(modalId);
  };

  // Support vertical (1x2, 1x3) and horizontal (2x1, 3x1) sizes
  const isVertical = size === "1x2" || size === "1x3";
  const isHorizontal = size === "2x1" || size === "3x1";

  if (!isVertical && !isHorizontal) {
    return (
      <Widget size={size}>
        <div className="widget-error-message">
          Audio Snippets only supports 1×2, 1×3, 2×1, and 3×1 sizes
        </div>
      </Widget>
    );
  }

  const showSoundboard = size === "1x3" || size === "3x1";

  return (
    <>
      <Widget size={size}>
        <div
          className={`widget-buttons-container ${isHorizontal ? "widget-buttons-horizontal" : "widget-buttons-vertical"}`}
        >
          {/* Record Button */}
          <Button onClick={handleRecord} disabled={isRecording} className="widget-button-flex">
            {isRecording ? (
              <>
                <i className="hn hn-circle-solid" /> Recording...
              </>
            ) : (
              <>
                <i className="hn hn-microphone-solid" /> Record
              </>
            )}
          </Button>

          {/* Play Random Button */}
          <Button
            onClick={handlePlayRandom}
            disabled={snippets.length === 0}
            className="widget-button-flex"
          >
            <i className="hn hn-play-solid" /> Play Random
          </Button>

          {/* Open Soundboard Button (1x3 and 3x1 only) */}
          {showSoundboard && (
            <Button onClick={handleOpenSoundboard} className="widget-button-flex">
              <i className="hn hn-volume-up-solid" /> Soundboard
            </Button>
          )}
        </div>
      </Widget>
      <AudioSnippetsModal friendId={friendId} />
    </>
  );
}

// Helper function to get random icon
function getRandomIcon(): string {
  const icons = [
    "hn-heart-solid",
    "hn-star-solid",
    "hn-skull-solid",
    "hn-smile-solid",
    "hn-music-solid",
    "hn-bolt-solid",
    "hn-moon-solid",
    "hn-sun-solid",
  ];
  return icons[Math.floor(Math.random() * icons.length)];
}
