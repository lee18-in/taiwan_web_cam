import type L from 'leaflet';
import { sampleWindAt } from '../../services/openMeteo';
import type { WindGridData } from '../../types/weather';

interface WindParticle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

const BUCKET_COLORS = [
  'rgba(56, 189, 248, 0.72)', // 0: < 15 km/h 輕風天藍
  'rgba(45, 212, 191, 0.80)', // 1: 15-30 km/h 中風青綠
  'rgba(250, 204, 21, 0.85)', // 2: 30-50 km/h 強風琥珀
  'rgba(249, 115, 22, 0.90)', // 3: 50-75 km/h 暴風橘紅
  'rgba(232, 121, 249, 0.92)' // 4: >= 75 km/h 烈風電紫
] as const;

const GRID_COLS = 36;
const GRID_ROWS = 28;
const FRAME_INTERVAL_MS = 33; // 鎖定 ~30fps，視覺絲滑且較 60fps 省一半 CPU

function speedToBucket(speedKmh: number): number {
  if (speedKmh >= 75) return 4;
  if (speedKmh >= 50) return 3;
  if (speedKmh >= 30) return 2;
  if (speedKmh >= 15) return 1;
  return 0;
}

/**
 * 極致省 CPU 版 Windy 動態風場流線引擎：
 * 1. 僅於 moveend/zoomend/resize 時建置一次 36×28 螢幕空間風速查表，動畫迴圈中 0 次 Leaflet 投影計算
 * 2. 所有粒子依風速歸入 5 色桶批次繪製（每幀僅 5 次 stroke，原為 1,050 次）
 * 3. 鎖定 30fps ＋ 分頁隱藏時自動暫停（visibilitychange），大幅釋放主執行緒給 YouTube 直播
 */
export class WindFlowController {
  private map: L.Map;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private grid: WindGridData | null = null;
  private particles: WindParticle[] = [];
  private enabled = false;
  private paused = false;
  private rafId: number | null = null;
  private lastFrameTs = 0;
  private width = 0;
  private height = 0;

  // 螢幕空間預計算速度場（TypedArrays 零 GC 分配）
  private fieldVx = new Float32Array(GRID_COLS * GRID_ROWS);
  private fieldVy = new Float32Array(GRID_COLS * GRID_ROWS);
  private fieldBucket = new Int8Array(GRID_COLS * GRID_ROWS); // -1 表示超出資料範圍
  private fieldReady = false;

  // 每幀複用之 5 色桶座標緩衝
  private bucketSegments: number[][] = [[], [], [], [], []];

  private readonly onMoveStart = () => {
    this.paused = true;
    this.clear();
  };

  private readonly onMoveEnd = () => {
    this.paused = false;
    this.resize();
    this.rebuildScreenField();
    this.resetParticles();
  };

  private readonly onVisibilityChange = () => {
    if (document.hidden) {
      this.stopLoop();
    } else if (this.enabled) {
      this.startLoop();
    }
  };

