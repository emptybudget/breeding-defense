import { describe, expect, it } from 'vitest';
import { computeEffectiveSpeedMult } from '../../src/game/ftue';
import { PREVIEW_SLOWMO } from '../../src/game/config';

describe('M2 FTUE 중 1배속 강제', () => {
  it('강제 스텝 활성 중이면 사용자 설정과 무관하게 1배속', () => {
    expect(computeEffectiveSpeedMult(2, true)).toBe(1);
    expect(computeEffectiveSpeedMult(1, true)).toBe(1);
  });

  it('비활성 시 사용자 설정 그대로', () => {
    expect(computeEffectiveSpeedMult(2, false)).toBe(2);
    expect(computeEffectiveSpeedMult(1, false)).toBe(1);
  });
});

describe('M4 예상 혈통 카드 절대 0.3배속 (E10)', () => {
  it('미리보기 활성 중이면 절대값 0.3 — FTUE 강제·2배속보다 우선', () => {
    expect(computeEffectiveSpeedMult(2, true, true)).toBe(PREVIEW_SLOWMO);
    expect(computeEffectiveSpeedMult(1, false, true)).toBe(PREVIEW_SLOWMO);
  });

  it('미리보기 비활성이면 기존 2-인자 동작과 동일', () => {
    expect(computeEffectiveSpeedMult(2, true, false)).toBe(1);
    expect(computeEffectiveSpeedMult(2, false, false)).toBe(2);
  });
});
