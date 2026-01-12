"use client";

import React, { useState, useEffect } from "react";
import { playSound } from "@/lib/sounds";
import Link from "next/link";
import { getInboxItems, updateInboxItemStatus } from "@/lib/queries";
import { formatDateCompact } from "@/lib/date-utils";
import clsx from "clsx";
import styles from "./InboxManager.module.css";

interface InboxItem {
  id: string;
  type: "recommendation" | "hangout_proposal";
  friend_id: string;
  friend_name: string;
  data: Record<string, unknown>;
  created_at: string;
  status: "pending" | "approved" | "rejected";
}

export function InboxManager() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const data = await getInboxItems(filter);
      setItems(data as unknown as InboxItem[]);
      setLoading(false);
    };
    fetchItems();
  }, [filter]);

  const handleApprove = async (itemId: string) => {
    const success = await updateInboxItemStatus(itemId, "approved");
    if (success) {
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, status: "approved" as const } : item))
      );
      playSound("success");
    } else {
      playSound("error");
    }
  };

  const handleReject = async (itemId: string) => {
    const success = await updateInboxItemStatus(itemId, "rejected");
    if (success) {
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, status: "rejected" as const } : item))
      );
      playSound("click");
    } else {
      playSound("error");
    }
  };

  return (
    <div className={`game-container ${styles.container}`}>
      <div className={clsx("game-breadcrumb", styles.breadcrumb)}>
        <Link href="/admin" className="game-link">
          Admin
        </Link>
        <span className="game-breadcrumb-separator">/</span>
        <span className="game-breadcrumb-current">Inbox</span>
      </div>
      <h1 className={clsx("game-heading-1", styles.title)}>Admin Inbox</h1>
      <p className={clsx("game-text-muted", styles.description)}>
        Review recommendations and hangout proposals from friends
      </p>

      {/* Filter buttons */}
      <div className={clsx("game-flex", "game-flex-gap-sm", styles.filters)}>
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            className={clsx("game-button", filter === f && "game-button-primary")}
            onClick={() => {
              setFilter(f);
              playSound("click");
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Items list */}
      {loading ? (
        <div className={clsx("game-card", styles.emptyState)}>Loading...</div>
      ) : items.length === 0 ? (
        <div className={clsx("game-card", styles.emptyState)}>
          <p className="game-text-muted">No {filter === "all" ? "" : filter} items</p>
        </div>
      ) : (
        <div className={styles.itemsList}>
          {items.map((item) => (
            <div key={item.id} className={clsx("game-card", styles.itemCard)}>
              <div className={styles.itemContent}>
                <div className={styles.fromText}>From: {item.friend_name}</div>
                <div className={styles.typeText}>Type: {item.type.replace("_", " ")}</div>
                {item.type === "recommendation" && (
                  <div>
                    <div className={styles.titleText}>{String(item.data.title || "")}</div>
                    <div className={styles.subtitleText}>{String(item.data.type || "")}</div>
                    {item.data.description != null && (
                      <div className={styles.descriptionText}>{String(item.data.description)}</div>
                    )}
                  </div>
                )}
                {item.type === "hangout_proposal" && (
                  <div>
                    <div className={`game-heading-3 ${styles.hangoutTitle}`}>Proposed Hangout</div>
                    <div className={`game-text-muted ${styles.hangoutDate}`}>
                      {item.data.date != null && (
                        <>
                          {formatDateCompact(String(item.data.date))}{" "}
                          {item.data.time != null && `at ${String(item.data.time)}`}
                        </>
                      )}
                    </div>
                    {item.data.message != null && (
                      <div className={`game-text-muted ${styles.hangoutMessage}`}>
                        {String(item.data.message)}
                      </div>
                    )}
                  </div>
                )}
                <div className={`game-text-muted ${styles.dateText}`}>
                  {formatDateCompact(item.created_at)}
                </div>
              </div>
              {item.status === "pending" && (
                <div className="game-flex game-flex-gap-sm">
                  <button
                    className={`game-button game-button-success ${styles.actionButton}`}
                    onClick={() => handleApprove(item.id)}
                  >
                    <i className={`hn hn-check-solid ${styles.actionIcon}`} /> Approve
                  </button>
                  <button
                    className={`game-button game-button-danger ${styles.actionButton}`}
                    onClick={() => handleReject(item.id)}
                  >
                    <i className={`hn hn-times-solid ${styles.actionIcon}`} /> Reject
                  </button>
                </div>
              )}
              {item.status !== "pending" && (
                <div
                  className={`${styles.statusBadge} ${
                    item.status === "approved"
                      ? styles.statusBadgeApproved
                      : styles.statusBadgeRejected
                  }`}
                >
                  {item.status === "approved" ? (
                    <>
                      <i className={`hn hn-check-solid ${styles.actionIcon}`} /> Approved
                    </>
                  ) : (
                    <>
                      <i className={`hn hn-times-solid ${styles.actionIcon}`} /> Rejected
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
