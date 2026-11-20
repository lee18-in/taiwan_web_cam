import { useEffect, useRef, useState } from 'react';
import {
  ChevronUp,
  Cloud,
  CloudRain,
  Film,
  Map as MapIcon,
  Radio,
  Wind
} from 'lucide-react';
import { BASEMAPS, SATELLITE_SUB_LAYERS, WEATHER_LAYERS } from '../../data/mapLayers';
import { useWarRoomStore } from '../../store/useWarRoomStore';
import type { WeatherLayerId } from '../../types/weather';

interface WeatherQuickBarProps {
  isMobile: boolean;
}

const SAT_IDS = new Set<string>(SATELLITE_SUB_LAYERS.map((s) => s.id));

/**
 * 底部極簡一鍵氣象切換列：
 * - 氣象圖層嚴格互斥單選（點啥顯示啥，其他全關，再點自己關閉），免抽屜、免調透明度
 * - 右側僅保留「風場」獨立開關 與「底圖」一鍵循環切換（暗黑 → 衛星 → 繁中）
 */
export function WeatherQuickBar({ isMobile }: WeatherQuickBarProps) {
  const [cloudMenuOpen, setCloudMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const activeLayer = useWarRoomStore((s) => s.activeLayer);
  const windEnabled = useWarRoomStore((s) => s.windEnabled);
  const basemap = useWarRoomStore((s) => s.basemap);
  const kioskMode = useWarRoomStore((s) => s.kioskMode);
  const selectLayer = useWarRoomStore((s) => s.selectLayer);
  const setWindEnabled = useWarRoomStore((s) => s.setWindEnabled);
  const cycleBasemap = useWarRoomStore((s) => s.cycleBasemap);

  useEffect(() => {
    if (!cloudMenuOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setCloudMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [cloudMenuOpen]);

  if (kioskMode) return null;

  const isSatActive = activeLayer !== null && SAT_IDS.has(activeLayer);
  const activeSatLabel = isSatActive
    ? WEATHER_LAYERS[activeLayer as WeatherLayerId].shortName
    : '雲圖';
  const baseLabel = BASEMAPS[basemap].shortName;

  const btnClass = (active: boolean) =>
    `inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
      active
        ? 'bg-cyan-500/25 text-cyan-100 ring-1 ring-cyan-400/70 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
    }`;

  return (
    <div
      className={`pointer-events-none fixed left-1/2 z-[770] -translate-x-1/2 px-2 ${
        isMobile ? 'bottom-[78px] w-full flex justify-center' : 'bottom-4'
      }`}
    >
      <div className="hud-glass pointer-events-auto relative flex max-w-full items-center gap-1 rounded-2xl p-1.5">
        {/* 單選互斥區：動態雨帶 / 雷達 / 雨量 / 雲圖▾ */}
        <div className="flex items-center gap-1 overflow-x-auto thin-scroll">
          <button
            type="button"
            onClick={() => {
              setCloudMenuOpen(false);
              selectLayer('rainViewer');
            }}
            title="RainViewer 過去 2 小時動態雨帶"
            className={btnClass(activeLayer === 'rainViewer')}
          >
            <Film className="h-3.5 w-3.5" />
            <span>動態雨帶</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCloudMenuOpen(false);
              selectLayer('radar');
            }}
            title="中央氣象署官方雷達回波"
            className={btnClass(activeLayer === 'radar')}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>雷達</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCloudMenuOpen(false);
              selectLayer('rainfall');
            }}
            title="中央氣象署日累積雨量圖"
            className={btnClass(activeLayer === 'rainfall')}
          >
            <CloudRain className="h-3.5 w-3.5" />
            <span>雨量</span>
          </button>

          {/* 衛星雲圖／等壓圖單選按鈕＋向上快選 */}
          <div ref={menuRef} className="relative flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => {
                if (isSatActive) {
                  setCloudMenuOpen((v) => !v);
                } else {
                  selectLayer('trueColor');
                  setCloudMenuOpen(false);
                }
              }}
              title="切換衛星雲圖／地面天氣圖（點箭頭選其他圖種）"
              className={`inline-flex items-center gap-1 rounded-l-xl pl-2.5 pr-1.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                isSatActive
                  ? 'bg-cyan-500/25 text-cyan-100 ring-1 ring-cyan-400/70'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Cloud className="h-3.5 w-3.5" />
              <span>{activeSatLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => setCloudMenuOpen((v) => !v)}
              aria-label="選擇其他衛星或等壓圖"
              className={`inline-flex items-center rounded-r-xl px-1.5 py-1.5 text-xs transition cursor-pointer ${
                isSatActive
                  ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/50 hover:bg-cyan-500/35'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <ChevronUp
                className={`h-3.5 w-3.5 transition-transform ${cloudMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {cloudMenuOpen && (
              <div className="hud-glass-strong fixed sm:absolute bottom-24 sm:bottom-full left-1/2 sm:left-auto sm:right-0 -translate-x-1/2 sm:translate-x-0 mb-2 w-44 rounded-xl p-1.5 z-[900]">
                {SATELLITE_SUB_LAYERS.map((cfg) => {
                  const active = activeLayer === cfg.id;
                  return (
                    <button
                      key={cfg.id}
                      type="button"
                      onClick={() => {
                        selectLayer(cfg.id);
                        setCloudMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                        active
                          ? 'bg-cyan-500/25 text-cyan-100 font-semibold'
                          : 'text-slate-200 hover:bg-slate-800/90'
                      }`}
                    >
                      <span>{cfg.name}</span>
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 分隔線 */}
        <div className="mx-0.5 h-5 w-px shrink-0 bg-slate-700/80" />

        {/* 獨立開關 1：動態風場 */}
        <button
          type="button"
          onClick={() => setWindEnabled(!windEnabled)}
          title="開關動態風場粒子流線（可疊加於任一氣象圖上）"
          className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
            windEnabled
              ? 'bg-teal-500/25 text-teal-200 ring-1 ring-teal-400/60'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <Wind className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">風場</span>
        </button>

        {/* 獨立開關 2：一鍵循環切換底圖（暗黑 → 衛星 → 繁中） */}
        <button
          type="button"
          onClick={cycleBasemap}
          title={`目前底圖：${BASEMAPS[basemap].name}（點擊切換下一個底圖）`}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-700/70 bg-slate-900/70 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-sky-400/50 hover:text-white cursor-pointer"
        >
          <MapIcon className="h-3.5 w-3.5 text-sky-400" />
          <span>{baseLabel}</span>
        </button>
      </div>
    </div>
  );
}
