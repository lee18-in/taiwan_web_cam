import { describe, expect, it } from 'vitest';
import webcamsRaw from '../../src/data/webcams.json';
import { selectDisplayWebcams } from '../../src/core/cameraSelector';
import { computeDesktopSlotLayouts, splitDesktopWalls } from '../../src/core/spatialSorter';
import { computeTacticalElbowPath } from '../../src/core/connectorGeometry';
import { buildShareUrl, parseUrlState } from '../../src/core/urlSync';
import { sampleWindAt } from '../../src/services/openMeteo';
import type { Webcam } from '../../src/types/webcam';
import type { WindGridData } from '../../src/types/weather';

const webcams = webcamsRaw as Webcam[];

describe('webcams.json 資料完整性', () => {
  it('完整保留 56 支鏡頭且 ID 唯一、座標與層級合法', () => {
    expect(webcams.length).toBe(56);
    const ids = new Set(webcams.map((c) => c.id));
    expect(ids.size).toBe(56);
    for (const c of webcams) {
      expect(c.level).toBeGreaterThanOrEqual(0);
      expect(c.level).toBeLessThanOrEqual(4);
      expect(c.lat).toBeGreaterThan(20);
      expect(c.lat).toBeLessThan(27);
      expect(c.lng).toBeGreaterThan(117);
      expect(c.lng).toBeLessThan(123);
      expect(c.stream.videoId.length).toBeGreaterThan(5);
    }
  });
});

describe('cameraSelector 鏡頭優先權、釘選與離線遞補', () => {
  const taiwanBounds = { south: 21.5, west: 118.0, north: 25.5, east: 122.2 };
  const center = { lat: 23.6, lng: 120.85 };

  it('預設取 4 支時應全選 level 0 最高優先鏡頭', () => {
    const picked = selectDisplayWebcams({
      webcams,
      bounds: taiwanBounds,
      center,
      maxTiles: 4,
      pinnedIds: [],
      offlineIds: new Set(),
      presetFilter: 'all',
      searchQuery: ''
    });
    expect(picked).toHaveLength(4);
    expect(picked.every((c) => c.level === 0)).toBe(true);
  });

  it('釘選鏡頭應永遠優先保留，即使不在可視範圍內', () => {
    const northOnlyBounds = { south: 24.8, west: 121.0, north: 25.4, east: 122.0 };
    const picked = selectDisplayWebcams({
      webcams,
      bounds: northOnlyBounds,
      center: { lat: 25.05, lng: 121.5 },
      maxTiles: 4,
      pinnedIds: ['kenting-nanwan'],
      offlineIds: new Set(),
      presetFilter: 'all',
      searchQuery: ''
    });
    expect(picked[0].id).toBe('kenting-nanwan');
    expect(picked).toHaveLength(4);
  });

  it('離線鏡頭應被自動跳過並遞補下一順位鏡頭', () => {
    const picked = selectDisplayWebcams({
      webcams,
      bounds: taiwanBounds,
      center,
      maxTiles: 4,
      pinnedIds: [],
      offlineIds: new Set(['xiangshan-taipei']),
      presetFilter: 'all',
      searchQuery: ''
    });
    expect(picked).toHaveLength(4);
    expect(picked.some((c) => c.id === 'xiangshan-taipei')).toBe(false);
    expect(picked.some((c) => c.level === 1)).toBe(true);
  });

  it('情境篩選「離島」應只回傳具 island 標籤之鏡頭', () => {
    const picked = selectDisplayWebcams({
      webcams,
      bounds: taiwanBounds,
      center,
      maxTiles: 8,
      pinnedIds: [],
      offlineIds: new Set(),
      presetFilter: 'island',
      searchQuery: ''
    });
    expect(picked.length).toBeGreaterThanOrEqual(2);
    expect(picked.every((c) => c.tags.includes('island'))).toBe(true);
  });
});

