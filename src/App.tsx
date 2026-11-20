import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type L from 'leaflet';
import rawWebcams from './data/webcams.json';
import { selectDisplayWebcams } from './core/cameraSelector';
import { computeDesktopSlotLayouts } from './core/spatialSorter';
import { fetchCameraTelemetry } from './services/openMeteo';
import { useWarRoomStore } from './store/useWarRoomStore';
import type { HealthManifest, Webcam } from './types/webcam';
import { WarRoomMap } from './components/map/WarRoomMap';
import { ConnectorOverlay } from './components/map/ConnectorOverlay';
import { DesktopVideoPool } from './components/video/DesktopVideoPool';
import { FocusTheaterModal } from './components/video/FocusTheaterModal';
import { TopHudBar } from './components/hud/TopHudBar';
import { WeatherQuickBar } from './components/hud/WeatherQuickBar';
import { RadarTimelineBar } from './components/hud/RadarTimelineBar';
import { MobileBottomSheet } from './components/hud/MobileBottomSheet';

const CalibrationDrawer = lazy(() => import('./components/dev/CalibrationDrawer'));

const WEBCAMS = rawWebcams as Webcam[];
const MOBILE_BREAKPOINT = 1024;
const AUTO_REFRESH_MS = 10 * 60 * 1000;

