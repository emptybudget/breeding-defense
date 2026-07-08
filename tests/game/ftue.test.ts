import { describe, expect, it } from 'vitest';
import { computeEffectiveSpeedMult } from '../../src/game/ftue';

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
