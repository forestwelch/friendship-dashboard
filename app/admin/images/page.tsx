import React from "react";
import { Navigation } from "@/components/Navigation";
import { ImageManager } from "@/components/admin/ImageManager";
import Link from "next/link";

export default function AdminImagesPage() {
  return (
    <>
      <Navigation />
      <div 
        className="admin-page"
        style={{ 
          paddingTop: `calc(var(--height-button) + var(--space-md))`,
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="game-container" style={{ 
          padding: "var(--space-md)",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <div className="game-breadcrumb" style={{ marginBottom: "var(--space-md)", flexShrink: 0 }}>
            <Link href="/" className="game-link">Home</Link>
            <span className="game-breadcrumb-separator">/</span>
            <span className="game-breadcrumb-current">Global Images</span>
          </div>
          <h1 className="game-heading-1" style={{ marginBottom: "var(--space-md)", flexShrink: 0 }}>
            Global Image Library
          </h1>

          <div style={{ flex: 1, overflow: "hidden" }}>
            <ImageManager initialImages={[]} />
          </div>
        </div>
      </div>
    </>
  );
}


