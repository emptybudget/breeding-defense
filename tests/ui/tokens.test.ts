import { describe, expect, it } from 'vitest';
import { clampHitArea, UI } from '../../src/scenes/ui/tokens';

describe('clampHitArea', () => {
  it('MIN_HIT_PX 이상이면 그대로 반환', () => {
    expect(clampHitArea(56, 48, false)).toEqual({ w: 56, h: 48 });
    expect(clampHitArea(96, 64, true)).toEqual({ w: 96, h: 64 });
  });

  it('prod 빌드: MIN_HIT_PX 미만이면 조용히 확대 클램프', () => {
    expect(clampHitArea(44, 44, false)).toEqual({ w: UI.minHit, h: UI.minHit });
    expect(clampHitArea(30, 60, false)).toEqual({ w: UI.minHit, h: 60 });
  });

  it('dev 빌드: MIN_HIT_PX 미만이면 throw', () => {
    expect(() => clampHitArea(44, 44, true)).toThrow(/MIN_HIT_PX/);
    expect(() => clampHitArea(48, 40, true)).toThrow(/MIN_HIT_PX/);
  });

  it('경계값 48은 통과(throw 없음)', () => {
    expect(() => clampHitArea(48, 48, true)).not.toThrow();
  });
});
