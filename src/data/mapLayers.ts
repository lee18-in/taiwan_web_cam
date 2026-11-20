import type {
  BasemapConfig,
  BasemapId,
  BoundsTuple,
  CalibrationGroupId,
  CalibrationGroupMeta,
  OverlayRuntimeState,
  WarRoomComboPreset,
  WeatherLayerConfig,
  WeatherLayerId
} from '../types/weather';

/** 台灣地理中心點與預設縮放 */
export const TAIWAN_DEFAULT_CENTER: [number, number] = [23.62, 120.85];
export const TAIWAN_DEFAULT_ZOOM = 8;

/**
 * 浮動繁體中文地名與路網透明圖磚（內政部國土測繪中心 NLSC EMAP2，已實測 200 OK、RGBA 透明無浮水印）
 * 置於雲圖與雷達之上，讓縣市名稱與國道路網永遠清晰不被雨帶蓋掉。
 */
export const TW_LABELS_TILE_URL =
  'https://wmts.nlsc.gov.tw/wmts/EMAP2/default/GoogleMapsCompatible/{z}/{y}/{x}';

/** 三組免 Key、無浮水印、已視覺實測通過的免費標準圖磚底圖（EPSG:3857，切換免重調座標） */
export const BASEMAPS: Record<BasemapId, BasemapConfig> = {
  dark: {
    id: 'dark',
    name: '暗黑戰情',
    shortName: '暗黑戰情',
    description: 'Esri 深黑無字畫布，無浮水印，最搭發光雷達與動態風場',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 16,
    attribution: 'Tiles &copy; Esri &copy; NLSC',
    supportsLabelsOnTop: true,
    previewGradient: 'linear-gradient(135deg, #10141c 0%, #1e2633 55%, #0c1018 100%)'
  },
  satellite: {
    id: 'satellite',
    name: '衛星實景',
    shortName: '衛星實景',
    description: 'Esri 高解析空拍地形與海岸線',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri &copy; NLSC',
    supportsLabelsOnTop: true,
    previewGradient: 'linear-gradient(135deg, #132a1b 0%, #1d4e3a 50%, #0d2b45 100%)'
  },
  nlsc: {
    id: 'nlsc',
    name: '台灣繁中地圖',
    shortName: '台灣繁中',
    description: '國土測繪中心台灣通用電子地圖，路網與縣市最精準',
    url: 'https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: '&copy; 內政部國土測繪中心 NLSC',
    supportsLabelsOnTop: false,
    previewGradient: 'linear-gradient(135deg, #1f3347 0%, #3b5978 50%, #5c7a8c 100%)'
  }
};

export const BASEMAP_LIST: BasemapConfig[] = [
  BASEMAPS.dark,
  BASEMAPS.satellite,
  BASEMAPS.nlsc
];

/** 100% 沿用舊版已手工校正之 5 組 CWA 邊界座標（[[南, 西], [北, 東]]） */
export const DEFAULT_CALIBRATION_BOUNDS: Record<CalibrationGroupId, BoundsTuple> = {
  radar: [
    [20.455, 118.0],
    [26.48, 124.0]
  ],
  rainfall: [
    [21.505, 119.195],
    [25.9, 123.575]
  ],
  sat1350: [
    [19.03, 115.925],
    [28.215, 126.07]
  ],
  sat800: [
    [19.05, 115.935],
    [28.195, 126.055]
  ],
  sfc: [
    [-0.34, 80.63],
    [56.69, 167.995]
  ]
};

