import { describe, expect, it } from 'vitest';
import {
  canBreed, resolveBreeding, resolveLineage, inheritOnSynthesis,
  bloodlineStrike, findApexUnit, previewBreedOutcome, PityState,
} from '../../src/game/breeding';
import { makeUnit } from '../../src/game/unitHelpers';
import { FAMILY_OF_RACE } from '../../src/game/naming';
import { Lineage, Tier1Race, UnitData } from '../../src/game/types';
import { BREED_BUDGET, GEN_MAX, LEGEND_PITY, RARE_PITY } from '../../src/game/config';

// 결정론적 시드 rng (mulberry32)
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// 스크립트 rng — 지정 값을 순서대로 반환 (소진 시 마지막 값 반복)
function scripted(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}
function t1(id: number, race: Tier1Race, gen = 0): UnitData {
  const u = makeUnit(id, race, 1, 0, 0);
  u.gen = gen as UnitData['gen'];
  return u;
}
const NO_PITY: PityState = { rareMiss: 0, legendMiss: 0 };

describe('canBreed — 거부 사유 5종 (14 §2 ①)', () => {
  it('동일 유닛 = same-unit', () => {
    const a = t1(1, 'Warrior');
    expect(canBreed(a, a, 0)).toBe('same-unit');
  });
  it('T1 아님 = tier', () => {
    const a = t1(1, 'Warrior'); const b = makeUnit(2, 'Bio_Wolf', 2, 0, 0);
    expect(canBreed(a, b, 0)).toBe('tier');
  });
  it('잠금 = locked', () => {
    const a = t1(1, 'Warrior'); const b = t1(2, 'Archer'); b.isLocked = true;
    expect(canBreed(a, b, 0)).toBe('locked');
  });
  it('교배중 = breeding', () => {
    const a = t1(1, 'Warrior'); const b = t1(2, 'Archer'); a.isBreeding = true;
    expect(canBreed(a, b, 0)).toBe('breeding');
  });
  it('예산 소진 = budget', () => {
    const a = t1(1, 'Warrior'); const b = t1(2, 'Archer');
    expect(canBreed(a, b, BREED_BUDGET)).toBe('budget');
    expect(canBreed(a, b, BREED_BUDGET - 1)).toBeNull();
  });
});

describe('Gen 전파 + 종 풀 (14 §2 ②)', () => {
  it('동계열: max Gen +1', () => {
    const out = resolveBreeding(t1(1, 'Warrior'), t1(2, 'Archer'), NO_PITY, scripted([0, 0.99]));
    expect(out.cross).toBe(false);
    expect(out.mutation).toBeUndefined();
    expect(out.childGen).toBe(1);
  });
  it('이계열: Gen 유지', () => {
    const out = resolveBreeding(t1(1, 'Warrior'), t1(2, 'Dog'), NO_PITY, scripted([0, 0.99]));
    expect(out.cross).toBe(true);
    expect(out.childGen).toBe(0);
  });
  it('희귀 변이는 Gen +1 추가', () => {
    // rng: childRace=0, rollMutation r=2.0(→rare), epithet=0
    const out = resolveBreeding(t1(1, 'Warrior', 0), t1(2, 'Archer', 0), NO_PITY, scripted([0, 0.02, 0]));
    expect(out.mutation).toBe('rare');
    expect(out.childGen).toBe(2); // 0 +1(동계열) +1(희귀)
  });
  it('Gen 상한 4 clamp', () => {
    const out = resolveBreeding(t1(1, 'Warrior', 4), t1(2, 'Archer', 4), NO_PITY, scripted([0, 0.02, 0]));
    expect(out.childGen).toBe(GEN_MAX); // 4+1+1 → clamp 4
  });
  it('종 풀 = 부모 2종만', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 300; i++) {
      const out = resolveBreeding(t1(1, 'Warrior'), t1(2, 'Dog'), NO_PITY, rng);
      expect(['Warrior', 'Dog']).toContain(out.childRace);
    }
  });
});

describe('피티 발동·리셋 (14 §4, 12-F3)', () => {
  it('희귀 피티 임계 도달 시 희귀 확률 상승(같은 rng이 common→rare로 바뀜)', () => {
    // r=5.0: 무피티(rare 2.5%)면 common, 피티(rare 10%)면 rare
    const noBoost = resolveBreeding(t1(1, 'Warrior'), t1(2, 'Archer'), { rareMiss: 0, legendMiss: 0 }, scripted([0, 0.05]));
    expect(noBoost.mutation).toBe('common');
    const boost = resolveBreeding(t1(1, 'Warrior'), t1(2, 'Archer'), { rareMiss: RARE_PITY, legendMiss: 0 }, scripted([0, 0.05, 0]));
    expect(boost.mutation).toBe('rare');
    expect(boost.pityAfter.rareMiss).toBe(0); // 희귀 획득 → 리셋
  });
  it('희귀 미획득 시 rareMiss +1, 전설 미획득 시 legendMiss +1', () => {
    const out = resolveBreeding(t1(1, 'Warrior'), t1(2, 'Archer'), { rareMiss: 3, legendMiss: 10 }, scripted([0, 0.99]));
    expect(out.mutation).toBeUndefined();
    expect(out.pityAfter).toEqual({ rareMiss: 4, legendMiss: 11 });
  });
  it('전설 피티 임계 도달 시 전설 확정 + legendMiss 리셋', () => {
    const out = resolveBreeding(t1(1, 'Warrior'), t1(2, 'Archer'), { rareMiss: 2, legendMiss: LEGEND_PITY }, scripted([0, 0, 0, 0.1, 0]));
    expect(out.mutation).toBe('legend');
    expect(out.pityAfter.legendMiss).toBe(0);
    expect(out.pityAfter.rareMiss).toBe(0); // 전설도 rare-plus라 희귀 피티 리셋
    expect(out.secondTrait).toBeDefined();   // 전설 = 특성 2슬롯
    expect(out.secondTrait).not.toBe(out.inheritedTrait);
  });
});

