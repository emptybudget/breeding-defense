// M3: 혈통 교배 판정 (docs/redesign/14-breeding-api.md) — 순수 TS, Phaser 의존 0, 부작용 없음.
// 모든 랜덤은 rng 주입 (Math.random 직접 호출 금지 — 시뮬 재현성).
import {
  BLOODLINE_STRIKE_ENABLED, BREED_BUDGET, GEN_MAX, LEGEND_PITY, MUTATION_TABLE,
  RARE_PITY, RARE_PITY_BOOST, STRIKE_PERIOD, TRAIT_INHERIT,
} from './config';
import { FAMILY_OF_RACE, generateBloodlineName, rollEpithet } from './naming';
import { Gen, Lineage, MutationGrade, Tier1Race, TraitId, UnitData } from './types';
import { HYBRID_RACES } from './unitHelpers';

const ALL_TRAITS: readonly TraitId[] = HYBRID_RACES;

// ① 교배 가능 판정 — DragController·둥지 하이라이트 공용
export type BreedDenial = 'tier' | 'locked' | 'budget' | 'breeding' | 'same-unit';
export function canBreed(a: UnitData, b: UnitData, breedsUsed: number): BreedDenial | null {
  if (a.id === b.id) return 'same-unit';
  if (a.tier !== 1 || b.tier !== 1) return 'tier';
  if (a.isLocked || b.isLocked) return 'locked';
  if (a.isBreeding || b.isBreeding) return 'breeding';
  if (breedsUsed >= BREED_BUDGET) return 'budget';
  return null;
}

export interface PityState { rareMiss: number; legendMiss: number; }

export interface BreedOutcome {
  childRace: Tier1Race;
  childGen: Gen;
  cross: boolean;
  mutation?: MutationGrade;
  inheritedTrait?: TraitId;
  secondTrait?: TraitId;       // 14 §2 확장: 전설 변이 2슬롯 (기존 시그니처엔 없어 additive 추가)
  epithet?: string;            // 14 §2 확장: 변이 칭호 (개체·신규 혈통 공용, rare/legend 시)
  pityAfter: PityState;
}

const clampGen = (g: number): Gen => Math.max(0, Math.min(GEN_MAX, g)) as Gen;

// ② 교배 결과 판정 (핵심 — 부작용 없음)
// forceRare: W1-2 최초 1회 교배 확정 희귀 (R3) — 호출부(GameState)가 스테이지·교배 횟수로 판단, 여기선 그대로 수용만.
export function resolveBreeding(
  a: UnitData, b: UnitData, pity: PityState, rng: () => number, forceRare = false,
): BreedOutcome {
  const raceA = a.race as Tier1Race;
  const raceB = b.race as Tier1Race;
  const cross = FAMILY_OF_RACE[raceA] !== FAMILY_OF_RACE[raceB];

  // 종 풀 = 부모 2종만 (R4)
  const childRace: Tier1Race = rng() < 0.5 ? raceA : raceB;

  // 변이 등급 롤 (피티 반영 — 12-F3)
  const mutation = forceRare ? 'rare' : rollMutation(cross, pity, rng);
  const gotRarePlus = mutation === 'rare' || mutation === 'legend';
  const pityAfter: PityState = {
    rareMiss: gotRarePlus ? 0 : pity.rareMiss + 1,
    legendMiss: mutation === 'legend' ? 0 : pity.legendMiss + 1,
  };

  // Gen 전파: 동계열 max+1 / 이계열 max 유지, 희귀 +1, 상한 4 clamp
  const parentMaxGen = Math.max(a.gen ?? 0, b.gen ?? 0);
  let childGen = cross ? parentMaxGen : parentMaxGen + 1;
  if (mutation === 'rare') childGen += 1;
  const finalGen = clampGen(childGen);

  // 특성: 전설 = 새 특성 2슬롯(계보의 특성 발원지) / 그 외 = 부모 특성 상속(50/40/20)
  let inheritedTrait: TraitId | undefined;
  let secondTrait: TraitId | undefined;
  if (mutation === 'legend') {
    inheritedTrait = ALL_TRAITS[Math.floor(rng() * ALL_TRAITS.length)];
    do {
      secondTrait = ALL_TRAITS[Math.floor(rng() * ALL_TRAITS.length)];
    } while (secondTrait === inheritedTrait);
  } else {
    inheritedTrait = resolveTraitInheritance(a, b, rng);
  }

  const epithet = mutation ? rollEpithet(mutation, rng) : undefined;

  return { childRace, childGen: finalGen, cross, mutation, inheritedTrait, secondTrait, epithet, pityAfter };
}

// M4: 예상 혈통 카드용 — rng 소비·pity 변경 없이 결정론적 절반(Gen·변이 확률%)만 미리 계산.
export function previewBreedOutcome(
  a: UnitData, b: UnitData, pity: PityState,
): { expectedGen: Gen; mutationChancePct: number; cross: boolean } {
  const raceA = a.race as Tier1Race;
  const raceB = b.race as Tier1Race;
  const cross = FAMILY_OF_RACE[raceA] !== FAMILY_OF_RACE[raceB];
  const parentMaxGen = Math.max(a.gen ?? 0, b.gen ?? 0);
  const expectedGen = clampGen(cross ? parentMaxGen : parentMaxGen + 1);
  if (pity.legendMiss >= LEGEND_PITY) return { expectedGen, mutationChancePct: 100, cross };
  const t = cross ? MUTATION_TABLE.cross : MUTATION_TABLE.same;
  const rareP = pity.rareMiss >= RARE_PITY ? RARE_PITY_BOOST : t.rare;
  return { expectedGen, mutationChancePct: t.legend + rareP + t.common, cross };
}

