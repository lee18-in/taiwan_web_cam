import { useCallback, useMemo } from 'react';
import type { VideoSlotRect } from '../../core/spatialSorter';
import { useWarRoomStore } from '../../store/useWarRoomStore';
import type { Webcam } from '../../types/webcam';
import { VideoCard } from './VideoCard';

interface DesktopVideoPoolProps {
  slots: VideoSlotRect[];
  visible: boolean;
}

/**
 * 單一扁平 Keyed 零重載影片牆（Zero-Reload Video Pool）：
 * 將所有顯示中卡片維持於同一個依 cam.id 穩定排序的 React 陣列，
 * 透過 CSS transform 定位至左／右牆精確格位。
 * 就算地圖拖曳導致卡片跨左右牆或順位移動，DOM 節點永不重排卸載，YouTube 直播 0 中斷！
 */
export function DesktopVideoPool({ slots, visible }: DesktopVideoPoolProps) {
  const pinnedIds = useWarRoomStore((s) => s.pinnedIds);
  const hoveredCamId = useWarRoomStore((s) => s.hoveredCamId);
  const fullLiveMode = useWarRoomStore((s) => s.fullLiveMode);
  const activatedFacadeIds = useWarRoomStore((s) => s.activatedFacadeIds);
  const telemetryById = useWarRoomStore((s) => s.telemetryById);

  const togglePin = useWarRoomStore((s) => s.togglePin);
  const setFocusedCamId = useWarRoomStore((s) => s.setFocusedCamId);
  const requestFlyTo = useWarRoomStore((s) => s.requestFlyTo);
  const setHoveredCamId = useWarRoomStore((s) => s.setHoveredCamId);
  const activateFacade = useWarRoomStore((s) => s.activateFacade);
  const markOffline = useWarRoomStore((s) => s.markOffline);

  // 建立原始優先順位映射（前 4 順位預設自動直播，其餘在省電模式下採縮圖延遲啟動）
  const liveEligibleSet = useMemo(() => {
    const pinnedSet = new Set(pinnedIds);
    const ranked = [...slots].sort((a, b) => {
      const aPin = pinnedSet.has(a.id) ? 0 : 1;
      const bPin = pinnedSet.has(b.id) ? 0 : 1;
      if (aPin !== bPin) return aPin - bPin;
      return a.cam.level - b.cam.level || a.indexInSide - b.indexInSide;
    });
    const quota = fullLiveMode ? ranked.length : 4;
    return new Set(ranked.slice(0, quota).map((s) => s.id));
  }, [slots, pinnedIds, fullLiveMode]);

  // 關鍵：DOM 順序永遠依 cam.id 字典序固定，絕不觸發 browser iframe insertBefore 重載
  const stableSlots = useMemo(
    () => [...slots].sort((a, b) => a.id.localeCompare(b.id)),
    [slots]
  );

  const handleLocate = useCallback(
    (cam: Webcam) => {
      requestFlyTo(cam.lat, cam.lng, 12);
    },
    [requestFlyTo]
  );

  if (!visible || stableSlots.length === 0) return null;

  const pinnedSet = new Set(pinnedIds);
  const activatedSet = new Set(activatedFacadeIds);

  return (
    <div className="pointer-events-none fixed inset-0 z-[500]">
      {stableSlots.map((slot, idx) => {
        const shouldPlayLive =
          fullLiveMode || liveEligibleSet.has(slot.id) || activatedSet.has(slot.id);

        return (
          <div
            key={slot.id}
            className="pointer-events-auto fixed left-0 top-0 transition-[transform,width,height] duration-300 ease-out will-change-transform"
            style={{
              width: `${slot.width}px`,
              height: `${slot.height}px`,
              transform: `translate3d(${slot.x}px, ${slot.y}px, 0)`
            }}
          >
            <VideoCard
              cam={slot.cam}
              isPinned={pinnedSet.has(slot.id)}
              isHovered={hoveredCamId === slot.id}
              shouldPlayLive={shouldPlayLive}
              staggerDelayMs={idx * 140}
              telemetry={telemetryById[slot.id]}
              onTogglePin={togglePin}
              onFocus={setFocusedCamId}
              onLocate={handleLocate}
              onHover={setHoveredCamId}
              onActivateFacade={activateFacade}
              onStreamError={markOffline}
            />
          </div>
        );
      })}
    </div>
  );
}
