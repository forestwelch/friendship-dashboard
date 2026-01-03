"use client";

import React from "react";
import Link from "next/link";
import { Friend } from "@/lib/types";
import { playSound } from "@/lib/sounds";
import "@/styles/friend-card.css";

interface FriendCardProps {
  friend: Friend;
  onMouseEnter?: () => void;
  onDelete?: (friendId: string, friendSlug: string) => void;
}

export function FriendCard({ friend, onMouseEnter, onDelete }: FriendCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onDelete) {
      onDelete(friend.id, friend.slug);
    }
  };

  return (
    <div
      className="game-card friend-card"
      data-friend-primary={friend.color_primary}
      data-friend-secondary={friend.color_secondary}
      data-friend-accent={friend.color_accent}
      data-friend-bg={friend.color_bg}
      data-friend-text={friend.color_text}
      style={
        {
          "--friend-primary": friend.color_primary,
          "--friend-secondary": friend.color_secondary,
          "--friend-accent": friend.color_accent,
          "--friend-bg": friend.color_bg,
          "--friend-text": friend.color_text,
        } as React.CSSProperties
      }
      onMouseEnter={onMouseEnter}
    >
      <span className="game-heading-2 friend-card-title" data-friend-text={friend.color_text}>
        {friend.display_name.toUpperCase()}
      </span>

      {/* VIEW, EDIT, and DELETE buttons */}
      <div className="friend-card-buttons">
        <Link
          href={`/${friend.slug}`}
          className="game-button friend-card-button friend-card-button-view"
          onClick={() => playSound("click")}
          data-friend-primary={friend.color_primary}
          data-friend-accent={friend.color_accent}
          data-friend-text={friend.color_text}
          style={
            {
              "--friend-primary": friend.color_primary,
              "--friend-accent": friend.color_accent,
              "--friend-text": friend.color_text,
            } as React.CSSProperties
          }
        >
          VIEW
        </Link>
        <Link
          href={`/admin/${friend.slug}`}
          className="game-button friend-card-button friend-card-button-edit"
          onClick={() => playSound("click")}
          data-friend-secondary={friend.color_secondary}
          data-friend-accent={friend.color_accent}
          data-friend-text={friend.color_text}
          style={
            {
              "--friend-secondary": friend.color_secondary,
              "--friend-accent": friend.color_accent,
              "--friend-text": friend.color_text,
            } as React.CSSProperties
          }
        >
          EDIT
        </Link>
        <button
          className="game-button friend-card-button friend-card-button-delete"
          onClick={handleDelete}
          data-friend-accent={friend.color_accent}
          data-friend-text={friend.color_text}
          style={
            {
              "--friend-accent": friend.color_accent,
              "--friend-text": friend.color_text,
            } as React.CSSProperties
          }
          title="Delete friend"
        >
          <i className="hn hn-trash-alt-solid" />
        </button>
      </div>
    </div>
  );
}
