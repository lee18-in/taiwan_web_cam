import { useEffect, useRef } from 'react';
import type L from 'leaflet';
import { computeTacticalElbowPath } from '../../core/connectorGeometry';
import type { VideoSlotRect } from '../../core/spatialSorter';

interface ConnectorOverlayProps {
  map: L.Map | null;
  slots: VideoSlotRect[];
  pinnedIds: string[];
  hoveredCamId: string | null;
  redrawTick: number;
  visible: boolean;
}

/**
 * 節點復用 SVG 戰術雷射連線層：
 * - 以 getBoundingClientRect() 設定 viewBox 避開行動裝置 100vh 位移問題（依 COMPONENT_MAP 契約）
 * - 採用 45° 戰術折線 + CSS 流動脈衝動畫，不使用高耗能 filter: drop-shadow
 * - 透過直接操作既有 DOM 節點 setAttribute + rAF 節流，拖動地圖維持 60fps
 */
export function ConnectorOverlay({
  map,
  slots,
  pinnedIds,
  hoveredCamId,
  redrawTick,
  visible
}: ConnectorOverlayProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const glowRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const lineRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const startDotRefs = useRef<Map<string, SVGCircleElement>>(new Map());
  const endDotRefs = useRef<Map<string, SVGCircleElement>>(new Map());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!visible || !map || !svgRef.current) return;

    const draw = () => {
      rafRef.current = null;
      const svg = svgRef.current;
      if (!svg || !map) return;

      const svgRect = svg.getBoundingClientRect();
      const mapRect = map.getContainer().getBoundingClientRect();
      if (svgRect.width <= 0 || svgRect.height <= 0) return;

      svg.setAttribute('viewBox', `0 0 ${svgRect.width} ${svgRect.height}`);

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

    if (rafRef.current === null) {
      rafRef.current = window.requestAnimationFrame(draw);
    }

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [map, slots, redrawTick, visible]);

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
            {/* 雙層柔和光暈（無 drop-shadow 濾鏡，GPU 友善） */}
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
            {/* 主 45° 戰術流動脈衝線 */}
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
            {/* 卡片起點接頭 */}
            <circle
              ref={(el) => {
                if (el) startDotRefs.current.set(slot.id, el);
                else startDotRefs.current.delete(slot.id);
              }}
              r={isHovered ? 3.5 : 2.5}
              fill={activeColor}
            />
            {/* 地標端點鎖定核 */}
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
