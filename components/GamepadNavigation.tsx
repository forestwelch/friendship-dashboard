"use client";

import { useEffect, useRef } from "react";
import { initGamepad, getGamepadState, isGamepadConnected } from "@/lib/gamepad";
import { playSound } from "@/lib/sounds";

interface GamepadNavigationProps {
  onButtonPress?: (button: string) => void;
  onStickMove?: (stick: "left" | "right", x: number, y: number) => void;
  enabled?: boolean;
}

export function GamepadNavigation({ 
  onButtonPress, 
  onStickMove, 
  enabled = true 
}: GamepadNavigationProps) {
  // Track last move time to prevent scrolling too fast
  const lastMoveTime = useRef(0);
  const MOVE_DELAY = 200; // ms between moves

  useEffect(() => {
    if (!enabled) return;
    
    const cleanup = initGamepad();
    return cleanup;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    
    const lastButtonState: Record<string, boolean> = {};
    const stickDeadzone = 0.5;

    const getFocusableElements = () => {
      return Array.from(document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )) as HTMLElement[];
    };

    const findNearestElement = (direction: "up" | "down" | "left" | "right") => {
      const active = document.activeElement as HTMLElement;
      if (!active || active === document.body) {
        // If nothing focused, focus first element
        const first = getFocusableElements()[0];
        if (first) first.focus();
        return;
      }

      const rect = active.getBoundingClientRect();
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      const candidates = getFocusableElements().filter(el => el !== active && !el.getAttribute("aria-hidden"));
      
      let nearest: HTMLElement | null = null;
      let minDistance = Infinity;

      candidates.forEach(el => {
        const r = el.getBoundingClientRect();
        const c = {
          x: r.left + r.width / 2,
          y: r.top + r.height / 2
        };

        // Filter based on direction
        let isValid = false;
        switch (direction) {
          case "up": isValid = c.y < center.y; break;
          case "down": isValid = c.y > center.y; break;
          case "left": isValid = c.x < center.x; break;
          case "right": isValid = c.x > center.x; break;
        }

        if (!isValid) return;

        // Calculate distance
        const dist = Math.pow(c.x - center.x, 2) + Math.pow(c.y - center.y, 2);
        
        // Weight distance to prefer direct lines (e.g. moving down prefers elements directly below)
        // Add penalty for orthogonal deviation
        let penalty = 0;
        if (direction === "up" || direction === "down") {
          penalty = Math.abs(c.x - center.x) * 2;
        } else {
          penalty = Math.abs(c.y - center.y) * 2;
        }

        if (dist + penalty < minDistance) {
          minDistance = dist + penalty;
          nearest = el;
        }
      });

      if (nearest) {
        (nearest as HTMLElement).focus();
        playSound("hover"); // Use hover sound for focus change
      }
    };

    const checkInputs = () => {
      if (!isGamepadConnected()) {
        requestAnimationFrame(checkInputs);
        return;
      }

      const state = getGamepadState();
      const now = Date.now();
      
      // Check button presses
      Object.entries(state.buttons).forEach(([button, pressed]) => {
        const wasPressed = lastButtonState[button] || false;
        if (pressed && !wasPressed) {
          // Handle global navigation
          if (button === "a") {
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.click();
              playSound("click");
            }
          } else if (button === "b") {
             // Maybe go back? or blur?
             if (document.activeElement instanceof HTMLElement) {
               document.activeElement.blur();
               playSound("cancel");
             }
          } else if (button === "x") {
             // Right click simulation? Or custom action
             // Dispatch context menu event?
             /* 
             const ev = new MouseEvent('contextmenu', {
               bubbles: true,
               cancelable: true,
               view: window,
             });
             document.activeElement?.dispatchEvent(ev);
             */
          } else if (button === "dpadUp") {
             // Handle D-pad if mapped, but stick usually handles it
          }

          onButtonPress?.(button);
        }
        lastButtonState[button] = pressed;
      });

      // Check stick movements for navigation
      if (now - lastMoveTime.current > MOVE_DELAY) {
        const { x, y } = state.sticks.left;
        
        if (Math.abs(y) > stickDeadzone) {
          findNearestElement(y > 0 ? "down" : "up");
          lastMoveTime.current = now;
          onStickMove?.("left", x, y);
        } else if (Math.abs(x) > stickDeadzone) {
          findNearestElement(x > 0 ? "right" : "left");
          lastMoveTime.current = now;
          onStickMove?.("left", x, y);
        }
      }

      requestAnimationFrame(checkInputs);
    };

    const frameId = requestAnimationFrame(checkInputs);
    return () => cancelAnimationFrame(frameId);
  }, [onButtonPress, onStickMove, enabled]);

  return null;
}
