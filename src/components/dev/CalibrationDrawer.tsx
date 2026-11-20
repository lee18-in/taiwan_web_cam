import { useState } from 'react';
import { Check, Copy, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { CALIBRATION_GROUPS, DEFAULT_CALIBRATION_BOUNDS } from '../../data/mapLayers';
import { useWarRoomStore } from '../../store/useWarRoomStore';
import type { CalibrationGroupId } from '../../types/weather';

const GROUP_IDS: CalibrationGroupId[] = ['radar', 'rainfall', 'sat1350', 'sat800', 'sfc'];

/**
 * 開發者疊圖邊界校正工具（Lazy-Load 載入，僅 ?debug=calib 或由圖層選單開啟）：
 * 支援 0.005 / 0.001 精細步進、即時套用並暫存 LocalStorage、一鍵複製 JSON 片段。
 */
export default function CalibrationDrawer() {
  const open = useWarRoomStore((s) => s.calibrationOpen);
  const customBounds = useWarRoomStore((s) => s.customBounds);
  const setCalibrationOpen = useWarRoomStore((s) => s.setCalibrationOpen);
  const setCustomBounds = useWarRoomStore((s) => s.setCustomBounds);
  const resetCustomBounds = useWarRoomStore((s) => s.resetCustomBounds);

  const [activeGroup, setActiveGroup] = useState<CalibrationGroupId>('radar');
  const [fineStep, setFineStep] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const meta = CALIBRATION_GROUPS[activeGroup];
  const bounds = customBounds[activeGroup] ?? DEFAULT_CALIBRATION_BOUNDS[activeGroup];
  const [s, w] = bounds[0];
  const [n, e] = bounds[1];
  const step = fineStep ? 0.001 : 0.005;

  const updateEdge = (edge: 'n' | 's' | 'w' | 'e', val: number) => {
    const next: [[number, number], [number, number]] = [
      [edge === 's' ? val : s, edge === 'w' ? val : w],
      [edge === 'n' ? val : n, edge === 'e' ? val : e]
    ];
    setCustomBounds(activeGroup, next);
  };

  const jsonSnippet = `[[${s.toFixed(3)}, ${w.toFixed(3)}], [${n.toFixed(3)}, ${e.toFixed(3)}]]`;

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(jsonSnippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('複製座標陣列：', jsonSnippet);
    }
  };

  return (
    <div className="hud-glass-strong fixed bottom-4 right-4 z-[920] w-[340px] max-w-[calc(100vw-24px)] rounded-2xl border-amber-400/50 p-4 text-xs">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <SlidersHorizontal className="h-4 w-4" />
          <span>開發者疊圖校正工具</span>
        </div>
        <button
          type="button"
          onClick={() => setCalibrationOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 5 組群組分頁 */}
      <div className="mb-3 flex flex-wrap gap-1">
        {GROUP_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveGroup(id)}
            className={`rounded-lg px-2 py-1 text-[11px] font-medium cursor-pointer ${
              activeGroup === id
                ? 'bg-amber-500/25 text-amber-200 ring-1 ring-amber-400/50'
                : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
          >
            {id}
          </button>
        ))}
      </div>

      <div className="mb-2 flex items-center justify-between text-[11px] text-slate-300">
        <span>{meta.title}</span>
        <label className="flex items-center gap-1 text-[10px] text-amber-200 cursor-pointer">
          <input
            type="checkbox"
            checked={fineStep}
            onChange={(ev) => setFineStep(ev.target.checked)}
            className="accent-amber-400"
          />
          精細 0.001
        </label>
      </div>

      {/* 四方位滑桿 */}
      <div className="space-y-2">
        {(
          [
            { key: 'n', label: '北 (上)', value: n, range: meta.range.n },
            { key: 's', label: '南 (下)', value: s, range: meta.range.s },
            { key: 'w', label: '西 (左)', value: w, range: meta.range.w },
            { key: 'e', label: '東 (右)', value: e, range: meta.range.e }
          ] as const
        ).map((item) => (
          <div key={item.key} className="grid grid-cols-[48px_1fr_54px] items-center gap-2">
            <span className="text-slate-300">{item.label}</span>
            <input
              type="range"
              min={item.range.min}
              max={item.range.max}
              step={step}
              value={item.value}
              onChange={(ev) => updateEdge(item.key, Number(ev.target.value))}
              className="h-1.5 accent-amber-400 cursor-pointer"
            />
            <span className="text-right font-mono-tech text-cyan-300">
              {item.value.toFixed(3)}
            </span>
          </div>
        ))}
      </div>

      {/* 輸出與操作 */}
      <div className="mt-3 rounded-xl border border-slate-700/80 bg-slate-950/90 p-2">
        <div className="mb-1 text-[10px] text-slate-400">
          已即時存至 LocalStorage；複製貼回 <code className="text-amber-300">mapLayers.ts</code>：
        </div>
        <div className="font-mono-tech text-[11px] text-amber-300 select-all">{jsonSnippet}</div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => resetCustomBounds(activeGroup)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-slate-300 hover:border-slate-500 hover:text-white cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          還原預設
        </button>
        <button
          type="button"
          onClick={() => void copySnippet()}
          className="inline-flex items-center gap-1 rounded-lg bg-amber-500/25 px-3 py-1.5 font-semibold text-amber-200 ring-1 ring-amber-400/50 hover:bg-amber-500/35 cursor-pointer"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? '已複製' : '複製座標'}
        </button>
      </div>
    </div>
  );
}
