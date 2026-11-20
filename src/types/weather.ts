export type BasemapId = 'dark' | 'satellite' | 'nlsc';

export type WeatherLayerId =
  | 'radar'
  | 'rainfall'
  | 'visible'
  | 'trueColor'
  | 'color'
  | 'enhanced'
  | 'bw'
  | 'sfc';

export type CalibrationGroupId =
  | 'radar'
  | 'rainfall'
  | 'sat1350'
  | 'sat800'
  | 'sfc';

export type BlendMode = 'normal' | 'screen';

export type BoundsTuple = [[number, number], [number, number]];

export interface BasemapConfig {
  id: BasemapId;
  name: string;
  shortName: string;
  description: string;
  url: string;
  subdomains?: string;
  maxZoom: number;
  attribution: string;
  supportsLabelsOnTop: boolean;
  previewGradient: string;
}

export interface WeatherLayerConfig {
  id: WeatherLayerId;
  name: string;
  shortName: string;
  category: 'precipitation' | 'satellite' | 'synoptic';
  url: string;
  pane: 'weather-cloud' | 'weather-radar';
  calibrationGroup: CalibrationGroupId;
  defaultOpacity: number;
  defaultBlendMode: BlendMode;
  legendType?: 'radar' | 'rainfall';
}

export interface OverlayRuntimeState {
  enabled: boolean;
  opacity: number;
  blendMode: BlendMode;
}

export interface CalibrationRange {
  n: { min: number; max: number };
  s: { min: number; max: number };
  w: { min: number; max: number };
  e: { min: number; max: number };
}

export interface CalibrationGroupMeta {
  id: CalibrationGroupId;
  title: string;
  defaultBounds: BoundsTuple;
  range: CalibrationRange;
}

export interface WarRoomComboPreset {
  id: string;
  label: string;
  description: string;
  basemap: BasemapId;
  labelsOnTop: boolean;
  windEnabled: boolean;
  rainViewerEnabled: boolean;
  overlays: Partial<Record<WeatherLayerId, { enabled: boolean; opacity: number; blendMode?: BlendMode }>>;
}

export interface RainViewerFrame {
  time: number;
  path: string;
}

export interface WindGridData {
  lats: number[];
  lngs: number[];
  /** u[latIdx][lngIdx] in m/s (eastward) */
  u: number[][];
  /** v[latIdx][lngIdx] in m/s (northward) */
  v: number[][];
  /** speed[latIdx][lngIdx] in km/h */
  speedKmh: number[][];
  fetchedAt: number;
}
