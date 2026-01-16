"use client";

import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  widgetId: string;
  widgetType: string;
  onDelete?: (widgetId: string) => void;
  isEditMode?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary for widget rendering
 * Catches errors in widget components to prevent entire page crash
 */
export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `Widget rendering failed for ${this.props.widgetId} (${this.props.widgetType}):`,
      error,
      errorInfo
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="w-full h-full flex flex-col items-center justify-center text-center p-4"
          style={{
            backgroundColor: "rgba(255, 0, 0, 0.1)",
            border: "1px solid rgba(255, 0, 0, 0.3)",
            borderRadius: "4px",
          }}
        >
          <div className="game-text-muted mb-2">⚠️ Widget Error</div>
          <div className="game-text-small mb-3">
            {this.props.widgetType.replace(/_/g, " ")} failed to load
          </div>
          {this.props.isEditMode && this.props.onDelete && (
            <button
              className="game-button game-button-danger game-button-small"
              onClick={() => {
                if (this.props.onDelete) {
                  this.props.onDelete(this.props.widgetId);
                }
              }}
            >
              Delete Widget
            </button>
          )}
          {!this.props.isEditMode && (
            <div className="game-text-small opacity-50">Contact admin to fix</div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
