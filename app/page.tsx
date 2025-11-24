import React from "react";
import { getAllFriends } from "@/lib/queries";
import { Navigation } from "@/components/Navigation";
import { HomeClient } from "./HomeClient";

export default async function Home() {
  const friends = await getAllFriends();

  return (
    <>
      <Navigation themeColors={undefined} />
      <HomeClient friends={friends} />
    </>
  );
}
