"use client";

import { useMemo } from "react";
import { playSound } from "@/lib/sounds";
import { useUIStore } from "@/lib/store/ui-store";
import { ThemeColors } from "@/lib/types";
import { PersonalityQuizModal } from "./PersonalityQuizModal";
import styles from "./PersonalityQuiz.module.css";

interface QuizResult {
  emoji: string;
  title: string;
  description: string;
  answers: string[];
  completed_at: string;
}

interface PersonalityQuizData {
  your_result?: QuizResult;
  their_result?: QuizResult;
  compatibility_note?: string;
}

interface PersonalityQuizProps {
  size: 1 | 2 | 3;
  friendId: string;
  widgetId: string;
  themeColors: ThemeColors;
  config?: PersonalityQuizData;
}

export function PersonalityQuiz({
  size,
  friendId,
  widgetId,
  themeColors,
  config,
}: PersonalityQuizProps) {
  const { setOpenModal } = useUIStore();
  const yourResult = config?.your_result;
  const theirResult = config?.their_result;
  const _compatibilityNote = config?.compatibility_note;

  const handleClick = () => {
    setOpenModal(`quiz-${widgetId}`);
    playSound("open");
  };

  // Calculate compatibility percentage (simple heuristic)
  const compatibilityPercentage = useMemo(() => {
    if (!yourResult || !theirResult) return null;
    // If same emoji, high compatibility
    if (yourResult.emoji === theirResult.emoji) return 90;
    // If complementary (Sun/Moon), high compatibility
    if (
      (yourResult.emoji === "☀️" && theirResult.emoji === "🌙") ||
      (yourResult.emoji === "🌙" && theirResult.emoji === "☀️")
    ) {
      return 85;
    }
    // Default to 70-80 range
    return 75;
  }, [yourResult, theirResult]);

  // 1x1 Tile: Your emoji / Their emoji
  if (size === 1) {
    return (
      <>
        <div className={styles.tile1x1} onClick={handleClick}>
          <div className={styles.emojiRow}>
            <div className={styles.emoji}>{yourResult?.emoji || "?"}</div>
            <div className={styles.emoji}>{theirResult?.emoji || "?"}</div>
          </div>
        </div>
        <PersonalityQuizModal
          friendId={friendId}
          widgetId={widgetId}
          themeColors={themeColors}
          config={config}
        />
      </>
    );
  }

  // 2x2 Tile: Your vibe + Their vibe
  if (size === 2) {
    return (
      <>
        <div className={styles.tile2x2} onClick={handleClick}>
          <div className={styles.vibeSection}>
            <div className={styles.vibeTitle}>YOUR VIBE:</div>
            <div className={styles.emoji}>{yourResult?.emoji || "?"}</div>
            <div className={styles.vibeName}>{yourResult?.title || "Not taken"}</div>
          </div>
          <div className={styles.vibeSection}>
            <div className={styles.vibeTitle}>THEIR VIBE:</div>
            <div className={styles.emoji}>{theirResult?.emoji || "?"}</div>
            <div className={styles.vibeName}>{theirResult?.title || "Waiting..."}</div>
          </div>
        </div>
        <PersonalityQuizModal
          friendId={friendId}
          widgetId={widgetId}
          themeColors={themeColors}
          config={config}
        />
      </>
    );
  }

  // 3x3 Tile: Both results + compatibility
  if (size === 3) {
    return (
      <>
        <div className={styles.tile3x3} onClick={handleClick}>
          <div className={styles.header}>
            <div className={styles.youSection}>
              <div className={styles.label}>YOU</div>
              <div className={styles.emoji}>{yourResult?.emoji || "?"}</div>
              <div className={styles.title}>{yourResult?.title || "Not taken"}</div>
            </div>
            <div className={styles.themSection}>
              <div className={styles.label}>THEM</div>
              <div className={styles.emoji}>{theirResult?.emoji || "?"}</div>
              <div className={styles.title}>{theirResult?.title || "Waiting..."}</div>
            </div>
          </div>
          {yourResult && (
            <div className={styles.description}>{yourResult.description.split(".")[0]}.</div>
          )}
          {compatibilityPercentage !== null && (
            <>
              <div className={styles.compatibilityBar}>
                <div
                  className={styles.compatibilityFill}
                  style={{ width: `${compatibilityPercentage}%` }}
                />
              </div>
              <div className={styles.compatibilityText}>
                {compatibilityPercentage}% Compatibility
              </div>
            </>
          )}
        </div>
        <PersonalityQuizModal
          friendId={friendId}
          widgetId={widgetId}
          themeColors={themeColors}
          config={config}
        />
      </>
    );
  }

  return null;
}
