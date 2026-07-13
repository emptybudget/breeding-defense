import { describe, expect, it } from 'vitest';
import { GameState } from '../../src/game/GameState';
import { makeUnit } from '../../src/game/unitHelpers';
import { BREED_BUDGET, MUTATION_COMMON_GOLD, TIER4_SYNTHESIS_SOUL_COST, WORLD_CONFIGS } from '../../src/game/config';

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

describe('M4 W1-2 확정 희귀 (R3) + 일반 변이 즉시 골드 (R6)', () => {
  it('W1-2 최초 확정 교배는 mutation=rare, Gen2 산출', () => {
    const st = new GameState(undefined, WORLD_CONFIGS[1][2]);
    st.units.push(makeUnit(1, 'Warrior', 1, 0, 0), makeUnit(2, 'Archer', 1, 0, 0));
    st.startBreeding(1, 2);
    const [child] = st.completeBreeding(1, 2);
    expect(child.gen).toBe(2); // 0+1(동계열)+1(확정 희귀)
    expect(st.pendingMutationRecord).toBe('rare');
  });

  it('W1-2 두 번째 교배부터는 강제되지 않음(분포 검증, 100회)', () => {
    let forcedTwice = 0;
    for (let trial = 0; trial < 100; trial++) {
      const st = new GameState(undefined, WORLD_CONFIGS[1][2]);
      st.units.push(makeUnit(1, 'Warrior', 1, 0, 0), makeUnit(2, 'Archer', 1, 0, 0));
      st.startBreeding(1, 2);
      st.completeBreeding(1, 2); // 1회차 = 강제 희귀 소진
      st.units.push(makeUnit(3, 'Warrior', 1, 0, 0), makeUnit(4, 'Archer', 1, 0, 0));
      st.startBreeding(3, 4);
      st.completeBreeding(3, 4); // 2회차 = 일반 롤
      if (st.pendingMutationRecord === 'rare') forcedTwice++;
    }
    // 2회차가 매번 rare라면 강제가 잘못 유지되고 있는 것 — 일반 확률(≈2.5%)이라 100회 중 대부분은 아님
    expect(forcedTwice).toBeLessThan(100);
  });

  it('W1-2가 아닌 스테이지는 첫 교배도 강제되지 않음(분포 검증, 100회)', () => {
    let rareCount = 0;
    for (let trial = 0; trial < 100; trial++) {
      const st = new GameState(undefined, WORLD_CONFIGS[2][1]);
      st.units.push(makeUnit(1, 'Warrior', 1, 0, 0), makeUnit(2, 'Archer', 1, 0, 0));
      st.startBreeding(1, 2);
      st.completeBreeding(1, 2);
      if (st.pendingMutationRecord === 'rare') rareCount++;
    }
    expect(rareCount).toBeLessThan(100); // 매번 rare면 forceRare가 스테이지 무관하게 새고 있는 것
  });

  it('common 변이 시 gold가 정확히 MUTATION_COMMON_GOLD만큼 증가 (실제 확률 분포, 500회 내 관측 보장)', () => {
    let sawCommon = false;
    for (let trial = 0; trial < 500 && !sawCommon; trial++) {
      const st = new GameState(undefined, WORLD_CONFIGS[2][1]);
      st.units.push(makeUnit(1, 'Warrior', 1, 0, 0), makeUnit(2, 'Archer', 1, 0, 0));
      st.startBreeding(1, 2);
      const goldBefore = st.gold;
      st.completeBreeding(1, 2);
      if (st.pendingMutationRecord === 'common') {
        expect(st.gold).toBe(goldBefore + MUTATION_COMMON_GOLD);
        sawCommon = true;
      }
    }
    expect(sawCommon).toBe(true);
  });
});

describe('32 T4 영혼 촉매 — 神 탄생 게이트', () => {
  function setupAstralReady(): GameState {
    const st = new GameState();
    // Astral 레시피 = Griffin + Thunder_Hawk + Cyborg_Wizard, 셋 다 100px 이내
    st.units.push(
      makeUnit(1, 'Griffin', 3, 100, 100),
      makeUnit(2, 'Thunder_Hawk', 3, 110, 100),
      makeUnit(3, 'Cyborg_Wizard', 3, 120, 100),
    );
    return st;
  }
  it('영혼 부족이면 T4 합성 실패 (유닛 불변)', () => {
    const st = setupAstralReady();
    st.enhancePoints = TIER4_SYNTHESIS_SOUL_COST - 1;
    const out = st.synthesize(1, 2);
    expect(out).toBeNull();
    expect(st.units.some(u => u.race === 'Astral_God')).toBe(false);
    expect(st.units.length).toBe(3);
    expect(st.enhancePoints).toBe(TIER4_SYNTHESIS_SOUL_COST - 1); // 미차감
  });
  it('영혼 충분이면 神 탄생 + 영혼 차감 + 재료 3 소모', () => {
    const st = setupAstralReady();
    st.enhancePoints = TIER4_SYNTHESIS_SOUL_COST + 2;
    const out = st.synthesize(1, 2);
    expect(out?.race).toBe('Astral_God');
    expect(st.enhancePoints).toBe(2);
    expect(st.units.filter(u => u.race === 'Astral_God').length).toBe(1);
    expect(st.units.some(u => u.tier === 3)).toBe(false); // 재료 3기 전부 소모
  });
});
