import Phaser from 'phaser';
import {
  BOSS_HP_PHASE_B_SCALAR,
  BOSS_HP_PHASE_C_SCALAR,
  BOSS_KILL_REWARD_PHASE_A,
  BOSS_KILL_REWARD_PHASE_B,
  BOSS_KILL_REWARD_PHASE_C,
  BOSS_PHASE_B_START_MS,
  BOSS_PHASE_C_START_MS,
  BOSS_SPEED_PHASE_A,
  BOSS_SPEED_PHASE_B,
  BOSS_SPEED_PHASE_C,
  ENEMY_TYPES,
  GAME_HEIGHT,
  GAME_WIDTH,
  KILL_REWARD,
  TANK_KILL_REWARD,
} from '../../game/config';
import { GameState } from '../../game/GameState';
import { EnemyType } from '../../game/types';
import { SoundManager } from '../SoundManager';

const ENEMY_EMOJI: Record<EnemyType, string> = {
  NORMAL: '👾',
  FAST:   '🐝',
  TANK:   '🐢',
};
const ENEMY_FONT: Record<EnemyType, string> = {
  NORMAL: '20px',
  FAST:   '16px',
  TANK:   '23px',
};
const BOSS_EMOJI = '👺';

type Enemy = Phaser.GameObjects.Text & {
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
  private sfx?: SoundManager;

  private enemies!: Phaser.GameObjects.Group;
  private enemyMap = new Map<number, Enemy>();
  private hpBarGraphics!: Phaser.GameObjects.Graphics;
  private flashGraphics!: Phaser.GameObjects.Graphics;
  private bossAuraGraphics?: Phaser.GameObjects.Graphics;
  private spawnAccumulatorMs = 0;
  private _nextEnemyId = 0;

  constructor(
    scene: Phaser.Scene,
    state: GameState,
    onBossKilled: () => void,
    sfx?: SoundManager,
  ) {
    this.scene = scene;
    this.state = state;
    this.onBossKilled = onBossKilled;
    this.sfx = sfx;
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
    const ms = this.state.elapsedMs;
    const overclockSpeedMult = this.state.currentEnemySpeed / 40;
    const isPhaseC = ms >= BOSS_PHASE_C_START_MS;

    const hpScalar = isPhaseC ? BOSS_HP_PHASE_C_SCALAR :
                     ms >= BOSS_PHASE_B_START_MS ? BOSS_HP_PHASE_B_SCALAR : 1;
    const speedMult = isPhaseC ? BOSS_SPEED_PHASE_C :
                      ms >= BOSS_PHASE_B_START_MS ? BOSS_SPEED_PHASE_B : BOSS_SPEED_PHASE_A;
    const killReward = isPhaseC ? BOSS_KILL_REWARD_PHASE_C :
                       ms >= BOSS_PHASE_B_START_MS ? BOSS_KILL_REWARD_PHASE_B : BOSS_KILL_REWARD_PHASE_A;

    const bossHp = Math.ceil(ENEMY_TYPES.NORMAL.hp * this.state.currentEnemyHp * this.state.stageConfig.bossHpMult * hpScalar);
    const bossEmoji = isPhaseC ? '👑' : BOSS_EMOJI;
    const bossFontSize = isPhaseC ? '48px' : '28px';
    const boss = this.scene.add.text(wp.x, wp.y, bossEmoji, {
      fontFamily: 'monospace', fontSize: bossFontSize,
    }).setOrigin(0.5) as unknown as Enemy;
    boss.id = this._nextEnemyId++;
    boss.hp = bossHp; boss.maxHp = bossHp;
    boss.speed = ENEMY_TYPES.NORMAL.speed * overclockSpeedMult * speedMult;
    boss.waypointIndex = 1; boss.enemyType = 'NORMAL'; boss.isBoss = true;
    boss.killReward = killReward;
    this.enemies.add(boss);
    this.enemyMap.set(boss.id, boss);
    this.state.registerSpawn();

    // U9: Phase C boss aura
    if (isPhaseC) {
      this.bossAuraGraphics?.destroy();
      this.bossAuraGraphics = this.scene.add.graphics().setDepth(0);
    }
  }

  clearAll(): void {
    for (const e of [...this.enemyMap.values()]) e.destroy();
    this.enemyMap.clear();
    this.enemies.clear(false, false);
    this.spawnAccumulatorMs = 0;
    this.bossAuraGraphics?.destroy();
    this.bossAuraGraphics = undefined;
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

    const { fastRatio, tankStartMs } = this.state.stageConfig;
    let type: EnemyType;
    if (this.state.elapsedMs >= tankStartMs && Math.random() < 0.15) {
      type = 'TANK';
    } else {
      type = Math.random() < fastRatio ? 'FAST' : 'NORMAL';
    }

    const def = ENEMY_TYPES[type];
    const overclockSpeedMult = this.state.currentEnemySpeed / 40;
    const hp = Math.ceil(def.hp * this.state.currentEnemyHp);
    const speed = def.speed * overclockSpeedMult;
    const killReward = type === 'TANK' ? TANK_KILL_REWARD : KILL_REWARD;

    const enemy = this.scene.add.text(wp.x, wp.y, ENEMY_EMOJI[type], {
      fontFamily: 'monospace', fontSize: ENEMY_FONT[type],
    }).setOrigin(0.5) as unknown as Enemy;
    enemy.id = this._nextEnemyId++;
    enemy.hp = hp; enemy.maxHp = hp; enemy.speed = speed;
    enemy.waypointIndex = (wpIdx + 1) % waypoints.length;
    enemy.enemyType = type; enemy.isBoss = false; enemy.killReward = killReward;
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
    // U9: Phase C boss aura
    if (this.bossAuraGraphics) {
      this.bossAuraGraphics.clear();
      const boss = [...this.enemyMap.values()].find(e => e.isBoss);
      if (boss) {
        this.bossAuraGraphics.lineStyle(6, 0xff2222, 0.65);
        this.bossAuraGraphics.strokeCircle(boss.x, boss.y, 46);
        this.bossAuraGraphics.lineStyle(3, 0xff6644, 0.35);
        this.bossAuraGraphics.strokeCircle(boss.x, boss.y, 60);
      } else {
        this.bossAuraGraphics.destroy();
        this.bossAuraGraphics = undefined;
      }
    }
    this.hpBarGraphics.clear();
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      const barW = e.isBoss ? 44 : e.enemyType === 'TANK' ? 30 : 20;
      const barH = e.isBoss ? 5 : e.enemyType === 'TANK' ? 4 : 3;
      const bx = e.x - barW / 2;
      const by = e.y - (e.displayHeight / 2) - 5;
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

    for (const { id, dx, dy } of result.knockbacks) {
      const enemy = this.enemyMap.get(id);
      if (enemy) {
        enemy.x = Phaser.Math.Clamp(enemy.x + dx, 10, GAME_WIDTH - 10);
        enemy.y = Phaser.Math.Clamp(enemy.y + dy, 80, GAME_HEIGHT - 80);
      }
    }

    let bossKilled = false;
    let hadKills = false;
    for (const id of result.killedIds) {
      const enemy = this.enemyMap.get(id);
      if (enemy) {
        if (enemy.isBoss) bossKilled = true;
        hadKills = true;
        enemy.destroy();
        this.enemyMap.delete(id);
      }
    }
    if (hadKills) this.sfx?.playSFX('kill');
    if (bossKilled && !this.state.isPaused) this.onBossKilled();

    if (result.attacks.length > 0) {
      this.flashGraphics.clear();
      this.flashGraphics.lineStyle(2, 0xffff00, 1);
      for (const atk of result.attacks) {
        this.flashGraphics.beginPath();
        this.flashGraphics.moveTo(atk.unitX, atk.unitY);
        this.flashGraphics.lineTo(atk.enemyX, atk.enemyY);
        this.flashGraphics.strokePath();
        if (atk.damage > 0) {
          const jitter = Phaser.Math.Between(-5, 5);
          const label = atk.isCrit ? `${atk.damage}!` : String(atk.damage);
          const color = atk.isCrit ? '#ffaa22' : '#ffffff';
          const fontSize = atk.isCrit ? '14px' : '11px';
          const dmgText = this.scene.add.text(atk.enemyX + jitter, atk.enemyY - 8, label, {
            fontFamily: 'monospace', fontSize, color,
          }).setOrigin(0.5).setDepth(5);
          this.scene.tweens.add({
            targets: dmgText,
            y: atk.enemyY - 38,
            alpha: 0,
            duration: 650,
            onComplete: () => dmgText.destroy(),
          });
        }
      }
      this.scene.time.delayedCall(100, () => this.flashGraphics.clear());
    }
  }
}
