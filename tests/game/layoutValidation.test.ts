import { describe, expect, it } from 'vitest';
import { checkChromeSafeZone, checkHatchOverlaySafeZone } from '../../src/game/layoutValidation';
import { DOCK_H, DOCK_Y, HUD_BAR_H, UNIT_MAX_HALF_H } from '../../src/game/config';

describe('크롬-세이프존-트랙 산술', () => {
  it('실제 config 상수는 세이프존·트랙 위반이 없어야 한다', () => {
    const result = checkChromeSafeZone();
    expect(result.reasons).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('스프라이트 반높이는 16px 이하여야 한다', () => {
    expect(UNIT_MAX_HALF_H).toBeLessThanOrEqual(16);
  });

  it('상단 바가 세이프존(top)을 침범하면 실패', () => {
    const result = checkChromeSafeZone({ hudBarY: 10 });
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('상단 바가 상단 세이프존을 침범');
  });

  it('독이 세이프존(bottom)을 침범하면 실패', () => {
    const result = checkChromeSafeZone({ dockH: DOCK_H + 20 });
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('독이 하단 세이프존을 침범');
  });

  it('상단 바가 트랙+반높이와 교차하면 실패', () => {
    const result = checkChromeSafeZone({ hudBarH: HUD_BAR_H + 30 });
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('상단 바가 트랙(+유닛 반높이)과 교차');
  });

  it('독이 트랙+반높이와 교차하면 실패', () => {
    const result = checkChromeSafeZone({ dockY: DOCK_Y - 20 });
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('독이 트랙(+유닛 반높이)과 교차');
  });

  it('경계값: 트랙 최저점(520)+반높이(16)=독 상단(536) 정확히 일치는 통과, 1px 모자라면 실패', () => {
    expect(checkChromeSafeZone({ dockY: 536 }).ok).toBe(true);
    expect(checkChromeSafeZone({ dockY: 535 }).ok).toBe(false);
  });
});

describe('M4 부화·예상 혈통 카드 세이프존(y100~420, R7)', () => {
  it('실제 config 상수는 세이프존·카드 좌표 위반이 없어야 한다', () => {
    const result = checkHatchOverlaySafeZone();
    expect(result.reasons).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
