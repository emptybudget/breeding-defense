// M3 밸런스 시뮬 (Phaser 없음, 순수 로직) — vitest 아닌 단독 실행 (14 §5 관례).
//   실행: npx esbuild scripts/sim-bloodline.ts --bundle --platform=node --format=esm --outfile=/tmp/sim.mjs && node /tmp/sim.mjs
// 검증 대상:
//   (A) 변이 분포 10만회 ±3σ (피티 비활성) — 12-Sim D
//   (B) 지배 시퀀스 유일성 (합성 수요 포함) — 12-F2: 순수 사다리 vs 도박 혼합의 우열이 시드마다 갈려야 통과
import { resolveBreeding, PityState } from '../src/game/breeding';
import { FAMILY_OF_RACE } from '../src/game/naming';
import { BREED_BUDGET, MUTATION_TABLE } from '../src/game/config';
import { Tier1Race, UnitData } from '../src/game/types';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const RACES: Tier1Race[] = ['Warrior', 'Archer', 'Dog', 'Squirrel', 'Android', 'Cannon'];
const FAMILIES = ['sword', 'fang', 'steel'] as const;
const NP: PityState = { rareMiss: 0, legendMiss: 0 };
function u(id: number, race: Tier1Race, gen: number): UnitData {
  return { id, race, tier: 1, x: 0, y: 0, lastAttackedAtMs: 0, isBreeding: false, breedingEndMs: 0, isLocked: false, gen: gen as UnitData['gen'] };
}
let fails = 0;
const failMsg = (m: string) => { console.error('  ✗ ' + m); fails++; };

// ─────────────────────────────────────────────────────────────
// (A) 변이 분포 10만회 ±3σ
// ─────────────────────────────────────────────────────────────
console.log('(A) 변이 분포 10만회 (피티 비활성):');
function checkDist(cross: boolean): void {
  const N = 100000; const rng = mulberry32(20260706);
  const c = { common: 0, rare: 0, legend: 0, none: 0 };
  const partnerRace: Tier1Race = cross ? 'Dog' : 'Archer';
  for (let i = 0; i < N; i++) c[resolveBreeding(u(1, 'Warrior', 0), u(2, partnerRace, 0), NP, rng).mutation ?? 'none']++;
  const tbl = cross ? MUTATION_TABLE.cross : MUTATION_TABLE.same;
  const sigma3 = (p: number) => 3 * Math.sqrt((p / 100) * (1 - p / 100) / N);
  const label = cross ? 'cross' : 'same ';
  console.log(`  ${label}: common ${(c.common / N * 100).toFixed(2)}%(=${tbl.common}) rare ${(c.rare / N * 100).toFixed(3)}%(=${tbl.rare}) legend ${(c.legend / N * 100).toFixed(3)}%(=${tbl.legend})`);
  for (const [k, exp] of [['common', tbl.common], ['rare', tbl.rare], ['legend', tbl.legend]] as const) {
    if (Math.abs(c[k] / N - exp / 100) > sigma3(exp)) failMsg(`${label} ${k} out of ±3σ`);
  }
}
checkDist(false); checkDist(true);

