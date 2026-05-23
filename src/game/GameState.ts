import { MetaData } from './MetaProgress';
import {
  BREEDING_DURATION_MS,
  BREEDING_EXHAUST_DURATION_MS,
  CLEAR_TIME_MS,
  GOLD_AUTO_RECOVERY_PER_SEC,
  META_UPGRADES,
  DOUBLE_ATK_INIT_PROB,
  DOUBLE_ATK_PROB_INC,
  ENEMY_BASE_HP,
  ENEMY_BASE_SPEED,
  ENEMY_SPAWN_INTERVAL_MS,
  KILL_REWARD,
  MAX_ENEMIES,
  MINE_DAMAGE,
  MINE_LIFETIME_MS,
  MINUTE_HP_MULT,
  MINUTE_SPEED_MULT,
  OVERCLOCK_HP_GROWTH,
  OVERCLOCK_MIN_SPAWN_MS,
  OVERCLOCK_SPAWN_DECAY,
  OVERCLOCK_SPEED_GROWTH,
  POPULATION_UPGRADE_BASE_COST,
  POPULATION_UPGRADE_COST_INCREASE,
  REWARD_GOLD_AMOUNT,
  SELL_GOLD_TIER1,
  SELL_GOLD_TIER2,
  SELL_GOLD_TIER3,
  SELL_GOLD_TIER4,
  SPAWN_ACCEL_DECAY,
  SPAWN_ACCEL_INTERVAL_MS,
  STARTING_GEMS,
  STARTING_GOLD,
  SUMMON_BASE_COST,
  SUMMON_COST_INCREMENT,
  SUMMON_MAX_COST,
  TWIN_INIT_PROB,
  TWIN_PROB_INC,
  CRIT_INIT_PROB,
  CRIT_PROB_INC,
  UNIT_CAP,
  TRACK_BASE_TL,
  TRACK_BASE_TR,
  TRACK_BASE_BR,
  TRACK_BASE_BL,
  TRACK_UNIT_ZONE_PADDING,
  VICTORY_TIME_MS,
} from './config';
import {
  CombatResult,
  EnemySnapshot,
  HybridRace,
  Mine,
  Reward,
  RewardType,
  Tier1Race,
  Tier3Race,
  UnitData,
} from './types';
import { runCombat } from './combat';
import {
  TIER1_RACES,
  getCategory,
  getOffspringRace,
  makeUnit,
  resolveTier2Race,
  resolveTier3Race,
  resolveAstralGodThird,
} from './unitHelpers';

