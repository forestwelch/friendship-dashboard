"use client";

import React from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";
import { useUIStore } from "@/lib/store/ui-store";
import { AbsurdReviewsModal } from "./AbsurdReviewsModal";
import { useCurrentTopic, useReviewsForTopic } from "@/lib/queries-reviews-hooks";
import { useIdentity } from "@/lib/identity-utils";

interface AbsurdReviewsProps {
  size: WidgetSize;
  friendId: string;
  friendName: string;
}

export function AbsurdReviews({ size, friendId, friendName }: AbsurdReviewsProps) {
  const { setOpenModal } = useUIStore();
  const identity = useIdentity();
  const modalId = `absurdreviews-${friendId}`;

  const { data: topic } = useCurrentTopic(friendId);
  const { data: reviews = [] } = useReviewsForTopic(topic?.id || null);

  const handleClick = () => {
    setOpenModal(modalId);
  };

  // Only support 2x2 size
  if (size !== "2x2") {
    return (
      <Widget size={size}>
        <div className="widget-error-message">Absurd Reviews only supports 2×2 size</div>
      </Widget>
    );
  }

  if (!topic) {
    return (
      <>
        <Widget size={size}>
          <div onClick={handleClick} className="widget-empty-state">
            No topic set. Click to set one!
          </div>
        </Widget>
        <AbsurdReviewsModal friendId={friendId} friendName={friendName} />
      </>
    );
  }

  const myReview = reviews.find((r) => r.reviewer === identity);
  const otherReview = reviews.find((r) => r.reviewer !== identity);
  const isRevealed = topic.status === "revealed";

  let displayText = "";

  if (!myReview) {
    displayText = `Awaiting your review...`;
  } else if (!otherReview) {
    displayText = `Awaiting ${identity === "admin" ? friendName : "Forest"}'s review...`;
  } else if (!isRevealed) {
    displayText = "Reviews ready! Click to reveal";
  } else {
    displayText = `${myReview.stars} vs ${otherReview.stars}`;
  }

  return (
    <>
      <Widget size={size}>
        <div
          onClick={handleClick}
          className="widget-clickable"
          style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}
        >
          <div className="widget-title">{topic.topic_name}</div>
          <div
            className="widget-content"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              justifyContent: "center",
            }}
          >
            {isRevealed && myReview && otherReview ? (
              <>
                {myReview.stars} <i className="hn hn-star-solid" style={{ fontSize: "0.7rem" }} />{" "}
                vs {otherReview.stars}{" "}
                <i className="hn hn-star-solid" style={{ fontSize: "0.7rem" }} />
              </>
            ) : (
              displayText
            )}
          </div>
          {myReview && !otherReview && (
            <div className="widget-badge">
              <i className="hn hn-check-solid" />
            </div>
          )}
        </div>
      </Widget>
      <AbsurdReviewsModal friendId={friendId} friendName={friendName} />
    </>
  );
}
