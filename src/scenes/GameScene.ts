import Phaser from 'phaser';
import { BREEDING_DURATION_MS, ENEMY_TYPES, GAME_HEIGHT, GAME_WIDTH, TRACK_WAYPOINTS, UNIT_ATTACK_RANGE } from '../game/config';
import { GameState } from '../game/GameState';
import { EnemyType, UnitData, UnitRace } from '../game/types';

const CENTER_X = GAME_WIDTH / 2;
const CENTER_Y = GAME_HEIGHT / 2;

const RACE_COLORS: Record<UnitRace, number> = {
  Human: 0x4488ff,
  Beast: 0x44cc44,
  Robot: 0xaa44cc,
  Hybrid: 0xffaa00,
};

type Enemy = Phaser.GameObjects.Rectangle & {
  id: number;
  hp: number;
  maxHp: number;
  speed: number;
  waypointIndex: number;
  enemyType: EnemyType;
};

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private enemies!: Phaser.GameObjects.Group;
  private enemyMap = new Map<number, Enemy>();
  private timerText!: Phaser.GameObjects.Text;
  private countText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private unitText!: Phaser.GameObjects.Text;
  private summonBtn!: Phaser.GameObjects.Text;
  private popBtn!: Phaser.GameObjects.Text;
  private flashGraphics!: Phaser.GameObjects.Graphics;
  private hpBarGraphics!: Phaser.GameObjects.Graphics;
  private banner?: Phaser.GameObjects.Text;
  private spawnAccumulatorMs = 0;
  private unitObjects = new Map<number, Phaser.GameObjects.Arc>();
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

    // HP bar graphics (above enemies)
    this.hpBarGraphics = this.add.graphics().setDepth(2);

    // Flash graphics for attack lines (above enemies, below HUD)
    this.flashGraphics = this.add.graphics().setDepth(3);

    // HUD background (76px for two rows)
    this.add.rectangle(0, 0, GAME_WIDTH, 76, 0x111111).setOrigin(0, 0).setDepth(5);
    this.timerText = this.add.text(12, 8, '00:00', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
    }).setDepth(6);
    this.countText = this.add.text(GAME_WIDTH - 12, 8, '0 / 50', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffaaaa',
    }).setOrigin(1, 0).setDepth(6);
    this.goldText = this.add.text(12, 42, 'Gold: 100', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffd700',
    }).setDepth(6);
    this.unitText = this.add.text(GAME_WIDTH - 12, 42, `Units: 0/${this.state.maxUnits}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#aaffaa',
    }).setOrigin(1, 0).setDepth(6);

    // Bottom button bar background
    this.add.rectangle(0, GAME_HEIGHT - 76, GAME_WIDTH, 76, 0x111111).setOrigin(0, 0).setDepth(5);

    // Summon button (left side of bottom bar)
    this.summonBtn = this.add.text(CENTER_X - 4, GAME_HEIGHT - 52, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#335533',
      padding: { x: 12, y: 8 },
    }).setOrigin(1, 0.5).setDepth(6).setInteractive({ useHandCursor: true });
    this.summonBtn.on('pointerdown', () => {
      const unit = this.state.summon();
      if (unit) this.addUnitCircle(unit);
    });

    // Population upgrade button (right side of bottom bar)
    this.popBtn = this.add.text(CENTER_X + 4, GAME_HEIGHT - 52, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#553322',
      padding: { x: 12, y: 8 },
    }).setOrigin(0, 0.5).setDepth(6).setInteractive({ useHandCursor: true });
    this.popBtn.on('pointerdown', () => {
      this.state.upgradePopulation();
    });

    // Scene-level drag events for unit circles
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
    this.summonBtn.setText(`소환 (${this.state.summonCost}G)`);
    this.popBtn.setText(`사회성 (${this.state.populationUpgradeCost}G)`);

    this.syncZzzTexts();
    this.handleSpawning(deltaMs);
    this.moveEnemies(deltaMs);
    this.drawHpBars();
    this.handleCombat();

    if (this.isPhase('gameover')) {
      this.showBanner('GAME OVER', '#ff5555');
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
    // currentEnemyHp is the overclock multiplier relative to ENEMY_BASE_HP(1)
    const overclockMult = this.state.currentEnemyHp;
    const hp = Math.ceil(def.hp * overclockMult);
    // currentEnemySpeed is absolute (base 40); scale each type's speed by the same ratio
    const overclockSpeedMult = this.state.currentEnemySpeed / 40;
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
    this.enemies.add(enemy);
    this.enemyMap.set(enemy.id, enemy);
    this.state.registerSpawn();
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
      const barW = 20;
      const barH = 3;
      const bx = e.x - barW / 2;
      const by = e.y - (e.displayHeight / 2) - 6;
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

  private handleDrop(droppedId: number, go: Phaser.GameObjects.Arc): void {
    const droppedUnit = this.state.units.find(u => u.id === droppedId);
    if (!droppedUnit) return;

    // Tier-2, breeding, or exhausted units can't interact
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
      // Breeding: same race
      const started = this.state.startBreeding(droppedId, targetId);
      if (started) this.startBreedingEffect(droppedId, targetId);
    } else {
      // Synthesis: different race
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
      // zzz texts are shown via syncZzzTexts() in update()
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
        if (t) {
          t.destroy();
          this.zzzTexts.delete(unit.id);
        }
      }
    }
  }

  private removeUnitObject(id: number): void {
    this.unitObjects.get(id)?.destroy();
    this.unitObjects.delete(id);
    this.heartTexts.get(id)?.destroy();
    this.heartTexts.delete(id);
    this.zzzTexts.get(id)?.destroy();
    this.zzzTexts.delete(id);
  }

  private addUnitCircle(unit: UnitData): void {
    // Range indicator (faint outline)
    this.add.graphics()
      .lineStyle(1, RACE_COLORS[unit.race], 0.2)
      .strokeCircle(unit.x, unit.y, UNIT_ATTACK_RANGE);

    const radius = unit.tier === 2 ? 16 : 10;
    const circle = this.add.circle(unit.x, unit.y, radius, RACE_COLORS[unit.race]);
    if (unit.tier === 2) circle.setStrokeStyle(3, 0xffffff);

    circle.setInteractive({ useHandCursor: true });
    this.input.setDraggable(circle);
    circle.setData('unitId', unit.id);
    this.unitObjects.set(unit.id, circle);
  }

  private showBanner(text: string, color: string): void {
    if (this.banner) return;
    this.banner = this.add.text(CENTER_X, CENTER_Y, text, {
      fontFamily: 'monospace', fontSize: '24px', color, align: 'center',
    }).setOrigin(0.5);
  }
}
