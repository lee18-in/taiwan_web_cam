import { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  BASEMAPS,
  DEFAULT_CALIBRATION_BOUNDS,
  TW_LABELS_TILE_URL,
  WEATHER_LAYER_LIST
} from '../../data/mapLayers';
import { fetchTaiwanWindGrid } from '../../services/openMeteo';
import { buildRainViewerTileUrl, fetchRainViewerFrames } from '../../services/rainViewer';
import { preloadImageNoReferrer, withCacheBust } from '../../services/weatherRefresher';
import { useWarRoomStore } from '../../store/useWarRoomStore';
import type { Webcam } from '../../types/webcam';
import type { WeatherLayerId } from '../../types/weather';
import { WindFlowController } from './WindFlowCanvas';

interface WarRoomMapProps {
  webcams: Webcam[];
  displayedCams: Webcam[];
  onMapReady: (map: L.Map) => void;
  onMapVisualMove: () => void;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return map[ch] ?? ch;
  });
}

function createActiveMarkerIcon(pinned: boolean, hovered: boolean): L.DivIcon {
  const classes = [
    'warroom-marker-wrap',
    pinned ? 'is-pinned' : '',
    hovered ? 'is-hovered' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return L.divIcon({
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: `<div class="${classes}"><span class="warroom-marker-sonar"></span><span class="warroom-marker-core"></span></div>`
  });
}

export function WarRoomMap({
  webcams,
  displayedCams,
  onMapReady,
  onMapVisualMove
}: WarRoomMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const basemapLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const cwaOverlaysRef = useRef<Partial<Record<WeatherLayerId, L.ImageOverlay>>>({});
  const rainViewerLayersRef = useRef<Map<string, L.TileLayer>>(new Map());
  const windControllerRef = useRef<WindFlowController | null>(null);

  // Canvas 標記池（未入選鏡頭）與高亮 DivIcon 標記池（活躍鏡頭）
  const canvasRendererRef = useRef<L.Canvas | null>(null);
  const passiveMarkersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const activeMarkersRef = useRef<Map<string, L.Marker>>(new Map());

  const basemap = useWarRoomStore((s) => s.basemap);
  const labelsOnTop = useWarRoomStore((s) => s.labelsOnTop);
  const overlays = useWarRoomStore((s) => s.overlays);
  const customBounds = useWarRoomStore((s) => s.customBounds);
  const weatherRefreshNonce = useWarRoomStore((s) => s.weatherRefreshNonce);
  const windEnabled = useWarRoomStore((s) => s.windEnabled);
  const windDensity = useWarRoomStore((s) => s.windDensity);
  const rainViewerEnabled = useWarRoomStore((s) => s.rainViewerEnabled);
  const rainViewerOpacity = useWarRoomStore((s) => s.rainViewerOpacity);
  const rainViewerHost = useWarRoomStore((s) => s.rainViewerHost);
  const rainViewerFrames = useWarRoomStore((s) => s.rainViewerFrames);
  const rainViewerFrameIndex = useWarRoomStore((s) => s.rainViewerFrameIndex);
  const pinnedIds = useWarRoomStore((s) => s.pinnedIds);
  const hoveredCamId = useWarRoomStore((s) => s.hoveredCamId);
  const offlineIds = useWarRoomStore((s) => s.offlineIds);
  const flyToTarget = useWarRoomStore((s) => s.flyToTarget);

  const setViewport = useWarRoomStore((s) => s.setViewport);
  const setFocusedCamId = useWarRoomStore((s) => s.setFocusedCamId);
  const setHoveredCamId = useWarRoomStore((s) => s.setHoveredCamId);
  const setRainViewerData = useWarRoomStore((s) => s.setRainViewerData);

  // 1. 初始化 Leaflet 地圖與 6 層「戰情三明治」Custom Panes
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const initialState = useWarRoomStore.getState();
    const map = L.map(el, {
      center: initialState.center,
      zoom: initialState.zoom,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: false,
      preferCanvas: true,
      attributionControl: true
    });

    // 精準 6 層 Z-Index 分層架構
    const cloudPane = map.createPane('weather-cloud');
    cloudPane.style.zIndex = '300';
    cloudPane.style.pointerEvents = 'none';

    const radarPane = map.createPane('weather-radar');
    radarPane.style.zIndex = '320';
    radarPane.style.pointerEvents = 'none';

    const windPane = map.createPane('weather-wind');
    windPane.style.zIndex = '350';
    windPane.style.pointerEvents = 'none';

    const labelsPane = map.createPane('labels-overlay');
    labelsPane.style.zIndex = '380';
    labelsPane.style.pointerEvents = 'none';

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    canvasRendererRef.current = L.canvas({ padding: 0.5 });

    // 初始化 Windy 動態風場控制器
    windControllerRef.current = new WindFlowController(map, 'weather-wind');

    let debounceTimer: number | null = null;
    const emitViewport = (immediate = false) => {
      const run = () => {
        const c = map.getCenter();
        const b = map.getBounds();
        setViewport([c.lat, c.lng], map.getZoom(), {
          south: b.getSouth(),
          west: b.getWest(),
          north: b.getNorth(),
          east: b.getEast()
        });
      };
      if (debounceTimer) window.clearTimeout(debounceTimer);
      if (immediate) {
        run();
      } else {
        debounceTimer = window.setTimeout(run, 240);
      }
    };

    map.on('moveend zoomend', () => {
      emitViewport(false);
      onMapVisualMove();
    });
    map.on('move zoom', onMapVisualMove);

    const handleResize = () => {
      map.invalidateSize({ animate: false });
      emitViewport(false);
      onMapVisualMove();
    };
    window.addEventListener('resize', handleResize);

    mapRef.current = map;
    onMapReady(map);
    emitViewport(true);

    return () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      window.removeEventListener('resize', handleResize);
      windControllerRef.current?.destroy();
      windControllerRef.current = null;
      rainViewerLayersRef.current.clear();
      passiveMarkersRef.current.clear();
      activeMarkersRef.current.clear();
      cwaOverlaysRef.current = {};
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. 處理飛往指定鏡頭事件
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToTarget) return;
    map.flyTo([flyToTarget.lat, flyToTarget.lng], flyToTarget.zoom, {
      duration: 0.9,
      easeLinearity: 0.25
    });
  }, [flyToTarget]);

  // 3. 底圖切換（3 種免費標準圖磚）＋ 獨立「地名文字置頂層」
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const cfg = BASEMAPS[basemap];
    if (basemapLayerRef.current) {
      map.removeLayer(basemapLayerRef.current);
    }

    const baseLayer = L.tileLayer(cfg.url, {
      subdomains: cfg.subdomains ?? '',
      maxZoom: cfg.maxZoom,
      attribution: `${cfg.attribution} | 影像版權屬原建置單位`,
      crossOrigin: true
    });
    baseLayer.addTo(map);
    basemapLayerRef.current = baseLayer;

    // 獨立浮動文字層（置於所有雲圖與雷達上方）
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }
    if (cfg.supportsLabelsOnTop && labelsOnTop) {
      const labelLayer = L.tileLayer(TW_LABELS_TILE_URL, {
        maxZoom: 19,
        opacity: 0.78,
        pane: 'labels-overlay',
        crossOrigin: true
      });
      labelLayer.addTo(map);
      labelsLayerRef.current = labelLayer;
    }
  }, [basemap, labelsOnTop]);

  // 4. 中央氣象署 8 組高解析疊圖（Lazy Load ＋ 多層疊加 ＋ 雙緩衝無感刷新 ＋ BlendMode）
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;

    WEATHER_LAYER_LIST.forEach((cfg) => {
      const runtime = overlays[cfg.id];
      const bounds = customBounds[cfg.calibrationGroup] ?? DEFAULT_CALIBRATION_BOUNDS[cfg.calibrationGroup];
      const existing = cwaOverlaysRef.current[cfg.id];

      if (!runtime.enabled) {
        if (existing && map.hasLayer(existing)) {
          map.removeLayer(existing);
        }
        return;
      }

      const bustedUrl = withCacheBust(cfg.url, weatherRefreshNonce);

      const applyImgStyles = (overlay: L.ImageOverlay) => {
        const imgEl = overlay.getElement();
        if (!imgEl) return;
        imgEl.referrerPolicy = 'no-referrer';
        imgEl.style.mixBlendMode = runtime.blendMode;
        imgEl.style.transition = 'opacity 0.25s ease';
      };

      if (!existing) {
        const overlay = L.imageOverlay(bustedUrl, bounds, {
          opacity: runtime.opacity,
          interactive: false,
          pane: cfg.pane
        });
        overlay.on('add', () => applyImgStyles(overlay));
        overlay.addTo(map);
        applyImgStyles(overlay);
        cwaOverlaysRef.current[cfg.id] = overlay;
      } else {
        if (!map.hasLayer(existing)) {
          existing.addTo(map);
        }
        existing.setBounds(L.latLngBounds(bounds));
        existing.setOpacity(runtime.opacity);
        applyImgStyles(existing);

        // 雙緩衝預載新圖資，避免每 10 分鐘自動刷新時閃白
        const currentUrl = (existing as unknown as { _url?: string })._url;
        if (currentUrl !== bustedUrl) {
          void preloadImageNoReferrer(bustedUrl).then((ok) => {
            if (!cancelled && ok) {
              existing.setUrl(bustedUrl);
              applyImgStyles(existing);
            }
          });
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [overlays, customBounds, weatherRefreshNonce]);

  // 5. Windy 動態風場流線層（Open-Meteo 單次批次網格）
  useEffect(() => {
    const ctrl = windControllerRef.current;
    if (!ctrl) return;
    ctrl.setDensity(windDensity);
    ctrl.setEnabled(windEnabled);
    if (!windEnabled) return;

    let cancelled = false;
    void fetchTaiwanWindGrid().then((grid) => {
      if (!cancelled && grid) {
        ctrl.setData(grid);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [windEnabled, windDensity, weatherRefreshNonce]);

  // 6. RainViewer 2 小時動態雷達圖磚時間軸
  useEffect(() => {
    if (!rainViewerEnabled) {
      const map = mapRef.current;
      if (map) {
        rainViewerLayersRef.current.forEach((layer) => {
          if (map.hasLayer(layer)) map.removeLayer(layer);
        });
      }
      return;
    }

    let cancelled = false;
    void fetchRainViewerFrames().then((payload) => {
      if (!cancelled && payload) {
        setRainViewerData(payload.host, payload.frames);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [rainViewerEnabled, weatherRefreshNonce, setRainViewerData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !rainViewerEnabled || rainViewerFrames.length === 0) return;

    const currentFrame = rainViewerFrames[rainViewerFrameIndex] ?? rainViewerFrames[rainViewerFrames.length - 1];
    if (!currentFrame) return;

    // 預載當前與下一幀，切換播放時流暢不閃爍
    const nextFrame = rainViewerFrames[(rainViewerFrameIndex + 1) % rainViewerFrames.length];
    const neededPaths = new Set([currentFrame.path, nextFrame.path]);

    neededPaths.forEach((p) => {
      const frame = rainViewerFrames.find((f) => f.path === p);
      if (!frame) return;
      if (!rainViewerLayersRef.current.has(p)) {
        const layer = L.tileLayer(buildRainViewerTileUrl(rainViewerHost, frame), {
          pane: 'weather-radar',
          maxNativeZoom: 7,
          maxZoom: 18,
          opacity: 0,
          crossOrigin: true
        });
        layer.addTo(map);
        rainViewerLayersRef.current.set(p, layer);
      }
    });

    rainViewerLayersRef.current.forEach((layer, pathKey) => {
      if (!map.hasLayer(layer)) layer.addTo(map);
      layer.setOpacity(pathKey === currentFrame.path ? rainViewerOpacity : 0);
    });
  }, [rainViewerEnabled, rainViewerHost, rainViewerFrames, rainViewerFrameIndex, rainViewerOpacity]);

  // 7. 標記差分渲染（Canvas 繪製未入選紅點 ＋ 發光聲納標記繪製顯示中鏡頭）
  useEffect(() => {
    const map = mapRef.current;
    const renderer = canvasRendererRef.current;
    if (!map || !renderer) return;

    const displayedSet = new Set(displayedCams.map((c) => c.id));
    const pinnedSet = new Set(pinnedIds);
    const offlineSet = new Set(offlineIds);

    // 移除已不再顯示的 active markers
    activeMarkersRef.current.forEach((marker, id) => {
      if (!displayedSet.has(id)) {
        map.removeLayer(marker);
        activeMarkersRef.current.delete(id);
      }
    });

    webcams.forEach((cam) => {
      const isDisplayed = displayedSet.has(cam.id);
      const isOffline = offlineSet.has(cam.id);
      const passive = passiveMarkersRef.current.get(cam.id);

      if (isDisplayed) {
        if (passive && map.hasLayer(passive)) {
          map.removeLayer(passive);
        }
        const isPinned = pinnedSet.has(cam.id);
        const isHovered = hoveredCamId === cam.id;
        const existingActive = activeMarkersRef.current.get(cam.id);
        if (!existingActive) {
          const marker = L.marker([cam.lat, cam.lng], {
            icon: createActiveMarkerIcon(isPinned, isHovered),
            zIndexOffset: isHovered ? 800 : isPinned ? 500 : 200
          })
            .bindTooltip(
              `<div class="font-medium">${escapeHtml(cam.name)}</div><div class="text-[10px] text-sky-300">${escapeHtml(cam.county)} · 點擊劇院放大</div>`,
              { direction: 'top', offset: [0, -10], className: 'warroom-tooltip' }
            )
            .on('click', () => setFocusedCamId(cam.id))
            .on('mouseover', () => setHoveredCamId(cam.id))
            .on('mouseout', () => setHoveredCamId(null));
          marker.addTo(map);
          activeMarkersRef.current.set(cam.id, marker);
        } else {
          existingActive.setIcon(createActiveMarkerIcon(isPinned, isHovered));
          existingActive.setZIndexOffset(isHovered ? 800 : isPinned ? 500 : 200);
        }
      } else {
        if (!passive) {
          const dot = L.circleMarker([cam.lat, cam.lng], {
            renderer,
            radius: isOffline ? 3.5 : 4.5,
            color: isOffline ? '#475569' : '#0f172a',
            weight: 1.2,
            fillColor: isOffline ? '#64748b' : '#f43f5e',
            fillOpacity: isOffline ? 0.55 : 0.9
          })
            .bindTooltip(
              `<div class="font-medium">${escapeHtml(cam.name)}</div><div class="text-[10px] text-slate-300">${escapeHtml(cam.county)}${
                isOffline ? ' · 暫時離線' : ' · 點擊放大檢視'
              }</div>`,
              { direction: 'top', offset: [0, -6], className: 'warroom-tooltip' }
            )
            .on('click', () => {
              if (!isOffline) {
                setFocusedCamId(cam.id);
              }
              map.flyTo([cam.lat, cam.lng], Math.max(map.getZoom(), 11), { duration: 0.7 });
            });
          dot.addTo(map);
          passiveMarkersRef.current.set(cam.id, dot);
        } else {
          if (!map.hasLayer(passive)) passive.addTo(map);
          passive.setStyle({
            fillColor: isOffline ? '#64748b' : '#f43f5e',
            fillOpacity: isOffline ? 0.55 : 0.9
          });
        }
      }
    });
  }, [webcams, displayedCams, pinnedIds, hoveredCamId, offlineIds, setFocusedCamId, setHoveredCamId]);

  return <div ref={containerRef} id="map" className="fixed inset-0 h-full w-full z-0" />;
}
