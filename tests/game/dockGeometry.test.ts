import { describe, expect, it } from 'vitest';
import { DOCK_CENTER_Y, DOCK_H, DOCK_Y, GAME_WIDTH, SELL_EDGE_W } from '../../src/game/config';
import { distToNestSlot, getNestSlotRect, isInSellZone } from '../../src/game/dockGeometry';

describe('isInSellZone — 판매존 시각=판정 동일 상수', () => {
  it('독 좌측 가장자리(SELL_EDGE_W 이내)는 판매존', () => {
    expect(isInSellZone(0, DOCK_CENTER_Y)).toBe(true);
    expect(isInSellZone(SELL_EDGE_W, DOCK_CENTER_Y)).toBe(true);
  });

  it('독 우측 가장자리(SELL_EDGE_W 이내)는 판매존', () => {
    expect(isInSellZone(GAME_WIDTH, DOCK_CENTER_Y)).toBe(true);
    expect(isInSellZone(GAME_WIDTH - SELL_EDGE_W, DOCK_CENTER_Y)).toBe(true);
  });

  it('중앙(둥지 슬롯 영역)은 판매존이 아니다', () => {
    expect(isInSellZone(GAME_WIDTH / 2, DOCK_CENTER_Y)).toBe(false);
  });

  it('독 y범위 밖이면 x가 가장자리여도 판매존 아님', () => {
    expect(isInSellZone(0, DOCK_Y - 1)).toBe(false);
    expect(isInSellZone(0, DOCK_Y + DOCK_H + 1)).toBe(false);
  });
});

describe('getNestSlotRect / distToNestSlot — 둥지 슬롯 기하', () => {
  it('슬롯 사각형 중심에서 거리 0', () => {
    for (const slot of [0, 1] as const) {
      const rect = getNestSlotRect(slot);
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      expect(distToNestSlot(cx, cy, slot)).toBeCloseTo(0);
    }
  });

  it('두 슬롯은 서로 다른 x 중심을 가진다', () => {
    const r0 = getNestSlotRect(0);
    const r1 = getNestSlotRect(1);
    expect(r0.x).not.toBe(r1.x);
  });
});
