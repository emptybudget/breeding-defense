export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;

export const MAX_ENEMIES = 50;
export const CLEAR_TIME_MS = 10 * 60 * 1000; // 10:00
export const ENEMY_SPAWN_INTERVAL_MS = 2500;  // was 5000

export const ENEMY_BASE_SPEED = 40; // px/sec (overclock base)
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
export const GOLD_AUTO_RECOVERY_PER_SEC = 2;
export const KILL_REWARD = 5;
export const UNIT_CAP = 5;
export const SUMMON_BASE_COST = 10;
export const SUMMON_COST_INCREMENT = 2;
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
export const BREEDING_DURATION_MS = 3000;
export const BREEDING_EXHAUST_DURATION_MS = 3000;

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
export const HYBRID_STATS = {
  Bio_Wolf:         { range: 90,  damage: 3, attackIntervalMs: 700  },
  Acorn_Girl:       { range: 110, damage: 2, attackIntervalMs: 900  },
  Falcon_Eye:       { range: 160, damage: 2, attackIntervalMs: 1100 },
  Acorn_Hunter:     { range: 140, damage: 2, attackIntervalMs: 700  },
  Cyborg_Slasher:   { range: 70,  damage: 5, attackIntervalMs: 1000 },
  Cannon_Shooter:   { range: 80,  damage: 4, attackIntervalMs: 1200 },
  Laser_Sniper:     { range: 200, damage: 3, attackIntervalMs: 1300 },
  Missile_Gunner:   { range: 170, damage: 2, attackIntervalMs: 1000 },
  Blade_Hound:      { range: 90,  damage: 3, attackIntervalMs: 800  },
  Gatling_Dog:      { range: 100, damage: 2, attackIntervalMs: 600  },
  Electric_Coon:    { range: 150, damage: 2, attackIntervalMs: 1100 },
  Menhera_Squirrel: { range: 180, damage: 1, attackIntervalMs: 2000 },
} as const;

// Enemy types
export const ENEMY_TYPES = {
  NORMAL: { hp: 5, speed: 40 },
  FAST:   { hp: 2, speed: 75 },
} as const;

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

// Tier-3 combat stats (range, damage, attackIntervalMs, maxTargets)
export const TIER3_STATS = {
  Cyborg_Wizard: { range: 180, damage: 6,  attackIntervalMs: 1000, maxTargets: 3 },
  Dino_Mecha:    { range: 150, damage: 30, attackIntervalMs: 1500, maxTargets: 1 },
  Griffin:       { range: 220, damage: 2,  attackIntervalMs: 200,  maxTargets: 1 },
} as const;

// Probabilistic upgrades (boss rewards)
export const TWIN_INIT_PROB = 0.10;
export const TWIN_PROB_INC = 0.02;
export const DOUBLE_ATK_INIT_PROB = 0.10;
export const DOUBLE_ATK_PROB_INC = 0.02;

// 30-second spawn acceleration
export const SPAWN_ACCEL_INTERVAL_MS = 30000;
export const SPAWN_ACCEL_DECAY = 0.85; // -15% per 30s

// Boss reward economy
export const REWARD_GOLD_AMOUNT = 150;

// Victory condition
export const VICTORY_TIME_MS = 2 * 60 * 1000; // 2:00

// Critical hit
export const CRIT_DAMAGE_MULT = 1.5;
