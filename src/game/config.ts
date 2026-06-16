import { EnemyType } from './types';

export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;

// Mobile safe zones (notch / home bar clearance)
export const MOBILE_SAFE_ZONE_TOP = 24;
export const MOBILE_SAFE_ZONE_BOTTOM = 16;

export const MAX_ENEMIES = 40;
export const CLEAR_TIME_MS = 10 * 60 * 1000; // 10:00

export const ENEMY_BASE_SPEED = 30; // px/sec (overclock base)
export const ENEMY_BASE_HP = 1;     // overclock multiplier base

// Overclock scaling (applied per second after CLEAR_TIME_MS)
export const OVERCLOCK_HP_GROWTH = 1.08;
export const OVERCLOCK_SPEED_GROWTH = 1.05;
export const OVERCLOCK_SPAWN_DECAY = 0.97;
export const OVERCLOCK_MIN_SPAWN_MS = 200;

// Per-minute permanent buff (from minute 1 onward)
export const MINUTE_HP_MULT = 1.25;   // +25% HP per minute
export const MINUTE_SPEED_MULT = 1.2; // +20% speed per minute

// --- Economy ---
export const STARTING_GOLD = 100;
export const GOLD_AUTO_RECOVERY_PER_SEC = 1;
export const KILL_REWARD = 5;
export const UNIT_CAP = 5;
export const SUMMON_BASE_COST = 10;
export const SUMMON_COST_INCREMENT = 2;
export const SUMMON_MAX_COST = 30;
export const STARTING_GEMS = 3;

// --- Track corners (base positions; per-game randomization happens in GameState) ---
// Y safe range: 86~530 (avoids top HUD 0~76 and bottom bar 564~640)
export const TRACK_BASE_TL = { x: 30,  y: 90 };
export const TRACK_BASE_TR = { x: 330, y: 90 };
export const TRACK_BASE_BR = { x: 330, y: 520 };
export const TRACK_BASE_BL = { x: 30,  y: 520 };
// Inward padding from each track edge to compute the valid unit placement zone
export const TRACK_UNIT_ZONE_PADDING = 30;

// --- Unit combat (legacy, superseded by RACE_STATS/HYBRID_STATS) ---
export const BREEDING_DURATION_MS = 5000;
export const BREEDING_EXHAUST_DURATION_MS = 5000;

// Tier-1 unit combat stats (6종)
export const TIER1_STATS = {
  Warrior:  { range: 50,  damage: 2, attackIntervalMs: 1000 },
  Archer:   { range: 150, damage: 1, attackIntervalMs: 1200 },
  Dog:      { range: 80,  damage: 1, attackIntervalMs: 600  },
  Squirrel: { range: 130, damage: 1, attackIntervalMs: 1000 },
  Android:  { range: 60,  damage: 3, attackIntervalMs: 1500 },
  Cannon:   { range: 180, damage: 2, attackIntervalMs: 2000 },
} as const;

// Tier-2 hybrid combat stats (12종, gimmicks added in Phase B-D)
// maxTargets: Missile_Gunner=3 (멀티샷), others=1
export const HYBRID_STATS = {
  Bio_Wolf:         { range: 90,  damage: 3, attackIntervalMs: 700,  maxTargets: 1 },
  Acorn_Girl:       { range: 110, damage: 2, attackIntervalMs: 900,  maxTargets: 1 },
  Falcon_Eye:       { range: 160, damage: 2, attackIntervalMs: 1100, maxTargets: 1 },
  Acorn_Hunter:     { range: 140, damage: 2, attackIntervalMs: 700,  maxTargets: 1 },
  Cyborg_Slasher:   { range: 70,  damage: 5, attackIntervalMs: 1000, maxTargets: 1 },
  Cannon_Shooter:   { range: 80,  damage: 4, attackIntervalMs: 1200, maxTargets: 1 },
  Laser_Sniper:     { range: 200, damage: 3, attackIntervalMs: 1300, maxTargets: 1 },
  Missile_Gunner:   { range: 170, damage: 2, attackIntervalMs: 1000, maxTargets: 3 },
  Blade_Hound:      { range: 90,  damage: 3, attackIntervalMs: 800,  maxTargets: 1 },
  Gatling_Dog:      { range: 100, damage: 2, attackIntervalMs: 600,  maxTargets: 1 },
  Electric_Coon:    { range: 150, damage: 2, attackIntervalMs: 1100, maxTargets: 1 },
  Menhera_Squirrel: { range: 180, damage: 1, attackIntervalMs: 2000, maxTargets: 1 },
} as const;

