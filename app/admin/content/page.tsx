"use client";

import React from "react";
import Link from "next/link";
import { playSound } from "@/lib/sounds";
import { Navigation } from "@/components/shared";
import clsx from "clsx";
import "@/styles/content-page.css";

export default function ContentPage() {
  return (
    <>
      <Navigation />
      <div className="admin-page content-page">
        <div className="game-container content-container">
          <h1 className="game-heading-1 content-title">MANAGE CONTENT</h1>
          <div className="content-grid">
            {/* Songs Card */}
            <Link
              href="/admin/content/songs"
              className="game-card game-card-hover content-card-link"
              onClick={() => playSound("click")}
            >
              <div className="content-card-icon">
                <i className={clsx("hn", "hn-music-solid")} />
              </div>
              <span className="game-heading-2 content-card-title">SONGS</span>
            </Link>

            {/* Images Card */}
            <Link
              href="/admin/content/images"
              className="game-card game-card-hover content-card-link"
              onClick={() => playSound("click")}
            >
              <div className="content-card-icon">
                <i className={clsx("hn", "hn-image-solid")} />
              </div>
              <span className="game-heading-2 content-card-title">IMAGES</span>
            </Link>

            {/* Color Palettes Card */}
            <Link
              href="/admin/content/color-palettes"
              className="game-card game-card-hover content-card-link"
              onClick={() => playSound("click")}
            >
              <div className="content-card-icon">
                <i className={clsx("hn", "hn-fill-solid")} />
              </div>
              <span className="game-heading-2 content-card-title">COLOR PALETTES</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
