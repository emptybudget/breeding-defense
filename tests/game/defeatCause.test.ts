import { describe, expect, it } from 'vitest';
import { computeDefeatCause } from '../../src/game/defeatCause';
import { GameState } from '../../src/game/GameState';
import { makeUnit } from '../../src/game/unitHelpers';

describe('M2 GameOver 패배 원인 판정', () => {
  it('합성한 유닛 없음(최대 티어 1) → noSynthesis', () => {
    const state = new GameState();
    state.units.push(makeUnit(1, 'Warrior', 1, 100, 100));
    expect(computeDefeatCause(state).cause).toBe('noSynthesis');
  });

  it('티어2 이상 있지만 유닛 수가 한도 절반 미만 → lowUnitCount', () => {
    const state = new GameState();
    state.maxUnits = 10;
    state.units.push(makeUnit(1, 'Bio_Wolf', 2, 100, 100));
    expect(state.units.length).toBeLessThan(state.maxUnits * 0.5);
    expect(computeDefeatCause(state).cause).toBe('lowUnitCount');
  });

  it('유닛 수는 충분하나 탱크 비율 높은 스테이지+티어3 미만 → tankOverwhelm', () => {
    const state = new GameState();
    state.maxUnits = 2;
    state.units.push(makeUnit(1, 'Bio_Wolf', 2, 100, 100));
    state.units.push(makeUnit(2, 'Bio_Wolf', 2, 100, 100));
    // W2-1 tankRatio(0.15)로는 기준 미달일 수 있어 직접 덮어써 조건을 확정한다
    state.stageConfig.tankRatio = 0.3;
    expect(computeDefeatCause(state).cause).toBe('tankOverwhelm');
  });

  it('유닛 충분+티어3 이상+탱크 낮음 → general(기본값)', () => {
    const state = new GameState();
    state.maxUnits = 2;
    state.units.push(makeUnit(1, 'Griffin', 3, 100, 100));
    state.units.push(makeUnit(2, 'Griffin', 3, 100, 100));
    state.stageConfig.tankRatio = 0;
    expect(computeDefeatCause(state).cause).toBe('general');
  });
});
