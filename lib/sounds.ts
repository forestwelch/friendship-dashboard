// Retro sound effects for the dashboard

export function playSound(
  type:
    | "click"
    | "success"
    | "error"
    | "pop"
    | "blip"
    | "move"
    | "select"
    | "cancel"
    | "open"
    | "close"
    | "hover"
    | "upload"
    | "delete"
    | "focus"
    | "navigate"
    | "event_save"
    | "quiz_advance"
    | "quiz_results"
    | "retake"
    | "game_drop"
    | "game_hover"
    | "game_win"
    | "game_lose"
    | "game_draw"
    | "opponent_move"
    | "whoosh"
    | "ping"
) {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") {
    return;
  }

  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Retro 8-bit Game Boy style sounds
    const sounds: Record<string, { frequency: number; duration: number; type: OscillatorType }> = {
      click: { frequency: 800, duration: 0.05, type: "square" },
      success: { frequency: 600, duration: 0.15, type: "sine" },
      error: { frequency: 300, duration: 0.2, type: "sawtooth" },
      pop: { frequency: 1000, duration: 0.08, type: "square" },
      blip: { frequency: 1200, duration: 0.06, type: "square" },
      move: { frequency: 400, duration: 0.04, type: "square" },
      select: { frequency: 500, duration: 0.1, type: "sine" },
      cancel: { frequency: 200, duration: 0.1, type: "sawtooth" },
      open: { frequency: 700, duration: 0.12, type: "sine" },
      close: { frequency: 300, duration: 0.1, type: "sawtooth" },
      hover: { frequency: 450, duration: 0.03, type: "square" },
      upload: { frequency: 550, duration: 0.1, type: "sine" },
      delete: { frequency: 250, duration: 0.15, type: "sawtooth" },
      focus: { frequency: 500, duration: 0.05, type: "square" },
      navigate: { frequency: 350, duration: 0.04, type: "square" },
      // Widget-specific sounds
      event_save: { frequency: 650, duration: 0.15, type: "sine" }, // Ascending tone
      quiz_advance: { frequency: 550, duration: 0.1, type: "sine" }, // Soft "ding"
      quiz_results: { frequency: 800, duration: 0.3, type: "sine" }, // Magical ascending tone
      retake: { frequency: 400, duration: 0.1, type: "sawtooth" }, // Reset/restart sound
      game_drop: { frequency: 500, duration: 0.12, type: "square" }, // Satisfying "plunk"
      game_hover: { frequency: 450, duration: 0.05, type: "square" }, // Subtle "bloop"
      game_win: { frequency: 800, duration: 0.5, type: "square" }, // Celebration fanfare, 8-bit style
      game_lose: { frequency: 200, duration: 0.4, type: "sawtooth" }, // Sad trombone, 8-bit style
      game_draw: { frequency: 400, duration: 0.15, type: "sine" }, // Neutral tone
      opponent_move: { frequency: 600, duration: 0.1, type: "square" }, // Notification sound
      whoosh: { frequency: 700, duration: 0.15, type: "sine" }, // Date selection
      ping: { frequency: 500, duration: 0.05, type: "square" }, // Field focus (can reuse focus)
    };

    const sound = sounds[type];
    if (!sound) return;

    oscillator.frequency.value = sound.frequency;
    oscillator.type = sound.type;

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + sound.duration);
  } catch {
    // Silently fail if audio context can't be created
  }
}