export type Phase = 'playing' | 'clear' | 'overclock' | 'gameover' | 'victory';

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
  isInfiniteMode = false;
  pendingBossSpawn = false;
  pendingBossAlert = false;
  pendingStreakBonus = false;
  pendingNotification: string | null = null;
  twinProbability = 0;
  doubleAttackProbability = 0;
  criticalProbability = 0;
  globalDamageBonus = 0;

  mines: Mine[] = [];

  readonly trackWaypoints: { x: number; y: number }[];
  readonly unitZone: { x1: number; y1: number; x2: number; y2: number };
  private goldAutoRecovery = GOLD_AUTO_RECOVERY_PER_SEC;

  constructor(meta?: MetaData) {
    if (meta) {
      this.gold = STARTING_GOLD + meta.levels.startingGold * META_UPGRADES.startingGold.effectPer;
      this.summonCost = Math.max(1, SUMMON_BASE_COST - meta.levels.summonCost * META_UPGRADES.summonCost.effectPer);
      this.maxUnits = UNIT_CAP + meta.levels.unitCap * META_UPGRADES.unitCap.effectPer;
      this.goldAutoRecovery = GOLD_AUTO_RECOVERY_PER_SEC + meta.levels.autoGold * META_UPGRADES.autoGold.effectPer;
    }
    this.trackWaypoints = this.generateTrackWaypoints();
    this.unitZone = this.computeUnitZone(this.trackWaypoints);
  }

  private generateTrackWaypoints(): { x: number; y: number }[] {
    const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    return [
      { x: TRACK_BASE_TL.x + r(-10, 15), y: TRACK_BASE_TL.y + r(-10, 20) },
      { x: TRACK_BASE_TR.x + r(-15, 10), y: TRACK_BASE_TR.y + r(-10, 20) },
      { x: TRACK_BASE_BR.x + r(-15, 10), y: TRACK_BASE_BR.y + r(-15, 15) },
      { x: TRACK_BASE_BL.x + r(-10, 15), y: TRACK_BASE_BL.y + r(-15, 15) },
    ];
  }

  private computeUnitZone(wp: { x: number; y: number }[]) {
    const [tl, tr, br, bl] = wp;
    const pad = TRACK_UNIT_ZONE_PADDING;
    return {
      x1: Math.max(tl.x, bl.x) + pad,
      y1: Math.max(tl.y, tr.y) + pad,
      x2: Math.min(tr.x, br.x) - pad,
      y2: Math.min(bl.y, br.y) - pad,
    };
  }

  private overclockSeconds = 0;
  private minuteHpMult = 1;
  private minuteSpeedMult = 1;
  private lastMinuteCrossed = 0;
  private spawnAccelMult = 1;
  private lastThirtySecCrossed = 0;
  private lastBossAlertThirtySec = -1;
  private lastSecondCrossed = 0;
  private phaseBeforeGameOver: Phase = 'playing';
  private _nextUnitId = 0;
  private _nextMineId = 0;
  private bossRewardCallCount = 0;
  private recentKillTimestamps: number[] = [];

  tick(deltaMs: number): void {
    if (this.phase === 'gameover' || this.isPaused) return;
    this.elapsedMs += deltaMs;

    if (!this.isInfiniteMode && this.phase === 'playing' && this.elapsedMs >= VICTORY_TIME_MS) {
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

    // Auto gold recovery (+2/sec)
    const currentSecond = Math.floor(this.elapsedMs / 1000);
    if (currentSecond > this.lastSecondCrossed) {
      this.gold += this.goldAutoRecovery * (currentSecond - this.lastSecondCrossed);
      this.lastSecondCrossed = currentSecond;
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

    // Boss alert: 5 seconds before each boss spawn
    const nextBossInterval = this.lastThirtySecCrossed + 1;
    if (this.lastBossAlertThirtySec < nextBossInterval &&
        this.elapsedMs >= nextBossInterval * SPAWN_ACCEL_INTERVAL_MS - 5000) {
      this.lastBossAlertThirtySec = nextBossInterval;
      this.pendingBossAlert = true;
    }

    // Auto-clear exhaustion
    for (const unit of this.units) {
      if (unit.isExhausted && this.elapsedMs >= unit.exhaustEndMs) {
        unit.isExhausted = false;
        unit.exhaustEndMs = 0;
      }
    }

    // Expire old mines
    if (this.mines.length > 0) {
      this.mines = this.mines.filter(m => this.elapsedMs - m.placedAtMs < MINE_LIFETIME_MS);
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

    this.recentKillTimestamps.push(this.elapsedMs);
    this.recentKillTimestamps = this.recentKillTimestamps.filter(t => this.elapsedMs - t < 1000);
    if (this.recentKillTimestamps.length >= 5) {
      this.gold += 10;
      this.pendingStreakBonus = true;
      this.recentKillTimestamps = [];
    }
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
    this.gold += unit.tier === 4 ? SELL_GOLD_TIER4 : unit.tier === 3 ? SELL_GOLD_TIER3 : unit.tier === 2 ? SELL_GOLD_TIER2 : SELL_GOLD_TIER1;
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
      { type: 'crit', label: this.criticalProbability === 0 ? '🎯 치명타 20%' : `🎯 치명타 +10% (현재 ${(this.criticalProbability * 100).toFixed(0)}%)` },
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
        this.criticalProbability = this.criticalProbability === 0
          ? CRIT_INIT_PROB
          : Math.min(1, this.criticalProbability + CRIT_PROB_INC);
        break;
    }
    this.isPaused = false;
  }

  summon(): UnitData | null {
    if (this.gold < this.summonCost || this.units.length >= this.maxUnits) return null;
    this.gold -= this.summonCost;
    this.summonCost = Math.min(SUMMON_MAX_COST, this.summonCost + SUMMON_COST_INCREMENT);
    const race = TIER1_RACES[Math.floor(Math.random() * TIER1_RACES.length)];
    const x = this.unitZone.x1 + Math.random() * (this.unitZone.x2 - this.unitZone.x1);
    const y = this.unitZone.y1 + Math.random() * (this.unitZone.y2 - this.unitZone.y1);
    const unit = makeUnit(this._nextUnitId++, race, 1, x, y);
    this.units.push(unit);
    return unit;
  }

  startBreeding(idA: number, idB: number): boolean {
    const a = this.units.find(u => u.id === idA);
    const b = this.units.find(u => u.id === idB);
    if (!a || !b) return false;
    if (a.tier !== 1 || b.tier !== 1) return false;
    if (getCategory(a.race as Tier1Race) !== getCategory(b.race as Tier1Race)) return false;
    if (a.isBreeding || b.isBreeding) return false;
    if (a.isExhausted || b.isExhausted) return false;
    if (a.isLocked || b.isLocked) return false;
    const pendingOffspring = this.units.filter(u => u.isBreeding).length / 2;
    if (this.units.length + pendingOffspring >= this.maxUnits) return false;
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
    const offspringRace = getOffspringRace(a.race as Tier1Race, b.race as Tier1Race);
    const offspring = makeUnit(this._nextUnitId++, offspringRace, 1, ox, oy);
    this.units.push(offspring);
    const born: UnitData[] = [offspring];

    // Twin check
    if (this.twinProbability > 0 && Math.random() < this.twinProbability && this.units.length < this.maxUnits) {
      const tx = ox + (Math.random() - 0.5) * 24;
      const ty = oy + (Math.random() - 0.5) * 24;
      const twin = makeUnit(this._nextUnitId++, offspringRace, 1, tx, ty);
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
    if (a.isLocked || b.isLocked) return null;
    const hx = (a.x + b.x) / 2;
    const hy = (a.y + b.y) / 2;
    const [hi, lo] = aIdx > bIdx ? [aIdx, bIdx] : [bIdx, aIdx];

    if (a.tier === 1 && b.tier === 1) {
      const tier2Race = resolveTier2Race(a.race as Tier1Race, b.race as Tier1Race);
      if (!tier2Race) {
        this.pendingNotification = '⚠️ 조합법이 존재하지 않습니다.';
        return null;
      }
      this.units.splice(hi, 1); this.units.splice(lo, 1);
      const hybrid = makeUnit(this._nextUnitId++, tier2Race, 2, hx, hy);
      this.units.push(hybrid);
      return hybrid;
    }

    if (a.tier === 2 && b.tier === 2) {
      const tier3Race = resolveTier3Race(a.race as HybridRace, b.race as HybridRace);
      if (!tier3Race) {
        this.pendingNotification = '⚠️ 조합법이 존재하지 않습니다.';
        return null;
      }
      this.units.splice(hi, 1); this.units.splice(lo, 1);
      const ultimate = makeUnit(this._nextUnitId++, tier3Race, 3, hx, hy);
      this.units.push(ultimate);
      return ultimate;
    }

    if (a.tier === 3 && b.tier === 3) {
      const thirdRace = resolveAstralGodThird(a.race as Tier3Race, b.race as Tier3Race);
      if (!thirdRace) {
        this.pendingNotification = '⚠️ 조합법이 존재하지 않습니다.';
        return null;
      }
      const third = this.units.find(u =>
        u.race === thirdRace && u.id !== idA && u.id !== idB && !u.isLocked &&
        Math.hypot(u.x - hx, u.y - hy) <= 100
      );
      if (!third) {
        this.pendingNotification = `⚠️ Astral_God: ${thirdRace} 필요 (100px 이내)`;
        return null;
      }
      const thirdIdx = this.units.findIndex(u => u.id === third.id);
      [aIdx, bIdx, thirdIdx].sort((x, y) => y - x).forEach(idx => this.units.splice(idx, 1));
      const astral = makeUnit(this._nextUnitId++, 'Astral_God', 4, hx, hy);
      this.units.push(astral);
      return astral;
    }

    return null;
  }

  processCombat(snapshots: EnemySnapshot[]): CombatResult {
    const { killRewards, newMinePositions, consumedMineIds, ...result } = runCombat(
      this.units,
      snapshots,
      this.elapsedMs,
      this.criticalProbability,
      this.doubleAttackProbability,
      this.globalDamageBonus,
      this.mines,
    );
    for (const reward of killRewards) this.registerKill(reward);
    for (const pos of newMinePositions) {
      this.mines.push({ id: this._nextMineId++, x: pos.x, y: pos.y, damage: MINE_DAMAGE, placedAtMs: this.elapsedMs });
    }
    if (consumedMineIds.length > 0) {
      const consumed = new Set(consumedMineIds);
      this.mines = this.mines.filter(m => !consumed.has(m.id));
    }
    return result;
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
