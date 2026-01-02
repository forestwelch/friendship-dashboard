"use client";

import React from "react";
import Link from "next/link";
import { Friend } from "@/lib/types";

interface FriendCardProps {
  friend: Friend;
  href: string;
  onMouseEnter?: () => void;
}

export function FriendCard({ friend, href, onMouseEnter }: FriendCardProps) {
  return (
    <Link
      href={href}
      className="game-card game-card-hover"
      style={{
        textDecoration: "none",
        padding: "var(--space-2xl)",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-lg)",
        borderColor: friend.color_accent,
        background: friend.color_bg,
        borderWidth: "var(--border-width-lg)",
        transition: "all 0.2s ease",
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
      <div
        style={{
          width: "4rem",
          height: "4rem",
          borderRadius: "var(--radius-sm)",
          background: friend.color_primary,
          border: `var(--border-width-lg) solid ${friend.color_accent}`,
          boxShadow: "var(--game-shadow-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "var(--font-size-xl)",
          color: friend.color_text,
          opacity: 0.9,
        }}
      >
        {friend.display_name.charAt(0).toUpperCase()}
      </div>
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
    </Link>
  );
}
