// Keyboard shortcuts for the dashboard

import React from "react";

export type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl === undefined || event.ctrlKey === shortcut.ctrl;
        const shiftMatch = shortcut.shift === undefined || event.shiftKey === shortcut.shift;
        const altMatch = shortcut.alt === undefined || event.altKey === shortcut.alt;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
