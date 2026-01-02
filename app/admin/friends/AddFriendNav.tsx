"use client";

import { Navigation } from "@/components/Navigation";
import { playSound } from "@/lib/sounds";

export function AddFriendNav() {
  const handleAddFriend = () => {
    window.dispatchEvent(new CustomEvent("admin-add-friend"));
    playSound("open");
  };

  return <Navigation addFriendAction={{ onClick: handleAddFriend }} />;
}
