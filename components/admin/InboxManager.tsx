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
    <div
      className="game-container"
      style={{
        paddingTop: "var(--space-2xl)",
        paddingBottom: "var(--space-2xl)",
      }}
    >
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
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                  }}
                >
                  From: {item.friend_name}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    opacity: 0.8,
                    marginBottom: "8px",
                    textTransform: "capitalize",
                  }}
                >
                  Type: {item.type.replace("_", " ")}
                </div>
                {item.type === "recommendation" && (
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                      {String(item.data.title || "")}
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>
                      {String(item.data.type || "")}
                    </div>
                    {item.data.description != null && (
                      <div
                        style={{
                          fontSize: "12px",
                          marginTop: "4px",
                          opacity: 0.7,
                        }}
                      >
                        {String(item.data.description)}
                      </div>
                    )}
                  </div>
                )}
                {item.type === "hangout_proposal" && (
                  <div>
                    <div className="game-heading-3" style={{ marginBottom: "var(--space-xs)" }}>
                      Proposed Hangout
                    </div>
                    <div className="game-text-muted" style={{ marginBottom: "var(--space-xs)" }}>
                      {item.data.date != null && (
                        <>
                          {formatDateCompact(String(item.data.date))}{" "}
                          {item.data.time != null && `at ${String(item.data.time)}`}
                        </>
                      )}
                    </div>
                    {item.data.message != null && (
                      <div className="game-text-muted" style={{ marginTop: "var(--space-xs)" }}>
                        {String(item.data.message)}
                      </div>
                    )}
                  </div>
                )}
                <div
                  className="game-text-muted"
                  style={{ fontSize: "10px", marginTop: "var(--space-sm)" }}
                >
                  {formatDateCompact(item.created_at)}
                </div>
              </div>
              {item.status === "pending" && (
                <div className="game-flex game-flex-gap-sm">
                  <button
                    className="game-button game-button-success"
                    onClick={() => handleApprove(item.id)}
                    style={{ fontSize: "11px" }}
                  >
                    <i className="hn hn-check-solid" style={{ marginRight: "var(--space-xs)" }} />{" "}
                    Approve
                  </button>
                  <button
                    className="game-button game-button-danger"
                    onClick={() => handleReject(item.id)}
                    style={{ fontSize: "11px" }}
                  >
                    <i className="hn hn-times-solid" style={{ marginRight: "var(--space-xs)" }} />{" "}
                    Reject
                  </button>
                </div>
              )}
              {item.status !== "pending" && (
                <div
                  className="game-button"
                  style={{
                    fontSize: "11px",
                    background:
                      item.status === "approved"
                        ? "var(--game-accent-green)"
                        : "var(--game-surface)",
                    color: item.status === "approved" ? "var(--bg)" : "var(--text)",
                    cursor: "default",
                  }}
                >
                  {item.status === "approved" ? (
                    <>
                      <i className="hn hn-check-solid" style={{ marginRight: "var(--space-xs)" }} />{" "}
                      Approved
                    </>
                  ) : (
                    <>
                      <i className="hn hn-times-solid" style={{ marginRight: "var(--space-xs)" }} />{" "}
                      Rejected
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