export const CALIBRATION_GROUPS: Record<CalibrationGroupId, CalibrationGroupMeta> = {
  radar: {
    id: 'radar',
    title: '雷達回波圖 (CV1_TW_3600)',
    defaultBounds: DEFAULT_CALIBRATION_BOUNDS.radar,
    range: {
      n: { min: 24.0, max: 28.0 },
      s: { min: 18.0, max: 22.0 },
      w: { min: 115.0, max: 120.0 },
      e: { min: 121.0, max: 127.0 }
    }
  },
  rainfall: {
    id: 'rainfall',
    title: '累積雨量圖 (QZJ)',
    defaultBounds: DEFAULT_CALIBRATION_BOUNDS.rainfall,
    range: {
      n: { min: 24.0, max: 27.0 },
      s: { min: 20.0, max: 22.5 },
      w: { min: 118.5, max: 121.0 },
      e: { min: 122.0, max: 124.5 }
    }
  },
  sat1350: {
    id: 'sat1350',
    title: '高解析衛星雲圖 (1350)',
    defaultBounds: DEFAULT_CALIBRATION_BOUNDS.sat1350,
    range: {
      n: { min: 24.0, max: 30.0 },
      s: { min: 16.0, max: 23.0 },
      w: { min: 114.0, max: 121.0 },
      e: { min: 121.0, max: 128.0 }
    }
  },
  sat800: {
    id: 'sat800',
    title: '紅外線衛星雲圖 (800)',
    defaultBounds: DEFAULT_CALIBRATION_BOUNDS.sat800,
    range: {
      n: { min: 23.0, max: 29.0 },
      s: { min: 17.0, max: 23.0 },
      w: { min: 115.0, max: 121.0 },
      e: { min: 120.0, max: 127.0 }
    }
  },
  sfc: {
    id: 'sfc',
    title: '地面等壓天氣圖 (SFCcombo)',
    defaultBounds: DEFAULT_CALIBRATION_BOUNDS.sfc,
    range: {
      n: { min: 45.0, max: 70.0 },
      s: { min: -20.0, max: 15.0 },
      w: { min: 60.0, max: 105.0 },
      e: { min: 145.0, max: 180.0 }
    }
  }
};

/** 中央氣象署 8 組官方圖資（透過 DOM img 疊加，免 CORS 限制） */
export const WEATHER_LAYERS: Record<WeatherLayerId, WeatherLayerConfig> = {
  radar: {
    id: 'radar',
    name: 'CWA 官方雷達回波',
    shortName: 'CWA 雷達',
    category: 'precipitation',
    url: 'https://www.cwa.gov.tw/Data/radar/CV1_TW_3600.png',
    pane: 'weather-radar',
    calibrationGroup: 'radar',
    defaultOpacity: 0.38,
    defaultBlendMode: 'normal',
    legendType: 'radar'
  },
  rainfall: {
    id: 'rainfall',
    name: 'CWA 日累積雨量圖',
    shortName: '累積雨量',
    category: 'precipitation',
    url: 'https://www.cwa.gov.tw/Data/rainfall/QZJ.jpg',
    pane: 'weather-radar',
    calibrationGroup: 'rainfall',
    defaultOpacity: 0.45,
    defaultBlendMode: 'screen',
    legendType: 'rainfall'
  },
  trueColor: {
    id: 'trueColor',
    name: '真實色衛星雲圖',
    shortName: '真實色雲圖',
    category: 'satellite',
    url: 'https://www.cwa.gov.tw/Data/satellite/TWI_TRGB_1350/TWI_TRGB_1350.jpg',
    pane: 'weather-cloud',
    calibrationGroup: 'sat1350',
    defaultOpacity: 0.45,
    defaultBlendMode: 'screen'
  },
  visible: {
    id: 'visible',
    name: '可見光衛星雲圖',
    shortName: '可見光雲圖',
    category: 'satellite',
    url: 'https://www.cwa.gov.tw/Data/satellite/TWI_VIS_Gray_1350/TWI_VIS_Gray_1350.jpg',
    pane: 'weather-cloud',
    calibrationGroup: 'sat1350',
    defaultOpacity: 0.45,
    defaultBlendMode: 'screen'
  },
  color: {
    id: 'color',
    name: '彩色紅外線雲圖',
    shortName: '彩色紅外線',
    category: 'satellite',
    url: 'https://www.cwa.gov.tw/Data/satellite/TWI_IR1_CR_800/TWI_IR1_CR_800.jpg',
    pane: 'weather-cloud',
    calibrationGroup: 'sat800',
    defaultOpacity: 0.48,
    defaultBlendMode: 'screen'
  },
  enhanced: {
    id: 'enhanced',
    name: '色調強化雲圖',
    shortName: '色調強化',
    category: 'satellite',
    url: 'https://www.cwa.gov.tw/Data/satellite/TWI_IR1_MB_800/TWI_IR1_MB_800.jpg',
    pane: 'weather-cloud',
    calibrationGroup: 'sat800',
    defaultOpacity: 0.48,
    defaultBlendMode: 'screen'
  },
  bw: {
    id: 'bw',
    name: '黑白紅外線雲圖',
    shortName: '黑白紅外線',
    category: 'satellite',
    url: 'https://www.cwa.gov.tw/Data/satellite/TWI_IR1_Gray_800/TWI_IR1_Gray_800.jpg',
    pane: 'weather-cloud',
    calibrationGroup: 'sat800',
    defaultOpacity: 0.45,
    defaultBlendMode: 'screen'
  },
  sfc: {
    id: 'sfc',
    name: '地面等壓天氣圖',
    shortName: '地面等壓圖',
    category: 'synoptic',
    url: 'https://www.cwa.gov.tw/Data/fcst_img/SFCcombo.jpg',
    pane: 'weather-cloud',
    calibrationGroup: 'sfc',
    defaultOpacity: 0.4,
    defaultBlendMode: 'screen'
  }
};

