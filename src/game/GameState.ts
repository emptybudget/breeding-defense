import {
  BREEDING_DURATION_MS,
  BREEDING_EXHAUST_DURATION_MS,
  CLEAR_TIME_MS,
  ENEMY_BASE_HP,
  ENEMY_BASE_SPEED,
  ENEMY_SPAWN_INTERVAL_MS,
  HYBRID_STATS,
  KILL_REWARD,
  MAX_ENEMIES,
  MINUTE_HP_MULT,
  MINUTE_SPEED_MULT,
  OVERCLOCK_HP_GROWTH,
  OVERCLOCK_MIN_SPAWN_MS,
  OVERCLOCK_SPAWN_DECAY,
  OVERCLOCK_SPEED_GROWTH,
  POPULATION_UPGRADE_BASE_COST,
  POPULATION_UPGRADE_COST_INCREASE,
  RACE_STATS,
  STARTING_GEMS,
  STARTING_GOLD,
  SUMMON_BASE_COST,
  SUMMON_COST_INCREMENT,
  UNIT_CAP,
  UNIT_ZONE,
} from './config';
import { AttackEvent, CombatResult, EnemySnapshot, HybridRace, Race, UnitData, UnitRace } from './types';

export type Phase = 'playing' | 'clear' | 'overclock' | 'gameover';

const RACES: Race[] = ['Human', 'Beast', 'Robot'];

function getUnitCombatStats(race: UnitRace) {
  if (race in RACE_STATS) return RACE_STATS[race as Race];
  return HYBRID_STATS[race as HybridRace];
}

function resolveHybridRace(a: Race, b: Race): HybridRace {
  const sorted = [a, b].sort().join('+');
  const map: Record<string, HybridRace> = {
    'Beast+Human': 'Human_Beast',
    'Human+Robot': 'Human_Robot',
    'Beast+Robot': 'Beast_Robot',
  };
  return map[sorted] ?? 'Human_Beast';
}

export class GameState {
  elapsedMs = 0;
  enemyCount = 0;
  gold = STARTING_GOLD;
  gems = STARTING_GEMS;
  phase: Phase = 'playing';
  units: UnitData[] = [];
  summonCost = SUMMON_BASE_COST;
  maxUnits = UNIT_CAP;
  populationUpgradeCost = POPULATION_UPGRADE_BASE_COST;

  pendingBossSpawn = false;

  private overclockSeconds = 0;
  private minuteHpMult = 1;
  private minuteSpeedMult = 1;
  private lastMinuteCrossed = 0;
  private phaseBeforeGameOver: Phase = 'playing';
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

    // Per-minute permanent buff
    const currentMinute = Math.floor(this.elapsedMs / 60000);
    if (currentMinute > this.lastMinuteCrossed) {
      this.lastMinuteCrossed = currentMinute;
      this.minuteHpMult *= MINUTE_HP_MULT;
      this.minuteSpeedMult *= MINUTE_SPEED_MULT;
      this.pendingBossSpawn = true;
    }

