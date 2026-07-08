import {
  DOCK_H, DOCK_Y, GAME_HEIGHT, HATCH_SAFE_ZONE_Y1, HATCH_SAFE_ZONE_Y2, HUD_BAR_H, HUD_BAR_Y,
  MOBILE_SAFE_ZONE_BOTTOM, MOBILE_SAFE_ZONE_TOP, PREVIEW_CARD_H, PREVIEW_CARD_Y,
  TRACK_BASE_BL, TRACK_BASE_TL, UNIT_MAX_HALF_H,
} from './config';

export interface ChromeLayout {
  hudBarY: number;
  hudBarH: number;
  dockY: number;
  dockH: number;
  safeTop: number;
  safeBottom: number;
  gameHeight: number;
  trackTopY: number;
  trackBottomY: number;
  unitMaxHalfH: number;
}

export const DEFAULT_CHROME_LAYOUT: ChromeLayout = {
  hudBarY: HUD_BAR_Y,
  hudBarH: HUD_BAR_H,
  dockY: DOCK_Y,
  dockH: DOCK_H,
  safeTop: MOBILE_SAFE_ZONE_TOP,
  safeBottom: MOBILE_SAFE_ZONE_BOTTOM,
  gameHeight: GAME_HEIGHT,
  trackTopY: TRACK_BASE_TL.y,
  trackBottomY: TRACK_BASE_BL.y,
  unitMaxHalfH: UNIT_MAX_HALF_H,
};

/**
 * 크롬(상단 바·독)이 모바일 세이프존을 침범하거나 트랙(+유닛 반높이)과 교차하면 실패.
 * 05-design-v3.md §3 R1의 수직 예산 산술을 그대로 검증.
 */
export function checkChromeSafeZone(overrides: Partial<ChromeLayout> = {}): { ok: boolean; reasons: string[] } {
  const p: ChromeLayout = { ...DEFAULT_CHROME_LAYOUT, ...overrides };
  const reasons: string[] = [];

  if (p.hudBarY < p.safeTop) reasons.push('상단 바가 상단 세이프존을 침범');
  if (p.dockY + p.dockH > p.gameHeight - p.safeBottom) reasons.push('독이 하단 세이프존을 침범');
  if (p.hudBarY + p.hudBarH > p.trackTopY - p.unitMaxHalfH) reasons.push('상단 바가 트랙(+유닛 반높이)과 교차');
  if (p.dockY < p.trackBottomY + p.unitMaxHalfH) reasons.push('독이 트랙(+유닛 반높이)과 교차');

  return { ok: reasons.length === 0, reasons };
}

/**
 * M4: 부화·예상 혈통 카드 세이프존(y100~420, R7) 검증 — 상단 바/독과 겹치지 않고
 * 카드가 세이프존 내부에 완전히 들어가는지 확인.
 */
export function checkHatchOverlaySafeZone(): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (HATCH_SAFE_ZONE_Y1 <= HUD_BAR_Y + HUD_BAR_H) reasons.push('세이프존 상단이 상단 바와 겹침');
  if (HATCH_SAFE_ZONE_Y2 >= DOCK_Y) reasons.push('세이프존 하단이 독과 겹침');
  if (PREVIEW_CARD_Y < HATCH_SAFE_ZONE_Y1) reasons.push('예상 혈통 카드 상단이 세이프존 밖');
  if (PREVIEW_CARD_Y + PREVIEW_CARD_H > HATCH_SAFE_ZONE_Y2) reasons.push('예상 혈통 카드 하단이 세이프존 밖');
  return { ok: reasons.length === 0, reasons };
}
