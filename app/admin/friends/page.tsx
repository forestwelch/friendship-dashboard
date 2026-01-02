import React from "react";
import { Navigation } from "@/components/Navigation";
import { FriendManager } from "@/components/admin/FriendManager";

export default async function AdminFriendsPage() {
  return (
    <>
      <Navigation />
      <FriendManager />
    </>
  );
}
