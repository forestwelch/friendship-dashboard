// Gamepad/Controller support for Game Boy-like navigation

export interface GamepadState {
  connected: boolean;
  buttons: {
    a: boolean;
    b: boolean;
    x: boolean;
    y: boolean;
    l: boolean;
    r: boolean;
    start: boolean;
    select: boolean;
  };
  sticks: {
    left: { x: number; y: number };
    right: { x: number; y: number };
  };
}

const gamepadState: GamepadState = {
  connected: false,
  buttons: {
    a: false,
    b: false,
    x: false,
    y: false,
    l: false,
    r: false,
    start: false,
    select: false,
  },
  sticks: {
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
  },
};

let animationFrameId: number | null = null;

// Standard button mappings (Nintendo-style)
const BUTTON_MAP: Record<number, keyof GamepadState["buttons"]> = {
  0: "b", // A button (Nintendo) = B in our system
  1: "a", // B button (Nintendo) = A in our system
  2: "y", // X button (Nintendo) = Y in our system
  3: "x", // Y button (Nintendo) = X in our system
  4: "l", // L button
  5: "r", // R button
  8: "select", // Select/Back
  9: "start", // Start
};

export function initGamepad() {
  if (typeof window === "undefined") return;

  const handleGamepadConnected = (e: GamepadEvent) => {
    console.warn("Gamepad connected:", e.gamepad.id);
    gamepadState.connected = true;
    startPolling();
  };

  const handleGamepadDisconnected = (e: GamepadEvent) => {
    console.warn("Gamepad disconnected:", e.gamepad.id);
    gamepadState.connected = false;
    stopPolling();
  };

  window.addEventListener("gamepadconnected", handleGamepadConnected);
  window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);

  // Check for already connected gamepads
  const gamepads = navigator.getGamepads();
  for (let i = 0; i < gamepads.length; i++) {
    if (gamepads[i]) {
      gamepadState.connected = true;
      startPolling();
      break;
    }
  }

  return () => {
    window.removeEventListener("gamepadconnected", handleGamepadConnected);
    window.removeEventListener("gamepaddisconnected", handleGamepadDisconnected);
    stopPolling();
  };
}

function startPolling() {
  if (animationFrameId !== null) return;

  const poll = () => {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0]; // Use first gamepad

    if (gamepad) {
      // Update buttons
      Object.entries(BUTTON_MAP).forEach(([index, button]) => {
        const buttonIndex = parseInt(index);
        gamepadState.buttons[button] = gamepad.buttons[buttonIndex]?.pressed || false;
      });

      // Update sticks (normalize to -1 to 1)
      gamepadState.sticks.left = {
        x: gamepad.axes[0] || 0,
        y: gamepad.axes[1] || 0,
      };
      gamepadState.sticks.right = {
        x: gamepad.axes[2] || 0,
        y: gamepad.axes[3] || 0,
      };
    }

    animationFrameId = requestAnimationFrame(poll);
  };

  poll();
}

function stopPolling() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

export function getGamepadState(): GamepadState {
  return { ...gamepadState };
}

export function isGamepadConnected(): boolean {
  return gamepadState.connected;
}

