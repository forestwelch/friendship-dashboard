"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { playSound } from "@/lib/sounds";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console (Sentry deferred)
    console.error("Component error:", error, errorInfo);
    playSound("error");
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: "var(--space-lg)",
            border: "2px solid var(--accent)",
            borderRadius: "var(--radius-md)",
            background: "var(--bg)",
            color: "var(--text)",
            margin: "var(--space-md)",
          }}
        >
          <h2 style={{ marginTop: 0, color: "var(--accent)" }}>
            Something went wrong
          </h2>
          <details style={{ marginTop: "var(--space-md)" }}>
            <summary style={{ cursor: "pointer", marginBottom: "var(--space-sm)" }}>
              Error details
            </summary>
            <pre
              style={{
                background: "var(--secondary)",
                padding: "var(--space-sm)",
                borderRadius: "var(--radius-sm)",
                overflow: "auto",
                fontSize: "var(--font-size-xs)",
              }}
            >
              {this.state.error?.message}
            </pre>
          </details>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              marginTop: "var(--space-md)",
              padding: "var(--space-sm) var(--space-md)",
              background: "var(--primary)",
              border: "2px solid var(--accent)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text)",
              cursor: "pointer",
              minHeight: "44px",
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}



