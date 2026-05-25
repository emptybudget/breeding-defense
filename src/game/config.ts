export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;

export const MAX_ENEMIES = 50;
export const CLEAR_TIME_MS = 10 * 60 * 1000; // 10:00
export const ENEMY_SPAWN_INTERVAL_MS = 6500;

export const ENEMY_BASE_SPEED = 30; // px/sec (overclock base)
export const ENEMY_BASE_HP = 1;     // overclock multiplier base

// Overclock scaling (applied per second after CLEAR_TIME_MS)
export const OVERCLOCK_HP_GROWTH = 1.05;
export const OVERCLOCK_SPEED_GROWTH = 1.03;
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
export const TANK_SPAWN_START_MS = 3 * 60 * 1000; // 3분 이후 등장
export const TANK_SPAWN_PROBABILITY = 0.15;        // 전체 스폰의 15%

// Boss
export const BOSS_HP_MULT = 15;
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
export const TWIN_INIT_PROB = 0.10;
export const TWIN_PROB_INC = 0.02;
export const DOUBLE_ATK_INIT_PROB = 0.10;
export const DOUBLE_ATK_PROB_INC = 0.02;
export const CRIT_INIT_PROB = 0.20;
export const CRIT_PROB_INC = 0.10;

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
export const META_STARS_PER_VICTORY = 3;

export const META_UPGRADES = {
  startingGold: { maxLevel: 3, costs: [5, 8, 12], effectPer: 20, label: '시작 골드', emoji: '💰', desc: '+20G/Lv' },
  summonCost:   { maxLevel: 2, costs: [6, 10],    effectPer: 1,  label: '소환 비용', emoji: '🔽', desc: '-1비용/Lv' },
  unitCap:      { maxLevel: 2, costs: [8, 15],    effectPer: 1,  label: '유닛 한도', emoji: '🏠', desc: '+1칸/Lv' },
  autoGold:     { maxLevel: 2, costs: [7, 12],    effectPer: 1,  label: '자동 골드', emoji: '⚡', desc: '+1/초/Lv' },
};

export type UpgradeKey = keyof typeof META_UPGRADES;

// Phase D gimmick constants
export const ACORN_GIRL_AURA_RADIUS = 120;   // px — allies within this range get +20% attack speed
export const BLADE_HOUND_MAX_STACKS = 5;     // max berserk stacks (+20% speed each)
export const MINE_TRIGGER_RADIUS = 25;       // px — enemy must be within this to detonate
export const MINE_DAMAGE = 3;               // flat damage per mine (no scaling)
export const MINE_LIFETIME_MS = 10000;       // mine expires after 10s

// Phase E gimmick constants
export const THUNDER_HAWK_CHAIN_COUNT = 3;
export const THUNDER_HAWK_CHAIN_MULT = 0.8;
export const THUNDER_HAWK_CHAIN_RANGE = 120;
export const BERSERK_SHAMAN_AURA_RADIUS = 200; // px — wider than Acorn_Girl, includes self
export const BERSERK_SHAMAN_AURA_BUFF = 0.4;   // +40% attack speed
export const ASTRAL_GOD_CHAIN_COUNT = 4;
export const ASTRAL_GOD_CHAIN_MULT = 0.9;
export const ASTRAL_GOD_CHAIN_RANGE = 160;

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
  1: { name: '🌿 스테이지 1', fastRatio: 0.5,  tankStartMs: 3 * 60 * 1000, bossHpMult: 15, spawnIntervalBase: 6500, bossTimeLimitMs: 10000 },
  2: { name: '🏜️ 스테이지 2', fastRatio: 0.65, tankStartMs: 2 * 60 * 1000, bossHpMult: 18, spawnIntervalBase: 5200, bossTimeLimitMs: 13000 },
  3: { name: '🌋 스테이지 3', fastRatio: 0.55, tankStartMs: 60 * 1000,      bossHpMult: 22, spawnIntervalBase: 4000, bossTimeLimitMs: 16000 },
};