describe('특성 상속 분포 (14 §2 ⑥, R5 50/40/20 · 합성 60)', () => {
  it('부모 무특성이면 undefined', () => {
    const out = resolveBreeding(t1(1, 'Warrior'), t1(2, 'Archer'), NO_PITY, scripted([0, 0.99]));
    expect(out.inheritedTrait).toBeUndefined();
  });
  it('A만 특성 보유 → 약 50% 상속', () => {
    let inherited = 0; const N = 20000; const rng = mulberry32(42);
    for (let i = 0; i < N; i++) {
      const a = t1(1, 'Warrior'); a.trait = 'Gatling_Dog';
      const out = resolveBreeding(a, t1(2, 'Archer'), NO_PITY, rng);
      if (out.mutation !== 'legend' && out.inheritedTrait === 'Gatling_Dog') inherited++;
    }
    expect(inherited / N).toBeGreaterThan(0.46);
    expect(inherited / N).toBeLessThan(0.54);
  });
  it('합성 승계 ≈ 60%', () => {
    let kept = 0; const N = 20000; const rng = mulberry32(99);
    for (let i = 0; i < N; i++) {
      const apex = makeUnit(1, 'Bio_Wolf', 2, 0, 0); apex.gen = 2; apex.trait = 'Gatling_Dog';
      const inh = inheritOnSynthesis([apex, makeUnit(2, 'Falcon_Eye', 2, 0, 0)], rng);
      if (inh.trait === 'Gatling_Dog') kept++;
    }
    expect(kept / N).toBeGreaterThan(0.57);
    expect(kept / N).toBeLessThan(0.63);
  });
});

describe('승계 우선순위 (14 §2 ③⑤⑦, E5·E22)', () => {
  const lineage: Lineage = { id: 5, name: '은빛칼날', family: 'sword' };
  function withLineage(id: number, race: Tier1Race, gen: number, lineageId?: number): UnitData {
    const u = t1(id, race, gen);
    if (lineageId !== undefined) { u.lineageId = lineageId; u.bloodlineName = '은빛칼날'; }
    return u;
  }
  it('E5 ①: 최대 Gen 쪽 lineageId 승계', () => {
    const lineages = new Map([[5, lineage]]);
    const a = withLineage(1, 'Warrior', 2, 5);
    const b = t1(2, 'Archer', 1);
    const out = resolveBreeding(a, b, NO_PITY, scripted([0, 0.99]));
    const res = resolveLineage(a, b, out, lineages, new Set(['은빛칼날']), 6, mulberry32(1));
    expect(res.isNew).toBe(false);
    expect(res.lineage.id).toBe(5);
  });
  it('E5 ②: Gen 동률이면 혈통 보유 쪽', () => {
    const lineages = new Map([[5, lineage]]);
    const a = t1(1, 'Warrior', 1);            // 무혈통
    const b = withLineage(2, 'Archer', 1, 5); // 혈통 보유
    const out = resolveBreeding(a, b, NO_PITY, scripted([0, 0.99]));
    const res = resolveLineage(a, b, out, lineages, new Set(['은빛칼날']), 6, mulberry32(1));
    expect(res.lineage.id).toBe(5);
  });
  it('E5 ③: 둘 다 무혈통 → 신규 창설 (계열 = 자식 종)', () => {
    const out = resolveBreeding(t1(1, 'Warrior'), t1(2, 'Dog'), NO_PITY, scripted([0, 0.99])); // childRace=Warrior(sword)
    const res = resolveLineage(t1(1, 'Warrior'), t1(2, 'Dog'), out, new Map(), new Set(), 6, mulberry32(1));
    expect(res.isNew).toBe(true);
    expect(res.lineage.id).toBe(6);
    expect(res.lineage.family).toBe(FAMILY_OF_RACE[out.childRace]);
  });
  it('E22 findApexUnit: 최대 Gen → 혈통 보유 → 최소 id', () => {
    const units = [
      t1(1, 'Warrior', 3),
      withLineage(2, 'Archer', 3, 5),
      withLineage(3, 'Dog', 3, 7),
    ];
    expect(findApexUnit(units)?.id).toBe(2); // Gen3 동률, 혈통 보유 중 id 최소
  });
  it('findApexUnit: 전부 Gen0 무혈통 → null', () => {
    expect(findApexUnit([t1(1, 'Warrior'), t1(2, 'Dog')])).toBeNull();
  });
});

