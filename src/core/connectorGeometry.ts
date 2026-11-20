export interface ElbowConnectorInput {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  side: 'left' | 'right';
}

export interface ElbowConnectorOutput {
  pathD: string;
  kneeX: number;
  kneeY: number;
}

/**
 * 計算 45° 戰術折線（Tactical Elbow）：
 * 自影片卡片側邊水平引出一段固定引線，再以俐落斜線直指地圖地標，比生硬斜線更具指揮中心美感。
 */
export function computeTacticalElbowPath(input: ElbowConnectorInput): ElbowConnectorOutput {
  const { startX, startY, targetX, targetY, side } = input;
  const dx = targetX - startX;
  const dy = targetY - startY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  const dir = side === 'left' ? 1 : -1;
  // 確保引線朝向目標且不會反折過頭
  const towardTarget = (side === 'left' && dx > 0) || (side === 'right' && dx < 0);

  let lead = towardTarget ? Math.min(34, Math.max(14, absDx * 0.22)) : 18;
  // 若水平空間大於垂直落差，嘗試做出標準 45° 折角
  if (towardTarget && absDx > absDy + 18) {
    lead = Math.min(absDx - absDy, Math.max(22, absDx * 0.35));
  }

  const kneeX = Math.round((startX + dir * lead) * 10) / 10;
  const kneeY = Math.round(startY * 10) / 10;
  const sx = Math.round(startX * 10) / 10;
  const sy = Math.round(startY * 10) / 10;
  const tx = Math.round(targetX * 10) / 10;
  const ty = Math.round(targetY * 10) / 10;

  return {
    pathD: `M ${sx} ${sy} L ${kneeX} ${kneeY} L ${tx} ${ty}`,
    kneeX,
    kneeY
  };
}
