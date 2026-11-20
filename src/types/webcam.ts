export type WebcamRegion = 'north' | 'central' | 'south' | 'east' | 'island';

export type WebcamTag =
  | 'coast'
  | 'mountain'
  | 'urban'
  | 'traffic'
  | 'reservoir'
  | 'island';

export type PresetFilter = 'all' | WebcamTag | 'pinned';

export interface WebcamStream {
  provider: 'youtube' | 'hls' | 'mjpeg';
  videoId: string;
  backupVideoIds: string[];
  url?: string;
}

export interface Webcam {
  id: string;
  name: string;
  level: 0 | 1 | 2 | 3 | 4;
  lat: number;
  lng: number;
  region: WebcamRegion;
  county: string;
  tags: WebcamTag[];
  stream: WebcamStream;
}

export interface CameraWeatherTelemetry {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  precipitation: number;
  weatherCode: number;
  updatedAt: number;
}

export interface HealthEntry {
  ok: boolean;
  statusCode?: number;
  title?: string;
  checkedAt?: string;
}

export interface HealthManifest {
  checkedAt: string | null;
  summary: {
    total: number;
    online: number;
    offline: number;
  };
  statusById: Record<string, HealthEntry>;
}
