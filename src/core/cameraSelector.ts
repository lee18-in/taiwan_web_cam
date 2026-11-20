import type { PresetFilter, Webcam } from '../types/webcam';

export interface GeoBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface SelectionOptions {
  webcams: Webcam[];
  bounds: GeoBounds | null;
  center: GeoPoint;
  maxTiles: number;
  pinnedIds: string[];
  offlineIds: Set<string>;
  presetFilter: PresetFilter;
  searchQuery: string;
  isCoveredByWall?: (cam: Webcam, selectedSoFar: Webcam[]) => boolean;
}

const EARTH_RADIUS_M = 6371000;

export function haversineDistanceMeters(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isPointInBounds(cam: GeoPoint, bounds: GeoBounds | null): boolean {
  if (!bounds) return true;
  return (
    cam.lat >= bounds.south &&
    cam.lat <= bounds.north &&
    cam.lng >= bounds.west &&
    cam.lng <= bounds.east
  );
}

export function matchesFilter(
  cam: Webcam,
  presetFilter: PresetFilter,
  searchQuery: string,
  pinnedSet: Set<string>
): boolean {
  const q = searchQuery.trim().toLowerCase();
  if (q) {
    const haystack = `${cam.name} ${cam.county} ${cam.tags.join(' ')} ${cam.id}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  if (presetFilter === 'all') return true;
  if (presetFilter === 'pinned') return pinnedSet.has(cam.id);
  return cam.tags.includes(presetFilter);
}

/**
 * 篩選最終要顯示於影片牆的攝影機清單：
 * 1. 已釘選鏡頭（上限 4 支）一律最優先保留，不受拖曳出視野影響。
 * 2. 剩餘格位自視野內健康（非離線）鏡頭依 level 升冪、同級距地圖中心距離升冪填入。
 * 3. 若有傳入遮擋判斷函式，最多迭代 2 次避開被左右影片牆擋住的地標（已釘選除外）。
 */
export function selectDisplayWebcams(options: SelectionOptions): Webcam[] {
  const {
    webcams,
    bounds,
    center,
    maxTiles,
    pinnedIds,
    offlineIds,
    presetFilter,
    searchQuery,
    isCoveredByWall
  } = options;

  if (maxTiles <= 0) return [];

  const pinnedSet = new Set(pinnedIds);
  const byId = new Map(webcams.map((c) => [c.id, c]));

  const pinnedCams: Webcam[] = [];
  for (const id of pinnedIds) {
    const cam = byId.get(id);
    if (!cam) continue;
    if (offlineIds.has(cam.id)) continue;
    if (searchQuery.trim() && !matchesFilter(cam, 'all', searchQuery, pinnedSet)) continue;
    pinnedCams.push(cam);
    if (pinnedCams.length >= Math.min(4, maxTiles)) break;
  }

  if (presetFilter === 'pinned') {
    return pinnedCams.slice(0, maxTiles);
  }

  const remainingSlots = maxTiles - pinnedCams.length;
  if (remainingSlots <= 0) return pinnedCams;

  const pinnedChosenIds = new Set(pinnedCams.map((c) => c.id));
  let candidates = webcams.filter((cam) => {
    if (pinnedChosenIds.has(cam.id)) return false;
    if (offlineIds.has(cam.id)) return false;
    if (!matchesFilter(cam, presetFilter, searchQuery, pinnedSet)) return false;
    // 若使用者有輸入搜尋字，允許跨視野快速聚焦找到該鏡頭
    if (searchQuery.trim()) return true;
    return isPointInBounds(cam, bounds);
  });

  const rankCandidates = (list: Webcam[]): Webcam[] => {
    return list
      .map((cam) => ({
        cam,
        dist: haversineDistanceMeters(center, cam)
      }))
      .sort((a, b) => a.cam.level - b.cam.level || a.dist - b.dist)
      .slice(0, remainingSlots)
      .map((item) => item.cam);
  };

  let chosenDynamic = rankCandidates(candidates);

  if (isCoveredByWall && !searchQuery.trim()) {
    for (let iter = 0; iter < 2; iter++) {
      const combined = [...pinnedCams, ...chosenDynamic];
      const uncovered = candidates.filter((cam) => !isCoveredByWall(cam, combined));
      if (uncovered.length === candidates.length || uncovered.length === 0) break;
      candidates = uncovered;
      chosenDynamic = rankCandidates(candidates);
    }
  }

  return [...pinnedCams, ...chosenDynamic];
}
