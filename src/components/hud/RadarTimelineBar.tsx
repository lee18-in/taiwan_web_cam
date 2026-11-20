import { useEffect } from 'react';
import { Pause, Play, X } from 'lucide-react';
import { formatTaipeiFrameTime } from '../../services/rainViewer';
import { useWarRoomStore } from '../../store/useWarRoomStore';

interface RadarTimelineBarProps {
  isMobile: boolean;
}

export function RadarTimelineBar({ isMobile }: RadarTimelineBarProps) {
  const enabled = useWarRoomStore((s) => s.rainViewerEnabled);
  const playing = useWarRoomStore((s) => s.rainViewerPlaying);
  const frames = useWarRoomStore((s) => s.rainViewerFrames);
  const frameIndex = useWarRoomStore((s) => s.rainViewerFrameIndex);
  const setPlaying = useWarRoomStore((s) => s.setRainViewerPlaying);
  const setFrameIndex = useWarRoomStore((s) => s.setRainViewerFrameIndex);
  const setEnabled = useWarRoomStore((s) => s.setRainViewerEnabled);

  useEffect(() => {
    if (!enabled || !playing || frames.length <= 1) return;
    const interval = window.setInterval(() => {
      const cur = useWarRoomStore.getState().rainViewerFrameIndex;
      setFrameIndex((cur + 1) % frames.length);
    }, 750);
    return () => window.clearInterval(interval);
  }, [enabled, playing, frames.length, setFrameIndex]);

  if (!enabled || frames.length === 0) return null;

  const activeFrame = frames[frameIndex] ?? frames[frames.length - 1];

  return (
    <div
      className={`hud-glass fixed left-1/2 z-[760] flex -translate-x-1/2 items-center gap-3 rounded-2xl px-3.5 py-2 ${
        isMobile ? 'bottom-20 w-[calc(100vw-24px)] max-w-md' : 'bottom-4 w-[360px]'
      }`}
    >
      <button
        type="button"
        onClick={() => setPlaying(!playing)}
        aria-label={playing ? '暫停雷達動畫' : '播放雷達動畫'}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500/25 text-sky-200 ring-1 ring-sky-400/50 hover:bg-sky-500/35 cursor-pointer"
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
      </button>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-sky-200">2 小時動態雨帶</span>
          <span className="font-mono-tech font-semibold text-white">
            {formatTaipeiFrameTime(activeFrame.time)} TPE
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(0, frames.length - 1)}
          value={frameIndex}
          onChange={(e) => {
            setPlaying(false);
            setFrameIndex(Number(e.target.value));
          }}
          className="h-1.5 w-full accent-sky-400 cursor-pointer"
        />
      </div>

      <button
        type="button"
        onClick={() => setEnabled(false)}
        aria-label="關閉動態雷達"
        className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
