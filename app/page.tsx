import React from "react";
import { getAllFriends } from "@/lib/queries";
import { HomeClient } from "./HomeClient";

export default async function Home() {
  const friends = await getAllFriends();

  return <HomeClient friends={friends} />;
}
