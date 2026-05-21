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
  TRACK_WAYPOINTS,
  UNIT_ZONE,
} from '../game/config';
import { GameState } from '../game/GameState';
import { EnemyType, HybridRace, Race, UnitData, UnitRace } from '../game/types';

const CENTER_X = GAME_WIDTH / 2;
const CENTER_Y = GAME_HEIGHT / 2;

const RACE_COLORS: Record<UnitRace, number> = {
  Human:      0x4488ff,
  Beast:      0x44cc44,
  Robot:      0xaa44cc,
  Human_Robot: 0x00eeff, // teal  — extreme range
  Human_Beast: 0xff44aa, // pink  — fast attack
  Beast_Robot: 0xff7700, // orange — burst damage
};

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
  private minuteWarning?: Phaser.GameObjects.Text;
  private gameOverContainer?: Phaser.GameObjects.Container;
  private spawnAccumulatorMs = 0;
  private unitObjects = new Map<number, Phaser.GameObjects.Arc>();
  private rangeCircles = new Map<number, Phaser.GameObjects.Graphics>();
  private heartTexts = new Map<number, Phaser.GameObjects.Text>();
  private zzzTexts = new Map<number, Phaser.GameObjects.Text>();
  private _nextEnemyId = 0;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.state = new GameState();
    this.enemies = this.add.group();

    // Track (ㅁ자 path)
    const g = this.add.graphics();
    g.lineStyle(36, 0x333333, 1);
    g.strokeRect(
      TRACK_WAYPOINTS[0].x,
      TRACK_WAYPOINTS[0].y,
      TRACK_WAYPOINTS[1].x - TRACK_WAYPOINTS[0].x,
      TRACK_WAYPOINTS[3].y - TRACK_WAYPOINTS[0].y,
    );

    this.hpBarGraphics = this.add.graphics().setDepth(2);
    this.flashGraphics = this.add.graphics().setDepth(3);

    // Top HUD (76px)
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

    // Bottom button bar (76px)
    this.add.rectangle(0, GAME_HEIGHT - 76, GAME_WIDTH, 76, 0x111111).setOrigin(0, 0).setDepth(5);
    this.summonBtn = this.add.text(CENTER_X - 4, GAME_HEIGHT - 52, '', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
      backgroundColor: '#335533', padding: { x: 12, y: 8 },
    }).setOrigin(1, 0.5).setDepth(6).setInteractive({ useHandCursor: true });
    this.summonBtn.on('pointerdown', () => {
      const unit = this.state.summon();
      if (unit) this.addUnitCircle(unit);
    });

    this.popBtn = this.add.text(CENTER_X + 4, GAME_HEIGHT - 52, '', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
      backgroundColor: '#553322', padding: { x: 12, y: 8 },
    }).setOrigin(0, 0.5).setDepth(6).setInteractive({ useHandCursor: true });
    this.popBtn.on('pointerdown', () => { this.state.upgradePopulation(); });

    // Scene-level drag
    this.input.on('dragstart', (_ptr: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject) => {
      (go as Phaser.GameObjects.Arc).setDepth(4);
    });
    this.input.on('drag', (_ptr: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
      const arc = go as Phaser.GameObjects.Arc;
      arc.x = dragX;
      arc.y = dragY;
    });
    this.input.on('dragend', (_ptr: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject, _dropped: boolean) => {
      const arc = go as Phaser.GameObjects.Arc;
      arc.setDepth(0);
      const unitId = arc.getData('unitId') as number;
      this.handleDrop(unitId, arc);
    });
  }

  update(_time: number, deltaMs: number): void {
    if (this.isPhase('gameover')) return;

    this.state.tick(deltaMs);
    this.timerText.setText(this.state.formatTimer());
    this.countText.setText(`${this.state.enemyCount} / 50`);
    this.goldText.setText(`Gold: ${this.state.gold}`);
    this.unitText.setText(`Units: ${this.state.units.length}/${this.state.maxUnits}`);
    this.gemsText.setText(`Gem: ${this.state.gems}`);
    this.summonBtn.setText(`소환 (${this.state.summonCost}G)`);
    this.popBtn.setText(`사회성 (${this.state.populationUpgradeCost}G)`);

    // Boss spawn on minute boundary
    if (this.state.pendingBossSpawn) {
      this.state.pendingBossSpawn = false;
      this.spawnBoss();
      this.showMinuteWarning();
    }

    this.syncZzzTexts();
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

  private isPhase(p: 'playing' | 'clear' | 'overclock' | 'gameover'): boolean {
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
    enemy.hp = hp;
    enemy.maxHp = hp;
    enemy.speed = speed;
    enemy.waypointIndex = (wpIdx + 1) % TRACK_WAYPOINTS.length;
    enemy.enemyType = type;
    enemy.isBoss = false;
    enemy.killReward = KILL_REWARD;
    this.enemies.add(enemy);
    this.enemyMap.set(enemy.id, enemy);
    this.state.registerSpawn();
  }

  private spawnBoss(): void {
    const wp = TRACK_WAYPOINTS[0]; // fixed at top-left corner
    const overclockSpeedMult = this.state.currentEnemySpeed / 40;
    const bossHp = Math.ceil(ENEMY_TYPES.NORMAL.hp * this.state.currentEnemyHp * BOSS_HP_MULT);
    const boss = this.add.rectangle(wp.x, wp.y, 32, 32, 0x0055ff) as Enemy;
    boss.id = this._nextEnemyId++;
    boss.hp = bossHp;
    boss.maxHp = bossHp;
    boss.speed = ENEMY_TYPES.NORMAL.speed * overclockSpeedMult;
    boss.waypointIndex = 1;
    boss.enemyType = 'NORMAL';
    boss.isBoss = true;
    boss.killReward = BOSS_KILL_REWARD;
    this.enemies.add(boss);
    this.enemyMap.set(boss.id, boss);
    this.state.registerSpawn();
  }

  private showMinuteWarning(): void {
    this.minuteWarning?.destroy();
    this.minuteWarning = this.add.text(CENTER_X, CENTER_Y - 80, '[시간 경과: 적들이 더 흉포해집니다!]', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ff6666', align: 'center',
    }).setOrigin(0.5).setDepth(8);
    this.time.delayedCall(2500, () => {
      this.minuteWarning?.destroy();
      this.minuteWarning = undefined;
    });
  }

  private moveEnemies(deltaMs: number): void {
    const dtSec = deltaMs / 1000;
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      const wp = TRACK_WAYPOINTS[e.waypointIndex];
      const dx = wp.x - e.x;
      const dy = wp.y - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 8) {
        e.waypointIndex = (e.waypointIndex + 1) % TRACK_WAYPOINTS.length;
        return;
      }
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
      const fillColor = pct > 0.5 ? 0x44cc44 : pct > 0.25 ? 0xffcc00 : 0xff4444;
      this.hpBarGraphics.fillStyle(fillColor);
      this.hpBarGraphics.fillRect(bx, by, barW * pct, barH);
    });
  }

  private handleCombat(): void {
    if (this.state.units.length === 0) return;

    const snapshots = this.enemies.getChildren().map((obj) => {
      const e = obj as Enemy;
      const wp = TRACK_WAYPOINTS[e.waypointIndex];
      return {
        id: e.id,
        x: e.x,
        y: e.y,
        hp: e.hp,
        progressScore: e.waypointIndex * 1000 - Math.hypot(wp.x - e.x, wp.y - e.y),
        killReward: e.killReward,
      };
    });

    const result = this.state.processCombat(snapshots);

    for (const { id, hp } of result.hpUpdates) {
      const enemy = this.enemyMap.get(id);
      if (enemy) enemy.hp = hp;
    }

    for (const id of result.killedIds) {
      const enemy = this.enemyMap.get(id);
      if (enemy) {
        enemy.destroy();
        this.enemyMap.delete(id);
      }
    }

    if (result.attacks.length > 0) {
      this.flashGraphics.clear();
      this.flashGraphics.lineStyle(2, 0xffff00, 1);
      for (const atk of result.attacks) {
        this.flashGraphics.beginPath();
        this.flashGraphics.moveTo(atk.unitX, atk.unitY);
        this.flashGraphics.lineTo(atk.enemyX, atk.enemyY);
        this.flashGraphics.strokePath();
      }
      this.time.delayedCall(100, () => this.flashGraphics.clear());
    }
  }

  private isValidUnitPosition(x: number, y: number): boolean {
    return (
      x >= UNIT_ZONE.x1 && x <= UNIT_ZONE.x2 &&
      y >= UNIT_ZONE.y1 && y <= Math.min(UNIT_ZONE.y2, GAME_HEIGHT - 76)
    );
  }

  private handleDrop(droppedId: number, go: Phaser.GameObjects.Arc): void {
    const droppedUnit = this.state.units.find(u => u.id === droppedId);
    if (!droppedUnit) return;

    if (droppedUnit.tier === 2 || droppedUnit.isBreeding || droppedUnit.isExhausted) {
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
      // Empty space — move if position is valid
      if (this.isValidUnitPosition(go.x, go.y)) {
        this.state.moveUnit(droppedId, go.x, go.y);
        this.rangeCircles.get(droppedId)?.setPosition(go.x, go.y);
        // go already sits at go.x, go.y from dragging — no snap needed
        return;
      }
      go.setPosition(droppedUnit.x, droppedUnit.y);
      return;
    }

    const targetUnit = this.state.units.find(u => u.id === targetId);
    if (!targetUnit || targetUnit.tier === 2 || targetUnit.isBreeding || targetUnit.isExhausted) {
      go.setPosition(droppedUnit.x, droppedUnit.y);
      return;
    }

    go.setPosition(droppedUnit.x, droppedUnit.y); // snap back regardless

    if (droppedUnit.race === targetUnit.race) {
      const started = this.state.startBreeding(droppedId, targetId);
      if (started) this.startBreedingEffect(droppedId, targetId);
    } else {
      const hybrid = this.state.synthesize(droppedId, targetId);
      if (hybrid) {
        this.removeUnitObject(droppedId);
        this.removeUnitObject(targetId);
        this.addUnitCircle(hybrid);
      }
    }
  }

  private startBreedingEffect(idA: number, idB: number): void {
    const goA = this.unitObjects.get(idA);
    const goB = this.unitObjects.get(idB);
    if (!goA || !goB) return;

    const heartA = this.add.text(goA.x, goA.y - 18, '❤', {
      fontSize: '16px', color: '#ff4444',
    }).setOrigin(0.5).setDepth(2);
    const heartB = this.add.text(goB.x, goB.y - 18, '❤', {
      fontSize: '16px', color: '#ff4444',
    }).setOrigin(0.5).setDepth(2);
    this.heartTexts.set(idA, heartA);
    this.heartTexts.set(idB, heartB);

    this.time.delayedCall(BREEDING_DURATION_MS, () => {
      heartA.destroy();
      heartB.destroy();
      this.heartTexts.delete(idA);
      this.heartTexts.delete(idB);
      const offspring = this.state.completeBreeding(idA, idB);
      if (offspring) this.addUnitCircle(offspring);
    });
  }

  private syncZzzTexts(): void {
    for (const unit of this.state.units) {
      const go = this.unitObjects.get(unit.id);
      if (!go) continue;
      if (unit.isExhausted) {
        if (!this.zzzTexts.has(unit.id)) {
          const t = this.add.text(go.x, go.y - 18, 'zzz', {
            fontSize: '12px', color: '#aaaaff',
          }).setOrigin(0.5).setDepth(2);
          this.zzzTexts.set(unit.id, t);
        }
      } else {
        const t = this.zzzTexts.get(unit.id);
        if (t) { t.destroy(); this.zzzTexts.delete(unit.id); }
      }
    }
  }

  private removeUnitObject(id: number): void {
    this.unitObjects.get(id)?.destroy();
    this.unitObjects.delete(id);
    this.rangeCircles.get(id)?.destroy();
    this.rangeCircles.delete(id);
    this.heartTexts.get(id)?.destroy();
    this.heartTexts.delete(id);
    this.zzzTexts.get(id)?.destroy();
    this.zzzTexts.delete(id);
  }

  private getUnitRange(race: UnitRace): number {
    if (race in RACE_STATS) return RACE_STATS[race as Race].range;
    return HYBRID_STATS[race as HybridRace].range;
  }

  private addUnitCircle(unit: UnitData): void {
    const range = this.getUnitRange(unit.race);
    const color = RACE_COLORS[unit.race];

    const rangeGfx = this.add.graphics();
    rangeGfx.lineStyle(1, color, 0.2);
    rangeGfx.strokeCircle(0, 0, range);
    rangeGfx.setPosition(unit.x, unit.y);
    this.rangeCircles.set(unit.id, rangeGfx);

    const radius = unit.tier === 2 ? 16 : 10;
    const circle = this.add.circle(unit.x, unit.y, radius, color);
    if (unit.tier === 2) circle.setStrokeStyle(3, 0xffffff);

    circle.setInteractive({ useHandCursor: true });
    this.input.setDraggable(circle);
    circle.setData('unitId', unit.id);
    this.unitObjects.set(unit.id, circle);
  }

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
    if (hasGems) {
      gemBtn.on('pointerdown', () => { this.gemContinue(); });
    }

    container.add([bg, title, restartBtn, gemBtn]);
    this.gameOverContainer = container;
  }

  private gemContinue(): void {
    if (!this.state.useGemContinue()) return;

    // Destroy all enemies
    for (const e of [...this.enemyMap.values()]) e.destroy();
    this.enemyMap.clear();
    this.enemies.clear(false, false);
    this.spawnAccumulatorMs = 0;

    // Clear GAME OVER banner if shown
    this.banner?.destroy();
    this.banner = undefined;

    // Close popup
    this.gameOverContainer?.destroy();
    this.gameOverContainer = undefined;
  }

  private showBanner(text: string, color: string): void {
    if (this.banner) return;
    this.banner = this.add.text(CENTER_X, CENTER_Y, text, {
      fontFamily: 'monospace', fontSize: '24px', color, align: 'center',
    }).setOrigin(0.5);
  }
}
