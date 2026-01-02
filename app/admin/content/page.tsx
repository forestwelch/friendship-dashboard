"use client";

import React from "react";
import Link from "next/link";
import { playSound } from "@/lib/sounds";
import { Navigation } from "@/components/Navigation";
import clsx from "clsx";

export default function ContentPage() {
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
        <div
          className="game-container"
          style={{
            paddingTop: "var(--space-3xl)",
            paddingBottom: "var(--space-3xl)",
          }}
        >
          <h1
            className="game-heading-1"
            style={{
              marginBottom: "var(--space-3xl)",
              fontSize: "var(--font-size-3xl)",
            }}
          >
            MANAGE CONTENT
          </h1>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(17.5rem, 1fr))",
              gap: "var(--space-xl)",
              marginBottom: "var(--space-3xl)",
            }}
          >
            {/* Songs Card */}
            <Link
              href="/admin/content/songs"
              className="game-card game-card-hover"
              onClick={() => playSound("click")}
              style={{
                textDecoration: "none",
                padding: "var(--space-2xl)",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "var(--space-lg)",
                borderWidth: "var(--border-width-lg)",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  width: "4rem",
                  height: "4rem",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--primary)",
                  border: "var(--border-width-lg) solid var(--accent)",
                  boxShadow: "var(--game-shadow-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "var(--font-size-xl)",
                  color: "var(--bg)",
                  opacity: 0.9,
                }}
              >
                <i className={clsx("hn", "hn-music-solid")} style={{ fontSize: "2rem" }} />
              </div>
              <span
                className="game-heading-2"
                style={{
                  margin: 0,
                  color: "var(--text)",
                  fontSize: "var(--font-size-xl)",
                }}
              >
                SONGS
              </span>
            </Link>

            {/* Images Card */}
            <Link
              href="/admin/content/images"
              className="game-card game-card-hover"
              onClick={() => playSound("click")}
              style={{
                textDecoration: "none",
                padding: "var(--space-2xl)",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "var(--space-lg)",
                borderWidth: "var(--border-width-lg)",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  width: "4rem",
                  height: "4rem",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--primary)",
                  border: "var(--border-width-lg) solid var(--accent)",
                  boxShadow: "var(--game-shadow-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "var(--font-size-xl)",
                  color: "var(--bg)",
                  opacity: 0.9,
                }}
              >
                <i className={clsx("hn", "hn-image-solid")} style={{ fontSize: "2rem" }} />
              </div>
              <span
                className="game-heading-2"
                style={{
                  margin: 0,
                  color: "var(--text)",
                  fontSize: "var(--font-size-xl)",
                }}
              >
                IMAGES
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
