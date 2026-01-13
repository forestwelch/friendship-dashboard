/**
 * Audio recording utilities - matching the working demo EXACTLY
 * https://addpipe.com/media-recorder-api-demo-audio/
 */

export async function startRecording(): Promise<{
  recorder: MediaRecorder;
  stream: MediaStream;
  extension: string;
} | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Match demo EXACTLY - simple format detection
    let extension = "webm";
    if (!MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
      extension = "ogg";
    }

    // Match demo EXACTLY - options with all the same properties
    const mimeType = `audio/${extension};codecs=opus`;
    const options: MediaRecorderOptions = {
      audioBitsPerSecond: 256000,
      videoBitsPerSecond: 2500000,
      bitsPerSecond: 2628000,
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
    };

    const recorder = new MediaRecorder(stream, options);

    return { recorder, stream, extension };
  } catch {
    return null;
  }
}

export function recordForDuration(
  recorder: MediaRecorder,
  stream: MediaStream,
  extension: string,
  durationMs: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const chunks: Blob[] = [];

    // Match demo EXACTLY - ondataavailable handler
    recorder.ondataavailable = (event) => {
      // Match demo EXACTLY - push ALL data, no size check
      chunks.push(event.data);

      // Match demo EXACTLY - check state with == (loose equality)
      if (recorder.state == "inactive") {
        // Match demo EXACTLY - create blob with bitsPerSecond
        const blob = new Blob(chunks, {
          type: `audio/${extension}`,
          bitsPerSecond: 128000,
        } as BlobPropertyBag);

        resolve(blob);
      }
    };

    recorder.onerror = (event) => {
      reject(new Error(`Recording error: ${event.error?.message || "Unknown error"}`));
    };

    // Match demo EXACTLY - start with 1 second chunks
    recorder.start(1000);

    // Stop after duration - match demo EXACTLY
    setTimeout(() => {
      if (recorder.state === "recording" || recorder.state === "paused") {
        // Match demo EXACTLY - stop recorder first
        recorder.stop();
        // Match demo EXACTLY - stop tracks immediately after (like gumStream.getAudioTracks()[0].stop())
        stream.getAudioTracks().forEach((track) => {
          track.stop();
        });
      }
    }, durationMs);
  });
}