  constructor(map: L.Map, paneName: string) {
    this.map = map;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'leaflet-layer wind-flow-canvas';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to acquire 2D context for WindFlowCanvas');
    this.ctx = ctx;

    const pane = map.getPane(paneName) ?? map.getPanes().overlayPane;
    pane.appendChild(this.canvas);

    this.resize();
    this.map.on('movestart zoomstart', this.onMoveStart);
    this.map.on('moveend zoomend resize', this.onMoveEnd);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  public setData(grid: WindGridData | null) {
    this.grid = grid;
    this.rebuildScreenField();
    if (this.enabled && grid && this.particles.length === 0) {
      this.resetParticles();
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.canvas.style.display = enabled ? 'block' : 'none';
    if (enabled) {
      this.resize();
      this.rebuildScreenField();
      this.resetParticles();
      this.startLoop();
    } else {
      this.stopLoop();
      this.clear();
    }
  }

  public destroy() {
    this.stopLoop();
    this.map.off('movestart zoomstart', this.onMoveStart);
    this.map.off('moveend zoomend resize', this.onMoveEnd);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.canvas.remove();
  }

  private resize() {
    const size = this.map.getSize();
    this.width = size.x;
    this.height = size.y;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    this.canvas.width = Math.max(1, Math.floor(this.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(this.height * dpr));
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    const topLeft = this.map.containerPointToLayerPoint([0, 0]);
    this.canvas.style.transform = `translate3d(${topLeft.x}px, ${topLeft.y}px, 0)`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /**
   * 將經緯度風場一次投影到螢幕 36×28 格網，後續動畫幀直接 O(1) 陣列查表。
   */
  private rebuildScreenField() {
    if (!this.grid || this.width <= 0 || this.height <= 0) {
      this.fieldReady = false;
      return;
    }

    const zoom = this.map.getZoom();
    // 30fps 下每步移動倍率略調高（與原 60fps 流速視覺一致）
    const speedScale = 0.42 * Math.pow(1.16, Math.max(0, zoom - 7));

    for (let r = 0; r < GRID_ROWS; r++) {
      const py = ((r + 0.5) / GRID_ROWS) * this.height;
      for (let c = 0; c < GRID_COLS; c++) {
        const px = ((c + 0.5) / GRID_COLS) * this.width;
        const idx = r * GRID_COLS + c;
        const latLng = this.map.containerPointToLatLng([px, py]);
        const sample = sampleWindAt(this.grid, latLng.lat, latLng.lng);

        if (!sample || sample.speedKmh < 0.8) {
          this.fieldBucket[idx] = -1;
          this.fieldVx[idx] = 0;
          this.fieldVy[idx] = 0;
        } else {
          this.fieldVx[idx] = sample.u * speedScale;
          this.fieldVy[idx] = -sample.v * speedScale;
          this.fieldBucket[idx] = speedToBucket(sample.speedKmh);
        }
      }
    }
    this.fieldReady = true;
  }

  private clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  private spawnParticle(): WindParticle {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      age: Math.floor(Math.random() * 35),
      maxAge: 36 + Math.floor(Math.random() * 34)
    };
  }

  private resetParticles() {
    const count = this.width <= 768 ? 360 : 680;
    this.particles = Array.from({ length: count }, () => this.spawnParticle());
    this.clear();
  }

  private startLoop() {
    if (this.rafId !== null || document.hidden) return;
    const step = (ts: number) => {
      this.rafId = window.requestAnimationFrame(step);
      if (ts - this.lastFrameTs < FRAME_INTERVAL_MS) return;
      this.lastFrameTs = ts;
      if (!this.enabled || this.paused || !this.fieldReady || this.width <= 0 || this.height <= 0) {
        return;
      }
      this.renderFrame();
    };
    this.rafId = window.requestAnimationFrame(step);
  }

  private stopLoop() {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private renderFrame() {
    const { ctx, width, height, fieldVx, fieldVy, fieldBucket, bucketSegments } = this;

    // 淡出既有流線尾跡，保留底圖透明
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.89)';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';

    for (let b = 0; b < 5; b++) bucketSegments[b].length = 0;

    const invW = GRID_COLS / width;
    const invH = GRID_ROWS / height;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.age >= p.maxAge || p.x < 0 || p.x >= width || p.y < 0 || p.y >= height) {
        this.particles[i] = this.spawnParticle();
        continue;
      }

      const c = Math.min(GRID_COLS - 1, Math.max(0, (p.x * invW) | 0));
      const r = Math.min(GRID_ROWS - 1, Math.max(0, (p.y * invH) | 0));
      const idx = r * GRID_COLS + c;
      const bucket = fieldBucket[idx];

      if (bucket < 0) {
        this.particles[i] = this.spawnParticle();
        continue;
      }

      const nx = p.x + fieldVx[idx];
      const ny = p.y + fieldVy[idx];
      bucketSegments[bucket].push(p.x, p.y, nx, ny);

      p.x = nx;
      p.y = ny;
      p.age += 1;
    }

    ctx.lineWidth = this.map.getZoom() >= 9 ? 1.5 : 1.25;
    ctx.lineCap = 'round';

    // 僅 5 次批次描邊（取代原每幀上千次獨立 stroke）
    for (let b = 0; b < 5; b++) {
      const segs = bucketSegments[b];
      if (segs.length === 0) continue;
      ctx.beginPath();
      ctx.strokeStyle = BUCKET_COLORS[b];
      for (let j = 0; j < segs.length; j += 4) {
        ctx.moveTo(segs[j], segs[j + 1]);
        ctx.lineTo(segs[j + 2], segs[j + 3]);
      }
      ctx.stroke();
    }
  }
}
