"use client";

import React from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";
import { useUIStore } from "@/lib/store/ui-store";
import { AbsurdReviewsModal } from "./AbsurdReviewsModal";
import { useCurrentTopic, useReviewsForTopic } from "./queries";
import { useIdentity } from "@/lib/identity-utils";
import styles from "./AbsurdReviews.module.css";

interface AbsurdReviewsProps {
  size: WidgetSize;
  friendId: string;
  friendName: string;
}

export function AbsurdReviews({ size, friendId, friendName }: AbsurdReviewsProps) {
  const { setOpenModal } = useUIStore();
  const identity = useIdentity();
  const modalId = `anthropocenereviewed-${friendId}`;

  const { data: topic } = useCurrentTopic(friendId);
  const { data: reviews = [] } = useReviewsForTopic(topic?.id || null);

  const handleClick = () => {
    setOpenModal(modalId);
  };

  // Support 2x1, 3x1, and 4x1 sizes (horizontal layouts)
  const [cols, rows] = size.split("x").map(Number);
  const isValidSize = rows === 1 && cols >= 2 && cols <= 4;

  if (!isValidSize) {
    return (
      <Widget size={size}>
        <div className="widget-error-message">
          Anthropocene Reviewed supports 2×1, 3×1, and 4×1 sizes
        </div>
      </Widget>
    );
  }

  const myReview = reviews.find((r) => r.reviewer === identity);
  const otherReview = reviews.find((r) => r.reviewer !== identity);
  const hasBothReviews = myReview && otherReview;
  const otherPersonName = identity === "admin" ? friendName : "Forest";

  // Determine display text based on three states
  let displayText = "";
  if (!topic) {
    displayText = "Waiting for topic...";
  } else if (hasBothReviews) {
    displayText = `View ${otherPersonName}'s review`;
  } else {
    displayText = `rate: ${topic.topic_name}`;
  }

  return (
    <>
      <Widget size={size}>
        <div onClick={handleClick} className={`widget-clickable ${styles.widgetClickableColumn}`}>
          <div className={styles.displayText}>{displayText}</div>
        </div>
      </Widget>
      <AbsurdReviewsModal friendId={friendId} friendName={friendName} />
    </>
  );
}
