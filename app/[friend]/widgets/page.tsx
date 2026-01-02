"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { WidgetSize } from "@/lib/types";
import { WidgetLibrary } from "@/components/admin/WidgetLibrary";
import { playSound } from "@/lib/sounds";
import { Navigation } from "@/components/Navigation";

export default function WidgetLibraryPage() {
  const router = useRouter();
  const params = useParams();
  const friend = params?.friend as string;

  const handleSelectWidget = (type: string, size: WidgetSize) => {
    // Navigate back with widget selection
    playSound("select");
    router.push(`/${friend}?addWidget=${type}&size=${size}`);
  };

  return (
    <>
      <Navigation />
      <div
        style={{
          paddingTop: "2.25rem",
          width: "100vw",
          minHeight: "100vh",
          background: "var(--bg)",
          color: "var(--text)",
        }}
      >
        <div className="game-container" style={{ padding: "var(--space-xl)" }}>
          <div className="game-breadcrumb" style={{ marginBottom: "var(--space-lg)" }}>
            <button
              onClick={() => {
                playSound("close");
                router.back();
              }}
              className="game-link"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              ← Back
            </button>
            <span className="game-breadcrumb-separator">/</span>
            <span className="game-breadcrumb-current">Widget Library</span>
          </div>
          <h1 className="game-heading-1" style={{ marginBottom: "var(--space-xl)" }}>
            WIDGET LIBRARY
          </h1>
          <WidgetLibrary onSelectWidget={handleSelectWidget} />
        </div>
      </div>
    </>
  );
}
