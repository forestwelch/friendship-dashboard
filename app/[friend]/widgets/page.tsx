"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { WidgetSize } from "@/lib/types";
import { WidgetLibrary } from "@/components/admin/WidgetLibrary";
import { playSound } from "@/lib/sounds";
import { Navigation } from "@/components/shared";

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
      <div className={styles.pageContainer}>
        <div className={`game-container ${styles.contentContainer}`}>
          <div className={`game-breadcrumb ${styles.breadcrumb}`}>
            <button
              onClick={() => {
                playSound("close");
                router.back();
              }}
              className={`game-link ${styles.backButton}`}
            >
              ← Back
            </button>
            <span className="game-breadcrumb-separator">/</span>
            <span className="game-breadcrumb-current">Widget Library</span>
          </div>
          <h1 className={`game-heading-1 ${styles.title}`}>WIDGET LIBRARY</h1>
          <WidgetLibrary onSelectWidget={handleSelectWidget} />
        </div>
      </div>
    </>
  );
}
