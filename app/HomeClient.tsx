"use client";

import React, { useEffect } from "react";
import { Friend } from "@/lib/types";
import { useThemeContext } from "@/lib/theme-context";
import { FriendCard } from "@/components/FriendCard";

interface HomeClientProps {
  friends: Friend[];
}

export function HomeClient({ friends }: HomeClientProps) {
  const { preloadAllThemes, prefetchTheme } = useThemeContext();

  // Preload all friend themes on mount for instant switching
  useEffect(() => {
    const friendSlugs = friends.map((f) => f.slug);
    preloadAllThemes(friendSlugs);
  }, [friends, preloadAllThemes]);

  return (
    <div
      className="admin-page"
      style={{
        paddingTop: `calc(var(--height-button) + var(--space-md))`,
        width: "100%",
        maxWidth: "100%",
        minHeight: "100vh",
        background: "var(--admin-bg)",
        color: "var(--admin-text)",
        overflowX: "hidden",
      }}
    >
      <div
        className="game-container"
        style={{
          paddingTop: "var(--space-3xl)",
          paddingBottom: "var(--space-3xl)",
        }}
      >
        <h1
          className="game-heading-1"
          style={{
            marginBottom: "var(--space-3xl)",
            fontSize: "var(--font-size-3xl)",
          }}
        >
          FRIENDSHIP DASHBOARD
        </h1>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(17.5rem, 1fr))",
            gap: "var(--space-xl)",
            marginBottom: "var(--space-3xl)",
          }}
        >
          {friends.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              href={`/${friend.slug}`}
              onMouseEnter={() => prefetchTheme(friend.slug)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
