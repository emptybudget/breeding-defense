export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;

export const MAX_ENEMIES = 50;
export const CLEAR_TIME_MS = 10 * 60 * 1000; // 10:00
export const ENEMY_SPAWN_INTERVAL_MS = 5000;

export const ENEMY_BASE_SPEED = 40; // px/sec
export const ENEMY_BASE_HP = 1;

// Overclock scaling (applied per second after CLEAR_TIME_MS)
export const OVERCLOCK_HP_GROWTH = 1.05;       // +5%/sec
export const OVERCLOCK_SPEED_GROWTH = 1.03;    // +3%/sec
export const OVERCLOCK_SPAWN_DECAY = 0.97;     // -3%/sec
export const OVERCLOCK_MIN_SPAWN_MS = 200;

// --- Economy ---
export const STARTING_GOLD = 100;
export const KILL_REWARD = 5;
export const UNIT_CAP = 5;
export const SUMMON_BASE_COST = 10;
export const SUMMON_COST_INCREMENT = 2;

// --- Track (ㅁ자 path, clockwise from top-left) ---
export const TRACK_WAYPOINTS: { x: number; y: number }[] = [
  { x: 30, y: 86 },
  { x: 330, y: 86 },
  { x: 330, y: 620 },
  { x: 30, y: 620 },
];

// Inner zone for unit spawning (inside the track lane)
export const UNIT_ZONE = { x1: 68, y1: 124, x2: 292, y2: 582 };

// --- Unit combat ---
export const UNIT_ATTACK_INTERVAL_MS = 1000;
export const UNIT_ATTACK_RANGE = 120;
export const UNIT_BASE_DAMAGE = 1;
