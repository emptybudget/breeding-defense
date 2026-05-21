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