export function App() {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [redrawTick, setRedrawTick] = useState(0);
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900
  }));

  const isMobile = viewportSize.width <= MOBILE_BREAKPOINT;

  const center = useWarRoomStore((s) => s.center);
  const bounds = useWarRoomStore((s) => s.bounds);
  const maxTiles = useWarRoomStore((s) => s.maxTiles);
  const presetFilter = useWarRoomStore((s) => s.presetFilter);
  const searchQuery = useWarRoomStore((s) => s.searchQuery);
  const pinnedIds = useWarRoomStore((s) => s.pinnedIds);
  const hoveredCamId = useWarRoomStore((s) => s.hoveredCamId);
  const offlineIds = useWarRoomStore((s) => s.offlineIds);
  const kioskMode = useWarRoomStore((s) => s.kioskMode);
  const wallsCollapsed = useWarRoomStore((s) => s.wallsCollapsed);
  const calibrationOpen = useWarRoomStore((s) => s.calibrationOpen);

  const hydrateFromUrl = useWarRoomStore((s) => s.hydrateFromUrl);
  const markManyOffline = useWarRoomStore((s) => s.markManyOffline);
  const mergeTelemetry = useWarRoomStore((s) => s.mergeTelemetry);
  const triggerWeatherRefresh = useWarRoomStore((s) => s.triggerWeatherRefresh);

  // 1. 啟動時解析分享 URL 與每日巡檢健康清單
  useEffect(() => {
    hydrateFromUrl(window.location.search);

    let cancelled = false;
    const healthUrl = `${import.meta.env.BASE_URL}health.json`;
    void fetch(healthUrl)
      .then((res) => (res.ok ? (res.json() as Promise<HealthManifest>) : null))
      .then((manifest) => {
        if (cancelled || !manifest?.statusById) return;
        const broken = Object.entries(manifest.statusById)
          .filter(([, entry]) => entry && entry.ok === false)
          .map(([id]) => id);
        if (broken.length > 0) markManyOffline(broken);
      })
      .catch(() => {
        // 靜默容錯
      });

    return () => {
      cancelled = true;
    };
  }, [hydrateFromUrl, markManyOffline]);

  // 2. 視窗大小監聽
  useEffect(() => {
    const onResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
      setRedrawTick((t) => t + 1);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // 3. 每 10 分鐘背景無感刷新當前氣象圖資與風場
  useEffect(() => {
    const id = window.setInterval(() => {
      triggerWeatherRefresh();
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [triggerWeatherRefresh]);

  const offlineSet = useMemo(() => new Set(offlineIds), [offlineIds]);

  // 4. 篩選顯示鏡頭清單
  const displayedCams = useMemo(() => {
    const targetTiles = isMobile ? 6 : maxTiles;

    const isCoveredByWall =
      !isMobile && !wallsCollapsed && mapInstance
        ? (cam: Webcam, selectedSoFar: Webcam[]) => {
            const tempMetrics = computeDesktopSlotLayouts(
              selectedSoFar,
              viewportSize.width,
              viewportSize.height,
              kioskMode ? 18 : 68,
              16
            );
            const pt = mapInstance.latLngToContainerPoint([cam.lat, cam.lng]);
            if (tempMetrics.leftWidth > 0 && pt.x < tempMetrics.leftWidth) return true;
            if (
              tempMetrics.rightWidth > 0 &&
              pt.x > viewportSize.width - tempMetrics.rightWidth
            ) {
              return true;
            }
            return false;
          }
        : undefined;

    return selectDisplayWebcams({
      webcams: WEBCAMS,
      bounds,
      center: { lat: center[0], lng: center[1] },
      maxTiles: targetTiles,
      pinnedIds,
      offlineIds: offlineSet,
      presetFilter,
      searchQuery,
      isCoveredByWall
    });
  }, [
    isMobile,
    maxTiles,
    wallsCollapsed,
    mapInstance,
    viewportSize.width,
    viewportSize.height,
    kioskMode,
    bounds,
    center,
    pinnedIds,
    offlineSet,
    presetFilter,
    searchQuery
  ]);

  // 5. 桌機卡片座標
  const desktopLayout = useMemo(() => {
    if (isMobile || wallsCollapsed) {
      return { leftWidth: 0, rightWidth: 0, slots: [] };
    }
    return computeDesktopSlotLayouts(
      displayedCams,
      viewportSize.width,
      viewportSize.height,
      kioskMode ? 18 : 68,
      16
    );
  }, [isMobile, wallsCollapsed, displayedCams, viewportSize.width, viewportSize.height, kioskMode]);

  // 6. 推移 Leaflet 右下縮放控制項，避開影片牆與底部列
  useEffect(() => {
    const bottomRight = document.querySelector<HTMLElement>('.leaflet-bottom.leaflet-right');
    if (!bottomRight) return;
    if (isMobile) {
      bottomRight.style.right = '6px';
      bottomRight.style.bottom = '136px';
    } else {
      bottomRight.style.right = `${desktopLayout.rightWidth}px`;
      bottomRight.style.bottom = '4px';
    }
  }, [isMobile, desktopLayout.rightWidth]);

  // 7. 批次同步顯示中鏡頭之即時風雨遙測
  useEffect(() => {
    if (displayedCams.length === 0) return;
    let cancelled = false;
    void fetchCameraTelemetry(displayedCams).then((data) => {
      if (!cancelled && Object.keys(data).length > 0) {
        mergeTelemetry(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [displayedCams, mergeTelemetry]);

  const handleMapVisualMove = useCallback(() => {
    setRedrawTick((t) => t + 1);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#060b16]">
      <WarRoomMap
        webcams={WEBCAMS}
        displayedCams={displayedCams}
        onMapReady={setMapInstance}
        onMapVisualMove={handleMapVisualMove}
      />

      <ConnectorOverlay
        map={mapInstance}
        slots={desktopLayout.slots}
        pinnedIds={pinnedIds}
        hoveredCamId={hoveredCamId}
        redrawTick={redrawTick}
        visible={!isMobile && !wallsCollapsed}
      />

      <DesktopVideoPool
        slots={desktopLayout.slots}
        visible={!isMobile && !wallsCollapsed}
      />

      <TopHudBar
        webcams={WEBCAMS}
        isMobile={isMobile}
        activeCount={displayedCams.length}
      />

      {/* 底部極簡一鍵單選氣象切換列 ＋ 2h 雨帶時間軸 */}
      <RadarTimelineBar isMobile={isMobile} />
      <WeatherQuickBar isMobile={isMobile} />

      {isMobile && !kioskMode && (
        <MobileBottomSheet displayedCams={displayedCams} allWebcams={WEBCAMS} />
      )}

      <FocusTheaterModal webcams={WEBCAMS} />

      {calibrationOpen && (
        <Suspense fallback={null}>
          <CalibrationDrawer />
        </Suspense>
      )}
    </div>
  );
}

export default App;