// Enemy types
export const ENEMY_TYPES = {
  NORMAL: { hp: 5,  speed: 40 },
  FAST:   { hp: 2,  speed: 75 },
  TANK:   { hp: 20, speed: 25 },
} as const;

export const TANK_KILL_REWARD = 12;

// Boss
export const BOSS_KILL_REWARD = 50;

// Population upgrade
export const POPULATION_UPGRADE_BASE_COST = 50;
export const POPULATION_UPGRADE_COST_INCREASE = 10;

// Unit sell reward
export const SELL_GOLD_TIER1 = 10;
export const SELL_GOLD_TIER2 = 30;
export const SELL_GOLD_TIER3 = 60;
export const SELL_GOLD_TIER4 = 150;

// Tier-3 combat stats (range, damage, attackIntervalMs, maxTargets)
export const TIER3_STATS = {
  Cyborg_Wizard:    { range: 180, damage: 6,  attackIntervalMs: 1000, maxTargets: 3 },
  Dino_Mecha:       { range: 150, damage: 30, attackIntervalMs: 1500, maxTargets: 1 },
  Griffin:          { range: 220, damage: 2,  attackIntervalMs: 200,  maxTargets: 1 },
  Thunder_Hawk:     { range: 220, damage: 5,  attackIntervalMs: 1100, maxTargets: 1 },
  Berserk_Shaman:   { range: 100, damage: 5,  attackIntervalMs: 700,  maxTargets: 1 },
  Chaos_Artillery:  { range: 190, damage: 3,  attackIntervalMs: 1500, maxTargets: 5 },
} as const;

// Tier-4 combat stats
export const TIER4_STATS = {
  Astral_God: { range: 260, damage: 10, attackIntervalMs: 300, maxTargets: 8 },
} as const;

// Probabilistic upgrades (boss rewards)
// R(2026-06-12): 크리 지배 전략 완화 — 크리 증분 하향, 쌍둥이/더블어택 상향
export const TWIN_INIT_PROB = 0.10;
export const TWIN_PROB_INC = 0.05;
export const DOUBLE_ATK_INIT_PROB = 0.10;
export const DOUBLE_ATK_PROB_INC = 0.05;
export const CRIT_INIT_PROB = 0.20;
export const CRIT_PROB_INC = 0.07;

// 30-second spawn acceleration
export const SPAWN_ACCEL_INTERVAL_MS = 30000;
export const SPAWN_ACCEL_DECAY = 0.85; // -15% per 30s

// Boss reward economy
export const REWARD_GOLD_AMOUNT = 150;

// Victory condition
export const VICTORY_TIME_MS = 7 * 60 * 1000; // 7:00

// Critical hit
export const CRIT_DAMAGE_MULT = 1.5;

// Meta-progression shop
/** 스테이지 해금 보석 비용 (소비형) */
export const STAGE_UNLOCK_GEM_COST: Record<number, number> = { 1: 0, 2: 0, 3: 3 };

