"use client";

import React, { useState, useEffect } from "react";
import { FriendWidget } from "@/lib/queries";
import { playSound } from "@/lib/sounds";

interface WidgetConfigModalProps {
  widget: FriendWidget | null;
  onClose: () => void;
  onSave: (config: Record<string, any>) => void;
}

export function WidgetConfigModal({
  widget,
  onClose,
  onSave,
}: WidgetConfigModalProps) {
  const [config, setConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    if (widget) {
      setConfig(widget.config || {});
    }
  }, [widget]);

  if (!widget) return null;

  const handleSave = () => {
    onSave(config);
    playSound("success");
    onClose();
  };

  const renderConfigFields = () => {
    switch (widget.widget_type) {
      case "notes":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <label className="game-heading-3" style={{ margin: 0 }}>
              Initial Notes (one per line)
            </label>
            <textarea
              className="game-input"
              value={(config.notes || []).join("\n")}
              onChange={(e) =>
                setConfig({
                  ...config,
                  notes: e.target.value.split("\n").filter((n) => n.trim()),
                })
              }
              style={{
                minHeight: "100px",
                fontFamily: "inherit",
              }}
            />
          </div>
        );

      case "links":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <label className="game-heading-3" style={{ margin: 0 }}>
              Links (JSON format)
            </label>
            <textarea
              className="game-input"
              value={JSON.stringify(config.links || [], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setConfig({ ...config, links: parsed });
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              style={{
                fontFamily: "monospace",
                minHeight: "150px",
              }}
            />
            <div className="game-text-muted" style={{ fontSize: "10px" }}>
              Format: [{"{"}"id": "1", "title": "Example", "url": "https://...", "icon": "hn-link-solid"{"}"}]
            </div>
          </div>
        );

      case "calendar":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <label className="game-heading-3" style={{ margin: 0 }}>
              Events (JSON format)
            </label>
            <textarea
              className="game-input"
              value={JSON.stringify(config.events || [], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setConfig({ ...config, events: parsed });
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              style={{
                fontFamily: "monospace",
                minHeight: "150px",
              }}
            />
            <div className="game-text-muted" style={{ fontSize: "10px" }}>
              Format: [{"{"}"id": "1", "title": "Event", "date": "2024-01-15", "time": "3:00 PM"{"}"}]
            </div>
          </div>
        );

      case "media_recommendations":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <label className="game-heading-3" style={{ margin: 0 }}>
              Recommendations (JSON format)
            </label>
            <textarea
              className="game-input"
              value={JSON.stringify(config.recommendations || [], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setConfig({ ...config, recommendations: parsed });
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              style={{
                fontFamily: "monospace",
                minHeight: "150px",
              }}
            />
            <div className="game-text-muted" style={{ fontSize: "10px" }}>
              Format: [{"{"}"id": "1", "title": "Movie", "type": "movie", "description": "..."{"}"}]
            </div>
          </div>
        );

      default:
        return (
          <div className="game-text-muted">
            No configuration options available for this widget type.
          </div>
        );
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="game-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "600px",
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
          padding: "var(--space-xl)",
        }}
      >
        <div className="game-flex game-flex-between" style={{ marginBottom: "var(--space-lg)" }}>
          <h2 className="game-heading-2" style={{ margin: 0 }}>
            Configure {widget.widget_name}
          </h2>
          <button
            className="game-button game-button-icon"
            onClick={onClose}
            style={{ minWidth: "32px", minHeight: "32px" }}
          >
            ×
          </button>
        </div>

        {renderConfigFields()}

        <div className="game-flex game-flex-gap-md" style={{ marginTop: "var(--space-xl)", justifyContent: "flex-end" }}>
          <button
            className="game-button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="game-button game-button-success"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}


