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

  // Support 2x1, 3x1, and 4x1 sizes (horizontal layouts)
  const [cols, rows] = size.split("x").map(Number);
  const isValidSize = rows === 1 && cols >= 2 && cols <= 4;

  if (!isValidSize) {
    return (
      <Widget size={size}>
        <div className="widget-error-message">Absurd Reviews supports 2×1, 3×1, and 4×1 sizes</div>
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
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: "var(--space-sm)",
            gap: "var(--space-xs)",
          }}
        >
          <div
            className="widget-title"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              width: "100%",
            }}
          >
            {topic.topic_name}
          </div>
          <div
            className="widget-content"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              justifyContent: "center",
              flex: 1,
              minHeight: 0,
            }}
          >
            {isRevealed && myReview && otherReview ? (
              <>
                {myReview.stars} <i className="hn hn-star-solid" style={{ fontSize: "0.7rem" }} />{" "}
                vs {otherReview.stars}{" "}
                <i className="hn hn-star-solid" style={{ fontSize: "0.7rem" }} />
              </>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {displayText}
              </div>
            )}
          </div>
          {myReview && !otherReview && (
            <div
              className="widget-badge"
              style={{
                fontSize: "var(--font-size-xs)",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-xs)",
              }}
            >
              <i className="hn hn-check-solid" />
              <span>Your review ready</span>
            </div>
          )}
        </div>
      </Widget>
      <AbsurdReviewsModal friendId={friendId} friendName={friendName} />
    </>
  );
}
