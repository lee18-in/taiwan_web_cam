import {
  CloudRain,
  Film,
  Layers,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Type,
  Wind,
  X
} from 'lucide-react';
import {
  BASEMAP_LIST,
  BASEMAPS,
  RADAR_LEGEND_STOPS,
  RAINFALL_LEGEND_STOPS,
  WAR_ROOM_COMBOS,
  WEATHER_LAYER_LIST
} from '../../data/mapLayers';
import { useWarRoomStore, type WindDensity } from '../../store/useWarRoomStore';

interface WeatherDrawerProps {
  rightOffsetPx: number;
  isMobile: boolean;
}

function formatShortTime(ts: number): string {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(ts));
}

export function WeatherDrawer({ rightOffsetPx, isMobile }: WeatherDrawerProps) {
  const open = useWarRoomStore((s) => s.weatherDrawerOpen);
  const basemap = useWarRoomStore((s) => s.basemap);
  const labelsOnTop = useWarRoomStore((s) => s.labelsOnTop);
  const overlays = useWarRoomStore((s) => s.overlays);
  const windEnabled = useWarRoomStore((s) => s.windEnabled);
  const windDensity = useWarRoomStore((s) => s.windDensity);
  const rainViewerEnabled = useWarRoomStore((s) => s.rainViewerEnabled);
  const rainViewerOpacity = useWarRoomStore((s) => s.rainViewerOpacity);
  const autoRefreshEnabled = useWarRoomStore((s) => s.autoRefreshEnabled);
  const lastWeatherRefreshAt = useWarRoomStore((s) => s.lastWeatherRefreshAt);

  const setWeatherDrawerOpen = useWarRoomStore((s) => s.setWeatherDrawerOpen);
  const setBasemap = useWarRoomStore((s) => s.setBasemap);
  const setLabelsOnTop = useWarRoomStore((s) => s.setLabelsOnTop);
  const toggleOverlay = useWarRoomStore((s) => s.toggleOverlay);
  const setOverlayOpacity = useWarRoomStore((s) => s.setOverlayOpacity);
  const setOverlayBlendMode = useWarRoomStore((s) => s.setOverlayBlendMode);
  const setWindEnabled = useWarRoomStore((s) => s.setWindEnabled);
  const setWindDensity = useWarRoomStore((s) => s.setWindDensity);
  const setRainViewerEnabled = useWarRoomStore((s) => s.setRainViewerEnabled);
  const setRainViewerOpacity = useWarRoomStore((s) => s.setRainViewerOpacity);
  const triggerWeatherRefresh = useWarRoomStore((s) => s.triggerWeatherRefresh);
  const setAutoRefreshEnabled = useWarRoomStore((s) => s.setAutoRefreshEnabled);
  const applyComboPreset = useWarRoomStore((s) => s.applyComboPreset);
  const setCalibrationOpen = useWarRoomStore((s) => s.setCalibrationOpen);

  if (!open) return null;

  const supportsLabels = BASEMAPS[basemap].supportsLabelsOnTop;
  const showRadarLegend = overlays.radar.enabled || rainViewerEnabled;
  const showRainfallLegend = overlays.rainfall.enabled;

  return (
    <aside
      style={!isMobile ? { right: `${Math.max(16, rightOffsetPx + 12)}px` } : undefined}
      className={`hud-glass-strong fixed z-[860] flex max-h-[calc(100vh-5.5rem)] flex-col overflow-hidden rounded-2xl ${
        isMobile ? 'inset-x-3 top-16' : 'top-16 w-[328px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sky-400/20 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-bold text-white">底圖與氣象圖層中心</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={triggerWeatherRefresh}
            title="立即刷新所有氣象圖資"
            className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-1.5 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-300 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setWeatherDrawerOpen(false)}
            aria-label="關閉圖層控制台"
            className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-1.5 text-slate-300 hover:border-rose-400/50 hover:text-rose-300 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="thin-scroll flex-1 space-y-4 overflow-y-auto p-3.5 text-xs">
        {/* 1. 一鍵戰情組合 */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-slate-300">一鍵戰情組合</span>
            <span className="font-mono-tech text-[10px] text-slate-400">
              刷新 {formatShortTime(lastWeatherRefreshAt)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {WAR_ROOM_COMBOS.map((combo) => (
              <button
                key={combo.id}
                type="button"
                onClick={() => applyComboPreset(combo.id)}
                title={combo.description}
                className="rounded-xl border border-slate-700/70 bg-slate-900/75 px-2.5 py-2 text-left transition hover:border-cyan-400/60 hover:bg-cyan-500/10 cursor-pointer"
              >
                <div className="font-semibold text-slate-100">{combo.label}</div>
                <div className="mt-0.5 truncate text-[10px] text-slate-400">
                  {combo.description}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 2. 三種免費底圖切換 + 地名置頂 */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-slate-300">底圖切換（免重調座標）</span>
            {supportsLabels && (
              <button
                type="button"
                onClick={() => setLabelsOnTop(!labelsOnTop)}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition cursor-pointer ${
                  labelsOnTop
                    ? 'bg-cyan-500/25 text-cyan-200 ring-1 ring-cyan-400/50'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Type className="h-2.5 w-2.5" />
                地名置頂
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {BASEMAP_LIST.map((b) => {
              const active = basemap === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBasemap(b.id)}
                  title={b.description}
                  className={`overflow-hidden rounded-xl border text-center transition cursor-pointer ${
                    active
                      ? 'border-cyan-400 ring-1 ring-cyan-400/50'
                      : 'border-slate-700/70 hover:border-slate-500'
                  }`}
                >
                  <div className="h-9 w-full" style={{ background: b.previewGradient }} />
                  <div
                    className={`py-1 text-[11px] font-medium ${
                      active ? 'bg-cyan-500/20 text-cyan-200' : 'bg-slate-900/90 text-slate-300'
                    }`}
                  >
                    {b.shortName}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. 動態視覺特效層（Windy 動態風場 + RainViewer 2h 動畫） */}
        <section className="space-y-2">
          <div className="font-semibold text-slate-300">動態戰情圖層（即時動畫）</div>

          {/* Windy 風場粒子流線 */}
          <div
            className={`rounded-xl border p-2.5 transition ${
              windEnabled
                ? 'border-cyan-400/50 bg-cyan-500/10'
                : 'border-slate-700/70 bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setWindEnabled(!windEnabled)}
                className="flex items-center gap-2 text-left cursor-pointer"
              >
                <Wind className={`h-4 w-4 ${windEnabled ? 'text-cyan-300' : 'text-slate-400'}`} />
                <div>
                  <div className="font-medium text-slate-100">動態風場粒子流線</div>
                  <div className="text-[10px] text-slate-400">Open-Meteo 台灣風場即時流動</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setWindEnabled(!windEnabled)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold cursor-pointer ${
                  windEnabled ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {windEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {windEnabled && (
              <div className="mt-2.5 flex items-center justify-between border-t border-cyan-400/15 pt-2">
                <span className="text-[10px] text-slate-400">粒子密度</span>
                <div className="flex gap-1">
                  {(['low', 'medium', 'high'] as WindDensity[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setWindDensity(d)}
                      className={`rounded px-2 py-0.5 text-[10px] cursor-pointer ${
                        windDensity === d
                          ? 'bg-cyan-500/30 text-cyan-200 font-semibold'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d === 'low' ? '省電' : d === 'medium' ? '標準' : '濃密'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RainViewer 2 小時動態雷達 */}
          <div
            className={`rounded-xl border p-2.5 transition ${
              rainViewerEnabled
                ? 'border-sky-400/50 bg-sky-500/10'
                : 'border-slate-700/70 bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRainViewerEnabled(!rainViewerEnabled)}
                className="flex items-center gap-2 text-left cursor-pointer"
              >
                <Film
                  className={`h-4 w-4 ${rainViewerEnabled ? 'text-sky-300' : 'text-slate-400'}`}
                />
                <div>
                  <div className="font-medium text-slate-100">2 小時動態雷達回放</div>
                  <div className="text-[10px] text-slate-400">RainViewer 雨帶軌跡時間軸</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRainViewerEnabled(!rainViewerEnabled)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold cursor-pointer ${
                  rainViewerEnabled ? 'bg-sky-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {rainViewerEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {rainViewerEnabled && (
              <div className="mt-2.5 flex items-center gap-2 border-t border-sky-400/15 pt-2">
                <span className="text-[10px] text-slate-400">透明度</span>
                <input
                  type="range"
                  min={0.2}
                  max={0.95}
                  step={0.05}
                  value={rainViewerOpacity}
                  onChange={(e) => setRainViewerOpacity(Number(e.target.value))}
                  className="h-1 flex-1 accent-sky-400 cursor-pointer"
                />
                <span className="w-8 text-right font-mono-tech text-[10px] text-sky-300">
                  {Math.round(rainViewerOpacity * 100)}%
                </span>
              </div>
            )}
          </div>
        </section>

        {/* 4. 中央氣象署 8 組高解析官方疊圖（多選疊加） */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <CloudRain className="h-3.5 w-3.5 text-sky-400" />
              中央氣象署高解析疊圖（可多選）
            </span>
          </div>

          <div className="space-y-1.5">
            {WEATHER_LAYER_LIST.map((cfg) => {
              const st = overlays[cfg.id];
              return (
                <div
                  key={cfg.id}
                  className={`rounded-xl border px-2.5 py-2 transition ${
                    st.enabled
                      ? 'border-sky-400/45 bg-sky-500/10'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleOverlay(cfg.id)}
                      className="flex flex-1 items-center gap-2 text-left cursor-pointer"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          st.enabled ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-600'
                        }`}
                      />
                      <span
                        className={`font-medium ${
                          st.enabled ? 'text-white' : 'text-slate-300'
                        }`}
                      >
                        {cfg.name}
                      </span>
                    </button>

                    {st.enabled && (
                      <button
                        type="button"
                        onClick={() =>
                          setOverlayBlendMode(
                            cfg.id,
                            st.blendMode === 'screen' ? 'normal' : 'screen'
                          )
                        }
                        title="切換發光濾色模式（讓暗色底融入夜空）"
                        className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] transition cursor-pointer ${
                          st.blendMode === 'screen'
                            ? 'bg-fuchsia-500/25 text-fuchsia-200 ring-1 ring-fuchsia-400/40'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Sparkles className="h-2.5 w-2.5" />
                        濾色
                      </button>
                    )}
                  </div>

                  {st.enabled && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">透明</span>
                      <input
                        type="range"
                        min={0.15}
                        max={1}
                        step={0.05}
                        value={st.opacity}
                        onChange={(e) => setOverlayOpacity(cfg.id, Number(e.target.value))}
                        className="h-1 flex-1 accent-cyan-400 cursor-pointer"
                      />
                      <span className="w-8 text-right font-mono-tech text-[10px] text-cyan-300">
                        {Math.round(st.opacity * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. 色階參考圖例 */}
        {(showRadarLegend || showRainfallLegend) && (
          <section className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
            {showRadarLegend && (
              <div>
                <div className="mb-1 flex justify-between text-[10px] text-slate-400">
                  <span>雷達回波強度 (dBZ)</span>
                  <span>弱 → 極強降雨</span>
                </div>
                <div className="grid grid-cols-6 gap-0.5 overflow-hidden rounded">
                  {RADAR_LEGEND_STOPS.map((s) => (
                    <div key={s.label} className="text-center">
                      <div className="h-2 w-full" style={{ backgroundColor: s.color }} />
                      <div className="mt-0.5 font-mono-tech text-[9px] text-slate-400">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showRainfallLegend && (
              <div>
                <div className="mb-1 flex justify-between text-[10px] text-slate-400">
                  <span>日累積雨量 (mm)</span>
                  <span>小雨 → 超大豪雨</span>
                </div>
                <div className="grid grid-cols-6 gap-0.5 overflow-hidden rounded">
                  {RAINFALL_LEGEND_STOPS.map((s) => (
                    <div key={s.label} className="text-center">
                      <div className="h-2 w-full" style={{ backgroundColor: s.color }} />
                      <div className="mt-0.5 font-mono-tech text-[9px] text-slate-400">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* 6. 自動刷新與開發校正入口 */}
        <section className="flex items-center justify-between border-t border-slate-800 pt-2.5 text-[11px]">
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              className="accent-cyan-400"
            />
            每 10 分鐘無感自動刷新
          </label>
          <button
            type="button"
            onClick={() => {
              setCalibrationOpen(true);
              setWeatherDrawerOpen(false);
            }}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-amber-300 cursor-pointer"
          >
            <SlidersHorizontal className="h-3 w-3" />
            邊界校正
          </button>
        </section>
      </div>
    </aside>
  );
}
