import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GeoBounds } from '../core/cameraSelector';
import { parseUrlState } from '../core/urlSync';
import {
  BASEMAP_ORDER,
  DEFAULT_CALIBRATION_BOUNDS,
  TAIWAN_DEFAULT_CENTER,
  TAIWAN_DEFAULT_ZOOM
} from '../data/mapLayers';
import type { CameraWeatherTelemetry, PresetFilter } from '../types/webcam';
import type {
  ActiveWeatherLayerId,
  BasemapId,
  BoundsTuple,
  CalibrationGroupId,
  RainViewerFrame
} from '../types/weather';

export type MobileSheetState = 'collapsed' | 'half' | 'expanded';

interface WarRoomState {
  // 地圖視角與底圖
  center: [number, number];
  zoom: number;
  bounds: GeoBounds | null;
  flyToTarget: { lat: number; lng: number; zoom: number; nonce: number } | null;
  basemap: BasemapId;

  // 嚴格單選氣象圖層（點誰開誰、其他全關；再點一次自己就全關）+ 獨立風場開關
  activeLayer: ActiveWeatherLayerId;
  windEnabled: boolean;
  rainViewerPlaying: boolean;
  rainViewerHost: string;
  rainViewerFrames: RainViewerFrame[];
  rainViewerFrameIndex: number;
  weatherRefreshNonce: number;

  // 影片牆與篩選
  maxTiles: 4 | 6 | 8;
  fullLiveMode: boolean;
  presetFilter: PresetFilter;
  searchQuery: string;
  pinnedIds: string[];
  focusedCamId: string | null;
  hoveredCamId: string | null;
  offlineIds: string[];
  activatedFacadeIds: string[];
  telemetryById: Record<string, CameraWeatherTelemetry>;

  // UI 控制與開發校正
  kioskMode: boolean;
  wallsCollapsed: boolean;
  calibrationOpen: boolean;
  customBounds: Partial<Record<CalibrationGroupId, BoundsTuple>>;
  mobileSheetState: MobileSheetState;

  // Actions
  setViewport: (center: [number, number], zoom: number, bounds: GeoBounds) => void;
  requestFlyTo: (lat: number, lng: number, zoom?: number) => void;
  setBasemap: (basemap: BasemapId) => void;
  cycleBasemap: () => void;
  /** 嚴格單選：點已啟用的圖層則關閉（null），點新圖層則立刻取代其他全部氣象圖 */
  selectLayer: (layer: Exclude<ActiveWeatherLayerId, null>) => void;
  clearLayer: () => void;
  setWindEnabled: (on: boolean) => void;
  setRainViewerPlaying: (playing: boolean) => void;
  setRainViewerData: (host: string, frames: RainViewerFrame[]) => void;
  setRainViewerFrameIndex: (index: number) => void;
  triggerWeatherRefresh: () => void;

  setMaxTiles: (count: 4 | 6 | 8) => void;
  setFullLiveMode: (on: boolean) => void;
  setPresetFilter: (filter: PresetFilter) => void;
  setSearchQuery: (q: string) => void;
  togglePin: (camId: string) => void;
  setFocusedCamId: (camId: string | null) => void;
  setHoveredCamId: (camId: string | null) => void;
  markOffline: (camId: string) => void;
  markManyOffline: (camIds: string[]) => void;
  activateFacade: (camId: string) => void;
  mergeTelemetry: (entries: Record<string, CameraWeatherTelemetry>) => void;

  setKioskMode: (on: boolean) => void;
  setWallsCollapsed: (on: boolean) => void;
  setCalibrationOpen: (open: boolean) => void;
  setCustomBounds: (group: CalibrationGroupId, bounds: BoundsTuple) => void;
  resetCustomBounds: (group: CalibrationGroupId) => void;
  setMobileSheetState: (state: MobileSheetState) => void;
  hydrateFromUrl: (search: string) => void;
}

