import type { PresetFilter } from '../types/webcam';
import type { ActiveWeatherLayerId, BasemapId, WeatherLayerId } from '../types/weather';

export interface UrlShareState {
  lat?: number;
  lng?: number;
  zoom?: number;
  basemap?: BasemapId;
  activeLayer?: ActiveWeatherLayerId;
  pinnedIds?: string[];
  presetFilter?: PresetFilter;
  windEnabled?: boolean;
  maxTiles?: 4 | 6 | 8;
  kioskMode?: boolean;
  debugCalib?: boolean;
}

const VALID_BASEMAPS = new Set<BasemapId>(['dark', 'satellite', 'nlsc']);
const VALID_ACTIVE_LAYERS = new Set<Exclude<ActiveWeatherLayerId, null>>([
  'rainViewer',
  'radar',
  'rainfall',
  'visible',
  'trueColor',
  'color',
  'enhanced',
  'bw',
  'sfc'
]);
const VALID_FILTERS = new Set<PresetFilter>([
  'all',
  'coast',
  'mountain',
  'urban',
  'traffic',
  'reservoir',
  'island',
  'pinned'
]);

export function parseUrlState(search: string): UrlShareState {
  const params = new URLSearchParams(search);
  const out: UrlShareState = {};

  const lat = Number(params.get('lat'));
  const lng = Number(params.get('lng'));
  if (params.has('lat') && params.has('lng') && Number.isFinite(lat) && Number.isFinite(lng)) {
    if (lat >= -85 && lat <= 85 && lng >= -180 && lng <= 180) {
      out.lat = lat;
      out.lng = lng;
    }
  }

  const z = Number(params.get('z'));
  if (params.has('z') && Number.isFinite(z) && z >= 4 && z <= 18) {
    out.zoom = Math.round(z);
  }

  const base = params.get('base') as BasemapId | null;
  if (base && VALID_BASEMAPS.has(base)) {
    out.basemap = base;
  }

  // 新版單選參數 ?layer=rainViewer | radar | rainfall | trueColor | ... | none
  if (params.has('layer')) {
    const raw = params.get('layer') ?? '';
    if (raw === 'none' || raw === '') {
      out.activeLayer = null;
    } else if (VALID_ACTIVE_LAYERS.has(raw as Exclude<ActiveWeatherLayerId, null>)) {
      out.activeLayer = raw as ActiveWeatherLayerId;
    }
  } else if (params.get('rv') === '1') {
    out.activeLayer = 'rainViewer';
  } else if (params.has('layers')) {
    const first = (params.get('layers') ?? '').split(',')[0] as WeatherLayerId;
    if (!first || first === ('none' as string)) {
      out.activeLayer = null;
    } else if (VALID_ACTIVE_LAYERS.has(first)) {
      out.activeLayer = first;
    }
  }

  if (params.has('pins')) {
    out.pinnedIds = (params.get('pins') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4);
  }

  const tag = params.get('tag') as PresetFilter | null;
  if (tag && VALID_FILTERS.has(tag)) {
    out.presetFilter = tag;
  }

  if (params.has('wind')) {
    out.windEnabled = params.get('wind') === '1';
  }

  const tiles = Number(params.get('tiles'));
  if (tiles === 4 || tiles === 6 || tiles === 8) {
    out.maxTiles = tiles;
  }

  if (params.get('kiosk') === '1') {
    out.kioskMode = true;
  }

  if (params.get('debug') === 'calib') {
    out.debugCalib = true;
  }

  return out;
}

export function buildShareUrl(
  baseUrl: string,
  state: Required<
    Pick<
      UrlShareState,
      | 'lat'
      | 'lng'
      | 'zoom'
      | 'basemap'
      | 'activeLayer'
      | 'pinnedIds'
      | 'presetFilter'
      | 'windEnabled'
      | 'maxTiles'
      | 'kioskMode'
    >
  >
): string {
  const url = new URL(baseUrl);
  const p = new URLSearchParams();
  p.set('lat', state.lat.toFixed(4));
  p.set('lng', state.lng.toFixed(4));
  p.set('z', String(Math.round(state.zoom)));
  p.set('base', state.basemap);
  p.set('layer', state.activeLayer ?? 'none');
  if (state.pinnedIds.length > 0) p.set('pins', state.pinnedIds.join(','));
  if (state.presetFilter !== 'all') p.set('tag', state.presetFilter);
  p.set('wind', state.windEnabled ? '1' : '0');
  if (state.maxTiles !== 4) p.set('tiles', String(state.maxTiles));
  if (state.kioskMode) p.set('kiosk', '1');
  url.search = p.toString();
  return url.toString();
}
