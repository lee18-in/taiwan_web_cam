import { Crosshair, ExternalLink, Maximize2, Pin, Play, Wind, Droplets } from 'lucide-react';
import { getYouTubeThumbnailUrl, getYouTubeWatchUrl } from '../../services/youtubeApi';
import type { CameraWeatherTelemetry, Webcam } from '../../types/webcam';
import { YouTubeLivePlayer } from './YouTubeLivePlayer';

interface VideoCardProps {
  cam: Webcam;
  isPinned: boolean;
  isHovered: boolean;
  shouldPlayLive: boolean;
  staggerDelayMs: number;
  telemetry?: CameraWeatherTelemetry;
  compact?: boolean;
  onTogglePin: (id: string) => void;
  onFocus: (id: string) => void;
  onLocate: (cam: Webcam) => void;
  onHover: (id: string | null) => void;
  onActivateFacade: (id: string) => void;
  onStreamError: (id: string) => void;
}

export function VideoCard({
  cam,
  isPinned,
  isHovered,
  shouldPlayLive,
  staggerDelayMs,
  telemetry,
  compact = false,
  onTogglePin,
  onFocus,
  onLocate,
  onHover,
  onActivateFacade,
  onStreamError
}: VideoCardProps) {
  const highWind = (telemetry?.windGusts ?? 0) >= 35;
  const heavyRain = (telemetry?.precipitation ?? 0) >= 3;

  return (
    <div
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-xl border bg-[#070e1c]/92 shadow-2xl transition-colors duration-200 ${
        isHovered
          ? 'border-cyan-400/80 ring-1 ring-cyan-400/40'
          : isPinned
          ? 'border-amber-400/60'
          : 'border-sky-400/20 hover:border-cyan-400/50'
      }`}
      onMouseEnter={() => onHover(cam.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* 頂部戰情資訊列 */}
      <div className="flex h-8 shrink-0 items-center justify-between gap-1.5 border-b border-sky-400/15 bg-slate-950/90 px-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          {isPinned ? (
            <Pin className="h-3 w-3 shrink-0 text-amber-400 fill-amber-400" />
          ) : (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
          )}
          <span className="truncate text-xs font-medium text-slate-100" title={cam.name}>
            {cam.name}
          </span>
          {!compact && (
            <span className="hidden shrink-0 rounded bg-slate-800/90 px-1 py-0.5 text-[10px] text-slate-400 xl:inline">
              {cam.county}
            </span>
          )}
        </div>

        {/* 即時 Open-Meteo 風雨遙測角標 */}
        {telemetry && (
          <div className="flex shrink-0 items-center gap-1.5 font-mono-tech text-[10px]">
            <span className="text-sky-300">{Math.round(telemetry.temperature)}°</span>
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 ${
                highWind
                  ? 'bg-amber-500/25 text-amber-300 font-semibold'
                  : 'text-slate-300'
              }`}
              title={`風速 ${telemetry.windSpeed} / 陣風 ${telemetry.windGusts} km/h`}
            >
              <Wind className="h-2.5 w-2.5" />
              {Math.round(telemetry.windGusts || telemetry.windSpeed)}
            </span>
            {telemetry.precipitation > 0 && (
              <span
                className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 ${
                  heavyRain ? 'bg-rose-500/30 text-rose-200 font-semibold' : 'text-cyan-300'
                }`}
                title={`降雨 ${telemetry.precipitation} mm`}
              >
                <Droplets className="h-2.5 w-2.5" />
                {telemetry.precipitation.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 16:9 影音區域（活體直播 或 節能縮圖延遲啟動） */}
      <div className="relative flex-1 bg-black overflow-hidden">
        {shouldPlayLive ? (
          <YouTubeLivePlayer
            videoId={cam.stream.videoId}
            backupVideoIds={cam.stream.backupVideoIds}
            title={cam.name}
            staggerDelayMs={staggerDelayMs}
            onFatalError={() => onStreamError(cam.id)}
          />
        ) : (
          <button
            type="button"
            onClick={() => onActivateFacade(cam.id)}
            className="relative flex h-full w-full items-center justify-center bg-slate-950 text-left cursor-pointer group/play overflow-hidden"
          >
            <img
              src={getYouTubeThumbnailUrl(cam.stream.videoId)}
              alt={cam.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-300 group-hover/play:scale-105 group-hover/play:opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
            <div className="relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-cyan-400/60 bg-slate-950/85 px-3.5 py-1.5 text-xs font-medium text-cyan-200 shadow-lg backdrop-blur-md transition group-hover/play:bg-cyan-500/25 group-hover/play:text-white">
              <Play className="h-3.5 w-3.5 fill-current" />
              點擊啟動直播
            </div>
          </button>
        )}

        {/* Hover 快捷操作浮動條（底部右側，不擋標題與中央畫面） */}
        <div className="pointer-events-auto absolute right-1.5 bottom-1.5 z-10 flex items-center gap-1 rounded-lg border border-sky-400/25 bg-slate-950/85 p-1 opacity-0 backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={() => onTogglePin(cam.id)}
            title={isPinned ? '取消釘選' : '釘選固定（拖曳地圖不被換掉）'}
            className={`rounded p-1 transition cursor-pointer ${
              isPinned
                ? 'bg-amber-500/25 text-amber-300'
                : 'text-slate-300 hover:bg-slate-800 hover:text-amber-300'
            }`}
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onFocus(cam.id)}
            title="劇院大畫面"
            className="rounded p-1 text-slate-300 transition hover:bg-slate-800 hover:text-cyan-300 cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onLocate(cam)}
            title="地圖飛往該鏡頭"
            className="rounded p-1 text-slate-300 transition hover:bg-slate-800 hover:text-sky-300 cursor-pointer"
          >
            <Crosshair className="h-3.5 w-3.5" />
          </button>
          <a
            href={getYouTubeWatchUrl(cam.stream.videoId)}
            target="_blank"
            rel="noopener noreferrer"
            title="在 YouTube 開啟"
            className="rounded p-1 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
