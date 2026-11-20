import type {
  BasemapConfig,
  BasemapId,
  BoundsTuple,
  CalibrationGroupId,
  CalibrationGroupMeta,
  WeatherLayerConfig,
  WeatherLayerId
} from '../types/weather';

/** 台灣地理中心點與預設縮放 */
export const TAIWAN_DEFAULT_CENTER: [number, number] = [23.62, 120.85];
export const TAIWAN_DEFAULT_ZOOM = 8;

/** 浮動繁體中文地名與路網透明圖磚（內政部國土測繪中心 NLSC EMAP2） */
export const TW_LABELS_TILE_URL =
  'https://wmts.nlsc.gov.tw/wmts/EMAP2/default/GoogleMapsCompatible/{z}/{y}/{x}';

/** 三組免 Key、無浮水印、實測通過的免費標準圖磚底圖（點一下依序循環切換） */
export const BASEMAP_ORDER: BasemapId[] = ['dark', 'satellite', 'nlsc'];

export const BASEMAPS: Record<BasemapId, BasemapConfig> = {
  dark: {
    id: 'dark',
    name: '暗黑戰情',
    shortName: '暗黑',
    description: 'Esri 深黑無字畫布＋繁中置頂地名',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 16,
    attribution: 'Tiles &copy; Esri &copy; NLSC',
    supportsLabelsOnTop: true
  },
  satellite: {
    id: 'satellite',
    name: '衛星實景',
    shortName: '衛星',
    description: 'Esri 高解析空拍地形＋繁中置頂地名',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri &copy; NLSC',
    supportsLabelsOnTop: true
  },
  nlsc: {
    id: 'nlsc',
    name: '台灣繁中地圖',
    shortName: '繁中',
    description: '國土測繪中心台灣通用電子地圖',
    url: 'https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: '&copy; 內政部國土測繪中心 NLSC',
    supportsLabelsOnTop: false
  }
};

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

/** 中央氣象署 8 組官方圖資（嚴格單選互斥，系統自動套用最佳透明度與混色） */
export const WEATHER_LAYERS: Record<WeatherLayerId, WeatherLayerConfig> = {
  radar: {
    id: 'radar',
    name: 'CWA 雷達回波',
    shortName: '雷達',
    category: 'precipitation',
    url: 'https://www.cwa.gov.tw/Data/radar/CV1_TW_3600.png',
    pane: 'weather-radar',
    calibrationGroup: 'radar',
    optimalOpacityDark: 0.36,
    optimalOpacityLight: 0.55,
    blendModeDark: 'normal'
  },
  rainfall: {
    id: 'rainfall',
    name: 'CWA 累積雨量',
    shortName: '雨量',
    category: 'precipitation',
    url: 'https://www.cwa.gov.tw/Data/rainfall/QZJ.jpg',
    pane: 'weather-radar',
    calibrationGroup: 'rainfall',
    optimalOpacityDark: 0.48,
    optimalOpacityLight: 0.58,
    blendModeDark: 'screen'
  },
  trueColor: {
    id: 'trueColor',
    name: '真實色衛星雲圖',
    shortName: '真實色',
    category: 'satellite',
    url: 'https://www.cwa.gov.tw/Data/satellite/TWI_TRGB_1350/TWI_TRGB_1350.jpg',
    pane: 'weather-cloud',
    calibrationGroup: 'sat1350',
    optimalOpacityDark: 0.52,
    optimalOpacityLight: 0.62,
    blendModeDark: 'screen'
  },
  visible: {
    id: 'visible',
    name: '可見光衛星雲圖',
    shortName: '可見光',
    category: 'satellite',
    url: 'https://www.cwa.gov.tw/Data/satellite/TWI_VIS_Gray_1350/TWI_VIS_Gray_1350.jpg',
    pane: 'weather-cloud',
    calibrationGroup: 'sat1350',
    optimalOpacityDark: 0.5,
    optimalOpacityLight: 0.6,
    blendModeDark: 'screen'
  },
  color: {
    id: 'color',
    name: '彩色紅外線雲圖',
    shortName: '彩色紅外線',
    category: 'satellite',
    url: 'https://www.cwa.gov.tw/Data/satellite/TWI_IR1_CR_800/TWI_IR1_CR_800.jpg',
    pane: 'weather-cloud',
    calibrationGroup: 'sat800',
    optimalOpacityDark: 0.52,
    optimalOpacityLight: 0.6,
    blendModeDark: 'screen'
  },
  enhanced: {
    id: 'enhanced',
    name: '色調強化雲圖',
    shortName: '色調強化',
    category: 'satellite',
    url: 'https://www.cwa.gov.tw/Data/satellite/TWI_IR1_MB_800/TWI_IR1_MB_800.jpg',
    pane: 'weather-cloud',
    calibrationGroup: 'sat800',
    optimalOpacityDark: 0.52,
    optimalOpacityLight: 0.6,
    blendModeDark: 'screen'
  },
  bw: {
    id: 'bw',
    name: '黑白紅外線雲圖',
    shortName: '黑白紅外線',
    category: 'satellite',
    url: 'https://www.cwa.gov.tw/Data/satellite/TWI_IR1_Gray_800/TWI_IR1_Gray_800.jpg',
    pane: 'weather-cloud',
    calibrationGroup: 'sat800',
    optimalOpacityDark: 0.48,
    optimalOpacityLight: 0.58,
    blendModeDark: 'screen'
  },
  sfc: {
    id: 'sfc',
    name: '地面等壓天氣圖',
    shortName: '地面等壓',
    category: 'synoptic',
    url: 'https://www.cwa.gov.tw/Data/fcst_img/SFCcombo.jpg',
    pane: 'weather-cloud',
    calibrationGroup: 'sfc',
    optimalOpacityDark: 0.44,
    optimalOpacityLight: 0.55,
    blendModeDark: 'screen'
  }
};

export const SATELLITE_SUB_LAYERS: WeatherLayerConfig[] = [
  WEATHER_LAYERS.trueColor,
  WEATHER_LAYERS.visible,
  WEATHER_LAYERS.color,
  WEATHER_LAYERS.enhanced,
  WEATHER_LAYERS.bw,
  WEATHER_LAYERS.sfc
];
