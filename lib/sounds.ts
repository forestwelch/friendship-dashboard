// Retro sound effects for the dashboard

export function playSound(
  type: "click" | "success" | "error" | "pop" | "blip" | "move" | "select" | "cancel" | "open" | "close"
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
    };

    const sound = sounds[type];
    if (!sound) return;

    oscillator.frequency.value = sound.frequency;
    oscillator.type = sound.type;

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + sound.duration);
  } catch (error) {
    // Silently fail if audio context can't be created
    console.debug("Could not play sound:", error);
  }
}


