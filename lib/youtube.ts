// YouTube IFrame Player API utilities

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayer {
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number) => void;
  getPlayerState: () => number;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  destroy: () => void;
}

let playerInstance: YouTubePlayer | null = null;
let isAPIReady = false;
let readyCallbacks: Array<() => void> = [];

export function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    // Check if we're in browser environment
    if (typeof window === "undefined" || typeof document === "undefined") {
      resolve(); // Resolve silently in SSR
      return;
    }

    if (isAPIReady) {
      resolve();
      return;
    }

    if (window.YT && window.YT.Player) {
      isAPIReady = true;
      resolve();
      return;
    }

    readyCallbacks.push(resolve);

    if (document.getElementById("youtube-api-script")) {
      // Script already loading, just wait
      return;
    }

    const tag = document.createElement("script");
    tag.id = "youtube-api-script";
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      isAPIReady = true;
      readyCallbacks.forEach((cb) => cb());
      readyCallbacks = [];
    };
  });
}

export function createYouTubePlayer(
  containerId: string,
  options: {
    videoId?: string;
    width?: number;
    height?: number;
    playerVars?: any;
    onStateChange?: (event: any) => void;
  } = {}
): Promise<YouTubePlayer> {
  return loadYouTubeAPI().then(() => {
    return new Promise((resolve) => {
      const player = new window.YT.Player(containerId, {
        width: options.width || 1,
        height: options.height || 1,
        videoId: options.videoId || "",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          ...options.playerVars,
        },
        events: {
          onReady: () => {
            playerInstance = player;
            resolve(player);
          },
          onStateChange: options.onStateChange || (() => {}),
        },
      });
    });
  });
}

export function getPlayerInstance(): YouTubePlayer | null {
  return playerInstance;
}

