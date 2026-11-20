import { useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Droplets,
  ExternalLink,
  Pin,
  Thermometer,
  Wind,
  X
} from 'lucide-react';
import { describeWeatherCode } from '../../services/openMeteo';
import { getYouTubeWatchUrl } from '../../services/youtubeApi';
import { useWarRoomStore } from '../../store/useWarRoomStore';
import type { Webcam } from '../../types/webcam';
import { YouTubeLivePlayer } from './YouTubeLivePlayer';

interface FocusTheaterModalProps {
  webcams: Webcam[];
}

export function FocusTheaterModal({ webcams }: FocusTheaterModalProps) {
  const focusedCamId = useWarRoomStore((s) => s.focusedCamId);
  const pinnedIds = useWarRoomStore((s) => s.pinnedIds);
  const telemetryById = useWarRoomStore((s) => s.telemetryById);
  const setFocusedCamId = useWarRoomStore((s) => s.setFocusedCamId);
  const togglePin = useWarRoomStore((s) => s.togglePin);
  const requestFlyTo = useWarRoomStore((s) => s.requestFlyTo);

  const currentIdx = webcams.findIndex((c) => c.id === focusedCamId);
  const cam = currentIdx >= 0 ? webcams[currentIdx] : null;

  useEffect(() => {
    if (!cam) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocusedCamId(null);
      if (e.key === 'ArrowLeft') {
        const prev = webcams[(currentIdx - 1 + webcams.length) % webcams.length];
        setFocusedCamId(prev.id);
      }
      if (e.key === 'ArrowRight') {
        const next = webcams[(currentIdx + 1) % webcams.length];
        setFocusedCamId(next.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cam, currentIdx, webcams, setFocusedCamId]);

  if (!cam) return null;

  const isPinned = pinnedIds.includes(cam.id);
  const telemetry = telemetryById[cam.id];

  const goPrev = () => {
    const prev = webcams[(currentIdx - 1 + webcams.length) % webcams.length];
    setFocusedCamId(prev.id);
  };
  const goNext = () => {
    const next = webcams[(currentIdx + 1) % webcams.length];
    setFocusedCamId(next.id);
  };

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-md sm:p-6"
      onClick={() => setFocusedCamId(null)}
    >
      <div
        className="hud-glass-strong relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 頂部標題與控制 */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-400/20 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
            <div>
              <h2 className="text-base font-bold text-white sm:text-lg">{cam.name}</h2>
              <p className="font-mono-tech text-[11px] text-slate-400">
                {cam.county} · {cam.lat.toFixed(4)}°N, {cam.lng.toFixed(4)}°E · LV.{cam.level}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={goPrev}
              title="上一支鏡頭 (←)"
              className="rounded-lg border border-slate-700/80 bg-slate-900/80 p-2 text-slate-300 hover:border-cyan-400/50 hover:text-white cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              title="下一支鏡頭 (→)"
              className="rounded-lg border border-slate-700/80 bg-slate-900/80 p-2 text-slate-300 hover:border-cyan-400/50 hover:text-white cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => togglePin(cam.id)}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                isPinned
                  ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                  : 'border-slate-700/80 bg-slate-900/80 text-slate-200 hover:border-amber-400/40'
              }`}
            >
              <Pin className="h-3.5 w-3.5" />
              {isPinned ? '已釘選' : '釘選'}
            </button>
            <button
              type="button"
              onClick={() => {
                requestFlyTo(cam.lat, cam.lng, 12);
                setFocusedCamId(null);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-sky-400/50 cursor-pointer"
            >
              <Crosshair className="h-3.5 w-3.5" />
              定位
            </button>
            <a
              href={getYouTubeWatchUrl(cam.stream.videoId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-sky-400/50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              YT
            </a>
            <button
              type="button"
              onClick={() => setFocusedCamId(null)}
              aria-label="關閉劇院視窗"
              className="rounded-lg border border-slate-700/80 bg-slate-900/80 p-2 text-slate-300 hover:border-rose-400/60 hover:text-rose-300 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 16:9 劇院播放器 */}
        <div className="relative aspect-video w-full bg-black">
          <YouTubeLivePlayer
            key={cam.id}
            videoId={cam.stream.videoId}
            backupVideoIds={cam.stream.backupVideoIds}
            title={cam.name}
            muted={false}
          />
        </div>

        {/* 底部即時氣象遙測儀表列 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sky-400/15 bg-slate-950/90 px-4 py-2.5 text-xs">
          {telemetry ? (
            <div className="flex flex-wrap items-center gap-4 font-mono-tech">
              <span className="inline-flex items-center gap-1.5 text-sky-300">
                <Thermometer className="h-3.5 w-3.5" />
                {telemetry.temperature.toFixed(1)}°C ({describeWeatherCode(telemetry.weatherCode)})
              </span>
              <span className="inline-flex items-center gap-1.5 text-teal-300">
                <Wind className="h-3.5 w-3.5" />
                風速 {telemetry.windSpeed.toFixed(1)} km/h · 陣風{' '}
                <strong className={telemetry.windGusts >= 35 ? 'text-amber-300' : 'text-white'}>
                  {telemetry.windGusts.toFixed(1)}
                </strong>{' '}
                km/h
              </span>
              <span className="inline-flex items-center gap-1.5 text-cyan-300">
                <Droplets className="h-3.5 w-3.5" />
                降雨 {telemetry.precipitation.toFixed(1)} mm
              </span>
            </div>
          ) : (
            <span className="text-slate-400">正在同步該地點 Open-Meteo 即時風雨遙測…</span>
          )}

          <div className="flex items-center gap-1.5">
            {cam.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-sky-400/25 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-300"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