describe('M4 forceRare — W1-2 확정 희귀 (R3)', () => {
  it('forceRare=true면 rng 무관 mutation=rare, Gen+1 추가', () => {
    const rng = scripted([0, 0.99, 0.99, 0.99]); // childRace/rollMutation 자리 모두 "낮은 확률 없음" 값
    const out = resolveBreeding(t1(1, 'Warrior', 0), t1(2, 'Archer', 0), NO_PITY, rng, true);
    expect(out.mutation).toBe('rare');
    expect(out.childGen).toBe(2); // 0 +1(동계열) +1(희귀)
  });
  it('forceRare=true면 피티가 실제 희귀 획득처럼 리셋된다', () => {
    const out = resolveBreeding(t1(1, 'Warrior'), t1(2, 'Archer'), { rareMiss: 5, legendMiss: 10 }, scripted([0, 0.99]), true);
    expect(out.pityAfter.rareMiss).toBe(0);
    expect(out.pityAfter.legendMiss).toBe(11); // 희귀는 legend-plus가 아니므로 legendMiss는 그대로 +1
  });
  it('forceRare=false(기본)면 일반 롤 그대로', () => {
    const out = resolveBreeding(t1(1, 'Warrior'), t1(2, 'Archer'), NO_PITY, scripted([0, 0.99]));
    expect(out.mutation).toBeUndefined();
  });
});

describe('previewBreedOutcome (M4 예상 혈통 카드)', () => {
  it('rng를 소비하지 않고 결정론적 Gen·계열 일치 여부를 반환', () => {
    const p1 = previewBreedOutcome(t1(1, 'Warrior', 1), t1(2, 'Archer', 0), NO_PITY);
    expect(p1.cross).toBe(false);
    expect(p1.expectedGen).toBe(2); // 동계열: max(1,0)+1
    const p2 = previewBreedOutcome(t1(1, 'Warrior', 1), t1(2, 'Dog', 2), NO_PITY);
    expect(p2.cross).toBe(true);
    expect(p2.expectedGen).toBe(2); // 이계열: max(1,2) 유지
  });
  it('전설 피티 임계 도달 시 변이 확률 100%', () => {
    const p = previewBreedOutcome(t1(1, 'Warrior'), t1(2, 'Archer'), { rareMiss: 0, legendMiss: LEGEND_PITY });
    expect(p.mutationChancePct).toBe(100);
  });
  it('희귀 피티 임계 도달 시 확률이 상승', () => {
    const base = previewBreedOutcome(t1(1, 'Warrior'), t1(2, 'Archer'), NO_PITY);
    const boosted = previewBreedOutcome(t1(1, 'Warrior'), t1(2, 'Archer'), { rareMiss: RARE_PITY, legendMiss: 0 });
    expect(boosted.mutationChancePct).toBeGreaterThan(base.mutationChancePct);
  });
});

describe('혈통 일격 (14 §2 ⑥, E17)', () => {
  function gen(g: number, counter: number): UnitData {
    const u = makeUnit(1, 'Warrior', 1, 0, 0);
    u.gen = g as UnitData['gen']; u.strikeCounter = counter;
    return u;
  }
  it('M4: 플래그 on(기본)이면 Gen 조건 충족 시 발동', () => {
    expect(bloodlineStrike(gen(3, 3))).toBe(true);
  });
  it('명시적 enabled=false면 항상 false', () => {
    expect(bloodlineStrike(gen(3, 3), false)).toBe(false);
  });
  it('Gen<2면 false', () => {
    expect(bloodlineStrike(gen(1, 4), true)).toBe(false);
  });
  it('Gen2 주기 4: counter 4·8에서만 발동', () => {
    expect(bloodlineStrike(gen(2, 1), true)).toBe(false);
    expect(bloodlineStrike(gen(2, 3), true)).toBe(false);
    expect(bloodlineStrike(gen(2, 4), true)).toBe(true);
    expect(bloodlineStrike(gen(2, 8), true)).toBe(true);
  });
  it('Gen3 주기 3 / Gen4 주기 2', () => {
    expect(bloodlineStrike(gen(3, 3), true)).toBe(true);
    expect(bloodlineStrike(gen(3, 4), true)).toBe(false);
    expect(bloodlineStrike(gen(4, 2), true)).toBe(true);
    expect(bloodlineStrike(gen(4, 3), true)).toBe(false);
  });
  it('더블어택 = 카운터 2씩 증가 시 발동 지점 (E17)', () => {
    // Gen2(주기4): 더블어택으로 counter 2,4,6,8 진행 → 4·8에서 발동 = 2회
    let strikes = 0;
    for (const c of [2, 4, 6, 8]) strikes += bloodlineStrike(gen(2, c), true) ? 1 : 0;
    expect(strikes).toBe(2);
  });
});
