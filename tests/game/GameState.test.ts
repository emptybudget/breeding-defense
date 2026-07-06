import { describe, expect, it } from 'vitest';
import {
  GOLD_AUTO_RECOVERY_PER_SEC,
  KILL_REWARD,
  MAX_ENEMIES,
  SELL_GOLD_TIER1,
  SELL_GOLD_TIER2,
  SELL_GOLD_TIER3,
  SELL_GOLD_TIER4,
  STARTING_GOLD,
  SUMMON_BASE_COST,
  SUMMON_COST_INCREMENT,
  SUMMON_MAX_COST,
} from '../../src/game/config';
import { GameState } from '../../src/game/GameState';
import { makeUnit } from '../../src/game/unitHelpers';

describe('소환 경제', () => {
  it('비용 곡선: 10부터 +2씩, 상한 30', () => {
    const state = new GameState();
    state.gold = 100000;
    state.maxUnits = 99;
    expect(state.summonCost).toBe(SUMMON_BASE_COST);
    let expected = SUMMON_BASE_COST;
    for (let i = 0; i < 15; i++) {
      const before = state.gold;
      expect(state.summon()).not.toBeNull();
      expect(before - state.gold).toBe(expected);
      expected = Math.min(SUMMON_MAX_COST, expected + SUMMON_COST_INCREMENT);
      expect(state.summonCost).toBe(expected);
    }
    expect(state.summonCost).toBe(SUMMON_MAX_COST);
  });

  it('골드 부족·유닛 캡 도달 시 null', () => {
    const state = new GameState();
    state.gold = 0;
    expect(state.summon()).toBeNull();

    const capped = new GameState();
    capped.gold = 100000;
    while (capped.units.length < capped.maxUnits) capped.summon();
    expect(capped.summon()).toBeNull();
  });
});

describe('판매 보상 (T4 10G 회귀 버그 방지)', () => {
  it('티어별 10/30/60/150G', () => {
    const state = new GameState();
    const cases: Array<[1 | 2 | 3 | 4, number]> = [
      [1, SELL_GOLD_TIER1], [2, SELL_GOLD_TIER2], [3, SELL_GOLD_TIER3], [4, SELL_GOLD_TIER4],
    ];
    expect(cases.map(c => c[1])).toEqual([10, 30, 60, 150]);
    for (const [tier, gold] of cases) {
      const race = tier === 1 ? 'Warrior' : tier === 2 ? 'Bio_Wolf' : tier === 3 ? 'Griffin' : 'Astral_God';
      state.units.push(makeUnit(1000 + tier, race, tier, 100, 100));
      const before = state.gold;
      state.sellUnit(1000 + tier);
      expect(state.gold - before).toBe(gold);
      expect(state.units.find(u => u.id === 1000 + tier)).toBeUndefined();
    }
  });
});

describe('적 카운트 / 게임오버', () => {
  it(`적 ${MAX_ENEMIES}마리 초과 시 gameover`, () => {
    const state = new GameState();
    for (let i = 0; i < MAX_ENEMIES; i++) state.registerSpawn();
    expect(state.phase).toBe('playing');
    state.registerSpawn();
    expect(state.phase).toBe('gameover');
  });

  it('처치: 골드 +5, 카운트 감소, 1초 내 5킬 스트릭 +10', () => {
    const state = new GameState();
    for (let i = 0; i < 5; i++) state.registerSpawn();
    const before = state.gold;
    for (let i = 0; i < 5; i++) state.registerKill();
    // 5킬 × 5G + 스트릭 10G
    expect(state.gold - before).toBe(5 * KILL_REWARD + 10);
    expect(state.enemyCount).toBe(0);
    expect(state.pendingStreakBonus).toBe(true);
  });
});

describe('tick 시간 경제', () => {
  it('초당 골드 자동회복', () => {
    const state = new GameState();
    const before = state.gold;
    state.tick(3000);
    expect(state.gold - before).toBe(3 * GOLD_AUTO_RECOVERY_PER_SEC);
  });

  it('isPaused 중에는 시간·골드 정지', () => {
    const state = new GameState();
    state.isPaused = true;
    state.tick(5000);
    expect(state.elapsedMs).toBe(0);
    expect(state.gold).toBe(STARTING_GOLD);
  });

  it('victoryTimeMs 도달 시 victory + 보석 +1 + 정지', () => {
    const state = new GameState();
    const gems = state.gems;
    state.tick(state.stageConfig.victoryTimeMs);
    expect(state.phase).toBe('victory');
    expect(state.gems).toBe(gems + 1);
    expect(state.isPaused).toBe(true);
  });
});

describe('한도+1 업그레이드', () => {
  it('구매 시 골드 차감·한도 증가·비용 상승, 골드 부족 시 실패', () => {
    const state = new GameState();
    state.gold = 1000;
    const cost = state.populationUpgradeCost;
    const cap = state.maxUnits;
    expect(state.upgradePopulation()).toBe(true);
    expect(state.maxUnits).toBe(cap + 1);
    expect(state.populationUpgradeCost).toBeGreaterThan(cost);

    state.gold = 0;
    expect(state.upgradePopulation()).toBe(false);
    expect(state.maxUnits).toBe(cap + 1);
  });
});

describe('잠금 토글', () => {
  it('toggleLock으로 잠금·해제', () => {
    const state = new GameState();
    state.units.push(makeUnit(1, 'Warrior', 1, 100, 100));
    state.toggleLock(1);
    expect(state.units[0].isLocked).toBe(true);
    state.toggleLock(1);
    expect(state.units[0].isLocked).toBe(false);
  });
});
