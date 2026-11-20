import type { Webcam } from '../types/webcam';

export type WallSide = 'left' | 'right';

export interface DesktopWallSplit {
  leftCams: Webcam[];
  rightCams: Webcam[];
}

export interface VideoSlotRect {
  id: string;
  cam: Webcam;
  side: WallSide;
  indexInSide: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DesktopLayoutMetrics {
  leftWidth: number;
  rightWidth: number;
  slots: VideoSlotRect[];
}

/**
 * 依經度切分桌機左右影片牆，每側再依緯度由北到南排序，大幅降低雷射連線交錯。
 */
export function splitDesktopWalls(cams: Webcam[]): DesktopWallSplit {
  if (cams.length === 0) return { leftCams: [], rightCams: [] };

  const sortedByLng = [...cams].sort((a, b) => a.lng - b.lng || b.lat - a.lat);
  const leftCount = cams.length < 2 ? 0 : Math.floor(sortedByLng.length / 2);

  const leftCams = sortedByLng
    .slice(0, leftCount)
    .sort((a, b) => b.lat - a.lat || a.lng - b.lng);

  const rightCams = sortedByLng
    .slice(leftCount)
    .sort((a, b) => b.lat - a.lat || a.lng - b.lng);

  return { leftCams, rightCams };
}

/**
 * 依單側鏡頭數與視窗大小計算影片牆最佳寬度，確保中央地圖始終保有足夠操作寬度。
 */
export function calculateDesktopWallWidth(
  tileCount: number,
  viewportWidth: number,
  viewportHeight: number,
  topOffset = 68,
  bottomOffset = 16
): number {
  if (tileCount <= 0) return 0;

  const headerHeight = 32;
  const gap = 10;
  const sidePadding = 12;
  const minCenterMapWidth = Math.max(360, viewportWidth * 0.34);

  const availableHeight = Math.max(240, viewportHeight - topOffset - bottomOffset);
  const perCardHeight = (availableHeight - gap * (tileCount - 1)) / tileCount;
  const videoHeight = Math.max(96, perCardHeight - headerHeight);
  const idealWidth = (videoHeight * 16) / 9;

  const maxWidthByViewport = Math.max(220, (viewportWidth - minCenterMapWidth) / 2 - sidePadding * 2);
  const maxWidthCap =
    tileCount <= 1 ? 390 : tileCount <= 2 ? 360 : tileCount <= 3 ? 320 : 295;
  const minWidthFloor = viewportWidth < 1200 ? 220 : 248;

  return Math.round(
    Math.min(maxWidthByViewport, maxWidthCap, Math.max(minWidthFloor, idealWidth))
  );
}

/**
 * 計算每一張卡片於桌機視窗的絕對像素座標，供單一扁平 React Keyed 清單以 CSS transform 零重載平滑定位。
 */
export function computeDesktopSlotLayouts(
  cams: Webcam[],
  viewportWidth: number,
  viewportHeight: number,
  topOffset = 68,
  bottomOffset = 16
): DesktopLayoutMetrics {
  const { leftCams, rightCams } = splitDesktopWalls(cams);
  const marginX = 12;
  const gap = 10;
  const headerHeight = 32;

  const leftWidth = calculateDesktopWallWidth(
    leftCams.length,
    viewportWidth,
    viewportHeight,
    topOffset,
    bottomOffset
  );
  const rightWidth = calculateDesktopWallWidth(
    rightCams.length,
    viewportWidth,
    viewportHeight,
    topOffset,
    bottomOffset
  );

  const buildSideSlots = (
    sideCams: Webcam[],
    side: WallSide,
    width: number
  ): VideoSlotRect[] => {
    if (sideCams.length === 0 || width <= 0) return [];
    const availableHeight = Math.max(240, viewportHeight - topOffset - bottomOffset);
    const naturalCardHeight = Math.round((width * 9) / 16) + headerHeight;
    const maxCardHeight = Math.floor(
      (availableHeight - gap * (sideCams.length - 1)) / sideCams.length
    );
    const cardHeight = Math.max(120, Math.min(naturalCardHeight, maxCardHeight));
    const totalColumnHeight =
      cardHeight * sideCams.length + gap * (sideCams.length - 1);
    const startY = Math.round(
      topOffset + Math.max(0, (availableHeight - totalColumnHeight) / 2)
    );
    const x = side === 'left' ? marginX : viewportWidth - width - marginX;

    return sideCams.map((cam, idx) => ({
      id: cam.id,
      cam,
      side,
      indexInSide: idx,
      x,
      y: startY + idx * (cardHeight + gap),
      width,
      height: cardHeight
    }));
  };

  return {
    leftWidth: leftWidth > 0 ? leftWidth + marginX * 2 : 0,
    rightWidth: rightWidth > 0 ? rightWidth + marginX * 2 : 0,
    slots: [
      ...buildSideSlots(leftCams, 'left', leftWidth),
      ...buildSideSlots(rightCams, 'right', rightWidth)
    ]
  };
}

export function sortMobileCams(cams: Webcam[], pinnedIds: string[]): Webcam[] {
  const pinnedOrder = new Map(pinnedIds.map((id, idx) => [id, idx]));
  return [...cams].sort((a, b) => {
    const aPin = pinnedOrder.has(a.id) ? pinnedOrder.get(a.id)! : 999;
    const bPin = pinnedOrder.has(b.id) ? pinnedOrder.get(b.id)! : 999;
    if (aPin !== bPin) return aPin - bPin;
    return a.level - b.level || b.lat - a.lat;
  });
}
