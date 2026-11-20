import { useEffect, useRef } from 'react';
import type L from 'leaflet';
import { computeTacticalElbowPath } from '../../core/connectorGeometry';
import type { VideoSlotRect } from '../../core/spatialSorter';

interface ConnectorOverlayProps {
  map: L.Map | null;
  slots: VideoSlotRect[];
  pinnedIds: string[];
  hoveredCamId: string | null;
  visible: boolean;
}

/**
 * 零 React 重繪之節點復用 SVG 戰術雷射連線層：
 * - 直接訂閱 Leaflet move/zoom 事件並透過 rAF 操作原生 DOM setAttribute，拖曳縮放期間 0 次 React 重繪！
 * - 快取 svgRect／mapRect 僅於 resize 時重測，消除拖曳期間每幀 getBoundingClientRect() 強制排版回流。
 */
export function ConnectorOverlay({
  map,
  slots,
  pinnedIds,
  hoveredCamId,
  visible
}: ConnectorOverlayProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const glowRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const lineRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const startDotRefs = useRef<Map<string, SVGCircleElement>>(new Map());
  const endDotRefs = useRef<Map<string, SVGCircleElement>>(new Map());
  const rafRef = useRef<number | null>(null);
  const slotsRef = useRef<VideoSlotRect[]>(slots);
  const rectCacheRef = useRef<{ svgRect: DOMRect; mapRect: DOMRect } | null>(null);

  slotsRef.current = slots;

  useEffect(() => {
    if (!visible || !map || !svgRef.current) return;

    const refreshRectCache = () => {
      const svg = svgRef.current;
      if (!svg) return;
      const svgRect = svg.getBoundingClientRect();
      const mapRect = map.getContainer().getBoundingClientRect();
      if (svgRect.width > 0 && svgRect.height > 0) {
        svg.setAttribute('viewBox', `0 0 ${svgRect.width} ${svgRect.height}`);
        rectCacheRef.current = { svgRect, mapRect };
      }
    };

    const draw = () => {
      rafRef.current = null;
      if (!svgRef.current || !map) return;
      if (!rectCacheRef.current) refreshRectCache();
      const cache = rectCacheRef.current;
      if (!cache) return;

      const { svgRect, mapRect } = cache;
      const currentSlots = slotsRef.current;

      for (let i = 0; i < currentSlots.length; i++) {
        const slot = currentSlots[i];
        const pt = map.latLngToContainerPoint([slot.cam.lat, slot.cam.lng]);
        const targetX = mapRect.left + pt.x - svgRect.left;
        const targetY = mapRect.top + pt.y - svgRect.top;

        const startX =
          (slot.side === 'left' ? slot.x + slot.width : slot.x) - svgRect.left;
        const startY = slot.y + slot.height / 2 - svgRect.top;

        const { pathD } = computeTacticalElbowPath({
          startX,
          startY,
          targetX,
          targetY,
          side: slot.side
        });

        glowRefs.current.get(slot.id)?.setAttribute('d', pathD);
        lineRefs.current.get(slot.id)?.setAttribute('d', pathD);

        const sDot = startDotRefs.current.get(slot.id);
        if (sDot) {
          sDot.setAttribute('cx', String(startX));
          sDot.setAttribute('cy', String(startY));
        }

        const eDot = endDotRefs.current.get(slot.id);
        if (eDot) {
          eDot.setAttribute('cx', String(targetX));
          eDot.setAttribute('cy', String(targetY));
        }
      }
    };

    const scheduleDraw = () => {
      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(draw);
      }
    };

    const onResize = () => {
      refreshRectCache();
      scheduleDraw();
    };

    refreshRectCache();
    scheduleDraw();

    map.on('move zoom moveend zoomend', scheduleDraw);
    window.addEventListener('resize', onResize);

    return () => {
      map.off('move zoom moveend zoomend', scheduleDraw);
      window.removeEventListener('resize', onResize);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [map, visible]);

  // 當卡片格位變動時補繪一次
  useEffect(() => {
    if (!visible || !map || !svgRef.current) return;
    const id = window.requestAnimationFrame(() => {
      const svg = svgRef.current;
      if (!svg) return;
      const svgRect = svg.getBoundingClientRect();
      const mapRect = map.getContainer().getBoundingClientRect();
      if (svgRect.width <= 0 || svgRect.height <= 0) return;
      svg.setAttribute('viewBox', `0 0 ${svgRect.width} ${svgRect.height}`);
      rectCacheRef.current = { svgRect, mapRect };

      for (const slot of slots) {
        const pt = map.latLngToContainerPoint([slot.cam.lat, slot.cam.lng]);
        const targetX = mapRect.left + pt.x - svgRect.left;
        const targetY = mapRect.top + pt.y - svgRect.top;
        const startX =
          (slot.side === 'left' ? slot.x + slot.width : slot.x) - svgRect.left;
        const startY = slot.y + slot.height / 2 - svgRect.top;

        const { pathD } = computeTacticalElbowPath({
          startX,
          startY,
          targetX,
          targetY,
          side: slot.side
        });

        glowRefs.current.get(slot.id)?.setAttribute('d', pathD);
        lineRefs.current.get(slot.id)?.setAttribute('d', pathD);
        startDotRefs.current.get(slot.id)?.setAttribute('cx', String(startX));
        startDotRefs.current.get(slot.id)?.setAttribute('cy', String(startY));
        endDotRefs.current.get(slot.id)?.setAttribute('cx', String(targetX));
        endDotRefs.current.get(slot.id)?.setAttribute('cy', String(targetY));
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [map, slots, visible]);

  if (!visible || slots.length === 0) return null;

  const pinnedSet = new Set(pinnedIds);

  return (
    <svg
      ref={svgRef}
      id="connection-layer"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full z-[440]"
    >
      {slots.map((slot) => {
        const isPinned = pinnedSet.has(slot.id);
        const isHovered = hoveredCamId === slot.id;
        const isDimmed = hoveredCamId !== null && !isHovered;

        const baseColor = isPinned ? '#f59e0b' : '#22d3ee';
        const activeColor = isHovered ? '#67e8f9' : baseColor;
        const opacity = isDimmed ? 0.16 : isHovered ? 1 : 0.78;

        return (
          <g key={slot.id} style={{ opacity, transition: 'opacity 180ms ease' }}>
            <path
              ref={(el) => {
                if (el) glowRefs.current.set(slot.id, el);
                else glowRefs.current.delete(slot.id);
              }}
              fill="none"
              stroke={activeColor}
              strokeOpacity={isHovered ? 0.35 : 0.16}
              strokeWidth={isHovered ? 6 : 4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              ref={(el) => {
                if (el) lineRefs.current.set(slot.id, el);
                else lineRefs.current.delete(slot.id);
              }}
              fill="none"
              stroke={activeColor}
              strokeWidth={isHovered ? 2.2 : 1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isHovered ? 'connector-pulse-line-fast' : 'connector-pulse-line'}
            />
            <circle
              ref={(el) => {
                if (el) startDotRefs.current.set(slot.id, el);
                else startDotRefs.current.delete(slot.id);
              }}
              r={isHovered ? 3.5 : 2.5}
              fill={activeColor}
            />
            <circle
              ref={(el) => {
                if (el) endDotRefs.current.set(slot.id, el);
                else endDotRefs.current.delete(slot.id);
              }}
              r={isHovered ? 5 : 3.5}
              fill={activeColor}
              stroke="#060b16"
              strokeWidth="1.5"
            />
          </g>
        );
      })}
    </svg>
  );
}
