import React from "react";
import { Navigation } from "@/components/shared";
import { FriendManager } from "@/components/admin/tools/FriendManager";

export default async function AdminFriendsPage() {
  return (
    <>
      <Navigation
        addFriendAction={{
          href: "/admin/friends/add",
        }}
      />
      <FriendManager />
    </>
  );
}
