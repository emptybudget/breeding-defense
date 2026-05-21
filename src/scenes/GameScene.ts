import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/config';
import { GameState } from '../game/GameState';

const CENTER_X = GAME_WIDTH / 2;
const CENTER_Y = GAME_HEIGHT / 2;

type Enemy = Phaser.GameObjects.Rectangle & {
  hp: number;
  speed: number;
};

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private enemies!: Phaser.GameObjects.Group;
  private timerText!: Phaser.GameObjects.Text;
  private countText!: Phaser.GameObjects.Text;
  private banner?: Phaser.GameObjects.Text;
  private spawnAccumulatorMs = 0;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.state = new GameState();
    this.enemies = this.add.group();

    // HUD
    this.add.rectangle(0, 0, GAME_WIDTH, 48, 0x111111).setOrigin(0, 0);
    this.timerText = this.add.text(12, 12, '00:00', {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffffff',
    });
    this.countText = this.add.text(GAME_WIDTH - 12, 12, '0 / 50', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffaaaa',
    }).setOrigin(1, 0);

    // Center marker (temporary)
    this.add.circle(CENTER_X, CENTER_Y, 16, 0x2244aa).setStrokeStyle(2, 0x88aaff);
  }

  update(_time: number, deltaMs: number): void {
    if (this.isPhase('gameover')) return;

    this.state.tick(deltaMs);
    this.timerText.setText(this.state.formatTimer());
    this.countText.setText(`${this.state.enemyCount} / 50`);

    this.handleSpawning(deltaMs);
    this.moveEnemies(deltaMs);

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
    const edge = Phaser.Math.Between(0, 3);
    let x = 0, y = 0;
    if (edge === 0) { x = Phaser.Math.Between(0, GAME_WIDTH); y = 56; }
    else if (edge === 1) { x = Phaser.Math.Between(0, GAME_WIDTH); y = GAME_HEIGHT - 8; }
    else if (edge === 2) { x = 8; y = Phaser.Math.Between(56, GAME_HEIGHT - 8); }
    else { x = GAME_WIDTH - 8; y = Phaser.Math.Between(56, GAME_HEIGHT - 8); }

    const enemy = this.add.rectangle(x, y, 16, 16, 0xff3344) as Enemy;
    enemy.hp = this.state.currentEnemyHp;
    enemy.speed = this.state.currentEnemySpeed;
    this.enemies.add(enemy);
    this.state.registerSpawn();
  }

  private moveEnemies(deltaMs: number): void {
    const dtSec = deltaMs / 1000;
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      const dx = CENTER_X - e.x;
      const dy = CENTER_Y - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 18) return; // reached center; idle (combat not implemented yet)
      const step = e.speed * dtSec;
      e.x += (dx / dist) * step;
      e.y += (dy / dist) * step;
    });
  }

  private showBanner(text: string, color: string): void {
    if (this.banner) return;
    this.banner = this.add.text(CENTER_X, CENTER_Y, text, {
      fontFamily: 'monospace', fontSize: '24px', color, align: 'center',
    }).setOrigin(0.5);
  }
}
