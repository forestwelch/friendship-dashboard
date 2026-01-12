"use client";

import React, { useEffect, useState } from "react";
import { Friend } from "@/lib/types";
import { useThemeContext } from "@/lib/theme-context";
import { FriendCard } from "@/components/FriendCard";
import { AddFriendModal } from "@/components/admin/AddFriendModal";
import { useUIStore } from "@/lib/store/ui-store";
import { playSound } from "@/lib/sounds";
import styles from "./HomeClient.module.css";

interface HomeClientProps {
  friends: Friend[];
}

export function HomeClient({ friends: initialFriends }: HomeClientProps) {
  const { preloadAllThemes, prefetchTheme } = useThemeContext();
  const { setOpenModal } = useUIStore();
  const [friends, setFriends] = useState<Friend[]>(initialFriends);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  // Preload all friend themes on mount for instant switching
  useEffect(() => {
    const friendSlugs = friends.map((f) => f.slug);
    preloadAllThemes(friendSlugs);
  }, [friends, preloadAllThemes]);

  // Listen for add friend event from navigation
  useEffect(() => {
    const handleAddFriend = () => {
      setShowAddFriendModal(true);
      setOpenModal("add-friend-modal");
    };

    window.addEventListener("admin-add-friend", handleAddFriend);
    return () => {
      window.removeEventListener("admin-add-friend", handleAddFriend);
    };
  }, [setOpenModal]);

  const handleFriendAdded = async () => {
    // Refresh friends list
    try {
      const response = await fetch("/api/friends");
      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error("Failed to refresh friends:", error);
    }
  };

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

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => {
          setShowAddFriendModal(false);
          setOpenModal(null);
        }}
        onFriendAdded={handleFriendAdded}
      />
    </div>
  );
}