export const META_UPGRADES = {
  startingGold: { maxLevel: 3, costs: [1, 1, 1], effectPer: 20, label: '시작 골드', emoji: '💰', desc: '+20G/Lv' },
  summonCost:   { maxLevel: 2, costs: [1, 1],    effectPer: 1,  label: '소환 비용', emoji: '🔽', desc: '-1비용/Lv' },
  unitCap:      { maxLevel: 2, costs: [1, 1],    effectPer: 1,  label: '유닛 한도', emoji: '🏠', desc: '+1칸/Lv' },
  autoGold:     { maxLevel: 2, costs: [1, 1],    effectPer: 1,  label: '자동 골드', emoji: '⚡', desc: '+1/초/Lv' },
  gameSpeed2x:  { maxLevel: 1, costs: [3],       effectPer: 1,  label: '게임 2배속', emoji: '⏩', desc: '인게임 1×/2× 토글 해금' },
  jackpotSummon: { maxLevel: 1, costs: [2],      effectPer: 1,  label: '잭팟 소환', emoji: '🎰', desc: '소환 4% 확률 2티어 직접 등장' },
};

// G2: 잭팟 소환 — 메타 해금 후 summon() 시 2티어 직접 등장 확률 (5% 초과 금지 — 교배 우회 방지)
export const JACKPOT_TIER2_PROB = 0.04;

// G3: 유닛 도감 마일스톤 — 첫 제작 종 수 달성 시 보석 지급 (합계 6, 묶음 한정 — 인플레 방지)
export const DISCOVERY_TOTAL = 25; // T1 6 + T2 12 + T3 6 + T4 1
export const DISCOVERY_MILESTONES = [
  { count: 10, gems: 1 },
  { count: 18, gems: 2 },
  { count: 25, gems: 3 },
] as const;

export type UpgradeKey = keyof typeof META_UPGRADES;

// Phase D gimmick constants
export const ACORN_GIRL_AURA_RADIUS = 120;   // px — allies within this range get +20% attack speed
export const BLADE_HOUND_MAX_STACKS = 5;     // max berserk stacks (+20% speed each)
export const MINE_TRIGGER_RADIUS = 25;       // px — enemy must be within this to detonate
export const MINE_DAMAGE = 3;               // flat damage per mine (no scaling)
export const MINE_LIFETIME_MS = 10000;       // mine expires after 10s
export const CANNON_SHOOTER_KB_DIST = 60;   // px knockback distance
export const GATLING_DOG_SPLASH_RADIUS = 40; // px splash radius
export const GATLING_DOG_SPLASH_MULT = 0.5; // 50% damage on splash
export const ELECTRIC_COON_CHAIN_RANGE = 100; // px chain range
export const ELECTRIC_COON_MAX_CHAINS = 2;   // max chain targets
export const ELECTRIC_COON_CHAIN_MULT = 0.5; // 50% damage per chain hop

// Phase E gimmick constants
export const THUNDER_HAWK_CHAIN_COUNT = 3;
export const THUNDER_HAWK_CHAIN_MULT = 0.8;
export const THUNDER_HAWK_CHAIN_RANGE = 120;
export const BERSERK_SHAMAN_AURA_RADIUS = 200; // px — wider than Acorn_Girl, includes self
export const BERSERK_SHAMAN_AURA_BUFF = 0.4;   // +40% attack speed
export const ASTRAL_GOD_CHAIN_COUNT = 4;
export const ASTRAL_GOD_CHAIN_MULT = 0.9;
export const ASTRAL_GOD_CHAIN_RANGE = 160;

// U13: Boss 3-phase system
export const BOSS_PHASE_B_START_MS = 150_000; // 2:30
export const BOSS_PHASE_C_START_MS = 270_000; // 4:30
export const BOSS_HP_PHASE_B_SCALAR = 25 / 15;
export const BOSS_HP_PHASE_C_SCALAR = 50 / 15;
export const BOSS_SPEED_PHASE_A = 0.8;
export const BOSS_SPEED_PHASE_B = 0.7;
export const BOSS_SPEED_PHASE_C = 0.55;
export const BOSS_KILL_REWARD_PHASE_A = 50;
export const BOSS_KILL_REWARD_PHASE_B = 80;
export const BOSS_KILL_REWARD_PHASE_C = 150;

