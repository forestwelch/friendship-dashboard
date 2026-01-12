"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { playSound } from "@/lib/sounds";
import styles from "./ErrorBoundary.module.css";

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
        <div className={styles.errorContainer}>
          <h2 className={styles.errorTitle}>Something went wrong</h2>
          <details className={styles.errorDetails}>
            <summary className={styles.errorSummary}>Error details</summary>
            <pre className={styles.errorPre}>{this.state.error?.message}</pre>
          </details>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className={styles.errorButton}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
