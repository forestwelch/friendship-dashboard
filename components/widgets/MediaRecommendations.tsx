"use client";

import React, { useState } from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";
import { playSound } from "@/lib/sounds";

interface MediaItem {
  id: string;
  title: string;
  type: "movie" | "show" | "book" | "music" | "game";
  description?: string;
  thumbnail?: string;
  watched?: boolean;
  createdAt: string;
}

interface MediaRecommendationsProps {
  size: WidgetSize;
  recommendations?: MediaItem[];
  onMarkWatched?: (id: string) => void;
  onAddRecommendation?: () => void;
}

export function MediaRecommendations({
  size,
  recommendations = [],
  onMarkWatched,
  onAddRecommendation,
}: MediaRecommendationsProps) {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  
  const unwatchedCount = recommendations.filter((r) => !r.watched).length;
  const latestUnwatched = recommendations.find((r) => !r.watched);
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "movie":
        return "hn-film-solid";
      case "show":
        return "hn-tv-solid";
      case "book":
        return "hn-book-solid";
      case "music":
        return "hn-music-solid";
      case "game":
        return "hn-gamepad-solid";
      default:
        return "hn-star-solid";
    }
  };
  
  if (size === "1x1") {
    return (
      <Widget size={size}>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-md)",
            gap: "var(--space-sm)",
          }}
        >
          <div
            style={{ fontSize: "32px", opacity: 0.8 }}
          >
            {getTypeIcon(latestUnwatched?.type || "movie")}
          </div>
          {unwatchedCount > 0 && (
            <div
              style={{
                fontSize: "12px",
                background: "var(--accent)",
                color: "var(--bg)",
                padding: "2px 6px",
                borderRadius: "2px",
                fontWeight: "bold",
              }}
            >
              {unwatchedCount}
            </div>
          )}
        </div>
      </Widget>
    );
  }
  
  if (size === "2x2") {
    return (
      <Widget size={size}>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "var(--space-md)",
            gap: "var(--space-sm)",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          >
            Recommendations
          </div>
          
          {latestUnwatched ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {latestUnwatched.title}
              </div>
              <div
                style={{
                  fontSize: "9px",
                  opacity: 0.8,
                  textTransform: "capitalize",
                }}
              >
                {latestUnwatched.type}
              </div>
              {latestUnwatched.description && (
                <div
                  style={{
                    fontSize: "8px",
                    opacity: 0.7,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {latestUnwatched.description}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                opacity: 0.6,
                textAlign: "center",
              }}
            >
              No new recommendations
            </div>
          )}
          
          <button
            className="widget-button"
            onClick={() => {
              playSound("click");
              if (onAddRecommendation) {
                onAddRecommendation();
              }
            }}
            style={{ fontSize: "10px", padding: "4px" }}
          >
            + Add Rec
          </button>
        </div>
      </Widget>
    );
  }
  
  // 3x3 version - Full list
  return (
    <Widget size={size}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "4px",
          gap: "4px",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            marginBottom: "4px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Media Recommendations</span>
          {unwatchedCount > 0 && (
            <span
              style={{
                fontSize: "10px",
                background: "var(--accent)",
                color: "var(--bg)",
                padding: "2px 6px",
                borderRadius: "2px",
              }}
            >
              {unwatchedCount} new
            </span>
          )}
        </div>
        
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {recommendations.length === 0 ? (
            <div
              style={{
                fontSize: "12px",
                opacity: 0.6,
                textAlign: "center",
                padding: "16px",
              }}
            >
              No recommendations yet
            </div>
          ) : (
            recommendations.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "6px",
                  background: item.watched
                    ? "var(--secondary)"
                    : "var(--primary)",
                  color: item.watched ? "var(--text)" : "var(--bg)",
                  border: "2px solid var(--accent)",
                  cursor: "pointer",
                  fontSize: "11px",
                  opacity: item.watched ? 0.7 : 1,
                }}
                onClick={() => {
                  if (!item.watched && onMarkWatched) {
                    playSound("success");
                    onMarkWatched(item.id);
                  }
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "2px",
                      }}
                    >
                      <span style={{ fontSize: "12px" }}>
                        {getTypeIcon(item.type)}
                      </span>
                      <span style={{ fontWeight: "bold" }}>{item.title}</span>
                      {item.watched && (
                        <span style={{ fontSize: "8px", opacity: 0.8 }}>
                          ✓
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "9px",
                        opacity: 0.8,
                        textTransform: "capitalize",
                        marginBottom: "2px",
                      }}
                    >
                      {item.type}
                    </div>
                    {item.description && (
                      <div
                        style={{
                          fontSize: "9px",
                          opacity: 0.7,
                          marginTop: "2px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <button
          className="widget-button"
          onClick={() => {
            playSound("click");
            if (onAddRecommendation) {
              onAddRecommendation();
            }
          }}
          style={{ fontSize: "12px", padding: "6px" }}
        >
          + Add Recommendation
        </button>
      </div>
    </Widget>
  );
}

