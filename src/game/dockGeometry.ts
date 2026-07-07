import {
  DOCK_CENTER_Y, DOCK_H, DOCK_Y, GAME_WIDTH,
  NEST_SLOT_1_X, NEST_SLOT_2_X, NEST_SLOT_SIZE, SELL_EDGE_W,
} from './config';

export type NestSlot = 0 | 1;

export interface Rect { x: number; y: number; w: number; h: number; }

const NEST_SLOT_X: Record<NestSlot, number> = { 0: NEST_SLOT_1_X, 1: NEST_SLOT_2_X };

/**
 * 드래그 컨텍스트 모드 판매존(독 좌우 가장자리, 각 SELL_EDGE_W). HudRenderer가 그리는
 * 시각 사각형과 DragController의 판정이 이 함수 하나를 공유해 시각=판정을 구조적으로 보장한다.
 */
export function isInSellZone(x: number, y: number): boolean {
  if (y < DOCK_Y || y > DOCK_Y + DOCK_H) return false;
  return x <= SELL_EDGE_W || x >= GAME_WIDTH - SELL_EDGE_W;
}

export function getNestSlotRect(slot: NestSlot): Rect {
  const cx = NEST_SLOT_X[slot];
  return {
    x: cx - NEST_SLOT_SIZE / 2,
    y: DOCK_CENTER_Y - NEST_SLOT_SIZE / 2,
    w: NEST_SLOT_SIZE,
    h: NEST_SLOT_SIZE,
  };
}

export function distToNestSlot(x: number, y: number, slot: NestSlot): number {
  return Math.hypot(x - NEST_SLOT_X[slot], y - DOCK_CENTER_Y);
}