export const WEATHER_LAYER_LIST: WeatherLayerConfig[] = [
  WEATHER_LAYERS.radar,
  WEATHER_LAYERS.rainfall,
  WEATHER_LAYERS.trueColor,
  WEATHER_LAYERS.visible,
  WEATHER_LAYERS.color,
  WEATHER_LAYERS.enhanced,
  WEATHER_LAYERS.bw,
  WEATHER_LAYERS.sfc
];

export function createInitialOverlays(): Record<WeatherLayerId, OverlayRuntimeState> {
  return {
    radar: { enabled: false, opacity: 0.38, blendMode: 'normal' },
    rainfall: { enabled: false, opacity: 0.45, blendMode: 'screen' },
    trueColor: { enabled: false, opacity: 0.45, blendMode: 'screen' },
    visible: { enabled: false, opacity: 0.45, blendMode: 'screen' },
    color: { enabled: false, opacity: 0.48, blendMode: 'screen' },
    enhanced: { enabled: false, opacity: 0.48, blendMode: 'screen' },
    bw: { enabled: false, opacity: 0.45, blendMode: 'screen' },
    sfc: { enabled: false, opacity: 0.4, blendMode: 'screen' }
  };
}

/** 一鍵戰情組合預設 */
export const WAR_ROOM_COMBOS: WarRoomComboPreset[] = [
  {
    id: 'typhoon',
    label: '🌀 颱風動態追蹤',
    description: '暗黑＋2h 透明動態雨帶＋風場流線',
    basemap: 'dark',
    labelsOnTop: true,
    windEnabled: true,
    rainViewerEnabled: true,
    overlays: {}
  },
  {
    id: 'cwa-radar',
    label: '📡 CWA 官方雷達',
    description: '暗黑＋氣象署高解析雷達＋風場',
    basemap: 'dark',
    labelsOnTop: true,
    windEnabled: true,
    rainViewerEnabled: false,
    overlays: {
      radar: { enabled: true, opacity: 0.38, blendMode: 'normal' }
    }
  },
  {
    id: 'cloud-rain',
    label: '☁️ 雲系＋累積雨量',
    description: '真實色衛星雲圖疊加日累積雨量',
    basemap: 'dark',
    labelsOnTop: true,
    windEnabled: false,
    rainViewerEnabled: false,
    overlays: {
      trueColor: { enabled: true, opacity: 0.45, blendMode: 'screen' },
      rainfall: { enabled: true, opacity: 0.48, blendMode: 'screen' }
    }
  },
  {
    id: 'tw-road',
    label: '🗺️ 繁中查路況',
    description: '台灣繁中電子地圖＋透明雨帶',
    basemap: 'nlsc',
    labelsOnTop: false,
    windEnabled: false,
    rainViewerEnabled: true,
    overlays: {}
  }
];

/** 雷達 dBZ 與累積雨量色階圖例 */
export const RADAR_LEGEND_STOPS = [
  { label: '15', color: '#00f0ff' },
  { label: '25', color: '#00a0ff' },
  { label: '35', color: '#00e600' },
  { label: '45', color: '#ffff00' },
  { label: '55', color: '#ff8000' },
  { label: '65+', color: '#e600e6' }
];

export const RAINFALL_LEGEND_STOPS = [
  { label: '1', color: '#9cf7ff' },
  { label: '15', color: '#00b4ff' },
  { label: '40', color: '#00d957' },
  { label: '80', color: '#ffd000' },
  { label: '150', color: '#ff5500' },
  { label: '300+', color: '#d400ff' }
];
