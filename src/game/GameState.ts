import {
  CLEAR_TIME_MS,
  ENEMY_BASE_HP,
  ENEMY_BASE_SPEED,
  ENEMY_SPAWN_INTERVAL_MS,
  MAX_ENEMIES,
  OVERCLOCK_HP_GROWTH,
  OVERCLOCK_MIN_SPAWN_MS,
  OVERCLOCK_SPAWN_DECAY,
  OVERCLOCK_SPEED_GROWTH,
} from './config';

export type Phase = 'playing' | 'clear' | 'overclock' | 'gameover';

/**
 * Pure data/state container — no Phaser. Drive it with tick(deltaMs).
 */
export class GameState {
  elapsedMs = 0;
  enemyCount = 0;
  gold = 0;
  phase: Phase = 'playing';

  private overclockSeconds = 0;

  tick(deltaMs: number): void {
    if (this.phase === 'gameover') return;
    this.elapsedMs += deltaMs;

    if (this.phase === 'playing' && this.elapsedMs >= CLEAR_TIME_MS) {
      this.phase = 'clear';
    }

    if (this.elapsedMs > CLEAR_TIME_MS) {
      this.overclockSeconds = (this.elapsedMs - CLEAR_TIME_MS) / 1000;
    }
  }

  enterOverclock(): void {
    if (this.phase === 'clear') this.phase = 'overclock';
  }

  registerSpawn(): void {
    this.enemyCount += 1;
    if (this.enemyCount > MAX_ENEMIES) this.phase = 'gameover';
  }

  registerKill(reward = 1): void {
    if (this.enemyCount > 0) this.enemyCount -= 1;
    this.gold += reward;
  }

  get currentSpawnIntervalMs(): number {
    if (this.overclockSeconds <= 0) return ENEMY_SPAWN_INTERVAL_MS;
    const scaled = ENEMY_SPAWN_INTERVAL_MS * Math.pow(OVERCLOCK_SPAWN_DECAY, this.overclockSeconds);
    return Math.max(OVERCLOCK_MIN_SPAWN_MS, scaled);
  }

  get currentEnemyHp(): number {
    if (this.overclockSeconds <= 0) return ENEMY_BASE_HP;
    return ENEMY_BASE_HP * Math.pow(OVERCLOCK_HP_GROWTH, this.overclockSeconds);
  }

  get currentEnemySpeed(): number {
    if (this.overclockSeconds <= 0) return ENEMY_BASE_SPEED;
    return ENEMY_BASE_SPEED * Math.pow(OVERCLOCK_SPEED_GROWTH, this.overclockSeconds);
  }

  formatTimer(): string {
    const totalSec = Math.floor(this.elapsedMs / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}