// U14: Tier enhancement system
export const BOSS_KILL_ENHANCE_POINT = 1;
export const TIER1_ENHANCE_MAX = 5;
export const TIER1_ENHANCE_COST = 1;
export const TIER2_ENHANCE_MAX = 3;
export const TIER2_ENHANCE_COST = 2;

// Soul Shop: soul-summon cost starts at 1pt and increments by 1 per purchase
export const SOUL_SUMMON_COST_START = 1;

// Stage system
export type StageId = 1 | 2 | 3;
export interface StageConfig {
  name: string;
  fastRatio: number;         // probability of spawning FAST over NORMAL
  tankStartMs: number;       // when TANKs start appearing
  bossHpMult: number;        // boss HP multiplier
  spawnIntervalBase: number; // base enemy spawn interval (ms)
  bossTimeLimitMs: number;   // fast-kill bonus time limit per stage
}
export const STAGE_CONFIGS: Record<StageId, StageConfig> = {
  1: { name: '🌿 스테이지 1', fastRatio: 0.5,  tankStartMs: 3 * 60 * 1000, bossHpMult: 15, spawnIntervalBase: 5500, bossTimeLimitMs: 10000 },
  2: { name: '🏜️ 스테이지 2', fastRatio: 0.65, tankStartMs: 2 * 60 * 1000, bossHpMult: 18, spawnIntervalBase: 4400, bossTimeLimitMs: 13000 },
  3: { name: '🌋 스테이지 3', fastRatio: 0.55, tankStartMs: 60 * 1000,      bossHpMult: 22, spawnIntervalBase: 3500, bossTimeLimitMs: 16000 },
};

// Elite enemy
export const ELITE_SPAWN_INTERVAL_MS = 45000; // fixed 45s timer (independent of spawn accel)
export const ELITE_SPAWN_START_MS    = 90 * 1000; // unlocks at 1:30
export const ELITE_HP_BOSS_RATIO     = 0.3;   // HP = 30% of Phase A boss HP
export const ELITE_BASE_SPEED        = 30;    // px/s (between NORMAL 40 and TANK 25)
export const ELITE_KILL_REWARD       = 20;

// --- World/Stage system ---
// DEV: 전 월드 즉시 선택 가능. 출시 전 false로 전환.
export const DEV_UNLOCK_ALL_WORLDS = true;

// 5분 경과 시 1회 적용되는 HP·Speed 급강화 (월드 2·3 전용)
export const FIVE_MIN_SURGE_MULT = 1.5;

export interface StageFeatures {
  breed: boolean;      // 교배 버튼
  synthesize: boolean; // 합성 (드래그 오버랩)
  sell: boolean;       // 판매존
  lock: boolean;       // 더블탭 잠금
  soulShop: boolean;   // 영혼상점
  recipe: boolean;     // 레시피북
}

export const ALL_FEATURES: StageFeatures = {
  breed: true, synthesize: true, sell: true, lock: true, soulShop: true, recipe: true,
};

export interface ScriptedWave {
  atMs: number;        // 스폰 시각 (게임 경과 ms)
  type: EnemyType;
  count: number;
}

export interface WorldStageConfig extends StageConfig {
  victoryTimeMs: number;
  features: StageFeatures;
  fiveMinSurge: boolean;        // FIVE_MIN_SURGE_MULT 적용 여부
  maxBossPhase: 0 | 1 | 2 | 3; // 0=없음, 1=A, 2=A+B, 3=A+B+C
  tankRatio: number;            // tankStartMs 이후 TANK 스폰 확률
  eliteIntervalMs: number | null; // null = 엘리트 없음
  scriptedWaves?: ScriptedWave[]; // 정해진 시각에 일시 러시 스폰 (G4)
}

export type WorldId = 1 | 2 | 3;
export type WorldStageId = 1 | 2 | 3 | 4 | 5;

