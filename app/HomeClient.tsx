"use client";

import React, { useEffect, useState } from "react";
import { Friend } from "@/lib/types";
import { useThemeContext } from "@/lib/theme-context";
import { FriendCard } from "@/components/FriendCard";
import { AddFriendModal } from "@/components/admin/AddFriendModal";
import { useUIStore } from "@/lib/store/ui-store";

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
              onMouseEnter={() => prefetchTheme(friend.slug)}
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
