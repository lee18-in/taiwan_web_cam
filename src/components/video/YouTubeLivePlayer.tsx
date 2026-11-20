import { useEffect, useRef, useState } from 'react';
import {
  createYouTubeFallbackEmbedUrl,
  getYouTubeThumbnailUrl,
  loadYouTubeIframeApi,
  type YTPlayerInstance
} from '../../services/youtubeApi';

interface YouTubeLivePlayerProps {
  videoId: string;
  backupVideoIds?: string[];
  title: string;
  staggerDelayMs?: number;
  muted?: boolean;
  onFatalError?: () => void;
}

/**
 * 正式接入 YouTube Iframe Player API 的即時播放器：
 * - 支援錯峰掛載（staggerDelayMs）避免開站瞬間搶頻寬
 * - 監聽 onError 自動切換 backupVideoIds，全失效時通知上層遞補鏡頭
 * - 若 API 腳本載入逾時，自動退回標準 embed iframe 確保可用
 */
export function YouTubeLivePlayer({
  videoId,
  backupVideoIds = [],
  title,
  staggerDelayMs = 0,
  muted = true,
  onFatalError
}: YouTubeLivePlayerProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const initialStaggerRef = useRef(staggerDelayMs);
  const [readyToMount, setReadyToMount] = useState(staggerDelayMs === 0);
  const [attemptIndex, setAttemptIndex] = useState(0);
  const [useFallbackIframe, setUseFallbackIframe] = useState(false);

  const candidateIds = [videoId, ...backupVideoIds].filter(Boolean);
  const activeVideoId = candidateIds[attemptIndex] ?? videoId;

  // 僅於首次掛載錯峰延遲，後續陣列索引變動絕不重跑
  useEffect(() => {
    const delay = initialStaggerRef.current;
    if (delay <= 0) {
      setReadyToMount(true);
      return;
    }
    const timer = window.setTimeout(() => setReadyToMount(true), delay);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!readyToMount || useFallbackIframe) return;
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;

    void loadYouTubeIframeApi().then((YT) => {
      if (disposed || !hostRef.current) return;
      if (!YT?.Player) {
        setUseFallbackIframe(true);
        return;
      }

      // 每次重建需乾淨子容器，避免 YT.Player 替換掉 React 管控的 ref
      hostRef.current.innerHTML = '';
      const mountNode = document.createElement('div');
      mountNode.style.width = '100%';
      mountNode.style.height = '100%';
      hostRef.current.appendChild(mountNode);

      const origin =
        window.location.origin && window.location.origin !== 'null'
          ? window.location.origin
          : undefined;

      try {
        playerRef.current = new YT.Player(mountNode, {
          videoId: activeVideoId,
          playerVars: {
            autoplay: 1,
            mute: muted ? 1 : 0,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            ...(origin ? { origin } : {})
          },
          events: {
            onReady: (ev) => {
              if (muted) ev.target.mute();
              ev.target.playVideo();
            },
            onError: () => {
              if (disposed) return;
              if (attemptIndex + 1 < candidateIds.length) {
                setAttemptIndex((i) => i + 1);
              } else {
                onFatalError?.();
              }
            }
          }
        });
      } catch {
        setUseFallbackIframe(true);
      }
    });

    return () => {
      disposed = true;
      // 主動將 iframe 指向 about:blank，促使 Chromium 立即回收 MSE 影音解碼記憶體
      if (hostRef.current) {
        hostRef.current.querySelectorAll('iframe').forEach((frame) => {
          try {
            frame.src = 'about:blank';
          } catch {
            // ignore
          }
        });
      }
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore destroy error
      }
      playerRef.current = null;
      if (hostRef.current) {
        hostRef.current.innerHTML = '';
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToMount, activeVideoId, useFallbackIframe, muted]);

  if (!readyToMount) {
    return (
      <div className="relative h-full w-full bg-slate-950 overflow-hidden">
        <img
          src={getYouTubeThumbnailUrl(activeVideoId)}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
          <span className="font-mono-tech text-[10px] tracking-widest text-cyan-300/90 uppercase">
            SYNCING FEED...
          </span>
        </div>
      </div>
    );
  }

  if (useFallbackIframe) {
    return (
      <iframe
        src={createYouTubeFallbackEmbedUrl(activeVideoId, true)}
        title={title}
        className="h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        loading="lazy"
        allowFullScreen
      />
    );
  }

  return (
    <div
      ref={hostRef}
      className="h-full w-full bg-black [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-0"
    />
  );
}
