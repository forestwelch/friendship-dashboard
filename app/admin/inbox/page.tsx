import React from "react";
import { Navigation } from "@/components/shared";
import { InboxManager } from "@/components/admin/InboxManager";

export default function AdminInboxPage() {
  return (
    <>
      <Navigation />
      <div className={`admin-page ${styles.pageContainer}`}>
        <InboxManager />
      </div>
    </>
  );
}
