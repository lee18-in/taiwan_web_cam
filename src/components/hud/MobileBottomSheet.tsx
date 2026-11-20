import { ChevronDown, ChevronUp } from 'lucide-react';
import { sortMobileCams } from '../../core/spatialSorter';
import { useWarRoomStore } from '../../store/useWarRoomStore';
import type { PresetFilter, Webcam } from '../../types/webcam';
import { VideoCard } from '../video/VideoCard';

interface MobileBottomSheetProps {
  displayedCams: Webcam[];
  allWebcams: Webcam[];
}

const MOBILE_CHIPS: { id: PresetFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'coast', label: '🌊 沿海' },
  { id: 'mountain', label: '🏔️ 山區' },
  { id: 'reservoir', label: '💧 水庫' },
  { id: 'traffic', label: '🌧️ 路況' },
  { id: 'island', label: '🏝️ 離島' },
  { id: 'pinned', label: '📌 釘選' }
];

export function MobileBottomSheet({ displayedCams, allWebcams }: MobileBottomSheetProps) {
  const sheetState = useWarRoomStore((s) => s.mobileSheetState);
  const pinnedIds = useWarRoomStore((s) => s.pinnedIds);
  const hoveredCamId = useWarRoomStore((s) => s.hoveredCamId);
  const activatedFacadeIds = useWarRoomStore((s) => s.activatedFacadeIds);
  const telemetryById = useWarRoomStore((s) => s.telemetryById);
  const presetFilter = useWarRoomStore((s) => s.presetFilter);

  const setSheetState = useWarRoomStore((s) => s.setMobileSheetState);
  const togglePin = useWarRoomStore((s) => s.togglePin);
  const setFocusedCamId = useWarRoomStore((s) => s.setFocusedCamId);
  const requestFlyTo = useWarRoomStore((s) => s.requestFlyTo);
  const setHoveredCamId = useWarRoomStore((s) => s.setHoveredCamId);
  const activateFacade = useWarRoomStore((s) => s.activateFacade);
  const markOffline = useWarRoomStore((s) => s.markOffline);
  const setPresetFilter = useWarRoomStore((s) => s.setPresetFilter);

  const orderedCams = sortMobileCams(displayedCams, pinnedIds);
  const pinnedSet = new Set(pinnedIds);
  const activatedSet = new Set(activatedFacadeIds);

  const cycleSheet = () => {
    if (sheetState === 'collapsed') setSheetState('half');
    else if (sheetState === 'half') setSheetState('expanded');
    else setSheetState('collapsed');
  };

  return (
    <section
      className={`hud-glass-strong fixed inset-x-0 bottom-0 z-[750] flex flex-col rounded-t-3xl border-b-0 transition-[height] duration-300 ease-out ${
        sheetState === 'collapsed'
          ? 'h-[68px]'
          : sheetState === 'half'
          ? 'h-[42vh] min-h-[260px]'
          : 'h-[78vh]'
      }`}
    >
      <div className="flex shrink-0 flex-col items-center px-3.5 pt-2 pb-2">
        <button
          type="button"
          onClick={cycleSheet}
          aria-label="切換鏡頭抽屜高度"
          className="mb-1.5 h-1.5 w-12 rounded-full bg-slate-600/80 cursor-pointer"
        />
        <div className="flex w-full items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setSheetState(sheetState === 'collapsed' ? 'half' : 'collapsed')}
            className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white">
                視野即時鏡頭 ({orderedCams.length})
              </div>
              <div className="truncate text-[11px] text-slate-400">
                全島 {allWebcams.length} 處 · 點擊展開瀏覽
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={cycleSheet}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-medium text-cyan-200 cursor-pointer"
          >
            {sheetState === 'expanded' ? (
              <>
                <ChevronDown className="h-4 w-4" />
                收合
              </>
            ) : (
              <>
                <ChevronUp className="h-4 w-4" />
                展開
              </>
            )}
          </button>
        </div>
      </div>

      {sheetState !== 'collapsed' && (
        <div className="thin-scroll flex-1 overflow-y-auto px-3 pb-5">
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
            {MOBILE_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setPresetFilter(chip.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer ${
                  presetFilter === chip.id
                    ? 'bg-cyan-500/25 text-cyan-200 ring-1 ring-cyan-400/60'
                    : 'bg-slate-900/80 text-slate-300'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {orderedCams.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 py-8 text-center text-sm text-slate-400">
              目前視野或篩選條件下無鏡頭，請縮小地圖或切換「全部」。
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {orderedCams.map((cam, idx) => {
                const shouldPlayLive = idx < 2 || activatedSet.has(cam.id);
                return (
                  <div key={cam.id} className="aspect-[16/11] w-full">
                    <VideoCard
                      cam={cam}
                      compact
                      isPinned={pinnedSet.has(cam.id)}
                      isHovered={hoveredCamId === cam.id}
                      shouldPlayLive={shouldPlayLive}
                      staggerDelayMs={idx * 180}
                      telemetry={telemetryById[cam.id]}
                      onTogglePin={togglePin}
                      onFocus={setFocusedCamId}
                      onLocate={(target) => {
                        requestFlyTo(target.lat, target.lng, 12);
                        setSheetState('collapsed');
                      }}
                      onHover={setHoveredCamId}
                      onActivateFacade={activateFacade}
                      onStreamError={markOffline}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
