"use client";

import React, { useState, useEffect } from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";
import { useUIStore } from "@/lib/store/ui-store";
import { AudioSnippetsModal } from "./AudioSnippetsModal";
import { useAudioSnippets, useUploadAudioSnippet } from "./queries";
import { useIdentity } from "@/lib/hooks/useIdentity";
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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [stopTimeout, setStopTimeout] = useState<NodeJS.Timeout | null>(null);
  const identity = useIdentity();
  const modalId = `audiosnippets-${friendId}`;

  const { data: snippets = [] } = useAudioSnippets(friendId);
  const uploadMutation = useUploadAudioSnippet(friendId);
  const [recordingDots, setRecordingDots] = useState(1);

  // Animate dots while recording (1, 2, 3, repeat)
  useEffect(() => {
    if (!isRecording) {
      setRecordingDots(1);
      return;
    }

    const interval = setInterval(() => {
      setRecordingDots((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 500); // Change every 500ms

    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStop = () => {
    if (!recorder || !isRecording) return;

    // Clear the auto-stop timeout
    if (stopTimeout) {
      clearTimeout(stopTimeout);
      setStopTimeout(null);
    }

    playSound("click");

    // Stop recording immediately - this will trigger onstop in recordForDuration
    // which will resolve the promise and continue with blob processing in handleRecord
    if (recorder.state === "recording" || recorder.state === "paused") {
      recorder.stop();
    }
    // Stop tracks immediately to release microphone
    recorder.stream.getTracks().forEach((track) => {
      track.stop();
    });
    // Note: isRecording and recorder state will be cleaned up in handleRecord's finally block
  };

  const handleRecord = async () => {
    if (isRecording || countdown !== null) return;

    // Start countdown
    setCountdown(3);
    playSound("click");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setCountdown(2);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setCountdown(1);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setCountdown(null);
    setIsRecording(true);

    const recording = await startRecording();
    if (!recording) {
      setIsRecording(false);
      return;
    }

    const { recorder: recorderInstance, stream, extension } = recording;
    setRecorder(recorderInstance);

    try {
      // Match demo exactly - recordForDuration handles everything including stopping tracks
      const blob = await recordForDuration(recorderInstance, stream, extension, 5000);

      setIsRecording(false);
      setRecorder(null);

      // Clear timeout if recording completed (either naturally or early)
      if (stopTimeout) {
        clearTimeout(stopTimeout);
        setStopTimeout(null);
      }

      // Only process blob if we're still recording (wasn't stopped early)
      // Actually, if stop was called, isRecording will be false but blob should still be valid
      if (!isRecording && !blob) {
        // Was stopped early, blob processing will happen in onstop handler
        return;
      }

      // Validate blob before uploading
      if (!blob || blob.size === 0) {
        playSound("error");
        setIsRecording(false);
        setRecorder(null);
        return;
      }

      const iconName = getRandomIcon();

      uploadMutation.mutate({
        audioBlob: blob,
        recordedBy: identity,
        iconName,
      });
    } catch {
      playSound("error");
      // Clear timeout on error
      if (stopTimeout) {
        clearTimeout(stopTimeout);
        setStopTimeout(null);
      }
    } finally {
      setIsRecording(false);
      setRecorder(null);
    }
  };

  const handlePlayRandom = () => {
    if (snippets.length === 0) {
      playSound("error");
      return;
    }
    const randomSnippet = snippets[Math.floor(Math.random() * snippets.length)];
    const audio = new Audio(randomSnippet.audio_url);

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
          {/* Record/Stop Button - replaces record with stop when recording */}
          {isRecording ? (
            <Button onClick={handleStop} className="widget-button-flex rec-button recording" icon>
              <div className="rec-indicator">
                <span className="rec-icon-placeholder"></span>
                <span className="rec-text-placeholder"></span>
                <span className="rec-dots">
                  <span className="rec-dot">{recordingDots >= 1 ? "." : ""}</span>
                  <span className="rec-dot">{recordingDots >= 2 ? "." : ""}</span>
                  <span className="rec-dot">{recordingDots >= 3 ? "." : ""}</span>
                </span>
              </div>
            </Button>
          ) : (
            <Button
              onClick={handleRecord}
              disabled={countdown !== null}
              className="widget-button-flex rec-button"
              icon
              sound={false}
            >
              {countdown !== null ? (
                <span>{countdown}</span>
              ) : (
                <div className="rec-indicator">
                  <span className="rec-circle"></span>
                  <span className="rec-text">REC</span>
                </div>
              )}
            </Button>
          )}

          {/* Play Random Button */}
          <Button
            onClick={handlePlayRandom}
            disabled={snippets.length === 0}
            className="widget-button-flex"
            icon
          >
            <i className="hn hn-play-solid" />
          </Button>

          {/* Open Soundboard Button (1x3 and 3x1 only) */}
          {showSoundboard && (
            <Button onClick={handleOpenSoundboard} className="widget-button-flex" icon>
              <i className="hn hn-playlist-solid" />
            </Button>
          )}
        </div>
      </Widget>
      <AudioSnippetsModal friendId={friendId} />
    </>
  );
}

// Helper function to get random icon
// All icons verified to exist in @hackernoon/pixel-icon-library
function getRandomIcon(): string {
  const icons = [
    "hn-heart-solid",
    "hn-star-solid",
    "hn-hockey-mask-solid", // skull alternative
    "hn-face-thinking-solid", // smile alternative
    "hn-music-solid",
    "hn-bolt-solid",
    "hn-moon-solid",
    "hn-sun-solid",
    "hn-fire-solid",
    "hn-crown-solid",
    "hn-sparkles-solid",
    "hn-thumbsup-solid",
    "hn-thumbsdown-solid",
    "hn-robot-solid",
    "hn-trophy-solid",
    "hn-bullhorn-solid",
    "hn-bell-solid",
    "hn-exclaimation-solid",
    "hn-lightbulb-solid",
    "hn-plane-solid",
    "hn-globe-solid",
    "hn-flag-solid",
    "hn-bookmark-solid",
    "hn-book-heart-solid",
    "hn-check-circle-solid",
    "hn-times-circle-solid",
    "hn-question-solid",
    "hn-info-circle-solid",
    "hn-eye-solid",
    "hn-users-solid",
    "hn-user-headset-solid",
    "hn-headphones-solid",
    "hn-sound-on-solid",
    "hn-play-solid",
    "hn-shuffle-solid",
    "hn-trending-solid",
    "hn-thumbtack-solid",
    "hn-tag-solid",
    "hn-star-crescent-solid",
    "hn-seedlings-solid",
  ];
  return icons[Math.floor(Math.random() * icons.length)];
}
