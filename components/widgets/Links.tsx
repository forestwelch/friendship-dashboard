"use client";

import React, { useState } from "react";
import { Widget } from "@/components/Widget";
import { WidgetSize } from "@/lib/types";

interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

interface LinksProps {
  size: WidgetSize;
  links?: LinkItem[];
}

export function Links({ size, links = [] }: LinksProps) {
  const [linkList, setLinkList] = useState<LinkItem[]>(links);
  
  const openLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
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
          <i
            className="hn hn-link-solid"
            style={{ fontSize: "32px", opacity: 0.8 }}
          />
          <div style={{ fontSize: "10px", textAlign: "center" }}>
            {linkList.length} {linkList.length === 1 ? "link" : "links"}
          </div>
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
            Links
          </div>
          
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-sm)",
            }}
          >
            {linkList.length === 0 ? (
              <div
                style={{
                  fontSize: "10px",
                  opacity: 0.6,
                  textAlign: "center",
                  padding: "8px",
                }}
              >
                No links yet
              </div>
            ) : (
              linkList.map((link) => (
                <button
                  key={link.id}
                  className="widget-button"
                  onClick={() => openLink(link.url)}
                  style={{
                    fontSize: "10px",
                    padding: "6px",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    width: "100%",
                  }}
                >
                  {link.icon && (
                    <i className={link.icon} style={{ fontSize: "12px" }} />
                  )}
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}
                  >
                    {link.title}
                  </span>
                  <i className="hn hn-external-link-alt-solid" style={{ fontSize: "8px", opacity: 0.7 }} />
                </button>
              ))
            )}
          </div>
        </div>
      </Widget>
    );
  }
  
  // 3x3 version - Full links grid
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
            fontSize: "14px",
            fontWeight: "bold",
            marginBottom: "4px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Quick Links</span>
          <span style={{ fontSize: "10px", opacity: 0.7 }}>
            {linkList.length}
          </span>
        </div>
        
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "6px",
          }}
        >
          {linkList.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                fontSize: "12px",
                opacity: 0.6,
                textAlign: "center",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <i
                className="hn hn-link-solid"
                style={{ fontSize: "32px", opacity: 0.5 }}
              />
              <div>No links yet</div>
            </div>
          ) : (
            linkList.map((link) => (
              <button
                key={link.id}
                className="widget-button"
                onClick={() => openLink(link.url)}
                style={{
                  fontSize: "11px",
                  padding: "8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "var(--space-sm)",
                  minHeight: "60px",
                  textAlign: "center",
                }}
              >
                {link.icon && (
                  <i className={link.icon} style={{ fontSize: "20px" }} />
                )}
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    wordBreak: "break-word",
                  }}
                >
                  {link.title}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </Widget>
  );
}