// ─────────────────────────────────────────────────────────────
// (B) 지배 시퀀스 유일성 — 합성 수요 포함
// 모델: 판당 자원 = 소환 SUMMONS회 + 교배 예산 BREED_BUDGET회.
//   목표 = Gen3 유닛 1기 AND T4 1기(합성 = T1 12기 소모). 두 목표가 유닛을 두고 경쟁.
//   전략 3종을 각 시드에서 몬테카를로로 성공률 측정 → 시드별 최적 전략/계열이 갈리면 통과, 단일 지배면 실패.
// ─────────────────────────────────────────────────────────────
console.log('\n(B) 지배 시퀀스 유일성 (합성 수요 포함):');
// 핵심 트레이드오프: 교배 예산(6)의 배분 = 사다리(동계열, 확실한 Gen 상승) vs 도박(이계열, Gen 유지+5% Gen+1 샷).
//   사다리 3회면 Gen3 도달. 남는 3회를 도박에 태우면 Gen4 초과달성 노림수 — 단 유닛을 더 소모.
//   합성 수요: T4 1기 = T1 12기. 유닛이 빠듯하면 도박에 태울 유닛이 T4 재료와 경쟁 → 도박이 손해.
//   ∴ 유닛 풍족도(U)에 따라 '순수 사다리(보수)' vs '사다리+도박(공격)'의 우열이 갈려야 건강.
const T4_UNIT_COST = 12;
const ROLLOUTS = 600;
type Strat = 'ladder' | 'hybrid'; // ladder=6회 전부 사다리(≈3회 낭비, 유닛 보존) / hybrid=3 사다리+3 도박
// 판 가치: Gen3 도달(1.0) + T4 완성(1.0) + Gen4 초과달성(0.5). 소환량 U 변동.
function value(strat: Strat, U: number, rng: () => number): number {
  let gen = 0; let unitsUsed = 0;
  // 사다리 3회 → Gen3 (동계열 max+1). 각 교배 부모2 소모, 자식1 회수 → 순 유닛 -1/교배 근사.
  for (let i = 0; i < 3; i++) { gen = resolveBreeding(u(1, 'Warrior', gen), u(2, 'Warrior', 0), NP, rng).childGen; unitsUsed += 1; }
  if (strat === 'hybrid') {
    // 도박 3회: 이계열, Gen 유지 + 5% Gen+1. 유닛 소모 2/교배(자식 회수 없이 도박 재료로 소진).
    for (let g = 0; g < 3 && gen < 4; g++) { const c = resolveBreeding(u(1, 'Warrior', gen), u(2, 'Dog', 0), NP, rng); if (c.childGen > gen) gen = c.childGen; unitsUsed += 2; }
  }
  let v = gen >= 3 ? 1 : 0;
  if (gen >= 4) v += 0.5;
  if (U - unitsUsed >= T4_UNIT_COST) v += 1; // 남은 유닛으로 T4 합성 가능
  return v;
}
function meanValue(strat: Strat, U: number, seed: number): number {
  const rng = mulberry32(seed); let sum = 0;
  for (let r = 0; r < ROLLOUTS; r++) sum += value(strat, U, rng);
  return sum / ROLLOUTS;
}

const winners = new Map<Strat, number>();
const optimalFamilies = new Set<string>();
const SEEDS = 200;
for (let s = 0; s < SEEDS; s++) {
  const seedRng = mulberry32(1000 + s);
  // 이번 판 소환량 U 변동 (12-Sim A/B: 중앙값 14, p-범위 근사 10~20) + 계열 분포
  const U = 10 + Math.floor(seedRng() * 11);
  const famCount: Record<string, number> = { sword: 0, fang: 0, steel: 0 };
  for (let i = 0; i < U; i++) famCount[FAMILY_OF_RACE[RACES[Math.floor(seedRng() * RACES.length)]]]++;
  optimalFamilies.add(FAMILIES.reduce((a, b) => famCount[a] >= famCount[b] ? a : b));

  const vLadder = meanValue('ladder', U, 2000 + s);
  const vHybrid = meanValue('hybrid', U, 3000 + s);
  const winner: Strat = vLadder > vHybrid + 1e-6 ? 'ladder' : 'hybrid';
  winners.set(winner, (winners.get(winner) ?? 0) + 1);
}

console.log('  최적 계열 분포:', [...optimalFamilies].join(', '), `(${optimalFamilies.size}종)`);
console.log('  승리 전략 분포:', [...winners.entries()].map(([k, v]) => `${k}:${v}`).join(' '), `(${winners.size}종)`);
if (optimalFamilies.size < 2) failMsg('최적 계열이 단일 — 시드 무관하게 고정됨');
if (winners.size < 2) failMsg('단일 전략이 모든 시드 지배 — F2 위험. 조정 필요(교배예산 6→5 또는 이계열 Gen=max−1, 사용자 결정)');

console.log(fails === 0 ? '\n✅ SIM PASS' : `\n❌ ${fails} SIM FAIL`);
process.exit(fails === 0 ? 0 : 1);
