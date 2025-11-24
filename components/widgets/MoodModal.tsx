"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { playSound } from "@/lib/sounds";
import { useUIStore } from "@/lib/store/ui-store";
import { ThemeColors } from "@/lib/types";
import { Modal } from "@/components/Modal";
import { useMoodWidget, useSetMood, useUpdateMoodNotes } from "@/lib/queries-mood";
import styles from "./MoodModal.module.css";

interface MoodData {
  current_mood?: {
    emoji: string;
    timestamp: string;
    notes?: string;
  };
  history?: Array<{
    emoji: string;
    timestamp: string;
    notes?: string;
  }>;
}

interface MoodModalProps {
  friendId: string;
  widgetId: string;
  themeColors: ThemeColors;
  config?: MoodData;
}

const MOOD_EMOJIS = [
  { emoji: ":D", label: "Happy" },
  { emoji: ":)", label: "Content" },
  { emoji: ":|", label: "Neutral" },
  { emoji: ":(", label: "Sad" },
  { emoji: "T_T", label: "Crying" },
  { emoji: ":P", label: "Playful" },
  { emoji: ";)", label: "Mischievous" },
  { emoji: "o_o", label: "Surprised" },
  { emoji: ">:)", label: "Determined" },
  { emoji: "^^", label: "Peaceful" },
];

export function MoodModal({ friendId, widgetId, themeColors: _themeColors, config }: MoodModalProps) {
  const { openModal, setOpenModal } = useUIStore();
  const modalId = `mood-${widgetId}`;
  const isOpen = openModal === modalId;

  // Fetch mood data using TanStack Query
  const { data: moodData } = useMoodWidget(friendId, widgetId);
  const setMoodMutation = useSetMood(friendId, widgetId);
  const updateNotesMutation = useUpdateMoodNotes(friendId, widgetId);

  const currentMood = moodData?.current_mood || config?.current_mood;
  const [selectedEmoji, setSelectedEmoji] = useState(currentMood?.emoji || ":)");
  const [notes, setNotes] = useState(currentMood?.notes || "");
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Update local state when data changes - defer to avoid sync setState
  useEffect(() => {
    if (currentMood) {
      setTimeout(() => {
        setSelectedEmoji(currentMood.emoji);
        setNotes(currentMood.notes || "");
      }, 0);
    }
  }, [currentMood]);

  // Get last 7 days of history
  const last7Days = useMemo(() => {
    const gameHistory = moodData?.history || config?.history || [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return gameHistory.filter((entry) => new Date(entry.timestamp) >= sevenDaysAgo).reverse();
  }, [moodData?.history, config?.history]);

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      setSelectedEmoji(emoji);
      playSound("mood_set");
      setMoodMutation.mutate({ emoji, notes });
    },
    [notes, setMoodMutation]
  );

  const handleNotesChange = useCallback(
    (newNotes: string) => {
      setNotes(newNotes);
      // Debounce auto-save
      const timeoutId = setTimeout(() => {
        if (currentMood) {
          updateNotesMutation.mutate(newNotes);
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [currentMood, updateNotesMutation]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, MOOD_EMOJIS.length - 1));
        playSound("navigate");
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        playSound("navigate");
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleEmojiSelect(MOOD_EMOJIS[focusedIndex].emoji);
      } else if (e.key === "Escape") {
        setOpenModal(null);
        playSound("close");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, focusedIndex, handleEmojiSelect, setOpenModal]);

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  };

  return (
    <Modal id={modalId} title="MOOD" onClose={() => setOpenModal(null)}>
      <div className={styles.moodModal}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>SELECT YOUR MOOD</h3>
          <div className={styles.emojiGrid}>
            {MOOD_EMOJIS.map((mood, idx) => (
              <button
                key={mood.emoji}
                className={`${styles.emojiButton} ${selectedEmoji === mood.emoji ? styles.selected : ""} ${focusedIndex === idx ? styles.focused : ""}`}
                onClick={() => handleEmojiSelect(mood.emoji)}
                aria-label={`${mood.emoji} ${mood.label}`}
                style={{
                  minWidth: "44px",
                  minHeight: "44px",
                }}
              >
                <span className={styles.emoji}>{mood.emoji}</span>
                <span className={styles.emojiLabel}>{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>OPTIONAL NOTES</h3>
          <textarea
            className={styles.notesInput}
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add notes about your mood..."
            rows={3}
          />
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>MOOD HISTORY (7 days)</h3>
          <div className={styles.historyList}>
            {last7Days.length > 0 ? (
              last7Days.map((entry, idx) => (
                <div key={idx} className={styles.historyItem}>
                  <span className={styles.historyEmoji}>{entry.emoji}</span>
                  <span className={styles.historyDate}>{formatTimeAgo(entry.timestamp)}</span>
                  {entry.notes && <span className={styles.historyNotes}>{entry.notes}</span>}
                </div>
              ))
            ) : (
              <div className={styles.noHistory}>No mood history yet</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

