import {
  BREEDING_DURATION_MS,
  BREEDING_EXHAUST_DURATION_MS,
  CLEAR_TIME_MS,
  CRIT_DAMAGE_MULT,
  DOUBLE_ATK_INIT_PROB,
  DOUBLE_ATK_PROB_INC,
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
  REWARD_GOLD_AMOUNT,
  SELL_GOLD_TIER1,
  SELL_GOLD_TIER2,
  SPAWN_ACCEL_DECAY,
  SPAWN_ACCEL_INTERVAL_MS,
  STARTING_GEMS,
  STARTING_GOLD,
  SUMMON_BASE_COST,
  SUMMON_COST_INCREMENT,
  TWIN_INIT_PROB,
  TWIN_PROB_INC,
  UNIT_CAP,
  UNIT_ZONE,
  VICTORY_TIME_MS,
} from './config';
import {
  AttackEvent,
  CombatResult,
  EnemySnapshot,
  HybridRace,
  Race,
  Reward,
  RewardType,
  UnitData,
  UnitRace,
} from './types';

export type Phase = 'playing' | 'clear' | 'overclock' | 'gameover' | 'victory';

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

function makeUnit(id: number, race: UnitRace, tier: 1 | 2, x: number, y: number): UnitData {
  return { id, race, tier, x, y, lastAttackedAtMs: 0, isBreeding: false, breedingEndMs: 0, isExhausted: false, exhaustEndMs: 0, isLocked: false };
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
  isPaused = false;
  pendingBossSpawn = false;
  twinProbability = 0;
  doubleAttackProbability = 0;
  criticalProbability = 0;
  globalDamageBonus = 0;

  private overclockSeconds = 0;
  private minuteHpMult = 1;
  private minuteSpeedMult = 1;
  private lastMinuteCrossed = 0;
  private spawnAccelMult = 1;
  private lastThirtySecCrossed = 0;
  private phaseBeforeGameOver: Phase = 'playing';
  private _nextUnitId = 0;
  private bossRewardCallCount = 0;

  tick(deltaMs: number): void {
    if (this.phase === 'gameover' || this.isPaused) return;
    this.elapsedMs += deltaMs;

    if (this.phase === 'playing' && this.elapsedMs >= VICTORY_TIME_MS) {
      this.phase = 'victory';
      this.gems += 1;
      this.isPaused = true;
      return;
    }
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
    }

    // 30-second spawn acceleration + boss spawn
    const currentThirtySec = Math.floor(this.elapsedMs / SPAWN_ACCEL_INTERVAL_MS);
    if (currentThirtySec > this.lastThirtySecCrossed) {
      this.lastThirtySecCrossed = currentThirtySec;
      this.spawnAccelMult *= SPAWN_ACCEL_DECAY;
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

  sellUnit(id: number): void {
    const idx = this.units.findIndex(u => u.id === id);
    if (idx < 0) return;
    const unit = this.units[idx];
    this.gold += unit.tier === 2 ? SELL_GOLD_TIER2 : SELL_GOLD_TIER1;
    this.units.splice(idx, 1);
  }

  toggleLock(id: number): void {
    const unit = this.units.find(u => u.id === id);
    if (unit) unit.isLocked = !unit.isLocked;
  }

  useGemContinue(): boolean {
    if (this.gems <= 0) return false;
    this.gems -= 1;
    this.enemyCount = 0;
    this.phase = this.phaseBeforeGameOver;
    return true;
  }

  generateRewards(count: number): Reward[] {
    const pool: Reward[] = [
      { type: 'gem',      label: '💎 보석 +1' },
      { type: 'gold',     label: `💰 골드 +${REWARD_GOLD_AMOUNT}` },
      { type: 'damage',   label: '⚔️ 공격력 +1' },
      { type: 'maxUnits', label: '🏠 유닛 한도 +1' },
      { type: 'twinProb', label: this.twinProbability === 0 ? '👶 쌍둥이 10%' : `👶 쌍둥이 +2% (현재 ${(this.twinProbability * 100).toFixed(0)}%)` },
      { type: 'doubleAtk', label: this.doubleAttackProbability === 0 ? '⚡ 더블어택 10%' : `⚡ 더블어택 +2% (현재 ${(this.doubleAttackProbability * 100).toFixed(0)}%)` },
      { type: 'crit', label: this.criticalProbability === 0 ? '🎯 치명타 50%' : `🎯 치명타 +50% (현재 ${(this.criticalProbability * 100).toFixed(0)}%)` },
    ];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // Guarantee crit appears in first 2-card display on the very first boss kill
    if (this.bossRewardCallCount === 0) {
      const critIdx = pool.findIndex(r => r.type === 'crit');
      if (critIdx > 0) [pool[0], pool[critIdx]] = [pool[critIdx], pool[0]];
    }
    this.bossRewardCallCount += 1;
    return pool.slice(0, Math.min(count, pool.length));
  }

  applyReward(type: RewardType): void {
    switch (type) {
      case 'gem':      this.gems += 1; break;
      case 'gold':     this.gold += REWARD_GOLD_AMOUNT; break;
      case 'damage':   this.globalDamageBonus += 1; break;
      case 'maxUnits': this.maxUnits += 1; break;
      case 'twinProb':
        this.twinProbability = this.twinProbability === 0
          ? TWIN_INIT_PROB
          : Math.min(1, this.twinProbability + TWIN_PROB_INC);
        break;
      case 'doubleAtk':
        this.doubleAttackProbability = this.doubleAttackProbability === 0
          ? DOUBLE_ATK_INIT_PROB
          : Math.min(1, this.doubleAttackProbability + DOUBLE_ATK_PROB_INC);
        break;
      case 'crit':
        this.criticalProbability = Math.min(1, this.criticalProbability + 0.5);
        break;
    }
    this.isPaused = false;
  }

  summon(): UnitData | null {
    if (this.gold < this.summonCost || this.units.length >= this.maxUnits) return null;
    this.gold -= this.summonCost;
    this.summonCost += SUMMON_COST_INCREMENT;
    const race = RACES[Math.floor(Math.random() * RACES.length)];
    const x = UNIT_ZONE.x1 + Math.random() * (UNIT_ZONE.x2 - UNIT_ZONE.x1);
    const y = UNIT_ZONE.y1 + Math.random() * (UNIT_ZONE.y2 - UNIT_ZONE.y1);
    const unit = makeUnit(this._nextUnitId++, race, 1, x, y);
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
    if (a.isLocked || b.isLocked) return false;
    if (this.units.length >= this.maxUnits) return false;
    const endMs = this.elapsedMs + BREEDING_DURATION_MS;
    a.isBreeding = true; a.breedingEndMs = endMs;
    b.isBreeding = true; b.breedingEndMs = endMs;
    return true;
  }

  // Returns newly born units: [offspring] normally, [offspring, twin] on twin proc, [] on failure
  completeBreeding(idA: number, idB: number): UnitData[] {
    const a = this.units.find(u => u.id === idA);
    const b = this.units.find(u => u.id === idB);
    if (!a || !b) return [];
    a.isBreeding = false; a.breedingEndMs = 0;
    b.isBreeding = false; b.breedingEndMs = 0;
    const exhaustEnd = this.elapsedMs + BREEDING_EXHAUST_DURATION_MS;
    a.isExhausted = true; a.exhaustEndMs = exhaustEnd;
    b.isExhausted = true; b.exhaustEndMs = exhaustEnd;
    const ox = (a.x + b.x) / 2 + (Math.random() - 0.5) * 20;
    const oy = (a.y + b.y) / 2 + (Math.random() - 0.5) * 20;
    const offspring = makeUnit(this._nextUnitId++, a.race, 1, ox, oy);
    this.units.push(offspring);
    const born: UnitData[] = [offspring];

    // Twin check
    if (this.twinProbability > 0 && Math.random() < this.twinProbability && this.units.length < this.maxUnits) {
      const tx = ox + (Math.random() - 0.5) * 24;
      const ty = oy + (Math.random() - 0.5) * 24;
      const twin = makeUnit(this._nextUnitId++, a.race, 1, tx, ty);
      this.units.push(twin);
      born.push(twin);
    }

    return born;
  }

  synthesize(idA: number, idB: number): UnitData | null {
    const aIdx = this.units.findIndex(u => u.id === idA);
    const bIdx = this.units.findIndex(u => u.id === idB);
    if (aIdx < 0 || bIdx < 0) return null;
    const a = this.units[aIdx];
    const b = this.units[bIdx];
    if (a.tier === 2 || b.tier === 2) return null;
    if (a.isLocked || b.isLocked) return null;
    const baseRaces: UnitRace[] = ['Human', 'Beast', 'Robot'];
    if (!baseRaces.includes(a.race) || !baseRaces.includes(b.race)) return null;
    const hybridRace = resolveHybridRace(a.race as Race, b.race as Race);
    const hx = (a.x + b.x) / 2;
    const hy = (a.y + b.y) / 2;
    const [hi, lo] = aIdx > bIdx ? [aIdx, bIdx] : [bIdx, aIdx];
    this.units.splice(hi, 1);
    this.units.splice(lo, 1);
    const hybrid = makeUnit(this._nextUnitId++, hybridRace, 2, hx, hy);
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
      const baseDmg = stats.damage + this.globalDamageBonus;
      let finalDmg = baseDmg;
      let isCrit = false;
      if (this.criticalProbability > 0 && Math.random() < this.criticalProbability) {
        finalDmg = Math.ceil(finalDmg * CRIT_DAMAGE_MULT);
        isCrit = true;
      }
      if (Math.random() < this.doubleAttackProbability) finalDmg *= 2;
      const newHp = (liveHp.get(target.id) ?? target.hp) - finalDmg;
      liveHp.set(target.id, newHp);
      attacks.push({ unitX: unit.x, unitY: unit.y, enemyX: target.x, enemyY: target.y, isCrit });

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
    const base = ENEMY_SPAWN_INTERVAL_MS * this.spawnAccelMult;
    if (this.overclockSeconds <= 0) return Math.max(OVERCLOCK_MIN_SPAWN_MS, base);
    return Math.max(OVERCLOCK_MIN_SPAWN_MS, base * Math.pow(OVERCLOCK_SPAWN_DECAY, this.overclockSeconds));
  }

  get currentEnemyHp(): number {
    const overclockMult = this.overclockSeconds > 0
      ? Math.pow(OVERCLOCK_HP_GROWTH, this.overclockSeconds) : 1;
    return ENEMY_BASE_HP * this.minuteHpMult * overclockMult;
  }

  get currentEnemySpeed(): number {
    const overclockMult = this.overclockSeconds > 0
      ? Math.pow(OVERCLOCK_SPEED_GROWTH, this.overclockSeconds) : 1;
    return ENEMY_BASE_SPEED * this.minuteSpeedMult * overclockMult;
  }

  formatTimer(): string {
    const totalSec = Math.floor(this.elapsedMs / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}