export const useWarRoomStore = create<WarRoomState>()(
  persist(
    (set) => ({
      center: TAIWAN_DEFAULT_CENTER,
      zoom: TAIWAN_DEFAULT_ZOOM,
      bounds: null,
      flyToTarget: null,
      basemap: 'dark',

      activeLayer: 'rainViewer',
      windEnabled: true,
      rainViewerPlaying: true,
      rainViewerHost: 'https://tilecache.rainviewer.com',
      rainViewerFrames: [],
      rainViewerFrameIndex: 0,
      weatherRefreshNonce: Date.now(),

      maxTiles: 4,
      fullLiveMode: false,
      presetFilter: 'all',
      searchQuery: '',
      pinnedIds: [],
      focusedCamId: null,
      hoveredCamId: null,
      offlineIds: [],
      activatedFacadeIds: [],
      telemetryById: {},

      kioskMode: false,
      wallsCollapsed: false,
      calibrationOpen: false,
      customBounds: {},
      mobileSheetState: 'collapsed',

      setViewport: (center, zoom, bounds) => set({ center, zoom, bounds }),
      requestFlyTo: (lat, lng, zoom) =>
        set((s) => ({
          flyToTarget: {
            lat,
            lng,
            zoom: zoom ?? Math.max(s.zoom, 11),
            nonce: Date.now()
          }
        })),
      setBasemap: (basemap) => set({ basemap }),
      cycleBasemap: () =>
        set((s) => {
          const idx = BASEMAP_ORDER.indexOf(s.basemap);
          const next = BASEMAP_ORDER[(idx + 1) % BASEMAP_ORDER.length];
          return { basemap: next };
        }),
      selectLayer: (layer) =>
        set((s) => ({
          activeLayer: s.activeLayer === layer ? null : layer
        })),
      clearLayer: () => set({ activeLayer: null }),
      setWindEnabled: (windEnabled) => set({ windEnabled }),
      setRainViewerPlaying: (rainViewerPlaying) => set({ rainViewerPlaying }),
      setRainViewerData: (rainViewerHost, rainViewerFrames) =>
        set({
          rainViewerHost,
          rainViewerFrames,
          rainViewerFrameIndex: Math.max(0, rainViewerFrames.length - 1)
        }),
      setRainViewerFrameIndex: (rainViewerFrameIndex) => set({ rainViewerFrameIndex }),
      triggerWeatherRefresh: () => set({ weatherRefreshNonce: Date.now() }),

      setMaxTiles: (maxTiles) => set({ maxTiles }),
      setFullLiveMode: (fullLiveMode) => set({ fullLiveMode }),
      setPresetFilter: (presetFilter) => set({ presetFilter }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      togglePin: (camId) =>
        set((s) => {
          const exists = s.pinnedIds.includes(camId);
          if (exists) return { pinnedIds: s.pinnedIds.filter((id) => id !== camId) };
          if (s.pinnedIds.length >= 4) return { pinnedIds: [...s.pinnedIds.slice(1), camId] };
          return { pinnedIds: [...s.pinnedIds, camId] };
        }),
      setFocusedCamId: (focusedCamId) => set({ focusedCamId }),
      setHoveredCamId: (hoveredCamId) => set({ hoveredCamId }),
      markOffline: (camId) =>
        set((s) =>
          s.offlineIds.includes(camId) ? s : { offlineIds: [...s.offlineIds, camId] }
        ),
      markManyOffline: (camIds) =>
        set((s) => ({
          offlineIds: Array.from(new Set([...s.offlineIds, ...camIds]))
        })),
      activateFacade: (camId) =>
        set((s) =>
          s.activatedFacadeIds.includes(camId)
            ? s
            : { activatedFacadeIds: [...s.activatedFacadeIds, camId] }
        ),
      mergeTelemetry: (entries) =>
        set((s) => ({
          telemetryById: { ...s.telemetryById, ...entries }
        })),

      setKioskMode: (kioskMode) => set({ kioskMode }),
      setWallsCollapsed: (wallsCollapsed) => set({ wallsCollapsed }),
      setCalibrationOpen: (calibrationOpen) => set({ calibrationOpen }),
      setCustomBounds: (group, bounds) =>
        set((s) => ({
          customBounds: { ...s.customBounds, [group]: bounds }
        })),
      resetCustomBounds: (group) =>
        set((s) => ({
          customBounds: {
            ...s.customBounds,
            [group]: DEFAULT_CALIBRATION_BOUNDS[group]
          }
        })),
      setMobileSheetState: (mobileSheetState) => set({ mobileSheetState }),

      hydrateFromUrl: (search) => {
        const parsed = parseUrlState(search);
        if (Object.keys(parsed).length === 0) return;
        set((s) => ({
          center:
            parsed.lat !== undefined && parsed.lng !== undefined
              ? [parsed.lat, parsed.lng]
              : s.center,
          zoom: parsed.zoom ?? s.zoom,
          basemap: parsed.basemap ?? s.basemap,
          activeLayer: parsed.activeLayer !== undefined ? parsed.activeLayer : s.activeLayer,
          pinnedIds: parsed.pinnedIds ?? s.pinnedIds,
          presetFilter: parsed.presetFilter ?? s.presetFilter,
          windEnabled: parsed.windEnabled ?? s.windEnabled,
          maxTiles: parsed.maxTiles ?? s.maxTiles,
          kioskMode: parsed.kioskMode ?? s.kioskMode,
          calibrationOpen: parsed.debugCalib ?? s.calibrationOpen
        }));
      }
    }),
    {
      name: 'tw-war-room-v2-simple-prefs',
      partialize: (state) => ({
        basemap: state.basemap,
        activeLayer: state.activeLayer,
        windEnabled: state.windEnabled,
        maxTiles: state.maxTiles,
        fullLiveMode: state.fullLiveMode,
        pinnedIds: state.pinnedIds,
        customBounds: state.customBounds
      })
    }
  )
);
