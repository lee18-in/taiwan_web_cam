import type L from 'leaflet';
import { sampleWindAt } from '../../services/openMeteo';
import type { WindDensity } from '../../store/useWarRoomStore';
import type { WindGridData } from '../../types/weather';

interface WindParticle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

const PARTICLE_COUNTS: Record<WindDensity, number> = {
  low: 550,
  medium: 1050,
  high: 1650
};

function windSpeedToColor(speedKmh: number): string {
  if (speedKmh >= 75) return 'rgba(232, 121, 249, 0.92)'; // 烈風電紫
  if (speedKmh >= 50) return 'rgba(249, 115, 22, 0.9)'; // 暴風橘紅
  if (speedKmh >= 30) return 'rgba(250, 204, 21, 0.85)'; // 強風琥珀
  if (speedKmh >= 15) return 'rgba(45, 212, 191, 0.8)'; // 中風青綠
  return 'rgba(56, 189, 248, 0.72)'; // 輕風天藍
}

/**
 * Windy 風格 Canvas 2D 動態風場粒子流線控制器：
 * 使用 destination-in 柔和拖尾、依風速分色，於地圖拖曳/縮放期間自動暫停清除，效能極輕量。
 */
export class WindFlowController {
  private map: L.Map;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private grid: WindGridData | null = null;
  private particles: WindParticle[] = [];
  private density: WindDensity = 'medium';
  private enabled = false;
  private paused = false;
  private rafId: number | null = null;
  private width = 0;
  private height = 0;

  private readonly onMoveStart = () => {
    this.paused = true;
    this.clear();
  };

  private readonly onMoveEnd = () => {
    this.paused = false;
    this.resize();
    this.resetParticles();
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
  }

  public setData(grid: WindGridData | null) {
    this.grid = grid;
    if (this.enabled && grid && this.particles.length === 0) {
      this.resetParticles();
    }
  }

  public setDensity(density: WindDensity) {
    if (this.density === density) return;
    this.density = density;
    this.resetParticles();
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.canvas.style.display = enabled ? 'block' : 'none';
    if (enabled) {
      this.resize();
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
    this.canvas.remove();
  }

  private resize() {
    const size = this.map.getSize();
    this.width = size.x;
    this.height = size.y;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.max(1, Math.floor(this.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(this.height * dpr));
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // 將 Canvas 對齊地圖容器原點（抵銷 Leaflet mapPane 位移）
    const topLeft = this.map.containerPointToLayerPoint([0, 0]);
    this.canvas.style.transform = `translate3d(${topLeft.x}px, ${topLeft.y}px, 0)`;

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  private spawnParticle(): WindParticle {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      age: Math.floor(Math.random() * 60),
      maxAge: 55 + Math.floor(Math.random() * 55)
    };
  }

  private resetParticles() {
    const count = PARTICLE_COUNTS[this.density];
    this.particles = Array.from({ length: count }, () => this.spawnParticle());
    this.clear();
  }

  private startLoop() {
    if (this.rafId !== null) return;
    const step = () => {
      this.rafId = window.requestAnimationFrame(step);
      if (!this.enabled || this.paused || !this.grid || this.width <= 0 || this.height <= 0) {
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
    const { ctx, grid } = this;
    if (!grid) return;

    // 使用 destination-in 淡出既有流線尾跡，不會把底圖染黑
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.globalCompositeOperation = 'source-over';

    const zoom = this.map.getZoom();
    // 隨縮放調整視覺流速，台灣全島視角 (z=8) 時手感最流暢
    const speedScale = 0.22 * Math.pow(1.16, Math.max(0, zoom - 7));
    ctx.lineWidth = zoom >= 9 ? 1.55 : 1.25;
    ctx.lineCap = 'round';

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.age >= p.maxAge || p.x < 0 || p.x > this.width || p.y < 0 || p.y > this.height) {
        this.particles[i] = this.spawnParticle();
        continue;
      }

      const latLng = this.map.containerPointToLatLng([p.x, p.y]);
      const sample = sampleWindAt(grid, latLng.lat, latLng.lng);
      if (!sample || sample.speedKmh < 0.8) {
        this.particles[i] = this.spawnParticle();
        continue;
      }

      const nextX = p.x + sample.u * speedScale;
      const nextY = p.y - sample.v * speedScale; // 螢幕 Y 軸向下，北向 v 為負

      ctx.beginPath();
      ctx.strokeStyle = windSpeedToColor(sample.speedKmh);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nextX, nextY);
      ctx.stroke();

      p.x = nextX;
      p.y = nextY;
      p.age += 1;
    }
  }
}
