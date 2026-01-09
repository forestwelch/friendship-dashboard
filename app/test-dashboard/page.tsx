"use client";

import React from "react";
import { FriendPageClient } from "@/app/[friend]/FriendPageClient";
import {
  testDashboardFriend,
  testDashboardSongs,
  testDashboardWidgets,
} from "@/lib/test-dashboard-data";

export default function TestDashboardPage() {
  return (
    <FriendPageClient
      friend={testDashboardFriend}
      initialWidgets={testDashboardWidgets}
      songs={testDashboardSongs}
      pixelArtMap={new Map()}
      pixelArtBySize={new Map()}
    />
  );
}
