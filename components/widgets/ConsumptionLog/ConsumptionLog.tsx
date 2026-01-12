"use client";

import React from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";
import { useUIStore } from "@/lib/store/ui-store";
import { ConsumptionLogModal } from "./ConsumptionLogModal";
import { useConsumptionEntries } from "./queries";
import { useIdentity } from "@/lib/identity-utils";

interface ConsumptionLogProps {
  size: WidgetSize;
  friendId: string;
  friendName: string;
}

export function ConsumptionLog({ size, friendId, friendName }: ConsumptionLogProps) {
  const { setOpenModal } = useUIStore();
  const identity = useIdentity();
  const { data: entries = [] } = useConsumptionEntries(friendId);

  // Count unread entries
  const unreadCount = entries.filter((entry) => {
    if (identity === "admin") {
      return !entry.read_by_admin;
    } else {
      return !entry.read_by_friend;
    }
  }).length;

  const handleClick = () => {
    setOpenModal(`consumption-${friendId}`);
  };

  // Only support 3x1 size
  if (size !== "3x1") {
    return (
      <Widget size={size}>
        <div className="widget-error-message">Consumption Log only supports 3×1 size</div>
      </Widget>
    );
  }

  const mostRecent = entries[0];
  const displayTitle = mostRecent?.title || "No entries yet";
  const displayThought = mostRecent?.thought || "Click to add your first entry";

  // Format unread count badge
  const badgeText = unreadCount > 0 && displayTitle ? `check out: ${displayTitle}` : null;

  return (
    <>
      <Widget size={size}>
        <div
          onClick={handleClick}
          className="widget-clickable"
          style={
            unreadCount > 0 && badgeText
              ? {
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                  padding: "var(--space-sm)",
                }
              : undefined
          }
        >
          {unreadCount > 0 && badgeText && (
            <div
              style={{
                wordBreak: "break-word",
                textAlign: "center",
                fontSize: "var(--font-size-xs)",
                lineHeight: 1.4,
                color: "var(--text)",
                fontWeight: "bold",
              }}
            >
              {badgeText}
            </div>
          )}
          {unreadCount === 0 && (
            <>
              <div className="widget-title">{displayTitle}</div>
              <div className="widget-content">{displayThought}</div>
            </>
          )}
        </div>
      </Widget>
      <ConsumptionLogModal friendId={friendId} friendName={friendName} />
    </>
  );
}
