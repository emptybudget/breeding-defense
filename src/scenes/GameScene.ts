import Phaser from 'phaser';
import {
  BOSS_HP_MULT,
  BOSS_KILL_REWARD,
  BREEDING_DURATION_MS,
  ENEMY_TYPES,
  GAME_HEIGHT,
  GAME_WIDTH,
  HYBRID_STATS,
  KILL_REWARD,
  RACE_STATS,
  SELL_GOLD_TIER1,
  SELL_GOLD_TIER2,
  SELL_GOLD_TIER3,
  TIER3_STATS,
  TRACK_WAYPOINTS,
  UNIT_ZONE,
} from '../game/config';
import { GameState, Phase } from '../game/GameState';
import { EnemyType, HybridRace, Race, Reward, Tier3Race, UnitData, UnitRace } from '../game/types';
import { CENTER_X, CENTER_Y, RACE_COLORS, RACE_EMOJI, SELL_ZONE_X, SELL_ZONE_Y } from './constants';
import { NotificationRenderer } from './render/NotificationRenderer';

type Enemy = Phaser.GameObjects.Rectangle & {
  id: number;
  hp: number;
  maxHp: number;
  speed: number;
  waypointIndex: number;
  enemyType: EnemyType;
  isBoss: boolean;
  killReward: number;
};

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private enemies!: Phaser.GameObjects.Group;
  private enemyMap = new Map<number, Enemy>();
  private timerText!: Phaser.GameObjects.Text;
  private countText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private unitText!: Phaser.GameObjects.Text;
  private gemsText!: Phaser.GameObjects.Text;
  private summonBtn!: Phaser.GameObjects.Text;
  private popBtn!: Phaser.GameObjects.Text;
  private flashGraphics!: Phaser.GameObjects.Graphics;
  private hpBarGraphics!: Phaser.GameObjects.Graphics;
  private banner?: Phaser.GameObjects.Text;
  private notificationRenderer!: NotificationRenderer;
  private gameOverContainer?: Phaser.GameObjects.Container;
  private victoryContainer?: Phaser.GameObjects.Container;
  private dimOverlay?: Phaser.GameObjects.Rectangle;
  private rewardContainer?: Phaser.GameObjects.Container;
  private spawnAccumulatorMs = 0;
  private unitObjects = new Map<number, Phaser.GameObjects.Text>();
  private rangeCircles = new Map<number, Phaser.GameObjects.Graphics>();
  private heartTexts = new Map<number, Phaser.GameObjects.Text>();
  private zzzTexts = new Map<number, Phaser.GameObjects.Text>();
  private lockTexts = new Map<number, Phaser.GameObjects.Text>();
  private _nextEnemyId = 0;
  // Boss reward state
  private allRewards: Reward[] = [];

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.state = new GameState();
    this.notificationRenderer = new NotificationRenderer(this);
    this.enemies = this.add.group();

    // Track
    const g = this.add.graphics();
    g.lineStyle(36, 0x333333, 1);
    g.strokeRect(
      TRACK_WAYPOINTS[0].x, TRACK_WAYPOINTS[0].y,
      TRACK_WAYPOINTS[1].x - TRACK_WAYPOINTS[0].x,
      TRACK_WAYPOINTS[3].y - TRACK_WAYPOINTS[0].y,
    );

    this.hpBarGraphics = this.add.graphics().setDepth(2);
    this.flashGraphics = this.add.graphics().setDepth(3);

    // Top HUD
    this.add.rectangle(0, 0, GAME_WIDTH, 76, 0x111111).setOrigin(0, 0).setDepth(5);
    this.timerText = this.add.text(12, 8, '00:00', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
    }).setDepth(6);
    this.gemsText = this.add.text(CENTER_X, 8, 'Gem: 3', {
      fontFamily: 'monospace', fontSize: '16px', color: '#aaddff',
    }).setOrigin(0.5, 0).setDepth(6);
    this.countText = this.add.text(GAME_WIDTH - 12, 8, '0 / 50', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffaaaa',
    }).setOrigin(1, 0).setDepth(6);
    this.goldText = this.add.text(12, 42, 'Gold: 100', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffd700',
    }).setDepth(6);
    this.unitText = this.add.text(GAME_WIDTH - 12, 42, `Units: 0/${this.state.maxUnits}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#aaffaa',
    }).setOrigin(1, 0).setDepth(6);

    // Bottom bar
    this.add.rectangle(0, GAME_HEIGHT - 76, GAME_WIDTH, 76, 0x111111).setOrigin(0, 0).setDepth(5);

    this.summonBtn = this.add.text(80, GAME_HEIGHT - 52, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
      backgroundColor: '#335533', padding: { x: 10, y: 8 },
    }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true });
    this.summonBtn.on('pointerdown', () => {
      const unit = this.state.summon();
      if (unit) this.addUnitCircle(unit);
    });

    this.popBtn = this.add.text(210, GAME_HEIGHT - 52, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
      backgroundColor: '#553322', padding: { x: 10, y: 8 },
    }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true });
    this.popBtn.on('pointerdown', () => { this.state.upgradePopulation(); });

    // Sell zone (bottom-right)
    this.add.text(SELL_ZONE_X, SELL_ZONE_Y, '🗑️', {
      fontSize: '20px', backgroundColor: '#551111', padding: { x: 6, y: 4 },
    }).setOrigin(0.5).setDepth(6);

    // Drag events
    this.input.on('dragstart', (_ptr: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject) => {
      (go as Phaser.GameObjects.Text).setDepth(4);
    });
    this.input.on('drag', (_ptr: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
      const label = go as Phaser.GameObjects.Text;
      label.x = dragX;
      label.y = dragY;
    });
    this.input.on('dragend', (_ptr: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject, _dropped: boolean) => {
      const label = go as Phaser.GameObjects.Text;
      label.setDepth(1);
      const unitId = label.getData('unitId') as number;
      this.handleDrop(unitId, label);
    });
  }

  update(_time: number, deltaMs: number): void {
    if (this.isPhase('gameover')) return;

    this.state.tick(deltaMs);

    // HUD always updates
    this.timerText.setText(this.state.formatTimer());
    this.countText.setText(`${this.state.enemyCount} / 50`);
    this.goldText.setText(`Gold: ${this.state.gold}`);
    this.unitText.setText(`Units: ${this.state.units.length}/${this.state.maxUnits}`);
    this.gemsText.setText(`Gem: ${this.state.gems}`);
    this.summonBtn.setText(`소환 (${this.state.summonCost}G)`);
    this.popBtn.setText(`사회성 (${this.state.populationUpgradeCost}G)`);

    // Boss spawn triggered by tick()
    if (this.state.pendingBossSpawn) {
      this.state.pendingBossSpawn = false;
      this.spawnBoss();
      this.notificationRenderer.add('👹 보스가 등장했습니다!', '#ff6666');
    }

    // Victory check
    if (this.isPhase('victory')) {
      if (!this.victoryContainer) this.showVictoryPopup();
      return;
    }

    // Pause guard — skip all gameplay when reward popup is active
    if (this.state.isPaused) return;

    this.syncZzzTexts();
    this.syncLockTexts();
    this.handleSpawning(deltaMs);
    this.moveEnemies(deltaMs);
    this.drawHpBars();
    this.handleCombat();

    if (this.isPhase('gameover')) {
      this.showGameOverPopup();
      return;
    }

    if (this.isPhase('clear')) {
      this.showBanner('Game Clear!\n오버클록 모드 진입!', '#ffd24a');
      this.time.delayedCall(1500, () => {
        this.banner?.destroy();
        this.banner = undefined;
        this.state.enterOverclock();
      });
    }
  }

  private isPhase(p: Phase): boolean {
    return this.state.phase === p;
  }

  private handleSpawning(deltaMs: number): void {
    this.spawnAccumulatorMs += deltaMs;
    const interval = this.state.currentSpawnIntervalMs;
    while (this.spawnAccumulatorMs >= interval && !this.isPhase('gameover')) {
      this.spawnAccumulatorMs -= interval;
      this.spawnEnemy();
      if (this.isPhase('gameover')) break;
    }
  }

  private spawnEnemy(): void {
    const wpIdx = Phaser.Math.Between(0, TRACK_WAYPOINTS.length - 1);
    const wp = TRACK_WAYPOINTS[wpIdx];
    const type: EnemyType = Math.random() < 0.5 ? 'NORMAL' : 'FAST';
    const def = ENEMY_TYPES[type];
    const overclockSpeedMult = this.state.currentEnemySpeed / 40;
    const hp = Math.ceil(def.hp * this.state.currentEnemyHp);
    const speed = def.speed * overclockSpeedMult;
    const color = type === 'FAST' ? 0xffcc00 : 0xff3344;
    const size = type === 'FAST' ? 10 : 16;
    const enemy = this.add.rectangle(wp.x, wp.y, size, size, color) as Enemy;
    enemy.id = this._nextEnemyId++;
    enemy.hp = hp; enemy.maxHp = hp; enemy.speed = speed;
    enemy.waypointIndex = (wpIdx + 1) % TRACK_WAYPOINTS.length;
    enemy.enemyType = type; enemy.isBoss = false; enemy.killReward = KILL_REWARD;
    this.enemies.add(enemy);
    this.enemyMap.set(enemy.id, enemy);
    this.state.registerSpawn();
  }

  private spawnBoss(): void {
    const wp = TRACK_WAYPOINTS[0];
    const overclockSpeedMult = this.state.currentEnemySpeed / 40;
    const bossHp = Math.ceil(ENEMY_TYPES.NORMAL.hp * this.state.currentEnemyHp * BOSS_HP_MULT);
    const boss = this.add.rectangle(wp.x, wp.y, 32, 32, 0x0055ff) as Enemy;
    boss.id = this._nextEnemyId++;
    boss.hp = bossHp; boss.maxHp = bossHp;
    boss.speed = ENEMY_TYPES.NORMAL.speed * overclockSpeedMult;
    boss.waypointIndex = 1; boss.enemyType = 'NORMAL'; boss.isBoss = true;
    boss.killReward = BOSS_KILL_REWARD;
    this.enemies.add(boss);
    this.enemyMap.set(boss.id, boss);
    this.state.registerSpawn();
  }

  private moveEnemies(deltaMs: number): void {
    const dtSec = deltaMs / 1000;
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      const wp = TRACK_WAYPOINTS[e.waypointIndex];
      const dx = wp.x - e.x; const dy = wp.y - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 8) { e.waypointIndex = (e.waypointIndex + 1) % TRACK_WAYPOINTS.length; return; }
      const step = e.speed * dtSec;
      e.x += (dx / dist) * step;
      e.y += (dy / dist) * step;
    });
  }

  private drawHpBars(): void {
    this.hpBarGraphics.clear();
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      const barW = e.isBoss ? 44 : 20;
      const barH = e.isBoss ? 5 : 3;
      const bx = e.x - barW / 2;
      const by = e.y - e.displayHeight / 2 - 5;
      this.hpBarGraphics.fillStyle(0x333333);
      this.hpBarGraphics.fillRect(bx, by, barW, barH);
      const pct = Math.max(0, e.hp / e.maxHp);
      this.hpBarGraphics.fillStyle(pct > 0.5 ? 0x44cc44 : pct > 0.25 ? 0xffcc00 : 0xff4444);
      this.hpBarGraphics.fillRect(bx, by, barW * pct, barH);
    });
  }

  private handleCombat(): void {
    if (this.state.units.length === 0) return;

    const snapshots = this.enemies.getChildren().map((obj) => {
      const e = obj as Enemy;
      const wp = TRACK_WAYPOINTS[e.waypointIndex];
      return {
        id: e.id, x: e.x, y: e.y, hp: e.hp,
        progressScore: e.waypointIndex * 1000 - Math.hypot(wp.x - e.x, wp.y - e.y),
        killReward: e.killReward,
      };
    });

    const result = this.state.processCombat(snapshots);

    for (const { id, hp } of result.hpUpdates) {
      const enemy = this.enemyMap.get(id);
      if (enemy) enemy.hp = hp;
    }

    let bossKilled = false;
    for (const id of result.killedIds) {
      const enemy = this.enemyMap.get(id);
      if (enemy) {
        if (enemy.isBoss) bossKilled = true;
        enemy.destroy();
        this.enemyMap.delete(id);
      }
    }
    if (bossKilled && !this.state.isPaused) this.onBossKilled();

    if (result.attacks.length > 0) {
      this.flashGraphics.clear();
      this.flashGraphics.lineStyle(2, 0xffff00, 1);
      for (const atk of result.attacks) {
        this.flashGraphics.beginPath();
        this.flashGraphics.moveTo(atk.unitX, atk.unitY);
        this.flashGraphics.lineTo(atk.enemyX, atk.enemyY);
        this.flashGraphics.strokePath();
        if (atk.isCrit) {
          const critText = this.add.text(atk.enemyX, atk.enemyY - 10, 'CRIT!', {
            fontFamily: 'monospace', fontSize: '13px', color: '#ff2222',
          }).setOrigin(0.5).setDepth(4);
          this.tweens.add({
            targets: critText,
            y: atk.enemyY - 40,
            alpha: 0,
            duration: 700,
            onComplete: () => critText.destroy(),
          });
        }
      }
      this.time.delayedCall(100, () => this.flashGraphics.clear());
    }
  }

  // ─── Boss reward popup ──────────────────────────────────────────────

  private onBossKilled(): void {
    this.state.isPaused = true;
    this.allRewards = this.state.generateRewards(3); // pre-generate 3, show 2
    this.showRewardPopup(2);
  }

  private showRewardPopup(count: 2 | 3): void {
    this.rewardContainer?.destroy();
    this.dimOverlay?.destroy();

    this.dimOverlay = this.add
      .rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72)
      .setDepth(15);

    const container = this.add.container(CENTER_X, CENTER_Y).setDepth(16);
    const bg = this.add.rectangle(0, 0, 326, 230, 0x111122, 0.96);

    const title = this.add.text(0, -95, '⚔️ 보스 처치!\n보상을 선택하세요', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffd700', align: 'center',
    }).setOrigin(0.5);

    const rewards = this.allRewards.slice(0, count);
    const xPositions = count === 2 ? [-82, 82] : [-115, 0, 115];

    const cards = rewards.map((reward, i) => {
      const card = this.add.text(xPositions[i], 10, reward.label, {
        fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
        backgroundColor: '#1a3355', padding: { x: 10, y: 16 },
        align: 'center',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      card.on('pointerover', () => card.setStyle({ backgroundColor: '#2a5588' }));
      card.on('pointerout', () => card.setStyle({ backgroundColor: '#1a3355' }));
      card.on('pointerdown', () => {
        this.state.applyReward(reward.type);
        this.closeRewardPopup();
      });
      return card;
    });

    const items: Phaser.GameObjects.GameObject[] = [bg, title, ...cards];

    if (count === 2 && this.state.gems > 0) {
      const expandBtn = this.add.text(0, 100, `💎 선택지 추가 (보석 ${this.state.gems}개)`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#aaddff',
        backgroundColor: '#113344', padding: { x: 12, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      expandBtn.on('pointerdown', () => {
        if (this.state.gems <= 0) return;
        this.state.gems -= 1;
        this.showRewardPopup(3);
      });
      items.push(expandBtn);
    }

    container.add(items);
    this.rewardContainer = container;
  }

  private closeRewardPopup(): void {
    this.rewardContainer?.destroy();
    this.rewardContainer = undefined;
    this.dimOverlay?.destroy();
    this.dimOverlay = undefined;
    this.allRewards = [];
  }

  // ─── Unit drag & drop ───────────────────────────────────────────────

  private isOnSellZone(x: number, y: number): boolean {
    return x >= GAME_WIDTH - 70 && y >= GAME_HEIGHT - 76;
  }

  private isValidUnitPosition(x: number, y: number): boolean {
    return (
      x >= UNIT_ZONE.x1 && x <= UNIT_ZONE.x2 &&
      y >= UNIT_ZONE.y1 && y <= Math.min(UNIT_ZONE.y2, GAME_HEIGHT - 76)
    );
  }

  private handleDrop(droppedId: number, go: Phaser.GameObjects.Text): void {
    const droppedUnit = this.state.units.find(u => u.id === droppedId);
    if (!droppedUnit) return;

    // Sell zone (highest priority)
    if (this.isOnSellZone(go.x, go.y)) {
      const sellGold = droppedUnit.tier === 3 ? SELL_GOLD_TIER3 : droppedUnit.tier === 2 ? SELL_GOLD_TIER2 : SELL_GOLD_TIER1;
      this.state.sellUnit(droppedId);
      this.removeUnitObject(droppedId);
      this.notificationRenderer.add(`💰 유닛 판매 +${sellGold}G`, '#ffd700');
      return;
    }

    // Breeding units can't act
    if (droppedUnit.isBreeding) {
      go.setPosition(droppedUnit.x, droppedUnit.y);
      return;
    }

    // Find nearest unit within 35px
    let targetId: number | null = null;
    for (const [id, other] of this.unitObjects) {
      if (id === droppedId) continue;
      if (Math.hypot(go.x - other.x, go.y - other.y) <= 35) {
        targetId = id;
        break;
      }
    }

    if (targetId === null) {
      // Empty space — all tiers can move
      if (this.isValidUnitPosition(go.x, go.y)) {
        this.state.moveUnit(droppedId, go.x, go.y);
        this.rangeCircles.get(droppedId)?.setPosition(go.x, go.y);
        return;
      }
      go.setPosition(droppedUnit.x, droppedUnit.y);
      return;
    }

    // Interaction
    go.setPosition(droppedUnit.x, droppedUnit.y); // snap back as default

    const targetUnit = this.state.units.find(u => u.id === targetId);
    if (!targetUnit || targetUnit.isBreeding) return;

    // Tier-3 units cannot interact
    if (droppedUnit.tier === 3 || targetUnit.tier === 3) return;

    // Tier-2 + Tier-2 → tier-3 synthesis
    if (droppedUnit.tier === 2 && targetUnit.tier === 2) {
      if (droppedUnit.isLocked || targetUnit.isLocked) return;
      const result = this.state.synthesize(droppedId, targetId);
      if (result) {
        this.removeUnitObject(droppedId);
        this.removeUnitObject(targetId);
        this.addUnitCircle(result);
      } else if (this.state.pendingNotification) {
        this.notificationRenderer.add(this.state.pendingNotification, '#ffaa44');
        this.state.pendingNotification = null;
      }
      return;
    }

    // Mismatched tiers → snap back already done
    if (droppedUnit.tier !== 1 || targetUnit.tier !== 1) return;

    // Tier-1 + Tier-1: check constraints
    if (droppedUnit.isExhausted || droppedUnit.isLocked) return;
    if (targetUnit.isExhausted || targetUnit.isLocked) return;

    if (droppedUnit.race === targetUnit.race) {
      const started = this.state.startBreeding(droppedId, targetId);
      if (started) {
        // Snap droppedUnit next to target (밀착 연출)
        const snapX = Math.min(UNIT_ZONE.x2, targetUnit.x + 18);
        const snapY = targetUnit.y;
        this.state.moveUnit(droppedId, snapX, snapY);
        go.setPosition(snapX, snapY);
        this.rangeCircles.get(droppedId)?.setPosition(snapX, snapY);
        this.startBreedingEffect(droppedId, targetId);
      }
    } else {
      const result = this.state.synthesize(droppedId, targetId);
      if (result) {
        this.removeUnitObject(droppedId);
        this.removeUnitObject(targetId);
        this.addUnitCircle(result);
      }
    }
  }

  private startBreedingEffect(idA: number, idB: number): void {
    const goA = this.unitObjects.get(idA);
    const goB = this.unitObjects.get(idB);
    if (!goA || !goB) return;

    const heartA = this.add.text(goA.x, goA.y - 22, '❤', {
      fontSize: '14px', color: '#ff4444',
    }).setOrigin(0.5).setDepth(2);
    const heartB = this.add.text(goB.x, goB.y - 22, '❤', {
      fontSize: '14px', color: '#ff4444',
    }).setOrigin(0.5).setDepth(2);
    this.heartTexts.set(idA, heartA);
    this.heartTexts.set(idB, heartB);

    this.time.delayedCall(BREEDING_DURATION_MS, () => {
      heartA.destroy(); heartB.destroy();
      this.heartTexts.delete(idA); this.heartTexts.delete(idB);
      const born = this.state.completeBreeding(idA, idB);
      for (const u of born) this.addUnitCircle(u);
    });
  }

  private syncZzzTexts(): void {
    for (const unit of this.state.units) {
      const go = this.unitObjects.get(unit.id);
      if (!go) continue;
      if (unit.isExhausted) {
        const existing = this.zzzTexts.get(unit.id);
        if (!existing) {
          const t = this.add.text(go.x, go.y - 16, 'zzz', {
            fontSize: '11px', color: '#aaaaff',
          }).setOrigin(0.5).setDepth(2);
          this.zzzTexts.set(unit.id, t);
        } else {
          existing.setPosition(go.x, go.y - 16);
        }
      } else {
        const t = this.zzzTexts.get(unit.id);
        if (t) { t.destroy(); this.zzzTexts.delete(unit.id); }
      }
    }
  }

  private syncLockTexts(): void {
    for (const unit of this.state.units) {
      const go = this.unitObjects.get(unit.id);
      if (!go) continue;
      if (unit.isLocked) {
        const existing = this.lockTexts.get(unit.id);
        if (!existing) {
          const t = this.add.text(go.x, go.y - 28, '🔒', {
            fontSize: '11px',
          }).setOrigin(0.5).setDepth(2);
          this.lockTexts.set(unit.id, t);
        } else {
          existing.setPosition(go.x, go.y - 28);
        }
      } else {
        const t = this.lockTexts.get(unit.id);
        if (t) { t.destroy(); this.lockTexts.delete(unit.id); }
      }
    }
  }

  private removeUnitObject(id: number): void {
    this.unitObjects.get(id)?.destroy();    this.unitObjects.delete(id);
    this.rangeCircles.get(id)?.destroy();   this.rangeCircles.delete(id);
    this.heartTexts.get(id)?.destroy();     this.heartTexts.delete(id);
    this.zzzTexts.get(id)?.destroy();       this.zzzTexts.delete(id);
    this.lockTexts.get(id)?.destroy();      this.lockTexts.delete(id);
  }

  private getUnitRange(race: UnitRace): number {
    if (race in TIER3_STATS) return TIER3_STATS[race as Tier3Race].range;
    if (race in RACE_STATS) return RACE_STATS[race as Race].range;
    return HYBRID_STATS[race as HybridRace].range;
  }

  private addUnitCircle(unit: UnitData): void {
    const range = this.getUnitRange(unit.race);
    const color = RACE_COLORS[unit.race];

    const rangeGfx = this.add.graphics().setDepth(0);
    rangeGfx.lineStyle(1, color, 0.2);
    rangeGfx.strokeCircle(0, 0, range);
    rangeGfx.setPosition(unit.x, unit.y);
    this.rangeCircles.set(unit.id, rangeGfx);

    const fontSize = unit.tier === 3 ? '30px' : unit.tier === 2 ? '26px' : '20px';
    const label = this.add.text(unit.x, unit.y, RACE_EMOJI[unit.race], {
      fontSize,
    }).setOrigin(0.5).setDepth(1);

    label.setInteractive({ useHandCursor: true });
    this.input.setDraggable(label);
    label.setData('unitId', unit.id);

    // Double-click to toggle lock
    const clickState = { time: 0, x: 0, y: 0 };
    label.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      const now = Date.now();
      if (now - clickState.time < 300 && Math.hypot(ptr.x - clickState.x, ptr.y - clickState.y) < 10) {
        this.state.toggleLock(unit.id);
      }
      clickState.time = now;
      clickState.x = ptr.x;
      clickState.y = ptr.y;
    });

    this.unitObjects.set(unit.id, label);
  }

  // ─── Game over popup ────────────────────────────────────────────────

  private showGameOverPopup(): void {
    if (this.gameOverContainer) return;

    const container = this.add.container(CENTER_X, CENTER_Y).setDepth(20);
    const bg = this.add.rectangle(0, 0, 290, 210, 0x000000, 0.88);
    const title = this.add.text(0, -78, 'GAME OVER', {
      fontFamily: 'monospace', fontSize: '24px', color: '#ff5555',
    }).setOrigin(0.5);

    const restartBtn = this.add.text(0, -24, '  다시하기  ', {
      fontFamily: 'monospace', fontSize: '15px', color: '#ffffff',
      backgroundColor: '#334433', padding: { x: 14, y: 9 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => { this.scene.restart(); });

    const hasGems = this.state.gems > 0;
    const gemBtn = this.add.text(0, 44, `  보석(${this.state.gems})로 이어하기  `, {
      fontFamily: 'monospace', fontSize: '14px',
      color: hasGems ? '#ffffff' : '#666666',
      backgroundColor: hasGems ? '#334455' : '#222222',
      padding: { x: 14, y: 9 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: hasGems });
    if (hasGems) gemBtn.on('pointerdown', () => { this.gemContinue(); });

    container.add([bg, title, restartBtn, gemBtn]);
    this.gameOverContainer = container;
  }

  private gemContinue(): void {
    if (!this.state.useGemContinue()) return;
    for (const e of [...this.enemyMap.values()]) e.destroy();
    this.enemyMap.clear();
    this.enemies.clear(false, false);
    this.spawnAccumulatorMs = 0;
    this.banner?.destroy(); this.banner = undefined;
    this.gameOverContainer?.destroy(); this.gameOverContainer = undefined;
  }

  private showBanner(text: string, color: string): void {
    if (this.banner) return;
    this.banner = this.add.text(CENTER_X, CENTER_Y, text, {
      fontFamily: 'monospace', fontSize: '24px', color, align: 'center',
    }).setOrigin(0.5);
  }

  private showVictoryPopup(): void {
    const container = this.add.container(CENTER_X, CENTER_Y).setDepth(20);
    const bg = this.add.rectangle(0, 0, 310, 240, 0x000000, 0.92);
    const title = this.add.text(0, -95, '🏆 VICTORY 🏆', {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffd700', align: 'center',
    }).setOrigin(0.5);
    const gemInfo = this.add.text(0, -48, `보석 +1 획득! 현재 💎 ${this.state.gems}개`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#aaddff', align: 'center',
    }).setOrigin(0.5);

    const restartBtn = this.add.text(-95, 30, ' 다시하기 ', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
      backgroundColor: '#334433', padding: { x: 8, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => { this.scene.restart(); });

    const infiniteBtn = this.add.text(0, 30, ' 무한 모드 ', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
      backgroundColor: '#334455', padding: { x: 8, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    infiniteBtn.on('pointerdown', () => {
      this.state.phase = 'playing';
      this.state.isInfiniteMode = true;
      this.state.isPaused = false;
      container.destroy();
      this.victoryContainer = undefined;
    });

    const menuBtn = this.add.text(95, 30, ' 메인메뉴 ', {
      fontFamily: 'monospace', fontSize: '13px', color: '#888888',
      backgroundColor: '#222222', padding: { x: 8, y: 8 },
    }).setOrigin(0.5).setAlpha(0.4);
    menuBtn.disableInteractive();

    container.add([bg, title, gemInfo, restartBtn, infiniteBtn, menuBtn]);
    this.victoryContainer = container;
  }
}
