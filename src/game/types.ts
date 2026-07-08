export type Race = 'Human' | 'Beast' | 'Robot'; // Category type (internal logic only)
export type Tier1Race = 'Warrior' | 'Archer' | 'Dog' | 'Squirrel' | 'Android' | 'Cannon';
export type HybridRace =
  'Bio_Wolf' | 'Acorn_Girl' | 'Falcon_Eye' | 'Acorn_Hunter' |
  'Cyborg_Slasher' | 'Cannon_Shooter' | 'Laser_Sniper' | 'Missile_Gunner' |
  'Blade_Hound' | 'Gatling_Dog' | 'Electric_Coon' | 'Menhera_Squirrel';
export type Tier3Race =
  'Cyborg_Wizard' | 'Dino_Mecha' | 'Griffin' |
  'Thunder_Hawk' | 'Berserk_Shaman' | 'Chaos_Artillery';
export type Tier4Race = 'Astral_God';
export type UnitRace = Tier1Race | HybridRace | Tier3Race | Tier4Race;

export type EnemyType = 'NORMAL' | 'FAST' | 'TANK';

// M2: FTUE(신규 유저 튜토리얼) 스텝 ID — docs/redesign/16-ftue-script.md 전체 13개.
// M2는 F1~F4·F8~F11·F13만 트리거 구현, F5~F7(M4)·F12(M5)는 스키마만 선점.
export type FtueStepId = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9' | 'F10' | 'F11' | 'F12' | 'F13';

export type RewardType = 'enhance' | 'gold' | 'goldSmall' | 'damage' | 'maxUnits' | 'twinProb' | 'doubleAtk' | 'crit';

export interface Reward {
  type: RewardType;
  label: string;
}

// M3: 혈통 데이터층 (docs/redesign/14-breeding-api.md §1, 08-naming-system.md)
export type FamilyKey = 'sword' | 'fang' | 'steel';   // 검문/야수문/강철문
export type Gen = 0 | 1 | 2 | 3 | 4;
export type MutationGrade = 'common' | 'rare' | 'legend';
export type TraitId = HybridRace;                     // R5: T2 기믹 12종 = 특성 (별도 enum 금지)

export interface Lineage {
  id: number;                 // 판 내 일련번호
  name: string;               // "은빛칼날" (naming.ts 생성)
  family: FamilyKey;          // 창설 시점 계열
  epithet?: string;           // 최고 등급 변이 칭호 (rare/legend 시)
}

export interface PedigreeNode {                        // 13-E2: 이벤트 로그, 불변
  parentIds: [number, number];
  childId: number;
  childRace: UnitRace;
  childGen: Gen;
  mutation?: MutationGrade;
  cross: boolean;             // 이계열 여부
}

export interface UnitData {
  id: number;
  race: UnitRace;
  tier: 1 | 2 | 3 | 4;
  x: number;
  y: number;
  lastAttackedAtMs: number;
  isBreeding: boolean;
  breedingEndMs: number;
  isLocked: boolean;
  attackSpeedStacks?: number; // Blade_Hound berserk stacks
  // M3: 혈통 필드 (전부 옵셔널 — 구세이브 E9 호환, 부재 = Gen0·무혈통)
  gen?: Gen;
  lineageId?: number;
  bloodlineName?: string;     // 생성 문자열 그대로 저장 (08 §4 — 시드 재생성 금지)
  trait?: TraitId;            // R5: 1슬롯 (전설 변이만 2슬롯 → trait2)
  trait2?: TraitId;
  epithet?: string;           // 변이 칭호 (개체 필드)
  strikeCounter?: number;     // 혈통 일격 누적 (combat.ts가 증가)
}

export interface Mine {
  id: number;
  x: number;
  y: number;
  damage: number;
  placedAtMs: number;
}

export interface EnemySnapshot {
  id: number;
  x: number;
  y: number;
  hp: number;
  progressScore: number;
  killReward: number;
}

export interface AttackEvent {
  unitX: number;
  unitY: number;
  enemyX: number;
  enemyY: number;
  isCrit: boolean;
  damage: number;
  srcRace?: UnitRace;
  srcId?: number;
  isStrike?: boolean; // M3: 혈통 일격 추가타 (E17 — 원 공격 결과 복제)
}

export interface CombatResult {
  attacks: AttackEvent[];
  killedIds: number[];
  hpUpdates: { id: number; hp: number }[];
  knockbacks: { id: number; dx: number; dy: number }[];
}
