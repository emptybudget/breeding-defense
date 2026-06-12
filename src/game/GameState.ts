import { MetaData } from './MetaProgress';
import {
  BREEDING_DURATION_MS,
  BREEDING_EXHAUST_DURATION_MS,
  CLEAR_TIME_MS,
  FIVE_MIN_SURGE_MULT,
  GOLD_AUTO_RECOVERY_PER_SEC,
  META_UPGRADES,
  DOUBLE_ATK_INIT_PROB,
  DOUBLE_ATK_PROB_INC,
  ENEMY_BASE_HP,
  ENEMY_BASE_SPEED,
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
  STARTING_GOLD,
  SUMMON_BASE_COST,
  SUMMON_COST_INCREMENT,
  SUMMON_MAX_COST,
  TWIN_INIT_PROB,
  TWIN_PROB_INC,
  CRIT_INIT_PROB,
  CRIT_PROB_INC,
  UNIT_CAP,
  WORLD_CONFIGS,
  WorldStageConfig,
  StageFeatures,
  SOUL_SUMMON_COST_START,
  TIER1_ENHANCE_MAX,
  TIER1_ENHANCE_COST,
  TIER2_ENHANCE_MAX,
  TIER2_ENHANCE_COST,
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
  UnitRace,
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
  gems = 0;
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
  bossSpawnedAtMs: number | null = null;
  bossCount = 0;
  private _lastSynthesisMs = 0;
  private _synthesisComboCount = 0;
  pendingNotification: string | null = null;
  twinProbability = 0;
  doubleAttackProbability = 0;
  criticalProbability = 0;
  globalDamageBonus = 0;

  mines: Mine[] = [];
  enhancePoints = 0;
  tier1AtkBonus = 0;
  tier2AtkBonus = 0;
  soulSummonCost = SOUL_SUMMON_COST_START;

  unitDamageMap: Map<number, { race: UnitRace; total: number }> = new Map();
  adReviveUsed = false;
  pendingCritHaptic = false;

  fiveMinSurgeApplied = false;
  pendingSurge = false;
  private _surgeMult = 1;

  readonly trackWaypoints: { x: number; y: number }[];
  readonly unitZone: { x1: number; y1: number; x2: number; y2: number };
  readonly stageConfig: WorldStageConfig;
  readonly features: StageFeatures;
  private goldAutoRecovery = GOLD_AUTO_RECOVERY_PER_SEC;

  constructor(meta?: MetaData, worldConfig?: WorldStageConfig) {
    this.stageConfig = worldConfig ?? WORLD_CONFIGS[2][1];
    this.features = this.stageConfig.features;
    if (meta) {
      this.gems = meta.gems;
      this.gold = STARTING_GOLD + meta.levels.startingGold * META_UPGRADES.startingGold.effectPer;
      this.summonCost = Math.max(1, SUMMON_BASE_COST - meta.levels.summonCost * META_UPGRADES.summonCost.effectPer);
      this.maxUnits = UNIT_CAP + meta.levels.unitCap * META_UPGRADES.unitCap.effectPer;
      this.goldAutoRecovery = GOLD_AUTO_RECOVERY_PER_SEC + meta.levels.autoGold * META_UPGRADES.autoGold.effectPer;
    }
    this.trackWaypoints = this.generateTrackWaypoints();
    this.unitZone = this.computeUnitZone(this.trackWaypoints);
  }

  private generateTrackWaypoints(): { x: number; y: number }[] {
    const n = (v: number, d: number) => Math.round(v + (Math.random() - 0.5) * 2 * d);
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const pt = (bx: number, by: number, dx = 18, dy = 18) => ({
      x: clamp(n(bx, dx), 18, 342),
      y: clamp(n(by, dy), 120, 525),
    });

    // 5 distinct track layouts — pick one at random each game
    const pick = Math.floor(Math.random() * 5);
    switch (pick) {
      case 0: // Rectangle (classic)
        return [pt(30,120), pt(330,120), pt(330,510), pt(30,510)];

      case 1: // S-snake — zigzag crosses through center
        return [pt(30,120), pt(330,120), pt(330,305), pt(30,305), pt(30,510), pt(330,510)];

      case 2: // Hexagon / V-top — symmetric, closes cleanly on left edge
        return [pt(30,145), pt(180,120,20,12), pt(330,145), pt(330,475), pt(180,505,20,12), pt(30,475)];

      case 3: // Kite / arrowhead-right — 5 pts, clean left-edge close
        return [pt(30,120), pt(330,120), pt(265,310,15,15), pt(105,310,15,15), pt(30,510)];

      case 4: // W-arch — arch in the middle of right side
        return [pt(30,120), pt(330,120), pt(330,280), pt(195,175,20,20), pt(30,280), pt(30,510), pt(330,510)];
    }
    // fallback
    return [pt(30,120), pt(330,120), pt(330,510), pt(30,510)];
  }

  private computeUnitZone(_wp: { x: number; y: number }[]) {
    // Fixed interior zone — safe for all track shapes
    return { x1: 68, y1: 132, x2: 292, y2: 480 };
  }

  // Returns distance from point (px,py) to segment (ax,ay)-(bx,by)
  private static _distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - ax, py - ay);
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  // True if (x,y) is too close to any track segment (track width=36px, margin=22px)
  isOnTrack(x: number, y: number): boolean { return this._onTrack(x, y); }
  private _onTrack(x: number, y: number): boolean {
    const wps = this.trackWaypoints;
    for (let i = 0; i < wps.length; i++) {
      const a = wps[i], b = wps[(i + 1) % wps.length];
      if (GameState._distToSeg(x, y, a.x, a.y, b.x, b.y) < 22) return true;
    }
    return false;
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

    if (!this.isInfiniteMode && this.phase === 'playing' && this.elapsedMs >= this.stageConfig.victoryTimeMs) {
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

    // Auto gold recovery (GOLD_AUTO_RECOVERY_PER_SEC / sec)
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

    // 5-minute surge (worlds 2+3 only, one-time)
    if (this.stageConfig.fiveMinSurge && !this.fiveMinSurgeApplied && this.elapsedMs >= 300_000) {
      this.fiveMinSurgeApplied = true;
      this._surgeMult = FIVE_MIN_SURGE_MULT;
      this.pendingSurge = true;
    }

    // 30-second spawn acceleration + boss spawn
    const currentThirtySec = Math.floor(this.elapsedMs / SPAWN_ACCEL_INTERVAL_MS);
    if (currentThirtySec > this.lastThirtySecCrossed) {
      this.lastThirtySecCrossed = currentThirtySec;
      this.spawnAccelMult *= SPAWN_ACCEL_DECAY;
      if (this.stageConfig.maxBossPhase > 0) {
        this.pendingBossSpawn = true;
        this.bossCount++;
        this.bossSpawnedAtMs = this.elapsedMs;
      }
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

  useAdRevive(): boolean {
    if (this.adReviveUsed) return false;
    this.adReviveUsed = true;
    this.enemyCount = 0;
    this.phase = this.phaseBeforeGameOver;
    return true;
  }

  getTopDamageDealers(n: number): { race: UnitRace; total: number }[] {
    return [...this.unitDamageMap.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, n);
  }

  /** Shell for future save/load feature. */
  serialize(): Record<string, unknown> {
    return {
      elapsedMs: this.elapsedMs,
      gold: this.gold,
      gems: this.gems,
      phase: this.phase,
      units: this.units,
    };
  }

  /** Shell for future save/load feature. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deserialize(_data: Record<string, unknown>): void {
    // TODO: implement full state restoration
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
    const { x1, y1, x2, y2 } = this.unitZone;
    let x: number, y: number, attempts = 0;
    do {
      x = x1 + Math.random() * (x2 - x1);
      y = y1 + Math.random() * (y2 - y1);
      attempts++;
    } while (attempts < 20 && this._onTrack(x, y));
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
      this.applySynthesisCombo();
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
      this.applySynthesisCombo();
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
      this.applySynthesisCombo();
      return astral;
    }

    return null;
  }

  upgradeTier1Atk(): boolean {
    if (this.tier1AtkBonus >= TIER1_ENHANCE_MAX || this.enhancePoints < TIER1_ENHANCE_COST) return false;
    this.enhancePoints -= TIER1_ENHANCE_COST;
    this.tier1AtkBonus += 1;
    return true;
  }

  upgradeTier2Atk(): boolean {
    if (this.tier2AtkBonus >= TIER2_ENHANCE_MAX || this.enhancePoints < TIER2_ENHANCE_COST) return false;
    this.enhancePoints -= TIER2_ENHANCE_COST;
    this.tier2AtkBonus += 1;
    return true;
  }

  soulSummonUnit(race: Tier1Race): UnitData | null {
    if (this.enhancePoints < this.soulSummonCost) return null;
    if (this.units.length >= this.maxUnits) return null;
    this.enhancePoints -= this.soulSummonCost;
    this.soulSummonCost += 1;
    const { x1, y1, x2, y2 } = this.unitZone;
    let x: number, y: number, attempts = 0;
    do {
      x = x1 + Math.random() * (x2 - x1);
      y = y1 + Math.random() * (y2 - y1);
      attempts++;
    } while (attempts < 20 && this._onTrack(x, y));
    const unit = makeUnit(this._nextUnitId++, race, 1, x, y);
    this.units.push(unit);
    return unit;
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
      this.tier1AtkBonus,
      this.tier2AtkBonus,
    );
    for (const reward of killRewards) this.registerKill(reward);
    for (const pos of newMinePositions) {
      this.mines.push({ id: this._nextMineId++, x: pos.x, y: pos.y, damage: MINE_DAMAGE, placedAtMs: this.elapsedMs });
    }
    if (consumedMineIds.length > 0) {
      const consumed = new Set(consumedMineIds);
      this.mines = this.mines.filter(m => !consumed.has(m.id));
    }
    // Accumulate per-unit damage and detect crits
    for (const atk of result.attacks) {
      if (atk.srcId !== undefined && atk.srcRace !== undefined && atk.damage > 0) {
        const entry = this.unitDamageMap.get(atk.srcId);
        if (entry) entry.total += atk.damage;
        else this.unitDamageMap.set(atk.srcId, { race: atk.srcRace, total: atk.damage });
      }
      if (atk.isCrit) this.pendingCritHaptic = true;
    }
    return result;
  }

  get currentSpawnIntervalMs(): number {
    const base = this.stageConfig.spawnIntervalBase * this.spawnAccelMult;
    if (this.overclockSeconds <= 0) return Math.max(OVERCLOCK_MIN_SPAWN_MS, base);
    return Math.max(OVERCLOCK_MIN_SPAWN_MS, base * Math.pow(OVERCLOCK_SPAWN_DECAY, this.overclockSeconds));
  }

  get currentEnemyHp(): number {
    const overclockMult = this.overclockSeconds > 0
      ? Math.pow(OVERCLOCK_HP_GROWTH, this.overclockSeconds) : 1;
    return ENEMY_BASE_HP * this.minuteHpMult * overclockMult * this._surgeMult;
  }

  get currentEnemySpeed(): number {
    const overclockMult = this.overclockSeconds > 0
      ? Math.pow(OVERCLOCK_SPEED_GROWTH, this.overclockSeconds) : 1;
    return ENEMY_BASE_SPEED * this.minuteSpeedMult * overclockMult * this._surgeMult;
  }

  private applySynthesisCombo(): void {
    const inWindow = this.elapsedMs - this._lastSynthesisMs <= 30000;
    this._synthesisComboCount = inWindow ? this._synthesisComboCount + 1 : 1;
    this._lastSynthesisMs = this.elapsedMs;
    if (this._synthesisComboCount >= 3) {
      this.gold += 30;
      this.pendingNotification = '💥 합성 콤보×3! +30G';
    } else if (this._synthesisComboCount >= 2) {
      this.gold += 15;
      this.pendingNotification = '⚡ 합성 콤보! +15G';
    }
  }

  formatTimer(): string {
    const totalSec = Math.floor(this.elapsedMs / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}
