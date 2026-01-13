"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { FriendWidget } from "@/lib/queries";
import { playSound } from "@/lib/sounds";

interface HistoryState {
  widgets: FriendWidget[];
  timestamp: number;
}

export function useUndoRedo(initialWidgets: FriendWidget[]) {
  const [history, setHistory] = useState<HistoryState[]>(() => [
    { widgets: initialWidgets, timestamp: Date.now() },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const widgetsRef = useRef<FriendWidget[]>(initialWidgets);

  useEffect(() => {
    widgetsRef.current = history[historyIndex]?.widgets || initialWidgets;
  }, [historyIndex, history, initialWidgets]);

  const saveState = useCallback(
    (widgets: FriendWidget[]) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push({ widgets, timestamp: Date.now() });
        // Keep only last 50 states
        const trimmedHistory = newHistory.length > 50 ? newHistory.slice(-50) : newHistory;
        setHistoryIndex(trimmedHistory.length - 1);
        return trimmedHistory;
      });
    },
    [historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      playSound("click");
      return history[newIndex].widgets;
    }
    return null;
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      playSound("click");
      return history[newIndex].widgets;
    }
    return null;
  }, [historyIndex, history]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Use state instead of ref for currentState to avoid ref access during render
  const [currentState, setCurrentState] = useState<FriendWidget[]>(initialWidgets);

  useEffect(() => {
    setCurrentState(widgetsRef.current);
  }, [historyIndex, history]);

  return {
    currentState,
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
