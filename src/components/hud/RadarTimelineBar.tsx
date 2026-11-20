import { useEffect } from 'react';
import { Pause, Play } from 'lucide-react';
import { formatTaipeiFrameTime } from '../../services/rainViewer';
import { useWarRoomStore } from '../../store/useWarRoomStore';
import { isMapCurrentlyInteracting } from '../map/WarRoomMap';

interface RadarTimelineBarProps {
  isMobile: boolean;
}

/**
 * 極簡 2 小時動態雨帶時間軸（僅於「動態雨帶」啟用時浮現於底部切換列正上方）
 */
export function RadarTimelineBar({ isMobile }: RadarTimelineBarProps) {
  const activeLayer = useWarRoomStore((s) => s.activeLayer);
  const playing = useWarRoomStore((s) => s.rainViewerPlaying);
  const frames = useWarRoomStore((s) => s.rainViewerFrames);
  const frameIndex = useWarRoomStore((s) => s.rainViewerFrameIndex);
  const kioskMode = useWarRoomStore((s) => s.kioskMode);
  const setPlaying = useWarRoomStore((s) => s.setRainViewerPlaying);
  const setFrameIndex = useWarRoomStore((s) => s.setRainViewerFrameIndex);

  const enabled = activeLayer === 'rainViewer';

  useEffect(() => {
    if (!enabled || !playing || frames.length <= 1) return;
    const interval = window.setInterval(() => {
      // 分頁隱藏或使用者正在拖拉縮放地圖時暫停推進幀，避免圖磚請求雪崩
      if (document.hidden || isMapCurrentlyInteracting()) return;
      const cur = useWarRoomStore.getState().rainViewerFrameIndex;
      setFrameIndex((cur + 1) % frames.length);
    }, 900);
    return () => window.clearInterval(interval);
  }, [enabled, playing, frames.length, setFrameIndex]);

  if (!enabled || frames.length === 0) return null;

  const activeFrame = frames[frameIndex] ?? frames[frames.length - 1];

  return (
    <div
      className={`hud-glass fixed left-1/2 z-[760] flex -translate-x-1/2 items-center gap-2.5 rounded-full px-3 py-1.5 ${
        kioskMode
          ? 'bottom-4 w-[300px]'
          : isMobile
          ? 'bottom-[132px] w-[calc(100vw-32px)] max-w-sm'
          : 'bottom-[68px] w-[320px]'
      }`}
    >
      <button
        type="button"
        onClick={() => setPlaying(!playing)}
        aria-label={playing ? '暫停雨帶動畫' : '播放雨帶動畫'}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/25 text-sky-200 ring-1 ring-sky-400/50 hover:bg-sky-500/35 cursor-pointer"
      >
        {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
      </button>

      <input
        type="range"
        min={0}
        max={Math.max(0, frames.length - 1)}
        value={frameIndex}
        onChange={(e) => {
          setPlaying(false);
          setFrameIndex(Number(e.target.value));
        }}
        className="h-1 flex-1 accent-sky-400 cursor-pointer"
      />

      <span className="shrink-0 font-mono-tech text-[11px] font-semibold text-sky-200">
        {formatTaipeiFrameTime(activeFrame.time)}
      </span>
    </div>
  );
}
