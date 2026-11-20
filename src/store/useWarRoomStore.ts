import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GeoBounds } from '../core/cameraSelector';
import { parseUrlState } from '../core/urlSync';
import {
  createInitialOverlays,
  DEFAULT_CALIBRATION_BOUNDS,
  TAIWAN_DEFAULT_CENTER,
  TAIWAN_DEFAULT_ZOOM,
  WAR_ROOM_COMBOS
} from '../data/mapLayers';
import type { CameraWeatherTelemetry, PresetFilter } from '../types/webcam';
import type {
  BasemapId,
  BlendMode,
  BoundsTuple,
  CalibrationGroupId,
  OverlayRuntimeState,
  RainViewerFrame,
  WeatherLayerId
} from '../types/weather';

export type WindDensity = 'low' | 'medium' | 'high';
export type MobileSheetState = 'collapsed' | 'half' | 'expanded';

interface WarRoomState {
  // 地圖視角與底圖
  center: [number, number];
  zoom: number;
  bounds: GeoBounds | null;
  flyToTarget: { lat: number; lng: number; zoom: number; nonce: number } | null;
  basemap: BasemapId;
  labelsOnTop: boolean;

  // 氣象疊圖與動態層
  overlays: Record<WeatherLayerId, OverlayRuntimeState>;
  windEnabled: boolean;
  windDensity: WindDensity;
  rainViewerEnabled: boolean;
  rainViewerPlaying: boolean;
  rainViewerOpacity: number;
  rainViewerHost: string;
  rainViewerFrames: RainViewerFrame[];
  rainViewerFrameIndex: number;
  weatherRefreshNonce: number;
  lastWeatherRefreshAt: number;
  autoRefreshEnabled: boolean;

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
  weatherDrawerOpen: boolean;
  calibrationOpen: boolean;
  customBounds: Partial<Record<CalibrationGroupId, BoundsTuple>>;
  mobileSheetState: MobileSheetState;

  // Actions
  setViewport: (center: [number, number], zoom: number, bounds: GeoBounds) => void;
  requestFlyTo: (lat: number, lng: number, zoom?: number) => void;
  setBasemap: (basemap: BasemapId) => void;
  setLabelsOnTop: (on: boolean) => void;
  toggleOverlay: (id: WeatherLayerId) => void;
  setOverlayOpacity: (id: WeatherLayerId, opacity: number) => void;
  setOverlayBlendMode: (id: WeatherLayerId, mode: BlendMode) => void;
  setWindEnabled: (on: boolean) => void;
  setWindDensity: (density: WindDensity) => void;
  setRainViewerEnabled: (on: boolean) => void;
  setRainViewerPlaying: (playing: boolean) => void;
  setRainViewerOpacity: (opacity: number) => void;
  setRainViewerData: (host: string, frames: RainViewerFrame[]) => void;
  setRainViewerFrameIndex: (index: number) => void;
  triggerWeatherRefresh: () => void;
  setAutoRefreshEnabled: (on: boolean) => void;
  applyComboPreset: (presetId: string) => void;

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
  setWeatherDrawerOpen: (open: boolean) => void;
  setCalibrationOpen: (open: boolean) => void;
  setCustomBounds: (group: CalibrationGroupId, bounds: BoundsTuple) => void;
  resetCustomBounds: (group: CalibrationGroupId) => void;
  setMobileSheetState: (state: MobileSheetState) => void;
  hydrateFromUrl: (search: string) => void;
}

