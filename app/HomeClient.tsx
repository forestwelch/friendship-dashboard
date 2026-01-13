"use client";

import React, { useEffect, useState } from "react";
import { Friend } from "@/lib/types";
import { useThemeContext } from "@/lib/contexts/theme-context";
import { FriendCard } from "@/components/FriendCard";
import { playSound } from "@/lib/sounds";
import styles from "./HomeClient.module.css";

interface HomeClientProps {
  friends: Friend[];
}

export function HomeClient({ friends: initialFriends }: HomeClientProps) {
  const { preloadAllThemes, prefetchTheme } = useThemeContext();
  const [friends, setFriends] = useState<Friend[]>(initialFriends);

  // Preload all friend themes on mount for instant switching
  useEffect(() => {
    const friendSlugs = friends.map((f) => f.slug);
    preloadAllThemes(friendSlugs);
  }, [friends, preloadAllThemes]);

  const handleDeleteFriend = async (friendId: string, friendSlug: string) => {
    // Find the friend to restore if deletion fails
    const friendToRestore = friends.find((f) => f.id === friendId);

    // Optimistic update - remove immediately from UI
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    playSound("delete");

    try {
      const response = await fetch(`/api/friends/${friendSlug}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete friend");
      }

      playSound("success");
    } catch (error) {
      playSound("error");
      console.error("Error deleting friend:", error);
      // Restore friend if API call failed
      if (friendToRestore) {
        setFriends((prev) =>
          [...prev, friendToRestore].sort((a, b) => a.display_name.localeCompare(b.display_name))
        );
      }
    }
  };

  const handleDeleteAll = async () => {
    // Optimistic update - clear immediately from UI
    const previousFriends = [...friends];
    setFriends([]);
    playSound("delete");

    try {
      const response = await fetch("/api/friends", {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete all friends");
      }

      playSound("success");
    } catch (error) {
      playSound("error");
      console.error("Error deleting all friends:", error);
      // Restore friends if API call failed
      setFriends(previousFriends);
    }
  };

  return (
    <div className={`admin-page ${styles.pageContainer}`}>
      <div className={`game-container ${styles.contentContainer}`}>
        <div className={styles.header}>
          <h1 className={`game-heading-1 ${styles.title}`}>FRIENDSHIP DASHBOARD</h1>
          {friends.length > 0 && (
            <button className={`game-button ${styles.deleteAllButton}`} onClick={handleDeleteAll}>
              <i className="hn hn-trash-alt-solid" />
              DELETE ALL
            </button>
          )}
        </div>
        <div className={styles.friendsGrid}>
          {friends.map((friend) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              onMouseEnter={() => prefetchTheme(friend.slug)}
              onDelete={handleDeleteFriend}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