    // Auto-clear exhaustion
    for (const unit of this.units) {
      if (unit.isExhausted && this.elapsedMs >= unit.exhaustEndMs) {
        unit.isExhausted = false;
        unit.exhaustEndMs = 0;
      }
    }
  }

  enterOverclock(): void {
    if (this.phase === 'clear') this.phase = 'overclock';
  }

  registerSpawn(): void {
    this.enemyCount += 1;
    if (this.enemyCount > MAX_ENEMIES) {
      this.phaseBeforeGameOver = this.phase;
      this.phase = 'gameover';
    }
  }

  registerKill(reward = KILL_REWARD): void {
    if (this.enemyCount > 0) this.enemyCount -= 1;
    this.gold += reward;
  }

  upgradePopulation(): boolean {
    if (this.gold < this.populationUpgradeCost) return false;
    this.gold -= this.populationUpgradeCost;
    this.populationUpgradeCost += POPULATION_UPGRADE_COST_INCREASE;
    this.maxUnits += 1;
    return true;
  }

  moveUnit(id: number, x: number, y: number): void {
    const unit = this.units.find(u => u.id === id);
    if (unit) { unit.x = x; unit.y = y; }
  }

  useGemContinue(): boolean {
    if (this.gems <= 0) return false;
    this.gems -= 1;
    this.enemyCount = 0;
    this.phase = this.phaseBeforeGameOver;
    return true;
  }

  summon(): UnitData | null {
    if (this.gold < this.summonCost || this.units.length >= this.maxUnits) return null;
    this.gold -= this.summonCost;
    this.summonCost += SUMMON_COST_INCREMENT;
    const race = RACES[Math.floor(Math.random() * RACES.length)];
    const x = UNIT_ZONE.x1 + Math.random() * (UNIT_ZONE.x2 - UNIT_ZONE.x1);
    const y = UNIT_ZONE.y1 + Math.random() * (UNIT_ZONE.y2 - UNIT_ZONE.y1);
    const unit: UnitData = {
      id: this._nextUnitId++, race, tier: 1, x, y,
      lastAttackedAtMs: 0, isBreeding: false, breedingEndMs: 0,
      isExhausted: false, exhaustEndMs: 0,
    };
    this.units.push(unit);
    return unit;
  }

  startBreeding(idA: number, idB: number): boolean {
    const a = this.units.find(u => u.id === idA);
    const b = this.units.find(u => u.id === idB);
    if (!a || !b) return false;
    if (a.race !== b.race || a.tier === 2 || b.tier === 2) return false;
    if (a.isBreeding || b.isBreeding) return false;
    if (a.isExhausted || b.isExhausted) return false;
    if (this.units.length >= this.maxUnits) return false;
    const endMs = this.elapsedMs + BREEDING_DURATION_MS;
    a.isBreeding = true; a.breedingEndMs = endMs;
    b.isBreeding = true; b.breedingEndMs = endMs;
    return true;
  }

  completeBreeding(idA: number, idB: number): UnitData | null {
    const a = this.units.find(u => u.id === idA);
    const b = this.units.find(u => u.id === idB);
    if (!a || !b) return null;
    a.isBreeding = false; a.breedingEndMs = 0;
    b.isBreeding = false; b.breedingEndMs = 0;
    const exhaustEnd = this.elapsedMs + BREEDING_EXHAUST_DURATION_MS;
    a.isExhausted = true; a.exhaustEndMs = exhaustEnd;
    b.isExhausted = true; b.exhaustEndMs = exhaustEnd;
    const ox = (a.x + b.x) / 2 + (Math.random() - 0.5) * 20;
    const oy = (a.y + b.y) / 2 + (Math.random() - 0.5) * 20;
    const offspring: UnitData = {
      id: this._nextUnitId++, race: a.race, tier: 1, x: ox, y: oy,
      lastAttackedAtMs: 0, isBreeding: false, breedingEndMs: 0,
      isExhausted: false, exhaustEndMs: 0,
    };
    this.units.push(offspring);
    return offspring;
  }

  synthesize(idA: number, idB: number): UnitData | null {
    const aIdx = this.units.findIndex(u => u.id === idA);
    const bIdx = this.units.findIndex(u => u.id === idB);
    if (aIdx < 0 || bIdx < 0) return null;
    const a = this.units[aIdx];
    const b = this.units[bIdx];
    if (a.tier === 2 || b.tier === 2) return null;
    // Both must be base Race (not hybrid) for synthesis
    const baseRaces: UnitRace[] = ['Human', 'Beast', 'Robot'];
    if (!baseRaces.includes(a.race) || !baseRaces.includes(b.race)) return null;
    const hybridRace = resolveHybridRace(a.race as Race, b.race as Race);
    const hx = (a.x + b.x) / 2;
    const hy = (a.y + b.y) / 2;
    const [hi, lo] = aIdx > bIdx ? [aIdx, bIdx] : [bIdx, aIdx];
    this.units.splice(hi, 1);
    this.units.splice(lo, 1);
    const hybrid: UnitData = {
      id: this._nextUnitId++, race: hybridRace, tier: 2, x: hx, y: hy,
      lastAttackedAtMs: 0, isBreeding: false, breedingEndMs: 0,
      isExhausted: false, exhaustEndMs: 0,
    };
    this.units.push(hybrid);
    return hybrid;
  }

  processCombat(snapshots: EnemySnapshot[]): CombatResult {
    const now = this.elapsedMs;
    const attacks: AttackEvent[] = [];
    const killedSet = new Set<number>();
    const liveHp = new Map<number, number>(snapshots.map(e => [e.id, e.hp]));

    for (const unit of this.units) {
      if (unit.isBreeding) continue;
      const stats = getUnitCombatStats(unit.race);
      if (now - unit.lastAttackedAtMs < stats.attackIntervalMs) continue;

      let target: EnemySnapshot | null = null;
      for (const e of snapshots) {
        if (killedSet.has(e.id)) continue;
        if (Math.hypot(e.x - unit.x, e.y - unit.y) > stats.range) continue;
        if (!target || e.progressScore > target.progressScore) target = e;
      }
      if (!target) continue;

      unit.lastAttackedAtMs = now;
      const newHp = (liveHp.get(target.id) ?? target.hp) - stats.damage;
      liveHp.set(target.id, newHp);
      attacks.push({ unitX: unit.x, unitY: unit.y, enemyX: target.x, enemyY: target.y });

      if (newHp <= 0) {
        killedSet.add(target.id);
        this.registerKill(target.killReward);
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

  // Returns overall HP multiplier (base 1 × minute buffs × overclock)
  get currentEnemyHp(): number {
    const overclockMult = this.overclockSeconds > 0
      ? Math.pow(OVERCLOCK_HP_GROWTH, this.overclockSeconds)
      : 1;
    return ENEMY_BASE_HP * this.minuteHpMult * overclockMult;
  }

  // Returns absolute speed (px/sec) with minute buffs and overclock applied
  get currentEnemySpeed(): number {
    const overclockMult = this.overclockSeconds > 0
      ? Math.pow(OVERCLOCK_SPEED_GROWTH, this.overclockSeconds)
      : 1;
    return ENEMY_BASE_SPEED * this.minuteSpeedMult * overclockMult;
  }

  formatTimer(): string {
    const totalSec = Math.floor(this.elapsedMs / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}
