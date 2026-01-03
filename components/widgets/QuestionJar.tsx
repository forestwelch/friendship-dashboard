"use client";

import React from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";
import { useUIStore } from "@/lib/store/ui-store";
import { QuestionJarModal } from "./QuestionJarModal";
import { useQuestionJarEntries } from "@/lib/queries-question-jar-hooks";
import { useIdentity } from "@/lib/identity-utils";

interface QuestionJarProps {
  size: WidgetSize;
  friendId: string;
  friendName: string;
}

export function QuestionJar({ size, friendId, friendName }: QuestionJarProps) {
  const { setOpenModal } = useUIStore();
  const identity = useIdentity();
  const modalId = `questionjar-${friendId}`;

  const { data: entries = [] } = useQuestionJarEntries(friendId);

  const handleClick = () => {
    setOpenModal(modalId);
  };

  // Only support 2x2 size
  if (size !== "2x2") {
    return (
      <Widget size={size}>
        <div className="widget-error-message">Question Jar only supports 2×2 size</div>
      </Widget>
    );
  }

  // Find the most recent unanswered question
  const unansweredQuestion = entries.find((entry) => !entry.answer_text);

  // Determine widget display state
  let displayText = "";
  let showIndicator = false;

  if (unansweredQuestion) {
    if (unansweredQuestion.asked_by !== identity) {
      // Your turn to answer
      displayText = `Q: ${unansweredQuestion.question_text}`;
      showIndicator = true;
    } else {
      // Waiting for other's answer
      displayText = `Waiting for ${unansweredQuestion.asked_by === "admin" ? friendName : "Forest"}'s answer...`;
    }
  } else {
    // Your turn to ask
    displayText = "Your turn to ask!";
    showIndicator = true;
  }

  return (
    <>
      <Widget size={size}>
        <div
          onClick={handleClick}
          className="widget-clickable"
          style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}
        >
          {showIndicator && (
            <div style={{ fontSize: "var(--font-size-lg)", color: "var(--accent)" }}>
              <i className="hn hn-star-solid" style={{ fontSize: "1.5rem" }} />
            </div>
          )}
          <div className="widget-title" style={{ wordBreak: "break-word" }}>
            {displayText}
          </div>
        </div>
      </Widget>
      <QuestionJarModal friendId={friendId} friendName={friendName} />
    </>
  );
}
