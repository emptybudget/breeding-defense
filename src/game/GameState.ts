import {
  CLEAR_TIME_MS,
  ENEMY_BASE_HP,
  ENEMY_BASE_SPEED,
  ENEMY_SPAWN_INTERVAL_MS,
  KILL_REWARD,
  MAX_ENEMIES,
  OVERCLOCK_HP_GROWTH,
  OVERCLOCK_MIN_SPAWN_MS,
  OVERCLOCK_SPAWN_DECAY,
  OVERCLOCK_SPEED_GROWTH,
  STARTING_GOLD,
  SUMMON_BASE_COST,
  SUMMON_COST_INCREMENT,
  UNIT_ATTACK_INTERVAL_MS,
  UNIT_ATTACK_RANGE,
  UNIT_BASE_DAMAGE,
  UNIT_CAP,
  UNIT_ZONE,
} from './config';
import { AttackEvent, CombatResult, EnemySnapshot, Race, UnitData } from './types';

export type Phase = 'playing' | 'clear' | 'overclock' | 'gameover';

const RACES: Race[] = ['Human', 'Beast', 'Robot'];

export class GameState {
  elapsedMs = 0;
  enemyCount = 0;
  gold = STARTING_GOLD;
  phase: Phase = 'playing';
  units: UnitData[] = [];
  summonCost = SUMMON_BASE_COST;

  private overclockSeconds = 0;
  private _nextUnitId = 0;

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

  registerKill(reward = KILL_REWARD): void {
    if (this.enemyCount > 0) this.enemyCount -= 1;
    this.gold += reward;
  }

  summon(): UnitData | null {
    if (this.gold < this.summonCost || this.units.length >= UNIT_CAP) return null;
    this.gold -= this.summonCost;
    this.summonCost += SUMMON_COST_INCREMENT;
    const race = RACES[Math.floor(Math.random() * RACES.length)];
    const x = UNIT_ZONE.x1 + Math.random() * (UNIT_ZONE.x2 - UNIT_ZONE.x1);
    const y = UNIT_ZONE.y1 + Math.random() * (UNIT_ZONE.y2 - UNIT_ZONE.y1);
    const unit: UnitData = { id: this._nextUnitId++, race, tier: 1, x, y, lastAttackedAtMs: 0 };
    this.units.push(unit);
    return unit;
  }

  processCombat(snapshots: EnemySnapshot[]): CombatResult {
    const now = this.elapsedMs;
    const attacks: AttackEvent[] = [];
    const killedSet = new Set<number>();
    const liveHp = new Map<number, number>(snapshots.map(e => [e.id, e.hp]));

    for (const unit of this.units) {
      if (now - unit.lastAttackedAtMs < UNIT_ATTACK_INTERVAL_MS) continue;

      let target: EnemySnapshot | null = null;
      for (const e of snapshots) {
        if (killedSet.has(e.id)) continue;
        if (Math.hypot(e.x - unit.x, e.y - unit.y) > UNIT_ATTACK_RANGE) continue;
        if (!target || e.progressScore > target.progressScore) target = e;
      }
      if (!target) continue;

      unit.lastAttackedAtMs = now;
      const newHp = (liveHp.get(target.id) ?? target.hp) - UNIT_BASE_DAMAGE;
      liveHp.set(target.id, newHp);
      attacks.push({ unitX: unit.x, unitY: unit.y, enemyX: target.x, enemyY: target.y });

      if (newHp <= 0) {
        killedSet.add(target.id);
        this.registerKill();
      }
    }

    const killedIds = [...killedSet];
    const hpUpdates = snapshots
      .filter(e => !killedSet.has(e.id) && liveHp.get(e.id) !== e.hp)
      .map(e => ({ id: e.id, hp: liveHp.get(e.id)! }));

    return { attacks, killedIds, hpUpdates };
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
