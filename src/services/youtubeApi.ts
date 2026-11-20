export interface YTPlayerInstance {
  destroy(): void;
  mute(): void;
  unMute(): void;
  playVideo(): void;
  pauseVideo(): void;
  getPlayerState?: () => number;
}

export interface YTPlayerOptions {
  videoId: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: { target: YTPlayerInstance }) => void;
    onError?: (event: { data: number }) => void;
    onStateChange?: (event: { data: number }) => void;
  };
}

interface YTNamespace {
  Player: new (element: HTMLElement | string, options: YTPlayerOptions) => YTPlayerInstance;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace | null> | null = null;

export function loadYouTubeIframeApi(): Promise<YTNamespace | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YTNamespace | null>((resolve) => {
    const timeout = window.setTimeout(() => {
      resolve(window.YT?.Player ? window.YT : null);
    }, 8000);

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      prevReady?.();
      resolve(window.YT ?? null);
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timeout);
        resolve(null);
      };
      document.head.appendChild(script);
    }
  });

  return apiPromise;
}

export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/mqdefault.jpg`;
}

export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

export function createYouTubeFallbackEmbedUrl(videoId: string, autoplay = true): string {
  const origin =
    typeof window !== 'undefined' && window.location.origin !== 'null'
      ? `&origin=${encodeURIComponent(window.location.origin)}`
      : '';
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?mute=1&autoplay=${
    autoplay ? 1 : 0
  }&playsinline=1&rel=0&modestbranding=1${origin}`;
}
