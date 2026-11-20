import { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  BASEMAPS,
  DEFAULT_CALIBRATION_BOUNDS,
  TW_LABELS_TILE_URL,
  WEATHER_LAYERS
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
  const activeCwaOverlayRef = useRef<{ id: WeatherLayerId; layer: L.ImageOverlay } | null>(null);
  const rainViewerLayersRef = useRef<Map<string, L.TileLayer>>(new Map());
  const windControllerRef = useRef<WindFlowController | null>(null);

  const canvasRendererRef = useRef<L.Canvas | null>(null);
  const passiveMarkersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const activeMarkersRef = useRef<Map<string, L.Marker>>(new Map());

  const basemap = useWarRoomStore((s) => s.basemap);
  const activeLayer = useWarRoomStore((s) => s.activeLayer);
  const customBounds = useWarRoomStore((s) => s.customBounds);
  const weatherRefreshNonce = useWarRoomStore((s) => s.weatherRefreshNonce);
  const windEnabled = useWarRoomStore((s) => s.windEnabled);
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

  const isRainViewerActive = activeLayer === 'rainViewer';

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
      if (immediate) run();
      else debounceTimer = window.setTimeout(run, 240);
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
      activeCwaOverlayRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. 飛往指定鏡頭
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToTarget) return;
    map.flyTo([flyToTarget.lat, flyToTarget.lng], flyToTarget.zoom, {
      duration: 0.85,
      easeLinearity: 0.25
    });
  }, [flyToTarget]);

  // 3. 底圖切換（3 種免費無浮水印底圖）＋ 自動置頂台灣繁中地名
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const cfg = BASEMAPS[basemap];
    if (basemapLayerRef.current) map.removeLayer(basemapLayerRef.current);

    const baseLayer = L.tileLayer(cfg.url, {
      subdomains: cfg.subdomains ?? '',
      maxZoom: cfg.maxZoom,
      attribution: `${cfg.attribution} | 影像版權屬原建置單位`,
      crossOrigin: true
    });
    baseLayer.addTo(map);
    basemapLayerRef.current = baseLayer;

    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }
    if (cfg.supportsLabelsOnTop) {
      const labelLayer = L.tileLayer(TW_LABELS_TILE_URL, {
        maxZoom: 19,
        opacity: 0.78,
        pane: 'labels-overlay',
        crossOrigin: true
      });
      labelLayer.addTo(map);
      labelsLayerRef.current = labelLayer;
    }
  }, [basemap]);

  // 4. 嚴格單選 CWA 官方疊圖（切換立刻清除舊層，自動依底圖套用最佳透明度與混色）
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;

    const cwaId: WeatherLayerId | null =
      activeLayer && activeLayer !== 'rainViewer' ? activeLayer : null;

    if (!cwaId) {
      if (activeCwaOverlayRef.current) {
        map.removeLayer(activeCwaOverlayRef.current.layer);
        activeCwaOverlayRef.current = null;
      }
      return;
    }

    const cfg = WEATHER_LAYERS[cwaId];
    const bounds =
      customBounds[cfg.calibrationGroup] ?? DEFAULT_CALIBRATION_BOUNDS[cfg.calibrationGroup];
    const isLightBase = basemap === 'nlsc';
    const opacity = isLightBase ? cfg.optimalOpacityLight : cfg.optimalOpacityDark;
    const blendMode = isLightBase ? 'normal' : cfg.blendModeDark;
    const bustedUrl = withCacheBust(cfg.url, weatherRefreshNonce);

    const applyStyles = (overlay: L.ImageOverlay) => {
      const imgEl = overlay.getElement();
      if (!imgEl) return;
      imgEl.referrerPolicy = 'no-referrer';
      imgEl.style.mixBlendMode = blendMode;
    };

    // 若切換到不同 CWA 圖層，立即移除舊層
    if (activeCwaOverlayRef.current && activeCwaOverlayRef.current.id !== cwaId) {
      map.removeLayer(activeCwaOverlayRef.current.layer);
      activeCwaOverlayRef.current = null;
    }

    if (!activeCwaOverlayRef.current) {
      const overlay = L.imageOverlay(bustedUrl, bounds, {
        opacity,
        interactive: false,
        pane: cfg.pane
      });
      overlay.on('add', () => applyStyles(overlay));
      overlay.addTo(map);
      applyStyles(overlay);
      activeCwaOverlayRef.current = { id: cwaId, layer: overlay };
    } else {
      const overlay = activeCwaOverlayRef.current.layer;
      overlay.setBounds(L.latLngBounds(bounds));
      overlay.setOpacity(opacity);
      applyStyles(overlay);

      const currentUrl = (overlay as unknown as { _url?: string })._url;
      if (currentUrl !== bustedUrl) {
        void preloadImageNoReferrer(bustedUrl).then((ok) => {
          if (!cancelled && ok && activeCwaOverlayRef.current?.id === cwaId) {
            overlay.setUrl(bustedUrl);
            applyStyles(overlay);
          }
        });
      }
    }

    return () => {
      cancelled = true;
    };
  }, [activeLayer, basemap, customBounds, weatherRefreshNonce]);

  // 5. 高效能 Windy 動態風場流線（獨立開關）
  useEffect(() => {
    const ctrl = windControllerRef.current;
    if (!ctrl) return;
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
  }, [windEnabled, weatherRefreshNonce]);

  // 6. RainViewer 2 小時動態雷達（僅在 activeLayer === 'rainViewer' 時啟用）
  useEffect(() => {
    if (!isRainViewerActive) {
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
  }, [isRainViewerActive, weatherRefreshNonce, setRainViewerData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isRainViewerActive || rainViewerFrames.length === 0) return;

    const currentFrame =
      rainViewerFrames[rainViewerFrameIndex] ?? rainViewerFrames[rainViewerFrames.length - 1];
    if (!currentFrame) return;

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

    const targetOpacity = basemap === 'nlsc' ? 0.6 : 0.72;
    rainViewerLayersRef.current.forEach((layer, pathKey) => {
      if (!map.hasLayer(layer)) layer.addTo(map);
      layer.setOpacity(pathKey === currentFrame.path ? targetOpacity : 0);
    });
  }, [isRainViewerActive, rainViewerHost, rainViewerFrames, rainViewerFrameIndex, basemap]);

  // 7. 標記差分渲染
  useEffect(() => {
    const map = mapRef.current;
    const renderer = canvasRendererRef.current;
    if (!map || !renderer) return;

    const displayedSet = new Set(displayedCams.map((c) => c.id));
    const pinnedSet = new Set(pinnedIds);
    const offlineSet = new Set(offlineIds);

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
        if (passive && map.hasLayer(passive)) map.removeLayer(passive);
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
              if (!isOffline) setFocusedCamId(cam.id);
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
