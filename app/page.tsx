import React from "react";
import Link from "next/link";
import { getAllFriends } from "@/lib/queries";
import { Navigation } from "@/components/Navigation";

export default async function Home() {
  const friends = await getAllFriends();

  return (
    <>
      <Navigation themeColors={undefined} />
      <div
        className="admin-page"
        style={{
          paddingTop: `calc(var(--height-button) + var(--space-md))`,
          width: "100vw",
          minHeight: "100vh",
          background: "var(--admin-bg)",
          color: "var(--admin-text)",
        }}
      >
        <div className="game-container" style={{ paddingTop: "var(--space-3xl)", paddingBottom: "var(--space-3xl)" }}>
          <h1 className="game-heading-1" style={{ marginBottom: "var(--space-3xl)", fontSize: "var(--font-size-3xl)" }}>
            FRIENDSHIP DASHBOARD
          </h1>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(17.5rem, 1fr))",
              gap: "var(--space-xl)",
              marginBottom: "var(--space-3xl)",
            }}
          >
            {friends.map((friend) => (
              <Link
                key={friend.id}
                href={`/${friend.slug}`}
                className="game-card game-card-hover"
                style={{
                  textDecoration: "none",
                  padding: "var(--space-2xl)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "var(--space-lg)",
                  borderColor: "var(--admin-accent)",
                  background: "var(--admin-surface)",
                  borderWidth: "var(--border-width-lg)",
                }}
              >
                <div
                  style={{
                    width: "4rem",
                    height: "4rem",
                    borderRadius: "var(--radius-sm)",
                    background: friend.color_primary || "var(--game-accent-blue)",
                    border: `var(--border-width-lg) solid var(--admin-accent)`,
                    boxShadow: "var(--game-shadow-md)",
                  }}
                />
                <span className="game-heading-2" style={{ margin: 0, color: "var(--admin-text)", fontSize: "var(--font-size-xl)" }}>
                  {friend.display_name.toUpperCase()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
