/**
 * Audio recording utilities using MediaRecorder API
 */

export async function startRecording(): Promise<MediaRecorder | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
    const recorder = new MediaRecorder(stream, { mimeType });
    return recorder;
  } catch (error) {
    console.error("Error accessing microphone:", error);
    return null;
  }
}

export function recordForDuration(recorder: MediaRecorder, durationMs: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const chunks: Blob[] = [];
    let hasError = false;
    const startTime = Date.now();

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const actualDuration = (Date.now() - startTime) / 1000;

      // Small delay to ensure all chunks are collected
      setTimeout(() => {
        if (hasError) {
          reject(new Error("Recording error occurred"));
          return;
        }

        if (chunks.length === 0) {
          reject(new Error("No audio data recorded"));
          return;
        }

        const blob = new Blob(chunks, { type: recorder.mimeType });

        if (blob.size === 0) {
          reject(new Error("Recorded blob is empty"));
          return;
        }

        console.warn(
          `Recording complete. Actual duration: ${actualDuration.toFixed(2)}s, Expected: ${(durationMs / 1000).toFixed(2)}s, Chunks: ${chunks.length}, Size: ${blob.size} bytes`
        );
        resolve(blob);
      }, 100);
    };

    recorder.onerror = (event) => {
      hasError = true;
      reject(new Error(`Recording error: ${event.error?.message || "Unknown error"}`));
    };

    // Note: recorder.start() should already be called before this function
    // This function just handles the duration timing
    if (recorder.state !== "recording") {
      console.warn("Recorder not in recording state, attempting to start...");
      try {
        recorder.start(100); // Capture data every 100ms
      } catch (error) {
        reject(new Error(`Failed to start recording: ${error}`));
        return;
      }
    }

    setTimeout(() => {
      if (recorder.state === "recording" || recorder.state === "paused") {
        try {
          recorder.stop();
        } catch (error) {
          console.error("Error stopping recorder:", error);
        }
      }
      // Stop all tracks to release microphone
      recorder.stream.getTracks().forEach((track) => {
        track.stop();
      });
    }, durationMs);
  });
}
