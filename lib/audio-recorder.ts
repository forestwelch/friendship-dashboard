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

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType });
      resolve(blob);
    };

    recorder.onerror = (error) => {
      reject(error);
    };

    recorder.start();
    setTimeout(() => {
      recorder.stop();
      // Stop all tracks to release microphone
      recorder.stream.getTracks().forEach((track) => track.stop());
    }, durationMs);
  });
}