export const WORLD_CONFIGS: Record<WorldId, Record<WorldStageId, WorldStageConfig>> = {
  // ── 월드 1: 튜토리얼 ──────────────────────────────────────────────
  1: {
    1: {
      name: 'W1-1',
      victoryTimeMs: 2 * 60_000,
      features: { breed: false, synthesize: false, sell: false, lock: false, soulShop: false, recipe: false },
      fiveMinSurge: false, maxBossPhase: 0,
      fastRatio: 0.3,  tankStartMs: Number.MAX_SAFE_INTEGER, tankRatio: 0,
      bossHpMult: 15,  spawnIntervalBase: 6000, bossTimeLimitMs: 10000, eliteIntervalMs: null,
    },
    2: {
      name: 'W1-2',
      victoryTimeMs: 2 * 60_000,
      features: { breed: true, synthesize: false, sell: false, lock: false, soulShop: false, recipe: false },
      fiveMinSurge: false, maxBossPhase: 0,
      fastRatio: 0.3,  tankStartMs: Number.MAX_SAFE_INTEGER, tankRatio: 0,
      bossHpMult: 15,  spawnIntervalBase: 6000, bossTimeLimitMs: 10000, eliteIntervalMs: null,
    },
    3: {
      name: 'W1-3',
      victoryTimeMs: 3 * 60_000,
      features: { breed: true, synthesize: true, sell: true, lock: false, soulShop: false, recipe: false },
      fiveMinSurge: false, maxBossPhase: 0,
      fastRatio: 0.4,  tankStartMs: Number.MAX_SAFE_INTEGER, tankRatio: 0,
      bossHpMult: 15,  spawnIntervalBase: 5800, bossTimeLimitMs: 10000, eliteIntervalMs: null,
    },
    4: {
      name: 'W1-4',
      victoryTimeMs: 3 * 60_000,
      features: { breed: true, synthesize: true, sell: true, lock: true, soulShop: true, recipe: false },
      fiveMinSurge: false, maxBossPhase: 1,
      fastRatio: 0.4,  tankStartMs: 2 * 60_000, tankRatio: 0.15,
      bossHpMult: 15,  spawnIntervalBase: 5500, bossTimeLimitMs: 10000, eliteIntervalMs: null,
    },
    5: {
      name: 'W1-5',
      victoryTimeMs: 4 * 60_000,
      features: ALL_FEATURES,
      fiveMinSurge: false, maxBossPhase: 2,
      fastRatio: 0.45, tankStartMs: 2 * 60_000, tankRatio: 0.15,
      bossHpMult: 15,  spawnIntervalBase: 5500, bossTimeLimitMs: 10000, eliteIntervalMs: null,
    },
  },
  // ── 월드 2: 본게임 (현행 Stage 1·2 기반) ─────────────────────────
  2: {
    1: {
      name: 'W2-1',
      victoryTimeMs: 7 * 60_000,
      features: ALL_FEATURES,
      fiveMinSurge: true, maxBossPhase: 3,
      fastRatio: 0.5,  tankStartMs: 3 * 60_000, tankRatio: 0.15,
      bossHpMult: 15,  spawnIntervalBase: 5500, bossTimeLimitMs: 10000, eliteIntervalMs: null,
      scriptedWaves: [{ atMs: 3 * 60_000 + 30_000, type: 'FAST', count: 6 }],
    },
    2: {
      name: 'W2-2',
      victoryTimeMs: 7 * 60_000,
      features: ALL_FEATURES,
      fiveMinSurge: true, maxBossPhase: 3,
      fastRatio: 0.55, tankStartMs: 2.5 * 60_000, tankRatio: 0.2,
      bossHpMult: 16,  spawnIntervalBase: 5000, bossTimeLimitMs: 11000, eliteIntervalMs: null,
      scriptedWaves: [{ atMs: 3 * 60_000, type: 'FAST', count: 7 }],
    },
    3: {
      name: 'W2-3',
      victoryTimeMs: 7 * 60_000,
      features: ALL_FEATURES,
      fiveMinSurge: true, maxBossPhase: 3,
      fastRatio: 0.65, tankStartMs: 2 * 60_000, tankRatio: 0.2,
      bossHpMult: 18,  spawnIntervalBase: 4400, bossTimeLimitMs: 13000, eliteIntervalMs: null,
      scriptedWaves: [{ atMs: 2 * 60_000 + 30_000, type: 'TANK', count: 5 }],
    },
    4: {
      name: 'W2-4',
      victoryTimeMs: 7 * 60_000,
      features: ALL_FEATURES,
      fiveMinSurge: true, maxBossPhase: 3,
      fastRatio: 0.6,  tankStartMs: 1.5 * 60_000, tankRatio: 0.25,
      bossHpMult: 20,  spawnIntervalBase: 4200, bossTimeLimitMs: 14000, eliteIntervalMs: null,
      scriptedWaves: [{ atMs: 3 * 60_000, type: 'FAST', count: 8 }],
    },
    5: {
      name: 'W2-5',
      victoryTimeMs: 7 * 60_000,
      features: ALL_FEATURES,
      fiveMinSurge: true, maxBossPhase: 3,
      fastRatio: 0.55, tankStartMs: 60_000, tankRatio: 0.3,
      bossHpMult: 20,  spawnIntervalBase: 4000, bossTimeLimitMs: 15000, eliteIntervalMs: 45000,
      scriptedWaves: [{ atMs: 2 * 60_000 + 30_000, type: 'TANK', count: 6 }],
    },
  },
  // ── 월드 3: 하드 (현행 Stage 3 기반) ─────────────────────────────
  3: {
    1: {
      name: 'W3-1',
      victoryTimeMs: 7 * 60_000,
      features: ALL_FEATURES,
      fiveMinSurge: true, maxBossPhase: 3,
      fastRatio: 0.55, tankStartMs: 60_000, tankRatio: 0.25,
      bossHpMult: 22,  spawnIntervalBase: 3500, bossTimeLimitMs: 16000, eliteIntervalMs: 45000,
      scriptedWaves: [{ atMs: 2 * 60_000, type: 'FAST', count: 8 }],
    },
    2: {
      name: 'W3-2',
      victoryTimeMs: 7 * 60_000,
      features: ALL_FEATURES,
      fiveMinSurge: true, maxBossPhase: 3,
      fastRatio: 0.55, tankStartMs: 60_000, tankRatio: 0.3,
      bossHpMult: 24,  spawnIntervalBase: 3300, bossTimeLimitMs: 16000, eliteIntervalMs: 45000,
      scriptedWaves: [{ atMs: 2 * 60_000, type: 'TANK', count: 6 }],
    },
    3: {
      name: 'W3-3',
      victoryTimeMs: 7 * 60_000,
      features: ALL_FEATURES,
      fiveMinSurge: true, maxBossPhase: 3,
      fastRatio: 0.5,  tankStartMs: 45_000, tankRatio: 0.4,
      bossHpMult: 26,  spawnIntervalBase: 3200, bossTimeLimitMs: 17000, eliteIntervalMs: 40000,
      scriptedWaves: [{ atMs: 90_000, type: 'FAST', count: 9 }],
    },
    4: {
      name: 'W3-4',
      victoryTimeMs: 7 * 60_000,
      features: ALL_FEATURES,
      fiveMinSurge: true, maxBossPhase: 3,
      fastRatio: 0.55, tankStartMs: 45_000, tankRatio: 0.35,
      bossHpMult: 28,  spawnIntervalBase: 3000, bossTimeLimitMs: 17000, eliteIntervalMs: 30000,
      scriptedWaves: [{ atMs: 90_000, type: 'TANK', count: 7 }],
    },
    5: {
      name: 'W3-5',
      victoryTimeMs: 7 * 60_000,
      features: ALL_FEATURES,
      fiveMinSurge: true, maxBossPhase: 3,
      fastRatio: 0.5,  tankStartMs: 30_000, tankRatio: 0.4,
      bossHpMult: 30,  spawnIntervalBase: 2800, bossTimeLimitMs: 18000, eliteIntervalMs: 30000,
      scriptedWaves: [{ atMs: 90_000, type: 'TANK', count: 8 }],
    },
  },
};