// 변이 등급 롤 (피티 발동: 희귀 피티 → 희귀 %상승, 전설 피티 → 전설 확정)
function rollMutation(cross: boolean, pity: PityState, rng: () => number): MutationGrade | undefined {
  if (pity.legendMiss >= LEGEND_PITY) return 'legend';
  const t = cross ? MUTATION_TABLE.cross : MUTATION_TABLE.same;
  const rareP = pity.rareMiss >= RARE_PITY ? RARE_PITY_BOOST : t.rare;
  const r = rng() * 100;
  if (r < t.legend) return 'legend';
  if (r < t.legend + rareP) return 'rare';
  if (r < t.legend + rareP + t.common) return 'common';
  return undefined;
}

// 특성 상속 (50% A / 40% B / 20% 제3 무작위) — 독립 게이트 + 우선순위(A>B>제3).
// 부모 무특성이면 undefined (특성 잠재력이 없는 계보엔 발현 안 함 — 발원은 legend 변이).
// 제3 무작위 = 전 특성 풀에서 신규 1종 (계보의 특성 드리프트).
function resolveTraitInheritance(a: UnitData, b: UnitData, rng: () => number): TraitId | undefined {
  if (!a.trait && !b.trait) return undefined;
  if (a.trait && rng() < TRAIT_INHERIT.fromA / 100) return a.trait;
  if (b.trait && rng() < TRAIT_INHERIT.fromB / 100) return b.trait;
  if (rng() < TRAIT_INHERIT.third / 100) return ALL_TRAITS[Math.floor(rng() * ALL_TRAITS.length)];
  return undefined;
}

// ③ 혈통 승계/창설 판정 — 부화 시 GameState가 호출
export function resolveLineage(
  a: UnitData, b: UnitData, outcome: BreedOutcome,
  lineages: Map<number, Lineage>,
  usedNames: Set<string>,
  nextLineageId: number,
  rng: () => number,
): { lineage: Lineage; isNew: boolean } {
  const inheritId = pickLineageId([a, b]);
  if (inheritId !== undefined) {
    const existing = lineages.get(inheritId);
    if (existing) return { lineage: existing, isNew: false };
  }
  // 둘 다 무혈통 → 창설 (칭호는 resolveBreeding이 이미 롤한 값을 재사용)
  const family = FAMILY_OF_RACE[outcome.childRace];
  const name = generateBloodlineName(family, rng, usedNames);
  return { lineage: { id: nextLineageId, name, family, epithet: outcome.epithet }, isNew: true };
}

// E5 우선순위: ①최대 Gen 보유자의 lineageId ②동률이면 혈통 보유 쪽 ③전부 무혈통이면 undefined
function pickLineageId(units: UnitData[]): number | undefined {
  let best: UnitData | undefined;
  for (const u of units) {
    if (u.lineageId === undefined) continue;
    if (!best) { best = u; continue; }
    const g = u.gen ?? 0, bg = best.gen ?? 0;
    if (g > bg || (g === bg && (u.lineageId < (best.lineageId ?? Infinity)))) best = u;
  }
  return best?.lineageId;
}

// ⑤ 융합(합성) 승계 — synthesize()가 결과 유닛 생성 직후 호출
export function inheritOnSynthesis(materials: UnitData[], rng: () => number): {
  gen: Gen; lineageId?: number; bloodlineName?: string; trait?: TraitId; epithet?: string;
} {
  const gen = clampGen(materials.reduce((m, u) => Math.max(m, u.gen ?? 0), 0));
  // 최대 Gen 재료 (동률이면 혈통 보유 → id 최소)
  const apex = [...materials].sort((a, b) =>
    (b.gen ?? 0) - (a.gen ?? 0) ||
    (Number(b.lineageId !== undefined) - Number(a.lineageId !== undefined)) ||
    a.id - b.id)[0];
  const trait = apex?.trait && rng() < TRAIT_INHERIT.synthesis / 100 ? apex.trait : undefined;
  return {
    gen,
    lineageId: apex?.lineageId,
    bloodlineName: apex?.bloodlineName,
    trait,
    epithet: apex?.epithet,
  };
}

// ⑥ 혈통 일격 판정 — combat.ts가 카운터 증가 후 호출 (E17). enabled는 테스트용(기본=상수).
export function bloodlineStrike(unit: UnitData, enabled: boolean = BLOODLINE_STRIKE_ENABLED): boolean {
  if (!enabled) return false;
  const g = unit.gen ?? 0;
  if (g < 2) return false;
  const period = STRIKE_PERIOD[g as 2 | 3 | 4];
  const c = unit.strikeCounter ?? 0;
  return c > 0 && c % period === 0;
}

// ⑦ 정점 유닛 판정 — 렌더(문장 오버레이)가 매 갱신 호출 (E22)
export function findApexUnit(units: UnitData[]): UnitData | null {
  const candidates = units.filter(u => (u.gen ?? 0) > 0 || u.lineageId !== undefined);
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) =>
    (b.gen ?? 0) - (a.gen ?? 0) ||
    (Number(b.lineageId !== undefined) - Number(a.lineageId !== undefined)) ||
    a.id - b.id)[0];
}
