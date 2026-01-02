import React from "react";
import { FriendManager } from "@/components/admin/FriendManager";
import { AddFriendNav } from "./AddFriendNav";

export default async function AdminFriendsPage() {
  return (
    <>
      <AddFriendNav />
      <FriendManager />
    </>
  );
}