export const useWarRoomStore = create<WarRoomState>()(
  persist(
    (set, get) => ({
      center: TAIWAN_DEFAULT_CENTER,
      zoom: TAIWAN_DEFAULT_ZOOM,
      bounds: null,
      flyToTarget: null,
      basemap: 'dark',
      labelsOnTop: true,

      overlays: createInitialOverlays(),
      windEnabled: true,
      windDensity: 'medium',
      rainViewerEnabled: true,
      rainViewerPlaying: true,
      rainViewerOpacity: 0.72,
      rainViewerHost: 'https://tilecache.rainviewer.com',
      rainViewerFrames: [],
      rainViewerFrameIndex: 0,
      weatherRefreshNonce: Date.now(),
      lastWeatherRefreshAt: Date.now(),
      autoRefreshEnabled: true,

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
      weatherDrawerOpen: false,
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
      setLabelsOnTop: (labelsOnTop) => set({ labelsOnTop }),
      toggleOverlay: (id) =>
        set((s) => ({
          overlays: {
            ...s.overlays,
            [id]: { ...s.overlays[id], enabled: !s.overlays[id].enabled }
          }
        })),
      setOverlayOpacity: (id, opacity) =>
        set((s) => ({
          overlays: {
            ...s.overlays,
            [id]: { ...s.overlays[id], opacity }
          }
        })),
      setOverlayBlendMode: (id, blendMode) =>
        set((s) => ({
          overlays: {
            ...s.overlays,
            [id]: { ...s.overlays[id], blendMode }
          }
        })),
      setWindEnabled: (windEnabled) => set({ windEnabled }),
      setWindDensity: (windDensity) => set({ windDensity }),
      setRainViewerEnabled: (rainViewerEnabled) =>
        set((s) => ({
          rainViewerEnabled,
          // 開啟 RainViewer 動畫時，自動先關閉靜態 CWA 雷達避免兩個雷達重疊打架
          overlays: rainViewerEnabled
            ? {
                ...s.overlays,
                radar: { ...s.overlays.radar, enabled: false }
              }
            : s.overlays
        })),
      setRainViewerPlaying: (rainViewerPlaying) => set({ rainViewerPlaying }),
      setRainViewerOpacity: (rainViewerOpacity) => set({ rainViewerOpacity }),
      setRainViewerData: (rainViewerHost, rainViewerFrames) =>
        set({
          rainViewerHost,
          rainViewerFrames,
          rainViewerFrameIndex: Math.max(0, rainViewerFrames.length - 1)
        }),
      setRainViewerFrameIndex: (rainViewerFrameIndex) => set({ rainViewerFrameIndex }),
      triggerWeatherRefresh: () => {
        const now = Date.now();
        set({ weatherRefreshNonce: now, lastWeatherRefreshAt: now });
      },
      setAutoRefreshEnabled: (autoRefreshEnabled) => set({ autoRefreshEnabled }),
      applyComboPreset: (presetId) => {
        const preset = WAR_ROOM_COMBOS.find((p) => p.id === presetId);
        if (!preset) return;
        const nextOverlays = createInitialOverlays();
        // 先全部關閉，再套用預設開啟者
        (Object.keys(nextOverlays) as WeatherLayerId[]).forEach((k) => {
          nextOverlays[k].enabled = false;
        });
        (Object.keys(preset.overlays) as WeatherLayerId[]).forEach((k) => {
          const cfg = preset.overlays[k];
          if (!cfg) return;
          nextOverlays[k] = {
            enabled: cfg.enabled,
            opacity: cfg.opacity,
            blendMode: cfg.blendMode ?? nextOverlays[k].blendMode
          };
        });
        set({
          basemap: preset.basemap,
          labelsOnTop: preset.labelsOnTop,
          windEnabled: preset.windEnabled,
          rainViewerEnabled: preset.rainViewerEnabled,
          overlays: nextOverlays
        });
      },

      setMaxTiles: (maxTiles) => set({ maxTiles }),
      setFullLiveMode: (fullLiveMode) => set({ fullLiveMode }),
      setPresetFilter: (presetFilter) => set({ presetFilter }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      togglePin: (camId) =>
        set((s) => {
          const exists = s.pinnedIds.includes(camId);
          if (exists) {
            return { pinnedIds: s.pinnedIds.filter((id) => id !== camId) };
          }
          if (s.pinnedIds.length >= 4) {
            // 上限 4 支：擠掉最早釘選的那支
            return { pinnedIds: [...s.pinnedIds.slice(1), camId] };
          }
          return { pinnedIds: [...s.pinnedIds, camId] };
        }),
      setFocusedCamId: (focusedCamId) => set({ focusedCamId }),
      setHoveredCamId: (hoveredCamId) => set({ hoveredCamId }),
      markOffline: (camId) =>
        set((s) =>
          s.offlineIds.includes(camId) ? s : { offlineIds: [...s.offlineIds, camId] }
        ),
      markManyOffline: (camIds) =>
        set((s) => {
          const merged = Array.from(new Set([...s.offlineIds, ...camIds]));
          return { offlineIds: merged };
        }),
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

      setKioskMode: (kioskMode) =>
        set({
          kioskMode,
          weatherDrawerOpen: kioskMode ? false : get().weatherDrawerOpen
        }),
      setWallsCollapsed: (wallsCollapsed) => set({ wallsCollapsed }),
      setWeatherDrawerOpen: (weatherDrawerOpen) => set({ weatherDrawerOpen }),
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
        set((s) => {
          const nextOverlays = { ...s.overlays };
          if (parsed.enabledLayers) {
            const enabledSet = new Set(parsed.enabledLayers);
            (Object.keys(nextOverlays) as WeatherLayerId[]).forEach((k) => {
              nextOverlays[k] = { ...nextOverlays[k], enabled: enabledSet.has(k) };
            });
          }
          const nextRainViewer =
            parsed.rainViewerEnabled !== undefined
              ? parsed.rainViewerEnabled
              : parsed.enabledLayers && parsed.enabledLayers.includes('radar')
              ? false
              : s.rainViewerEnabled;

          if (parsed.rainViewerEnabled === true && !parsed.enabledLayers) {
            nextOverlays.radar = { ...nextOverlays.radar, enabled: false };
          }

          return {
            center:
              parsed.lat !== undefined && parsed.lng !== undefined
                ? [parsed.lat, parsed.lng]
                : s.center,
            zoom: parsed.zoom ?? s.zoom,
            basemap: parsed.basemap ?? s.basemap,
            labelsOnTop: parsed.labelsOnTop ?? s.labelsOnTop,
            overlays: nextOverlays,
            pinnedIds: parsed.pinnedIds ?? s.pinnedIds,
            presetFilter: parsed.presetFilter ?? s.presetFilter,
            windEnabled: parsed.windEnabled ?? s.windEnabled,
            rainViewerEnabled: nextRainViewer,
            maxTiles: parsed.maxTiles ?? s.maxTiles,
            kioskMode: parsed.kioskMode ?? s.kioskMode,
            calibrationOpen: parsed.debugCalib ?? s.calibrationOpen
          };
        });
      }
    }),
    {
      name: 'tw-war-room-v2-prefs',
      partialize: (state) => ({
        basemap: state.basemap,
        labelsOnTop: state.labelsOnTop,
        overlays: state.overlays,
        windEnabled: state.windEnabled,
        windDensity: state.windDensity,
        maxTiles: state.maxTiles,
        fullLiveMode: state.fullLiveMode,
        pinnedIds: state.pinnedIds,
        autoRefreshEnabled: state.autoRefreshEnabled,
        customBounds: state.customBounds
      })
    }
  )
);
