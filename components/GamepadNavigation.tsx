"use client";

import React, { useEffect, useCallback } from "react";
import { initGamepad, getGamepadState, isGamepadConnected } from "@/lib/gamepad";
import { playSound } from "@/lib/sounds";

interface GamepadNavigationProps {
  onButtonPress?: (button: string) => void;
  onStickMove?: (stick: "left" | "right", x: number, y: number) => void;
}

export function GamepadNavigation({ onButtonPress, onStickMove }: GamepadNavigationProps) {
  useEffect(() => {
    const cleanup = initGamepad();
    return cleanup;
  }, []);

  useEffect(() => {
    if (!isGamepadConnected()) return;

    let lastButtonState: Record<string, boolean> = {};
    let stickDeadzone = 0.3; // Ignore small stick movements

    const checkInputs = () => {
      const state = getGamepadState();
      
      // Check button presses (only trigger on press, not hold)
      Object.entries(state.buttons).forEach(([button, pressed]) => {
        const wasPressed = lastButtonState[button] || false;
        if (pressed && !wasPressed) {
          playSound("click");
          onButtonPress?.(button);
        }
        lastButtonState[button] = pressed;
      });

      // Check stick movements
      if (Math.abs(state.sticks.left.x) > stickDeadzone || Math.abs(state.sticks.left.y) > stickDeadzone) {
        onStickMove?.("left", state.sticks.left.x, state.sticks.left.y);
      }
      if (Math.abs(state.sticks.right.x) > stickDeadzone || Math.abs(state.sticks.right.y) > stickDeadzone) {
        onStickMove?.("right", state.sticks.right.x, state.sticks.right.y);
      }

      requestAnimationFrame(checkInputs);
    };

    const frameId = requestAnimationFrame(checkInputs);
    return () => cancelAnimationFrame(frameId);
  }, [onButtonPress, onStickMove]);

  return null; // This component doesn't render anything
}

