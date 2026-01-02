import React from "react";
import { Navigation } from "@/components/Navigation";
import { InboxManager } from "@/components/admin/InboxManager";

export default function AdminInboxPage() {
  return (
    <>
      <Navigation />
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
        <InboxManager />
      </div>
    </>
  );
}
