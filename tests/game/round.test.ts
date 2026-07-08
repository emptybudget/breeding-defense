import { describe, expect, it } from 'vitest';
import { GOLD_AUTO_RECOVERY_PER_SEC, ROUND_CLEAR_GOLD, STARTING_GOLD, TOTAL_ROUNDS } from '../../src/game/config';
import { GameState } from '../../src/game/GameState';

describe('M2 라운드 시스템', () => {
  it('30초마다 pendingRoundBanner 1회 발생, 14라운드 이후 OVERTIME 번호로 계속 증가, +5G씩', () => {
    const state = new GameState();
    state.isInfiniteMode = true; // victory 조기 return 없이 라운드 계속 진행
    const roundNumbers: number[] = [];
    for (let i = 0; i < 450; i++) {
      state.tick(1000);
      if (state.pendingRoundBanner !== null) {
        roundNumbers.push(state.pendingRoundBanner);
        state.pendingRoundBanner = null;
      }
    }

    expect(roundNumbers).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    expect(roundNumbers[13]).toBe(TOTAL_ROUNDS);     // 14번째 발생 = 라운드 14 (정규 마지막)
    expect(roundNumbers[14]).toBe(TOTAL_ROUNDS + 1); // 15번째 발생 = OVERTIME 전환 지점

    const expectedGold = STARTING_GOLD + 450 * GOLD_AUTO_RECOVERY_PER_SEC + 15 * ROUND_CLEAR_GOLD;
    expect(state.gold).toBe(expectedGold);
  });

  it('한 번의 tick 호출 안에서는 경계를 1회만 넘어도 pendingRoundBanner가 정확히 1개 값', () => {
    const state = new GameState();
    state.isInfiniteMode = true;
    state.tick(30000);
    expect(state.pendingRoundBanner).toBe(1);
    state.pendingRoundBanner = null;
    state.tick(30000);
    expect(state.pendingRoundBanner).toBe(2);
  });
});
