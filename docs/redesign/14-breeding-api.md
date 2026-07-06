# `breeding.ts` API 사전 설계 (M3 구현 계약서)

> 2026-07-06 확정. M3 담당 모델은 이 시그니처를 **그대로 구현**한다 — 설계 판단은 이미 끝났고, 바꿔야 할 이유를 발견하면 구현 전에 사용자에게 보고할 것.
> 근거 문서: v3 R4·R4b·R5·R6 / `08-naming-system.md` / `12-balance-verification.md`(F2·F3) / `13-edge-case-matrix.md`.
> 원칙: **순수 TS·Phaser 의존 0·부작용 없는 판정 함수** — GameState가 호출하고 상태 반영은 GameState 몫. 모든 랜덤은 `rng: () => number` 주입 (시뮬 재현성).

## 1. 타입 확장 (`types.ts`)

```ts
// ── 신규 ──
export type FamilyKey = 'sword' | 'fang' | 'steel';           // 08 문서
export type Gen = 0 | 1 | 2 | 3 | 4;
export type MutationGrade = 'common' | 'rare' | 'legend';
export type TraitId = HybridRace;                              // R5: T2 기믹 12종 = 특성. 별도 enum 만들지 말 것

export interface Lineage {
  id: number;                 // 판 내 일련번호
  name: string;               // "은빛칼날" (naming.ts 생성)
  family: FamilyKey;          // 창설 시점 계열
  epithet?: string;           // 최고 등급 변이 칭호 (rare/legend 시)
}

export interface PedigreeNode {                                // 13-E2: 이벤트 로그, 불변
  parentIds: [number, number];
  childId: number;
  childRace: UnitRace;
  childGen: Gen;
  mutation?: MutationGrade;
  cross: boolean;             // 이계열 여부
}

// ── UnitData 확장 (전부 옵셔널 — 구세이브 E9 호환) ──
export interface UnitData {
  /* 기존 필드 유지, 단: isExhausted/exhaustEndMs 제거 (13-E18 폐기, 스키마 v2) */
  gen?: Gen;                  // 부재 = 0
  lineageId?: number;
  trait?: TraitId;            // R5: 1슬롯 (전설 변이만 2슬롯 → trait2)
  trait2?: TraitId;
  epithet?: string;
  strikeCounter?: number;     // 혈통 일격 누적 (R4 형태 표기의 뒷면)
}
```

## 2. `src/game/breeding.ts` — 공개 API 7개

```ts
// ① 교배 가능 판정 — DragController·둥지 하이라이트가 공용 사용
export function canBreed(a: UnitData, b: UnitData, breedsUsed: number): BreedDenial | null;
export type BreedDenial = 'tier' | 'locked' | 'budget' | 'breeding' | 'same-unit';
// 규칙: T1만(tier 1 && 1) / 잠금 불가(13-E1) / breedsUsed >= BREED_BUDGET / 이미 알 진행 중 / a===b.
// null = 가능. 거부 사유를 반환하는 이유: 렌더가 사유별 피드백(흔들림/토스트)을 분기.

// ② 교배 결과 판정 (핵심 — 부작용 없음, GameState가 결과를 적용)
export function resolveBreeding(
  a: UnitData, b: UnitData,
  pity: PityState,                 // 아래 ④
  rng: () => number,
): BreedOutcome;

export interface BreedOutcome {
  childRace: Tier1Race;            // 부모 중 무작위 (R4 — 종 풀은 부모 2종만)
  childGen: Gen;                   // 동계열 max+1 / 이계열 max 유지, 희귀 +1, 상한 4 clamp
  cross: boolean;
  mutation?: MutationGrade;        // MUTATION_TABLE 롤 (F3: pity 반영 후)
  inheritedTrait?: TraitId;        // R5: a 50% / b 40% / 제3 무작위 20% — 부모 무특성이면 undefined
  pityAfter: PityState;            // 갱신된 카운터 (호출측이 저장)
}

// ③ 혈통 승계/창설 판정 — 부화 시 GameState가 호출
export function resolveLineage(
  a: UnitData, b: UnitData, outcome: BreedOutcome,
  lineages: Map<number, Lineage>,
  usedNames: Set<string>,
  nextLineageId: number,
  rng: () => number,
): { lineage: Lineage; isNew: boolean };
// 규칙: 부모 중 최대 Gen 쪽 lineageId 승계(13-E5 우선순위) / 둘 다 무혈통이면 창설(naming.ts 호출).
// 창설 계열 = outcome.childRace의 FAMILY_OF_RACE. epithet은 rare/legend 시 EPITHET_* 롤.

// ④ 피티 상태 — MetaProgress 영속 (12-F3 확정)
export interface PityState { rareMiss: number; legendMiss: number; }
// rareMiss ≥ RARE_PITY(8) → 이번 롤 희귀 확률 10%로 상승, 희귀 이상 획득 시 rareMiss=0.
// legendMiss ≥ LEGEND_PITY(60) → 전설 확정, 획득 시 legendMiss=0. 둘 다 교배 1회당 +1.

// ⑤ 융합(합성) 승계 — 기존 synthesize()가 결과 유닛 생성 직후 호출
export function inheritOnSynthesis(materials: UnitData[]): {
  gen: Gen;                        // max(재료 gen) — R4 "질서 축은 보존만"
  lineageId?: number;              // 13-E5: ①최대 Gen ②동률이면 혈통 보유 ③전부 무혈통이면 undefined
  trait?: TraitId;                 // R5: 60% 계승 (최대 Gen 재료의 특성) — rng 필요 시 인자 추가
  epithet?: string;
};

// ⑥ 혈통 일격 판정 — combat.ts가 공격 성공마다 호출 (13-E17: 원 공격 결과 복제)
export function bloodlineStrike(unit: UnitData): boolean;
// gen<2 → false. 주기 = STRIKE_PERIOD[gen] (Gen2:4 / Gen3:3 / Gen4:2).
// unit.strikeCounter를 직접 증가시키지 않음 — 순수 판정. 카운터 증가는 combat.ts 몫 (더블어택 = 2회 호출, E17).
// BLOODLINE_STRIKE_ENABLED=false면 항상 false (M3 플래그 off, M4 on).

// ⑦ 정점 유닛 판정 — 렌더(문장 오버레이)가 매 갱신 호출 (13-E22)
export function findApexUnit(units: UnitData[]): UnitData | null;
// 최대 Gen → 동률이면 lineageId 보유 → 그중 id 최소. 전부 Gen0 무혈통이면 null.
```

