"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="theme-daniel" style={{ width: "100vw", height: "100vh" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          background: "var(--bg)",
          color: "var(--text)",
        }}
      >
        <h1 style={{ fontSize: "32px", marginBottom: "16px" }}>Friendship Dashboard</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Link
            href="/daniel"
            className="widget-button"
            style={{
              padding: "16px 32px",
              textDecoration: "none",
              fontSize: "24px",
              textAlign: "center",
            }}
          >
            Daniel
          </Link>
          <Link
            href="/max"
            className="widget-button"
            style={{
              padding: "16px 32px",
              textDecoration: "none",
              fontSize: "24px",
              textAlign: "center",
            }}
          >
            Max
          </Link>
          <Link
            href="/violet"
            className="widget-button"
            style={{
              padding: "16px 32px",
              textDecoration: "none",
              fontSize: "24px",
              textAlign: "center",
            }}
          >
            Violet
          </Link>
          <Link
            href="/gameboy"
            className="widget-button"
            style={{
              padding: "16px 32px",
              textDecoration: "none",
              fontSize: "24px",
              textAlign: "center",
            }}
          >
            Gameboy
          </Link>
        </div>
      </div>
    </div>
  );
}
