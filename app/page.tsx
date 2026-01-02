import React from "react";
import { getAllFriends } from "@/lib/queries";
import { HomeClient } from "./HomeClient";
import { AddFriendNav } from "./admin/friends/AddFriendNav";

export default async function Home() {
  const friends = await getAllFriends();

  return (
    <>
      <AddFriendNav />
      <HomeClient friends={friends} />
    </>
  );
}