## 3. `config.ts` 신규 상수 (12번 검증 반영값)

```ts
export const BREED_BUDGET = 6;
export const EGG_HATCH_MS = 3000;
export const MUTATION_TABLE = {                       // [common, rare, legend] %
  same:  { common: 12, rare: 2.5, legend: 0.5 },
  cross: { common: 24, rare: 5,   legend: 1   },
} as const;
export const RARE_PITY = 8;                           // 영속 (12-F3)
export const LEGEND_PITY = 60;
export const RARE_PITY_BOOST = 10;                    // 발동 시 희귀 %
export const STRIKE_PERIOD: Record<2 | 3 | 4, number> = { 2: 4, 3: 3, 4: 2 };
export const BLOODLINE_STRIKE_ENABLED = false;        // M4에서 true
export const TRAIT_INHERIT = { fromA: 50, fromB: 40, third: 20, synthesis: 60 } as const;
export const GEN_MAX = 4;
export const SAVE_SCHEMA_VERSION = 2;                 // v2 = gen/lineage/특성 + exhaust 제거
// BOSS_HP_MULT_PHASE_C: 50 → 65 는 M5 밸런스 패스에서 (12-F1)
```

## 4. GameState 통합 지점 (수정 계약)

| 기존 | 변경 |
|---|---|
| `startBreeding(idA, idB)` | 유지하되 내부에서 `canBreed` 사용, `breedsUsedThisGame` 증가, 부모에 `isBreeding` 표시 (M1b 임시 배선을 정식 교체) |
| `completeBreeding` | **부모 2 제거** + `resolveBreeding`→`resolveLineage` 결과로 자식 1 생성, `pendingHatch` 큐에 연출 정보(등급·이름) 적재. 탈진 코드 삭제(E18) |
| `synthesize` | 결과 유닛 생성 후 `inheritOnSynthesis` 적용 1줄 추가 |
| `processCombat` | 공격 확정 루프에서 `bloodlineStrike` 판정 → 추가 AttackEvent(`isStrike: true` 필드 추가) |
| 신규 상태 | `breedsUsedThisGame: number`, `lineages: Map<number, Lineage>`, `pedigree: PedigreeNode[]`, `pendingHatch: {...} \| null` |

## 5. 테스트 계약 (M3 완료 판정과 1:1)

| 테스트 | 대상 |
|---|---|
| `canBreed` 거부 사유 5종 전수 | ① |
| Gen 전파(동/이계열·clamp 4)·종 풀 | ② |
| 변이 분포 10만회 ±3σ (피티 비활성) | ② + MUTATION_TABLE |
| 피티 발동·리셋·영속 왕복 | ④ |
| 승계 우선순위 (E5 3케이스 + E22 동률) | ③⑤⑦ |
| 특성 상속 분포 (50/40/20, 합성 60) | ②⑤ |
| 일격 주기·플래그 off·더블어택 2카운트 | ⑥ |
| 지배 시퀀스 유일성 (합성 수요 포함 — 12-F2) | 시나리오 시뮬 |
| 스키마 v1→v2 마이그레이션 (exhaust 제거 포함) | E9 픽스처 |

> 시뮬 테스트는 `scripts/sim-bloodline.ts` (기존 `sim-freeze.ts` 관례) — vitest 아닌 단독 tsx 실행이어도 무방, `npm run build` + 실행 성공이 판정.
