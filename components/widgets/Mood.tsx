"use client";

import { useMemo } from "react";
import { playSound } from "@/lib/sounds";
import { useUIStore } from "@/lib/store/ui-store";
import { ThemeColors } from "@/lib/types";
import { MoodModal } from "./MoodModal";
import styles from "./Mood.module.css";

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

interface MoodProps {
  size: 1 | 2 | 3;
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

export function Mood({ size, friendId, widgetId, themeColors, config }: MoodProps) {
  const { setOpenModal } = useUIStore();
  const currentMood = config?.current_mood;

  const handleClick = () => {
    setOpenModal(`mood-${widgetId}`);
    playSound("open");
  };

  // Get last 7 days of history
  const last7Days = useMemo(() => {
    const gameHistory = config?.history || [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return gameHistory.filter((entry) => new Date(entry.timestamp) >= sevenDaysAgo);
  }, [config?.history]);

  // Format timestamp
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // 1x1 Tile: Just emoji
  if (size === 1) {
    return (
      <>
        <div className={styles.tile1x1} onClick={handleClick}>
          <div className={styles.emoji}>{currentMood?.emoji || ":)"}</div>
        </div>
        <MoodModal friendId={friendId} widgetId={widgetId} themeColors={themeColors} config={config} />
      </>
    );
  }

  // 2x2 Tile: Current mood + timestamp + history preview
  if (size === 2) {
    const moodLabel = MOOD_EMOJIS.find((m) => m.emoji === currentMood?.emoji)?.label || "Mood";
    return (
      <>
        <div className={styles.tile2x2} onClick={handleClick}>
          <div className={styles.currentSection}>
            <div className={styles.emoji}>{currentMood?.emoji || ":)"}</div>
            <div className={styles.label}>{moodLabel}</div>
            {currentMood?.timestamp && (
              <div className={styles.timestamp}>{formatTimeAgo(currentMood.timestamp)}</div>
            )}
          </div>
          {last7Days.length > 0 && (
            <div className={styles.historyPreview}>
              {last7Days.slice(0, 4).map((entry, idx) => (
                <span key={idx} className={styles.historyEmoji}>
                  {entry.emoji}
                </span>
              ))}
            </div>
          )}
        </div>
        <MoodModal friendId={friendId} widgetId={widgetId} themeColors={themeColors} config={config} />
      </>
    );
  }

  // 3x3 Tile: Current mood + last 7 days history
  if (size === 3) {
    const moodLabel = MOOD_EMOJIS.find((m) => m.emoji === currentMood?.emoji)?.label || "Mood";
    return (
      <>
        <div className={styles.tile3x3} onClick={handleClick}>
          <div className={styles.currentSection}>
            <div className={styles.title}>Current Mood</div>
            <div className={styles.emojiLarge}>{currentMood?.emoji || ":)"}</div>
            <div className={styles.label}>{moodLabel}</div>
          </div>
          <div className={styles.historySection}>
            <div className={styles.historyTitle}>Last 7:</div>
            <div className={styles.historyGrid}>
              {last7Days.slice(0, 7).map((entry, idx) => (
                <div key={idx} className={styles.historyItem}>
                  <span className={styles.historyEmoji}>{entry.emoji}</span>
                </div>
              ))}
            </div>
            {currentMood?.timestamp && (
              <div className={styles.lastSet}>Set {formatTimeAgo(currentMood.timestamp)}</div>
            )}
          </div>
        </div>
        <MoodModal friendId={friendId} widgetId={widgetId} themeColors={themeColors} config={config} />
      </>
    );
  }

  return null;
}

