import { describe, expect, it } from 'vitest';
import { GameState } from '../../src/game/GameState';
import { makeUnit } from '../../src/game/unitHelpers';
import { BREED_BUDGET } from '../../src/game/config';

describe('M3 GameState 교배 통합 (14 §4)', () => {
  it('부모 2 소모 + 자식 1 생성 + 혈통 창설 + pendingHatch', () => {
    const st = new GameState();
    st.units.push(makeUnit(100, 'Warrior', 1, 50, 50), makeUnit(101, 'Archer', 1, 60, 60));

    expect(st.startBreeding(100, 101)).toBe(true);
    expect(st.breedsUsedThisGame).toBe(1);
    expect(st.units.find(u => u.id === 100)!.isBreeding).toBe(true);

    const born = st.completeBreeding(100, 101);
    expect(born.length).toBeGreaterThanOrEqual(1);
    expect(st.units.some(u => u.id === 100 || u.id === 101)).toBe(false); // 부모 제거
    const child = born[0];
    expect(child.gen).toBe(1);                    // 동계열 max+1
    expect(child.lineageId).toBeDefined();
    expect(child.bloodlineName).toBeTruthy();
    expect(st.lineages.size).toBe(1);
    expect(st.pedigree).toHaveLength(1);
    expect(st.pendingHatch?.childId).toBe(child.id);
    expect(st.pendingPitySave).toBe(true);
  });

  it('이계열(Warrior+Dog) 교배 허용 — 도박 루프', () => {
    const st = new GameState();
    st.units.push(makeUnit(1, 'Warrior', 1, 0, 0), makeUnit(2, 'Dog', 1, 0, 0));
    expect(st.startBreeding(1, 2)).toBe(true);
    const born = st.completeBreeding(1, 2);
    expect(born[0].gen).toBe(0); // 이계열 = Gen 유지
  });

  it('교배 예산 상한 = BREED_BUDGET회', () => {
    const st = new GameState();
    let started = 0;
    for (let i = 0; i < BREED_BUDGET + 2; i++) {
      const x = makeUnit(1000 + i * 2, 'Warrior', 1, 0, 0);
      const y = makeUnit(1001 + i * 2, 'Archer', 1, 0, 0);
      st.units.push(x, y);
      if (st.startBreeding(x.id, y.id)) started++;
    }
    expect(started).toBe(BREED_BUDGET);
  });

  it('융합(합성) 시 최대 Gen 재료의 혈통 승계 (E5)', () => {
    const st = new GameState();
    const a = makeUnit(1, 'Warrior', 1, 100, 100); a.gen = 2; a.lineageId = 9; a.bloodlineName = '은빛칼날';
    const b = makeUnit(2, 'Dog', 1, 105, 105);
    st.units.push(a, b); // Warrior+Dog → Bio_Wolf (T2)
    const hybrid = st.synthesize(1, 2);
    expect(hybrid).not.toBeNull();
    expect(hybrid!.gen).toBe(2);            // max(재료 gen)
    expect(hybrid!.lineageId).toBe(9);      // 최대 Gen 재료 혈통 승계
    expect(hybrid!.bloodlineName).toBe('은빛칼날');
  });
});
