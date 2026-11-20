import type { CameraWeatherTelemetry, Webcam } from '../types/webcam';
import type { WindGridData } from '../types/weather';

const WIND_GRID_LATS = [21.2, 22.15, 23.1, 24.05, 25.0, 25.95];
const WIND_GRID_LNGS = [118.0, 118.95, 119.9, 120.85, 121.8, 122.75];

const CACHE_TTL_MS = 10 * 60 * 1000;

let cachedWindGrid: WindGridData | null = null;
let inflightWindPromise: Promise<WindGridData | null> | null = null;

const telemetryCache = new Map<string, CameraWeatherTelemetry>();

interface OpenMeteoCurrentItem {
  current?: {
    temperature_2m?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    wind_gusts_10m?: number;
    precipitation?: number;
    weather_code?: number;
  };
}

/**
 * 單次批次查詢台灣周邊 6x6 網格風速／風向（免 Key、CORS *），快取 10 分鐘。
 */
export async function fetchTaiwanWindGrid(force = false): Promise<WindGridData | null> {
  const now = Date.now();
  if (!force && cachedWindGrid && now - cachedWindGrid.fetchedAt < CACHE_TTL_MS) {
    return cachedWindGrid;
  }
  if (!force && inflightWindPromise) return inflightWindPromise;

  const latList: number[] = [];
  const lngList: number[] = [];
  for (const lat of WIND_GRID_LATS) {
    for (const lng of WIND_GRID_LNGS) {
      latList.push(lat);
      lngList.push(lng);
    }
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latList.join(
    ','
  )}&longitude=${lngList.join(',')}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh`;

  inflightWindPromise = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) return cachedWindGrid;
      const json: OpenMeteoCurrentItem | OpenMeteoCurrentItem[] = await res.json();
      const items = Array.isArray(json) ? json : [json];
      if (items.length !== latList.length) return cachedWindGrid;

      const rows = WIND_GRID_LATS.length;
      const cols = WIND_GRID_LNGS.length;
      const u: number[][] = Array.from({ length: rows }, () => Array<number>(cols).fill(0));
      const v: number[][] = Array.from({ length: rows }, () => Array<number>(cols).fill(0));
      const speedKmh: number[][] = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const item = items[r * cols + c]?.current;
          const spdKmh = item?.wind_speed_10m ?? 0;
          const dirDeg = item?.wind_direction_10m ?? 0;
          // 氣象風向為「風吹來的方向（北=0° 順時針）」，粒子流動方向為其反向
          const spdMs = spdKmh / 3.6;
          const rad = (dirDeg * Math.PI) / 180;
          u[r][c] = -spdMs * Math.sin(rad);
          v[r][c] = -spdMs * Math.cos(rad);
          speedKmh[r][c] = spdKmh;
        }
      }

      cachedWindGrid = {
        lats: WIND_GRID_LATS,
        lngs: WIND_GRID_LNGS,
        u,
        v,
        speedKmh,
        fetchedAt: Date.now()
      };
      return cachedWindGrid;
    } catch {
      return cachedWindGrid;
    } finally {
      inflightWindPromise = null;
    }
  })();

  return inflightWindPromise;
}

/**
 * 對台灣風場網格執行雙線性內插，取得任意經緯度之風向向量與風速。
 */
export function sampleWindAt(
  grid: WindGridData,
  lat: number,
  lng: number
): { u: number; v: number; speedKmh: number } | null {
  const { lats, lngs, u, v, speedKmh } = grid;
  const minLat = lats[0];
  const maxLat = lats[lats.length - 1];
  const minLng = lngs[0];
  const maxLng = lngs[lngs.length - 1];

  if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) {
    return null;
  }

  const rFloat = ((lat - minLat) / (maxLat - minLat)) * (lats.length - 1);
  const cFloat = ((lng - minLng) / (maxLng - minLng)) * (lngs.length - 1);
  const r0 = Math.min(lats.length - 2, Math.max(0, Math.floor(rFloat)));
  const c0 = Math.min(lngs.length - 2, Math.max(0, Math.floor(cFloat)));
  const dr = rFloat - r0;
  const dc = cFloat - c0;

  const interp = (mat: number[][]) =>
    mat[r0][c0] * (1 - dr) * (1 - dc) +
    mat[r0][c0 + 1] * (1 - dr) * dc +
    mat[r0 + 1][c0] * dr * (1 - dc) +
    mat[r0 + 1][c0 + 1] * dr * dc;

  return {
    u: interp(u),
    v: interp(v),
    speedKmh: interp(speedKmh)
  };
}

/**
 * 批次查詢顯示中鏡頭座標之即時氣溫、風速、陣風與降雨量，結果快取 10 分鐘。
 */
export async function fetchCameraTelemetry(
  cams: Webcam[]
): Promise<Record<string, CameraWeatherTelemetry>> {
  const now = Date.now();
  const result: Record<string, CameraWeatherTelemetry> = {};
  const toFetch: Webcam[] = [];

  for (const cam of cams) {
    const hit = telemetryCache.get(cam.id);
    if (hit && now - hit.updatedAt < CACHE_TTL_MS) {
      result[cam.id] = hit;
    } else {
      toFetch.push(cam);
    }
  }

  if (toFetch.length === 0) return result;

  const lats = toFetch.map((c) => c.lat.toFixed(4)).join(',');
  const lngs = toFetch.map((c) => c.lng.toFixed(4)).join(',');
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,weather_code&wind_speed_unit=kmh`;

  try {
    const res = await fetch(url);
    if (!res.ok) return result;
    const json: OpenMeteoCurrentItem | OpenMeteoCurrentItem[] = await res.json();
    const items = Array.isArray(json) ? json : [json];

    toFetch.forEach((cam, idx) => {
      const cur = items[idx]?.current;
      if (!cur) return;
      const entry: CameraWeatherTelemetry = {
        temperature: cur.temperature_2m ?? 0,
        windSpeed: cur.wind_speed_10m ?? 0,
        windDirection: cur.wind_direction_10m ?? 0,
        windGusts: cur.wind_gusts_10m ?? 0,
        precipitation: cur.precipitation ?? 0,
        weatherCode: cur.weather_code ?? 0,
        updatedAt: Date.now()
      };
      telemetryCache.set(cam.id, entry);
      result[cam.id] = entry;
    });
  } catch {
    // 靜默容錯：遙測失敗不影響地圖與直播主功能
  }

  return result;
}

export function describeWeatherCode(code: number): string {
  if (code === 0) return '晴朗';
  if (code <= 3) return '多雲';
  if (code === 45 || code === 48) return '起霧';
  if (code >= 51 && code <= 57) return '毛毛雨';
  if (code >= 61 && code <= 65) return '降雨';
  if (code >= 80 && code <= 82) return '陣雨';
  if (code >= 95) return '雷雨';
  return '陰';
}
