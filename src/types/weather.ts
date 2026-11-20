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

/** 嚴格單選互斥氣象圖層（含 RainViewer 動態雨帶與 8 組 CWA 官方圖資；null 表示全部關閉） */
export type ActiveWeatherLayerId = 'rainViewer' | WeatherLayerId | null;

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
}

export interface WeatherLayerConfig {
  id: WeatherLayerId;
  name: string;
  shortName: string;
  category: 'precipitation' | 'satellite' | 'synoptic';
  url: string;
  pane: 'weather-cloud' | 'weather-radar';
  calibrationGroup: CalibrationGroupId;
  /** 系統依底圖自動套用之最佳透明度（暗黑／衛星 vs 淺色繁中） */
  optimalOpacityDark: number;
  optimalOpacityLight: number;
  blendModeDark: BlendMode;
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
