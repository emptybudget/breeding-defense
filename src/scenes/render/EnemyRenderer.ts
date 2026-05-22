import Phaser from 'phaser';
import {
  BOSS_HP_MULT,
  BOSS_KILL_REWARD,
  ENEMY_TYPES,
  KILL_REWARD,
} from '../../game/config';
import { GameState } from '../../game/GameState';
import { EnemyType } from '../../game/types';
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

export class EnemyRenderer {
  private scene: Phaser.Scene;
  private state: GameState;
  private onBossKilled: () => void;

  private enemies!: Phaser.GameObjects.Group;
  private enemyMap = new Map<number, Enemy>();
  private hpBarGraphics!: Phaser.GameObjects.Graphics;
  private flashGraphics!: Phaser.GameObjects.Graphics;
  private spawnAccumulatorMs = 0;
  private _nextEnemyId = 0;

  constructor(
    scene: Phaser.Scene,
    state: GameState,
    onBossKilled: () => void,
  ) {
    this.scene = scene;
    this.state = state;
    this.onBossKilled = onBossKilled;
  }

  create(): void {
    this.enemies = this.scene.add.group();
    this.hpBarGraphics = this.scene.add.graphics().setDepth(2);
    this.flashGraphics = this.scene.add.graphics().setDepth(3);
  }

  update(deltaMs: number): void {
    this.handleSpawning(deltaMs);
    this.moveEnemies(deltaMs);
    this.drawHpBars();
    this.handleCombat();
  }

  spawnBoss(): void {
    const wp = this.state.trackWaypoints[0];
    const overclockSpeedMult = this.state.currentEnemySpeed / 40;
    const bossHp = Math.ceil(ENEMY_TYPES.NORMAL.hp * this.state.currentEnemyHp * BOSS_HP_MULT);
    const boss = this.scene.add.rectangle(wp.x, wp.y, 32, 32, 0x0055ff) as Enemy;
    boss.id = this._nextEnemyId++;
    boss.hp = bossHp; boss.maxHp = bossHp;
    boss.speed = ENEMY_TYPES.NORMAL.speed * overclockSpeedMult;
    boss.waypointIndex = 1; boss.enemyType = 'NORMAL'; boss.isBoss = true;
    boss.killReward = BOSS_KILL_REWARD;
    this.enemies.add(boss);
    this.enemyMap.set(boss.id, boss);
    this.state.registerSpawn();
  }

  clearAll(): void {
    for (const e of [...this.enemyMap.values()]) e.destroy();
    this.enemyMap.clear();
    this.enemies.clear(false, false);
    this.spawnAccumulatorMs = 0;
  }

  private handleSpawning(deltaMs: number): void {
    this.spawnAccumulatorMs += deltaMs;
    const interval = this.state.currentSpawnIntervalMs;
    while (this.spawnAccumulatorMs >= interval) {
      this.spawnAccumulatorMs -= interval;
      this.spawnEnemy();
      if ((this.state.phase as string) === 'gameover') break;
    }
  }

  private spawnEnemy(): void {
    const waypoints = this.state.trackWaypoints;
    const wpIdx = Phaser.Math.Between(0, waypoints.length - 1);
    const wp = waypoints[wpIdx];
    const type: EnemyType = Math.random() < 0.5 ? 'NORMAL' : 'FAST';
    const def = ENEMY_TYPES[type];
    const overclockSpeedMult = this.state.currentEnemySpeed / 40;
    const hp = Math.ceil(def.hp * this.state.currentEnemyHp);
    const speed = def.speed * overclockSpeedMult;
    const color = type === 'FAST' ? 0xffcc00 : 0xff3344;
    const size = type === 'FAST' ? 10 : 16;
    const enemy = this.scene.add.rectangle(wp.x, wp.y, size, size, color) as Enemy;
    enemy.id = this._nextEnemyId++;
    enemy.hp = hp; enemy.maxHp = hp; enemy.speed = speed;
    enemy.waypointIndex = (wpIdx + 1) % waypoints.length;
    enemy.enemyType = type; enemy.isBoss = false; enemy.killReward = KILL_REWARD;
    this.enemies.add(enemy);
    this.enemyMap.set(enemy.id, enemy);
    this.state.registerSpawn();
  }

  private moveEnemies(deltaMs: number): void {
    const dtSec = deltaMs / 1000;
    const waypoints = this.state.trackWaypoints;
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      const wp = waypoints[e.waypointIndex];
      const dx = wp.x - e.x; const dy = wp.y - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 8) { e.waypointIndex = (e.waypointIndex + 1) % waypoints.length; return; }
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

    const waypoints = this.state.trackWaypoints;
    const snapshots = this.enemies.getChildren().map((obj) => {
      const e = obj as Enemy;
      const wp = waypoints[e.waypointIndex];
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
          const critText = this.scene.add.text(atk.enemyX, atk.enemyY - 10, 'CRIT!', {
            fontFamily: 'monospace', fontSize: '13px', color: '#ff2222',
          }).setOrigin(0.5).setDepth(4);
          this.scene.tweens.add({
            targets: critText,
            y: atk.enemyY - 40,
            alpha: 0,
            duration: 700,
            onComplete: () => critText.destroy(),
          });
        }
      }
      this.scene.time.delayedCall(100, () => this.flashGraphics.clear());
    }
  }
}
