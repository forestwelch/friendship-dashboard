"use client";

import React, { useState, useEffect } from "react";
import { playSound } from "@/lib/sounds";
import Link from "next/link";
import { getInboxItems, updateInboxItemStatus } from "@/lib/queries";

interface InboxItem {
  id: string;
  type: "recommendation" | "hangout_proposal";
  friend_id: string;
  friend_name: string;
  data: any;
  created_at: string;
  status: "pending" | "approved" | "rejected";
}

export function InboxManager() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const data = await getInboxItems(filter);
      setItems(data);
      setLoading(false);
    };
    fetchItems();
  }, [filter]);

  const handleApprove = async (itemId: string) => {
    const success = await updateInboxItemStatus(itemId, "approved");
    if (success) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status: "approved" as const } : item
        )
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
        prev.map((item) =>
          item.id === itemId ? { ...item, status: "rejected" as const } : item
        )
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
      <div
        className="game-breadcrumb"
        style={{ marginBottom: "var(--space-xl)" }}
      >
        <Link href="/admin" className="game-link">
          Admin
        </Link>
        <span className="game-breadcrumb-separator">/</span>
        <span className="game-breadcrumb-current">Inbox</span>
      </div>
      <h1
        className="game-heading-1"
        style={{ marginBottom: "var(--space-md)" }}
      >
        Admin Inbox
      </h1>
      <p
        className="game-text-muted"
        style={{ marginBottom: "var(--space-xl)" }}
      >
        Review recommendations and hangout proposals from friends
      </p>

      {/* Filter buttons */}
      <div
        className="game-flex game-flex-gap-sm"
        style={{ marginBottom: "var(--space-xl)", flexWrap: "wrap" }}
      >
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            className={`game-button ${
              filter === f ? "game-button-primary" : ""
            }`}
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
        <div
          className="game-card"
          style={{ padding: "var(--space-2xl)", textAlign: "center" }}
        >
          Loading...
        </div>
      ) : items.length === 0 ? (
        <div
          className="game-card"
          style={{ padding: "var(--space-2xl)", textAlign: "center" }}
        >
          <p className="game-text-muted">
            No {filter === "all" ? "" : filter} items
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="game-card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "var(--space-lg)",
              }}
            >
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
                      {item.data.title}
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>
                      {item.data.type}
                    </div>
                    {item.data.description && (
                      <div
                        style={{
                          fontSize: "12px",
                          marginTop: "4px",
                          opacity: 0.7,
                        }}
                      >
                        {item.data.description}
                      </div>
                    )}
                  </div>
                )}
                {item.type === "hangout_proposal" && (
                  <div>
                    <div
                      className="game-heading-3"
                      style={{ marginBottom: "var(--space-xs)" }}
                    >
                      Proposed Hangout
                    </div>
                    <div
                      className="game-text-muted"
                      style={{ marginBottom: "var(--space-xs)" }}
                    >
                      {new Date(item.data.date).toLocaleDateString()} at{" "}
                      {item.data.time}
                    </div>
                    {item.data.message && (
                      <div
                        className="game-text-muted"
                        style={{ marginTop: "var(--space-xs)" }}
                      >
                        {item.data.message}
                      </div>
                    )}
                  </div>
                )}
                <div
                  className="game-text-muted"
                  style={{ fontSize: "10px", marginTop: "var(--space-sm)" }}
                >
                  {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
              {item.status === "pending" && (
                <div className="game-flex game-flex-gap-sm">
                  <button
                    className="game-button game-button-success"
                    onClick={() => handleApprove(item.id)}
                    style={{ fontSize: "11px" }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="game-button game-button-danger"
                    onClick={() => handleReject(item.id)}
                    style={{ fontSize: "11px" }}
                  >
                    × Reject
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
                    color:
                      item.status === "approved"
                        ? "var(--bg)"
                        : "var(--text)",
                    cursor: "default",
                  }}
                >
                  {item.status === "approved" ? "✓ Approved" : "× Rejected"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
