"use client";

import React from "react";
import Link from "next/link";
import { Friend } from "@/lib/types";
import { playSound } from "@/lib/sounds";

interface FriendCardProps {
  friend: Friend;
  onMouseEnter?: () => void;
}

export function FriendCard({ friend, onMouseEnter }: FriendCardProps) {
  return (
    <div
      className="game-card"
      style={{
        padding: "var(--space-2xl)",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-lg)",
        borderColor: friend.color_accent,
        background: friend.color_bg,
        borderWidth: "var(--border-width-lg)",
        /* Transition removed for performance */
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = friend.color_primary;
        e.currentTarget.style.background = friend.color_secondary;
        onMouseEnter?.();
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = friend.color_accent;
        e.currentTarget.style.background = friend.color_bg;
      }}
    >
      <span
        className="game-heading-2"
        style={{
          margin: 0,
          color: friend.color_text,
          fontSize: "var(--font-size-xl)",
        }}
      >
        {friend.display_name.toUpperCase()}
      </span>

      {/* VIEW and EDIT buttons */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-md)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Link
          href={`/${friend.slug}`}
          className="game-button"
          onClick={() => playSound("click")}
          style={{
            padding: "var(--space-sm) var(--space-lg)",
            background: friend.color_primary,
            borderColor: friend.color_accent,
            color: friend.color_text,
            textDecoration: "none",
            fontSize: "var(--font-size-sm)",
            fontWeight: "bold",
          }}
        >
          VIEW
        </Link>
        <Link
          href={`/admin/${friend.slug}`}
          className="game-button"
          onClick={() => playSound("click")}
          style={{
            padding: "var(--space-sm) var(--space-lg)",
            background: friend.color_secondary,
            borderColor: friend.color_accent,
            color: friend.color_text,
            textDecoration: "none",
            fontSize: "var(--font-size-sm)",
            fontWeight: "bold",
          }}
        >
          EDIT
        </Link>
      </div>
    </div>
  );
}
