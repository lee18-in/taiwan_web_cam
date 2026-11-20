import type { RainViewerFrame } from '../types/weather';

export interface RainViewerPayload {
  host: string;
  frames: RainViewerFrame[];
  fetchedAt: number;
}

const CACHE_MS = 5 * 60 * 1000;
let cached: RainViewerPayload | null = null;

interface RawRainViewerApi {
  host?: string;
  radar?: {
    past?: RainViewerFrame[];
    nowcast?: RainViewerFrame[];
  };
}

export async function fetchRainViewerFrames(force = false): Promise<RainViewerPayload | null> {
  if (!force && cached && Date.now() - cached.fetchedAt < CACHE_MS) {
    return cached;
  }

  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (!res.ok) return cached;
    const data: RawRainViewerApi = await res.json();
    const host = data.host || 'https://tilecache.rainviewer.com';
    const past = data.radar?.past ?? [];
    const nowcast = data.radar?.nowcast ?? [];
    const frames = [...past, ...nowcast];
    if (frames.length === 0) return cached;

    cached = {
      host,
      frames,
      fetchedAt: Date.now()
    };
    return cached;
  } catch {
    return cached;
  }
}

export function buildRainViewerTileUrl(host: string, frame: RainViewerFrame): string {
  // color scheme 2 (Universal Blue) + smooth=1 + snow=1
  return `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
}

export function formatTaipeiFrameTime(unixSec: number): string {
  const date = new Date(unixSec * 1000);
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}
