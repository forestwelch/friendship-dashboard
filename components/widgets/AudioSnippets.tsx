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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [stopTimeout, setStopTimeout] = useState<NodeJS.Timeout | null>(null);
  const identity = useIdentity();
  const modalId = `audiosnippets-${friendId}`;

  const { data: snippets = [] } = useAudioSnippets(friendId);
  const uploadMutation = useUploadAudioSnippet(friendId);

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

    const recorderInstance = await startRecording();
    if (!recorderInstance) {
      setIsRecording(false);
      return;
    }

    setRecorder(recorderInstance);

    try {
      // Start recording BEFORE the countdown ends to ensure it's ready
      // MediaRecorder.start() needs time to actually begin recording
      recorderInstance.start(100);

      // Wait for recorder to actually start recording (browser needs time)
      // This ensures we get the full 5 seconds of audio
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Set up auto-stop after 5 seconds
      const timeout = setTimeout(() => {
        if (recorderInstance.state === "recording" || recorderInstance.state === "paused") {
          recorderInstance.stop();
        }
        // Stop all tracks to release microphone
        recorderInstance.stream.getTracks().forEach((track) => {
          track.stop();
        });
        setIsRecording(false);
        setRecorder(null);
        setStopTimeout(null);
      }, 5000);
      setStopTimeout(timeout);

      // Now record for up to 5 seconds (can be stopped early via handleStop)
      // The promise will resolve when recorder.stop() is called (either manually or via timeout)
      const blob = await recordForDuration(recorderInstance, 5000);

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
        console.error("Recorded blob is empty or invalid");
        playSound("error");
        setIsRecording(false);
        setRecorder(null);
        return;
      }

      // Log blob info (duration analysis happens after upload when playing)
      console.warn(`Recording complete. Blob size: ${blob.size} bytes, type: ${blob.type}`);

      const iconName = getRandomIcon();
      uploadMutation.mutate({
        audioBlob: blob,
        recordedBy: identity,
        iconName,
      });
    } catch (error) {
      console.error("Error recording:", error);
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
    if (snippets.length === 0) return;
    const randomSnippet = snippets[Math.floor(Math.random() * snippets.length)];
    const audio = new Audio(randomSnippet.audio_url);
    audio.play();
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
            <Button onClick={handleStop} className="widget-button-flex" icon>
              <i className="hn hn-upload" />
            </Button>
          ) : (
            <Button
              onClick={handleRecord}
              disabled={countdown !== null}
              className="widget-button-flex"
              icon
              sound={false}
            >
              {countdown !== null ? (
                <span>{countdown}</span>
              ) : (
                <i className="hn hn-comment-quote" />
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
  ];
  return icons[Math.floor(Math.random() * icons.length)];
}
