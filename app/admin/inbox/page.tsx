import React from "react";
import { Navigation } from "@/components/shared";
import { InboxManager } from "@/components/admin/InboxManager";
import styles from "./page.module.css";

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
