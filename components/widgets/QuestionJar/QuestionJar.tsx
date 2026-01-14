"use client";

import React from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";
import { useUIStore } from "@/lib/store/ui-store";
import { QuestionJarModal } from "./QuestionJarModal";
import { useQuestionJarEntries } from "./queries";
import { useIdentity } from "@/lib/hooks/useIdentity";
import { Shimmer } from "@/components/shared";
import styles from "./QuestionJar.module.css";

interface QuestionJarProps {
  size: WidgetSize;
  friendId: string;
  friendName: string;
}

export function QuestionJar({ size, friendId, friendName }: QuestionJarProps) {
  const { setOpenModal } = useUIStore();
  const identity = useIdentity();
  const modalId = `questionjar-${friendId}`;

  const { data: entries = [], isLoading, isPending } = useQuestionJarEntries(friendId);
  const isLoadingState = isLoading || isPending;

  const handleClick = () => {
    setOpenModal(modalId);
  };

  // Support 2x2, 3x2, and 4x2 sizes
  const [cols] = size.split("x").map(Number);
  const isValidSize = size === "2x2" || size === "3x2" || size === "4x2";

  if (!isValidSize) {
    return (
      <Widget size={size}>
        <div className="widget-error-message">Question Jar supports 2×2, 3×2, and 4×2 sizes</div>
      </Widget>
    );
  }

  // Show shimmer while loading
  if (isLoadingState) {
    return (
      <Widget size={size}>
        <Shimmer animation="verticalwipe" className={styles.widgetClickableCentered} />
      </Widget>
    );
  }

  // Find the most recent unanswered question
  const unansweredQuestion = entries.find((entry) => !entry.answer_text);

  // Determine widget display state
  let displayText = "";

  if (unansweredQuestion) {
    if (unansweredQuestion.asked_by !== identity) {
      // Your turn to answer
      displayText = `Q: ${unansweredQuestion.question_text}`;
    } else {
      // Waiting for other's answer
      displayText = `Waiting for ${unansweredQuestion.asked_by === "admin" ? friendName : "Forest"}'s answer...`;
    }
  } else {
    // Your turn to ask
    displayText = "My turn";
  }

  return (
    <>
      <Widget size={size}>
        <div onClick={handleClick} className={`widget-clickable ${styles.widgetClickableCentered}`}>
          <div
            className={styles.displayText}
            style={
              {
                "--display-font-size": cols >= 4 ? "var(--font-size-sm)" : "var(--font-size-xs)",
              } as React.CSSProperties
            }
          >
            {displayText}
          </div>
        </div>
      </Widget>
      <QuestionJarModal friendId={friendId} friendName={friendName} />
    </>
  );
}
