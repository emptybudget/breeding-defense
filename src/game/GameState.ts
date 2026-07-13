import { MetaData } from './MetaProgress';
import {
  BOSS_PHASE_B_START_MS,
  BOSS_PHASE_C_START_MS,
  BREEDING_DURATION_MS,
  CLEAR_TIME_MS,
  FIVE_MIN_SURGE_MULT,
  GOLD_AUTO_RECOVERY_PER_SEC,
  JACKPOT_TIER2_PROB,
  META_UPGRADES,
  DOUBLE_ATK_INIT_PROB,
  DOUBLE_ATK_PROB_INC,
  ENEMY_BASE_HP,
  ENEMY_BASE_SPEED,
  KILL_REWARD,
  MAX_ENEMIES,
  MINE_DAMAGE,
  MINE_LIFETIME_MS,
  MINIBOSS_TIMES_MS,
  MINIBOSS_GOLD_AMOUNT,
  MINIBOSS_WAVE_GUARD_MS,
  MINIBOSS_WAVE_DELAY_MS,
  MUTATION_COMMON_GOLD,
  MINUTE_HP_MULT,
  MINUTE_SPEED_MULT,
  OVERCLOCK_HP_GROWTH,
  OVERCLOCK_MIN_SPAWN_MS,
  OVERCLOCK_SPAWN_DECAY,
  OVERCLOCK_SPEED_GROWTH,
  POPULATION_UPGRADE_BASE_COST,
  POPULATION_UPGRADE_COST_INCREASE,
  REWARD_GOLD_AMOUNT,
  ROUND_CLEAR_GOLD,
  ROUND_MS,
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
  TIER4_SYNTHESIS_SOUL_COST,
} from './config';
import {
  CombatResult,
  EnemySnapshot,
  EnemyType,
  HybridRace,
  Lineage,
  Mine,
  MutationGrade,
  PedigreeNode,
  Reward,
  RewardType,
  Tier1Race,
  Tier3Race,
  UnitData,
  UnitRace,
} from './types';
import { runCombat } from './combat';
import {
  HYBRID_RACES,
  TIER1_RACES,
  makeUnit,
  resolveTier2Race,
  resolveTier3Race,
  resolveAstralGodThird,
} from './unitHelpers';
import {
  PityState,
  canBreed,
  inheritOnSynthesis,
  resolveBreeding,
  resolveLineage,
} from './breeding';

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
  pendingScriptedWaveAlert = false;
  pendingScriptedWave: { type: EnemyType; count: number } | null = null;
  // GD1: 보스 페이즈 전환 컷인 — GameScene이 드레인 (2=Phase B, 3=Phase C)
  pendingPhaseTransition: 2 | 3 | null = null;
  // M2: 라운드 클리어 배너 — GameScene이 드레인 (1-indexed, TOTAL_ROUNDS 초과 시 OVERTIME)
  pendingRoundBanner: number | null = null;
  // GD3: 미니보스 — GameScene이 드레인
  pendingMinibossSpawn = false;
  pendingMinibossReward = false;
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

  // G2: 잭팟 소환 — GameScene이 메타 해금 + W1 제외 조건으로 설정
  jackpotEnabled = false;
  pendingJackpot = false;

  // G3: 도감 — 이번 틱에 새로 제작된 종 (GameScene이 드레인 후 MetaProgress.discover)
  pendingDiscoveries: UnitRace[] = [];

  // M3: 혈통 데이터층 (docs/redesign/14-breeding-api.md §4)
  breedsUsedThisGame = 0;
  lineages: Map<number, Lineage> = new Map();
  pedigree: PedigreeNode[] = [];
  pity: PityState = { rareMiss: 0, legendMiss: 0 };
  // 부화 연출 정보 (M4가 소비) — M3는 큐만 적재
  pendingHatch: {
    childId: number; race: UnitRace; gen: number;
    mutation?: MutationGrade; bloodlineName: string; epithet?: string; isNewLineage: boolean;
  } | null = null;
  // GameScene이 드레인해 MetaProgress에 영속 (피티·변이 카운트)
  pendingPitySave = false;
  pendingMutationRecord: MutationGrade | null = null;
  private _nextLineageId = 1;
  private _usedNames = new Set<string>();

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
      // M3: 희귀/전설 피티는 계정 영속 (12-F3) — 판 시작 시 메타에서 읽어 이어감
      if (meta.pity) this.pity = { rareMiss: meta.pity.rareMiss, legendMiss: meta.pity.legendMiss };
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

  // True if (x,y) is too close to any track segment.
  // 반폭 18 = 렌더 본체(34px)+테두리(42px) 안쪽 — 판정 폭(36)이 비주얼(42)보다 항상 좁아서,
  // 거절은 반드시 눈에 보이는 트랙 위에서만 일어난다 (31-track-drag-fix.md F2).
  isOnTrack(x: number, y: number): boolean { return this._onTrack(x, y); }
  private _onTrack(x: number, y: number): boolean {
    const wps = this.trackWaypoints;
    for (let i = 0; i < wps.length; i++) {
      const a = wps[i], b = wps[(i + 1) % wps.length];
      if (GameState._distToSeg(x, y, a.x, a.y, b.x, b.y) < 18) return true;
    }
    return false;
  }

  private overclockSeconds = 0;
  private minuteHpMult = 1;
  private minuteSpeedMult = 1;
  private lastMinuteCrossed = 0;
  private spawnAccelMult = 1;
  private lastThirtySecCrossed = 0;
  private lastRoundCrossed = 0;
  private lastBossAlertThirtySec = -1;
  private lastSecondCrossed = 0;
  private phaseBeforeGameOver: Phase = 'playing';
  private _nextUnitId = 0;
  private _nextMineId = 0;
  private bossRewardCallCount = 0;
  private recentKillTimestamps: number[] = [];
  private scriptedWaveIndex = 0;
  private scriptedWaveAlerted = false;
  private phaseBTransitionFired = false;
  private phaseCTransitionFired = false;
  private minibossTimes: number[] | null = null; // lazy-init (엘리트 스테이지만, 웨이브 충돌 보정 포함)
  private minibossIndex = 0;

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

    // M2: 라운드 경계 (30초 박동, 15라운드+는 OVERTIME으로 계속 카운트)
    const currentRound = Math.floor(this.elapsedMs / ROUND_MS);
    if (currentRound > this.lastRoundCrossed) {
      this.lastRoundCrossed = currentRound;
      this.gold += ROUND_CLEAR_GOLD;
      this.pendingRoundBanner = currentRound;
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

    // GD1: 보스 페이즈 전환 컷인 (시간 경계 기반, 스테이지 maxBossPhase 도달 시에만)
    if (this.stageConfig.maxBossPhase >= 2 && !this.phaseBTransitionFired && this.elapsedMs >= BOSS_PHASE_B_START_MS) {
      this.phaseBTransitionFired = true;
      this.pendingPhaseTransition = 2;
    }
    if (this.stageConfig.maxBossPhase >= 3 && !this.phaseCTransitionFired && this.elapsedMs >= BOSS_PHASE_C_START_MS) {
      this.phaseCTransitionFired = true;
      this.pendingPhaseTransition = 3;
    }

    // Boss alert: 5 seconds before each boss spawn
    const nextBossInterval = this.lastThirtySecCrossed + 1;
    if (this.lastBossAlertThirtySec < nextBossInterval &&
        this.elapsedMs >= nextBossInterval * SPAWN_ACCEL_INTERVAL_MS - 5000) {
      this.lastBossAlertThirtySec = nextBossInterval;
      this.pendingBossAlert = true;
    }

    // Scripted wave (G4): 5s telegraph, then spawn at the configured time
    const scriptedWaves = this.stageConfig.scriptedWaves;
    if (scriptedWaves && this.scriptedWaveIndex < scriptedWaves.length) {
      const wave = scriptedWaves[this.scriptedWaveIndex];
      if (!this.scriptedWaveAlerted && this.elapsedMs >= wave.atMs - 5000) {
        this.scriptedWaveAlerted = true;
        this.pendingScriptedWaveAlert = true;
      }
      if (this.elapsedMs >= wave.atMs) {
        const count = Math.min(wave.count, MAX_ENEMIES - this.enemyCount - 10);
        if (count > 0) {
          this.pendingScriptedWave = { type: wave.type, count };
        }
        this.scriptedWaveIndex++;
        this.scriptedWaveAlerted = false;
      }
    }

    // GD3: 미니보스 — 엘리트 스테이지에서 고정 시각 2회 (G4 웨이브와 충돌 시 뒤로 보정)
    if (this.minibossTimes === null) {
      this.minibossTimes = this.stageConfig.eliteIntervalMs === null
        ? []
        : MINIBOSS_TIMES_MS.map(t => {
            const clash = this.stageConfig.scriptedWaves?.find(w => Math.abs(w.atMs - t) <= MINIBOSS_WAVE_GUARD_MS);
            return clash ? clash.atMs + MINIBOSS_WAVE_DELAY_MS : t;
          });
    }
    if (this.minibossIndex < this.minibossTimes.length &&
        this.elapsedMs >= this.minibossTimes[this.minibossIndex]) {
      this.minibossIndex++;
      this.pendingMinibossSpawn = true;
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
      { type: 'enhance',  label: '💀 강화점 +1' },
      { type: 'gold',     label: `💰 골드 +${REWARD_GOLD_AMOUNT}` },
      { type: 'damage',   label: '⚔️ 공격력 +1' },
      { type: 'maxUnits', label: '🏠 유닛 한도 +1' },
      { type: 'twinProb', label: this.twinProbability === 0 ? `👶 쌍둥이 ${(TWIN_INIT_PROB * 100).toFixed(0)}%` : `👶 쌍둥이 +${(TWIN_PROB_INC * 100).toFixed(0)}% (현재 ${(this.twinProbability * 100).toFixed(0)}%)` },
      { type: 'doubleAtk', label: this.doubleAttackProbability === 0 ? `⚡ 더블어택 ${(DOUBLE_ATK_INIT_PROB * 100).toFixed(0)}%` : `⚡ 더블어택 +${(DOUBLE_ATK_PROB_INC * 100).toFixed(0)}% (현재 ${(this.doubleAttackProbability * 100).toFixed(0)}%)` },
      { type: 'crit', label: this.criticalProbability === 0 ? `🎯 치명타 ${(CRIT_INIT_PROB * 100).toFixed(0)}%` : `🎯 치명타 +${(CRIT_PROB_INC * 100).toFixed(0)}% (현재 ${(this.criticalProbability * 100).toFixed(0)}%)` },
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

  // GD3: 미니보스 축소 보상 — 보스 풀과 분리, 골드(절반)/소량 확률 카드만. 2장 중 1택.
  generateMinibossRewards(): Reward[] {
    const pool: Reward[] = [
      { type: 'goldSmall', label: `💰 골드 +${MINIBOSS_GOLD_AMOUNT}` },
      { type: 'twinProb', label: this.twinProbability === 0 ? `👶 쌍둥이 ${(TWIN_INIT_PROB * 100).toFixed(0)}%` : `👶 쌍둥이 +${(TWIN_PROB_INC * 100).toFixed(0)}% (현재 ${(this.twinProbability * 100).toFixed(0)}%)` },
      { type: 'doubleAtk', label: this.doubleAttackProbability === 0 ? `⚡ 더블어택 ${(DOUBLE_ATK_INIT_PROB * 100).toFixed(0)}%` : `⚡ 더블어택 +${(DOUBLE_ATK_PROB_INC * 100).toFixed(0)}% (현재 ${(this.doubleAttackProbability * 100).toFixed(0)}%)` },
      { type: 'crit', label: this.criticalProbability === 0 ? `🎯 치명타 ${(CRIT_INIT_PROB * 100).toFixed(0)}%` : `🎯 치명타 +${(CRIT_PROB_INC * 100).toFixed(0)}% (현재 ${(this.criticalProbability * 100).toFixed(0)}%)` },
    ];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 2);
  }

  applyReward(type: RewardType): void {
    switch (type) {
      case 'enhance':  this.enhancePoints += 1; break;
      case 'gold':     this.gold += REWARD_GOLD_AMOUNT; break;
      case 'goldSmall': this.gold += MINIBOSS_GOLD_AMOUNT; break;
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
    const isJackpot = this.jackpotEnabled && Math.random() < JACKPOT_TIER2_PROB;
    const race = isJackpot
      ? HYBRID_RACES[Math.floor(Math.random() * HYBRID_RACES.length)]
      : TIER1_RACES[Math.floor(Math.random() * TIER1_RACES.length)];
    const { x1, y1, x2, y2 } = this.unitZone;
    let x: number, y: number, attempts = 0;
    do {
      x = x1 + Math.random() * (x2 - x1);
      y = y1 + Math.random() * (y2 - y1);
      attempts++;
    } while (attempts < 20 && this._onTrack(x, y));
    const unit = makeUnit(this._nextUnitId++, race, isJackpot ? 2 : 1, x, y);
    this.units.push(unit);
    this.pendingDiscoveries.push(race);
    if (isJackpot) {
      this.pendingJackpot = true;
      this.pendingNotification = `🎰 잭팟! ${race} 등장!`;
    }
    return unit;
  }

  // M3: canBreed 게이트(T1·잠금·예산·진행중·동일유닛) + 예산 소모. 부모 소모는 completeBreeding에서.
  startBreeding(idA: number, idB: number): boolean {
    const a = this.units.find(u => u.id === idA);
    const b = this.units.find(u => u.id === idB);
    if (!a || !b) return false;
    if (canBreed(a, b, this.breedsUsedThisGame) !== null) return false;
    // 부모 2 소모 → 자식 1 = 순감이라 정원 초과 불가 (E13) — 캡 체크 불필요
    const endMs = this.elapsedMs + BREEDING_DURATION_MS;
    a.isBreeding = true; a.breedingEndMs = endMs;
    b.isBreeding = true; b.breedingEndMs = endMs;
    this.breedsUsedThisGame += 1;
    return true;
  }

  // M3: 부모 2 제거 + resolveBreeding/resolveLineage 결과로 자식 1 생성. pendingHatch 큐에 연출 정보 적재.
  // Returns newly born units: [child] normally, [child, twin] on twin proc, [] on failure.
  completeBreeding(idA: number, idB: number): UnitData[] {
    const aIdx = this.units.findIndex(u => u.id === idA);
    const bIdx = this.units.findIndex(u => u.id === idB);
    if (aIdx < 0 || bIdx < 0) return [];
    const a = this.units[aIdx];
    const b = this.units[bIdx];
    const ox = (a.x + b.x) / 2 + (Math.random() - 0.5) * 20;
    const oy = (a.y + b.y) / 2 + (Math.random() - 0.5) * 20;

    // R3: W1-2 최초 1회 확정 교배 = 확정 희귀 (breedsUsedThisGame은 startBreeding에서 이미 +1된 상태이므로 1이면 "이번 판 첫 확정 교배")
    const forceRare = this.stageConfig.name === 'W1-2' && this.breedsUsedThisGame === 1;
    const outcome = resolveBreeding(a, b, this.pity, Math.random, forceRare);
    const { lineage, isNew } = resolveLineage(
      a, b, outcome, this.lineages, this._usedNames, this._nextLineageId, Math.random,
    );
    this.pity = outcome.pityAfter;
    this.pendingPitySave = true;
    if (isNew) {
      this.lineages.set(lineage.id, lineage);
      this._usedNames.add(lineage.name);
      this._nextLineageId += 1;
    }

    // 부모 2 제거 (인덱스 큰 쪽부터)
    const [hi, lo] = aIdx > bIdx ? [aIdx, bIdx] : [bIdx, aIdx];
    this.units.splice(hi, 1);
    this.units.splice(lo, 1);

    const child = makeUnit(this._nextUnitId++, outcome.childRace, 1, ox, oy);
    child.gen = outcome.childGen;
    child.lineageId = lineage.id;
    child.bloodlineName = lineage.name;
    // 특성(T2 기믹)은 W2-1 해금 전엔 상속·표기 안 함 (28-schools). 칭호(epithet)는 M3 변이 표기라 별개로 유지.
    if (this.features.traits) {
      if (outcome.inheritedTrait) child.trait = outcome.inheritedTrait;
      if (outcome.secondTrait) child.trait2 = outcome.secondTrait;
    }
    if (outcome.epithet) child.epithet = outcome.epithet;
    this.units.push(child);
    this.pendingDiscoveries.push(outcome.childRace);

    // 계보 노드 (이벤트 로그, 불변 — E2). M5: 혈통 귀속 3필드 포함(가문 체인 빌더용)
    this.pedigree.push({
      parentIds: [idA, idB], childId: child.id, childRace: outcome.childRace,
      childGen: outcome.childGen, mutation: outcome.mutation, cross: outcome.cross,
      lineageId: lineage.id, name: lineage.name, epithet: outcome.epithet,
    });

    // 부화 연출/영속 큐
    this.pendingHatch = {
      childId: child.id, race: outcome.childRace, gen: outcome.childGen,
      mutation: outcome.mutation, bloodlineName: lineage.name, epithet: outcome.epithet, isNewLineage: isNew,
    };
    if (outcome.mutation) this.pendingMutationRecord = outcome.mutation;
    if (outcome.mutation === 'common') this.gold += MUTATION_COMMON_GOLD;

    const born: UnitData[] = [child];

    // Twin check — 자식과 동일 혈통/Gen/특성 복제
    if (this.twinProbability > 0 && Math.random() < this.twinProbability && this.units.length < this.maxUnits) {
      const tx = ox + (Math.random() - 0.5) * 24;
      const ty = oy + (Math.random() - 0.5) * 24;
      const twin = makeUnit(this._nextUnitId++, outcome.childRace, 1, tx, ty);
      twin.gen = child.gen; twin.lineageId = child.lineageId; twin.bloodlineName = child.bloodlineName;
      if (child.trait) twin.trait = child.trait;
      if (child.trait2) twin.trait2 = child.trait2;
      if (child.epithet) twin.epithet = child.epithet;
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
      this.applyInheritance(hybrid, [a, b]);
      this.units.push(hybrid);
      this.pendingDiscoveries.push(tier2Race);
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
      this.applyInheritance(ultimate, [a, b]);
      this.units.push(ultimate);
      this.pendingDiscoveries.push(tier3Race);
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
      // 32: 神 탄생 = 영혼 촉매 필요 (T3 메인 운용화). 혈통 승계는 그대로 — 영혼은 승격 촉매지 T4 구매가 아님.
      if (this.enhancePoints < TIER4_SYNTHESIS_SOUL_COST) {
        this.pendingNotification = `⚠️ 神을 낳으려면 영혼 ${TIER4_SYNTHESIS_SOUL_COST} 필요 (보유 ${this.enhancePoints})`;
        return null;
      }
      const thirdIdx = this.units.findIndex(u => u.id === third.id);
      [aIdx, bIdx, thirdIdx].sort((x, y) => y - x).forEach(idx => this.units.splice(idx, 1));
      this.enhancePoints -= TIER4_SYNTHESIS_SOUL_COST;
      const astral = makeUnit(this._nextUnitId++, 'Astral_God', 4, hx, hy);
      this.applyInheritance(astral, [a, b, third]);
      this.units.push(astral);
      this.pendingDiscoveries.push('Astral_God');
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
    this.pendingDiscoveries.push(race);
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

  // M3: 융합 결과에 혈통 승계 적용 (최대 Gen 재료의 혈통·특성 계승 — inheritOnSynthesis, E5)
  private applyInheritance(result: UnitData, materials: UnitData[]): void {
    const inh = inheritOnSynthesis(materials, Math.random);
    if (inh.gen > 0) result.gen = inh.gen;
    if (inh.lineageId !== undefined) result.lineageId = inh.lineageId;
    if (inh.bloodlineName) result.bloodlineName = inh.bloodlineName;
    if (inh.trait) result.trait = inh.trait;
    if (inh.trait2) result.trait2 = inh.trait2;
    if (inh.epithet) result.epithet = inh.epithet;

    // M5: 융합 결과도 계보에 로깅 — "시조→교배→융합" 체인 완성 (혈통 승계된 경우만 귀속)
    this.pedigree.push({
      parentIds: [materials[0].id, materials[1].id],
      childId: result.id, childRace: result.race, childGen: result.gen ?? 0,
      cross: false,
      lineageId: result.lineageId, name: result.bloodlineName, epithet: result.epithet,
    });
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