describe('spatialSorter 左右牆空間排序與座標計算', () => {
  it('6 支鏡頭應平均分配為左 3 右 3，且單側由北到南遞減排序', () => {
    const sample = webcams.slice(0, 6);
    const { leftCams, rightCams } = splitDesktopWalls(sample);
    expect(leftCams).toHaveLength(3);
    expect(rightCams).toHaveLength(3);
    for (let i = 1; i < leftCams.length; i++) {
      expect(leftCams[i - 1].lat).toBeGreaterThanOrEqual(leftCams[i].lat);
    }
    for (let i = 1; i < rightCams.length; i++) {
      expect(rightCams[i - 1].lat).toBeGreaterThanOrEqual(rightCams[i].lat);
    }
  });

  it('1440x900 桌機版 8 格卡片不得超出視窗且中央保有地圖操作區', () => {
    const sample = webcams.slice(0, 8);
    const metrics = computeDesktopSlotLayouts(sample, 1440, 900);
    expect(metrics.slots).toHaveLength(8);
    expect(1440 - metrics.leftWidth - metrics.rightWidth).toBeGreaterThanOrEqual(360);
    for (const s of metrics.slots) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x + s.width).toBeLessThanOrEqual(1440);
      expect(s.y).toBeGreaterThanOrEqual(60);
      expect(s.y + s.height).toBeLessThanOrEqual(900);
    }
  });
});

describe('connectorGeometry 45° 戰術折線', () => {
  it('應產生合法 SVG Path 且左側向右延伸、右側向左延伸', () => {
    const left = computeTacticalElbowPath({
      startX: 300,
      startY: 200,
      targetX: 600,
      targetY: 320,
      side: 'left'
    });
    expect(left.kneeX).toBeGreaterThan(300);
    expect(left.pathD).toMatch(/^M 300 200 L .+ L 600 320$/);

    const right = computeTacticalElbowPath({
      startX: 1100,
      startY: 250,
      targetX: 780,
      targetY: 400,
      side: 'right'
    });
    expect(right.kneeX).toBeLessThan(1100);
    expect(right.pathD).toMatch(/^M 1100 250 L .+ L 780 400$/);
  });
});

describe('urlSync 分享連結序列化與還原', () => {
  it('應能完整來回編解碼視角、底圖、單選氣象層、釘選與風場開關', () => {
    const url = buildShareUrl('https://lee18-in.github.io/taiwan_web_cam/', {
      lat: 23.5825,
      lng: 120.5855,
      zoom: 9,
      basemap: 'satellite',
      activeLayer: 'trueColor',
      pinnedIds: ['kenting-nanwan', 'taitung-sanxiantai'],
      presetFilter: 'coast',
      windEnabled: true,
      maxTiles: 6,
      kioskMode: false
    });
    const parsed = parseUrlState(new URL(url).search);
    expect(parsed.lat).toBeCloseTo(23.5825, 4);
    expect(parsed.lng).toBeCloseTo(120.5855, 4);
    expect(parsed.zoom).toBe(9);
    expect(parsed.basemap).toBe('satellite');
    expect(parsed.activeLayer).toBe('trueColor');
    expect(parsed.pinnedIds).toEqual(['kenting-nanwan', 'taitung-sanxiantai']);
    expect(parsed.presetFilter).toBe('coast');
    expect(parsed.windEnabled).toBe(true);
    expect(parsed.maxTiles).toBe(6);
  });

  it('應正確解析 ?debug=calib、?layer=none 與舊參數相容 ?rv=1', () => {
    const parsed = parseUrlState('?debug=calib&kiosk=1&layer=none');
    expect(parsed.debugCalib).toBe(true);
    expect(parsed.kioskMode).toBe(true);
    expect(parsed.activeLayer).toBeNull();
    expect(parseUrlState('?rv=1').activeLayer).toBe('rainViewer');
  });
});

describe('openMeteo 雙線性風場內插', () => {
  const grid: WindGridData = {
    lats: [22, 24],
    lngs: [120, 122],
    u: [
      [0, 10],
      [0, 10]
    ],
    v: [
      [0, 0],
      [20, 20]
    ],
    speedKmh: [
      [10, 30],
      [30, 50]
    ],
    fetchedAt: Date.now()
  };

  it('中心點應精準內插為四頂點平均', () => {
    const s = sampleWindAt(grid, 23, 121);
    expect(s).not.toBeNull();
    expect(s!.u).toBeCloseTo(5, 5);
    expect(s!.v).toBeCloseTo(10, 5);
    expect(s!.speedKmh).toBeCloseTo(30, 5);
  });

  it('超出網格邊界應安全回傳 null', () => {
    expect(sampleWindAt(grid, 26, 121)).toBeNull();
    expect(sampleWindAt(grid, 23, 117)).toBeNull();
  });
});
