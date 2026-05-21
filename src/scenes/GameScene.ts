import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TRACK_WAYPOINTS, UNIT_ATTACK_RANGE, UNIT_CAP } from '../game/config';
import { GameState } from '../game/GameState';
import { Race, UnitData } from '../game/types';

const CENTER_X = GAME_WIDTH / 2;
const CENTER_Y = GAME_HEIGHT / 2;

const RACE_COLORS: Record<Race, number> = {
  Human: 0x4488ff,
  Beast: 0x44cc44,
  Robot: 0xaa44cc,
};

type Enemy = Phaser.GameObjects.Rectangle & {
  id: number;
  hp: number;
  speed: number;
  waypointIndex: number;
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
  private flashGraphics!: Phaser.GameObjects.Graphics;
  private banner?: Phaser.GameObjects.Text;
  private spawnAccumulatorMs = 0;
  private unitCircles = new Map<number, Phaser.GameObjects.Arc>();
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
    this.unitText = this.add.text(GAME_WIDTH - 12, 42, `Units: 0/${UNIT_CAP}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#aaffaa',
    }).setOrigin(1, 0).setDepth(6);

    // Summon button
    this.summonBtn = this.add.text(CENTER_X, GAME_HEIGHT - 36, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#335533',
      padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true });
    this.summonBtn.on('pointerdown', () => {
      const unit = this.state.summon();
      if (unit) this.addUnitCircle(unit);
    });
  }

  update(_time: number, deltaMs: number): void {
    if (this.isPhase('gameover')) return;

    this.state.tick(deltaMs);
    this.timerText.setText(this.state.formatTimer());
    this.countText.setText(`${this.state.enemyCount} / 50`);
    this.goldText.setText(`Gold: ${this.state.gold}`);
    this.unitText.setText(`Units: ${this.state.units.length}/${UNIT_CAP}`);
    this.summonBtn.setText(`유닛 소환 (${this.state.summonCost}G)`);

    this.handleSpawning(deltaMs);
    this.moveEnemies(deltaMs);
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
    const enemy = this.add.rectangle(wp.x, wp.y, 16, 16, 0xff3344) as Enemy;
    enemy.id = this._nextEnemyId++;
    enemy.hp = this.state.currentEnemyHp;
    enemy.speed = this.state.currentEnemySpeed;
    enemy.waypointIndex = (wpIdx + 1) % TRACK_WAYPOINTS.length;
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

  private addUnitCircle(unit: UnitData): void {
    // Range indicator (faint outline)
    this.add.graphics()
      .lineStyle(1, RACE_COLORS[unit.race], 0.2)
      .strokeCircle(unit.x, unit.y, UNIT_ATTACK_RANGE);

    const circle = this.add.circle(unit.x, unit.y, 10, RACE_COLORS[unit.race]);
    this.unitCircles.set(unit.id, circle);
  }

  private showBanner(text: string, color: string): void {
    if (this.banner) return;
    this.banner = this.add.text(CENTER_X, CENTER_Y, text, {
      fontFamily: 'monospace', fontSize: '24px', color, align: 'center',
    }).setOrigin(0.5);
  }
}
