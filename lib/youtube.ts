// YouTube IFrame Player API utilities

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: () => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: (event: { data: number }) => void;
          };
          onReady?: () => void;
          onStateChange?: (event: { data: number }) => void;
          onError?: (event: { data: number }) => void;
        }
      ) => {
        playVideo: () => void;
        pauseVideo: () => void;
        stopVideo: () => void;
        getCurrentTime: () => number;
        getDuration: () => number;
        seekTo: (seconds: number) => void;
        setVolume: (volume: number) => void;
        getVolume: () => number;
        mute: () => void;
        unMute: () => void;
        isMuted: () => boolean;
        setPlaybackRate: (rate: number) => void;
        getPlaybackRate: () => number;
        getPlayerState: () => number;
        loadVideoById: (videoId: string) => void;
        cueVideoById: (videoId: string) => void;
        destroy: () => void;
      };
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
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

    // Script is loaded by Next.js Script component in layout.tsx
    // Just wait for it to be ready
    // Set up callback if not already set
    if (!window.onYouTubeIframeAPIReady) {
      window.onYouTubeIframeAPIReady = () => {
        isAPIReady = true;
        readyCallbacks.forEach((cb) => cb());
        readyCallbacks = [];
      };
    }

    // Check if script is already loaded
    const checkAPI = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkAPI);
        isAPIReady = true;
        readyCallbacks.forEach((cb) => cb());
        readyCallbacks = [];
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkAPI);
      if (!isAPIReady) {
        console.warn("YouTube API failed to load after 10 seconds");
        // Resolve anyway to prevent hanging
        isAPIReady = true;
        readyCallbacks.forEach((cb) => cb());
        readyCallbacks = [];
      }
    }, 10000);
  });
}

export function createYouTubePlayer(
  containerId: string,
  options: {
    videoId?: string;
    width?: number;
    height?: number;
    playerVars?: Record<string, unknown>;
    onStateChange?: (event: { data: number }) => void;
  } = {}
): Promise<YouTubePlayer> {
  return loadYouTubeAPI().then(() => {
    return new Promise((resolve, reject) => {
      // Verify container exists before creating player
      const container = document.getElementById(containerId);
      if (!container) {
        reject(new Error(`Container with id "${containerId}" not found`));
        return;
      }

      // Verify container is still in the DOM
      if (!container.isConnected) {
        reject(new Error(`Container with id "${containerId}" is not connected to DOM`));
        return;
      }

      try {
        const player = new window.YT.Player(containerId, {
          width: String(options.width || 1),
          height: String(options.height || 1),
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
            onError: (event: { data: number }) => {
              console.error("YouTube player error:", event);
              reject(new Error(`YouTube player error: ${event.data}`));
            },
            onStateChange: options.onStateChange || (() => {}),
          },
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

export function getPlayerInstance(): YouTubePlayer | null {
  return playerInstance;
}
