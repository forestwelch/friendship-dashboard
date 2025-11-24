"use client";
import { useKeyboardShortcuts } from "@/lib/keyboard";

interface KeyboardNavigationProps {
  onNavigate?: (direction: "up" | "down" | "left" | "right") => void;
  onSelect?: () => void;
  onEscape?: () => void;
}

export function KeyboardNavigation({
  onNavigate,
  onSelect,
  onEscape,
}: KeyboardNavigationProps) {
  useKeyboardShortcuts([
    {
      key: "ArrowUp",
      action: () => onNavigate?.("up"),
      description: "Navigate up",
    },
    {
      key: "ArrowDown",
      action: () => onNavigate?.("down"),
      description: "Navigate down",
    },
    {
      key: "ArrowLeft",
      action: () => onNavigate?.("left"),
      description: "Navigate left",
    },
    {
      key: "ArrowRight",
      action: () => onNavigate?.("right"),
      description: "Navigate right",
    },
    {
      key: "Enter",
      action: () => onSelect?.(),
      description: "Select widget",
    },
    {
      key: "Escape",
      action: () => onEscape?.(),
      description: "Close/escape",
    },
  ]);

  return null;
}


