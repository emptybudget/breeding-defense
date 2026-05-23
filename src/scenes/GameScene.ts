import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, META_STARS_PER_VICTORY } from '../game/config';
import { GameState, Phase } from '../game/GameState';
import { MetaProgress } from '../game/MetaProgress';
import { CENTER_X, CENTER_Y } from './constants';
import { DragController } from './input/DragController';
import { EnemyRenderer } from './render/EnemyRenderer';
import { HudRenderer } from './render/HudRenderer';
import { NotificationRenderer } from './render/NotificationRenderer';
import { PopupRenderer } from './render/PopupRenderer';
import { UnitRenderer } from './render/UnitRenderer';

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private metaProgress!: MetaProgress;
  private starsAwarded = false;
  private enemyRenderer!: EnemyRenderer;
  private hudRenderer!: HudRenderer;
  private popupRenderer!: PopupRenderer;
  private banner?: Phaser.GameObjects.Text;
  private notificationRenderer!: NotificationRenderer;
  private unitRenderer!: UnitRenderer;
  private dragController!: DragController;
  private mineGraphics!: Phaser.GameObjects.Graphics;
  private dangerBorder!: Phaser.GameObjects.Graphics;
  private dangerTween?: Phaser.Tweens.Tween;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.metaProgress = new MetaProgress();
    this.starsAwarded = false;
    this.state = new GameState(this.metaProgress.getData());
    this.notificationRenderer = new NotificationRenderer(this);
    this.unitRenderer = new UnitRenderer(this, this.state);
    this.hudRenderer = new HudRenderer(
      this,
      () => { const unit = this.state.summon(); if (unit) this.unitRenderer.addUnit(unit); },
      () => { this.state.upgradePopulation(); },
      () => { this.onPause(); },
    );
    this.popupRenderer = new PopupRenderer(
      this,
      this.state,
      () => { this.scene.restart(); },
      () => { this.gemContinue(); },
      () => {
        this.state.phase = 'playing';
        this.state.isInfiniteMode = true;
        this.state.isPaused = false;
      },
      () => { this.scene.start('StageSelectScene'); },
    );
    this.enemyRenderer = new EnemyRenderer(
      this,
      this.state,
      () => { this.onBossKilled(); },
    );

    // Track (dynamic polygon each game)
    const g = this.add.graphics();
    g.lineStyle(36, 0x333333, 1);
    const wp = this.state.trackWaypoints;
    g.beginPath();
    g.moveTo(wp[0].x, wp[0].y);
    for (let i = 1; i < wp.length; i++) g.lineTo(wp[i].x, wp[i].y);
    g.closePath();
    g.strokePath();

    // Mine rendering layer (above track, below enemies)
    this.mineGraphics = this.add.graphics();

    // Danger border (40+ enemies)
    this.dangerTween = undefined;
    this.dangerBorder = this.add.graphics().setDepth(50);
    this.dangerBorder.lineStyle(10, 0xff2222, 1);
    this.dangerBorder.strokeRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.dangerBorder.setAlpha(0);

    this.enemyRenderer.create();
    this.hudRenderer.create(this.state);

    this.dragController = new DragController(this, this.state, this.unitRenderer, this.notificationRenderer, this.popupRenderer);
    this.dragController.register();

    // Show tutorial overlay and pause until dismissed
    this.state.isPaused = true;
    this.popupRenderer.showTutorial(() => { this.state.isPaused = false; });
  }

  update(_time: number, deltaMs: number): void {
    if (this.isPhase('gameover')) return;

    this.state.tick(deltaMs);

    // HUD always updates
    this.hudRenderer.update(this.state);
    this.updateDangerBorder();

    // Boss alert (5s before spawn)
    if (this.state.pendingBossAlert) {
      this.state.pendingBossAlert = false;
      this.notificationRenderer.add('⚠️ 보스 출현 5초 전!', '#ff8800');
    }

    // Boss spawn triggered by tick()
    if (this.state.pendingBossSpawn) {
      this.state.pendingBossSpawn = false;
      this.enemyRenderer.spawnBoss();
      this.notificationRenderer.add('👹 보스가 등장했습니다!', '#ff6666');
    }

    // Kill streak bonus
    if (this.state.pendingStreakBonus) {
      this.state.pendingStreakBonus = false;
      this.notificationRenderer.add('🔥 킬 스트릭! +10G', '#ffdd00');
    }

    // Victory check
    if (this.isPhase('victory')) {
      if (!this.popupRenderer.hasVictoryPopup) {
        if (!this.starsAwarded) {
          this.metaProgress.addStars(META_STARS_PER_VICTORY);
          this.starsAwarded = true;
        }
        this.popupRenderer.showVictory();
      }
      return;
    }

    // Pause guard — skip all gameplay when reward popup is active
    if (this.state.isPaused) return;

    this.unitRenderer.syncOverlays();

    // Render mines as small yellow circles
    this.mineGraphics.clear();
    if (this.state.mines.length > 0) {
      this.mineGraphics.fillStyle(0xffee00, 0.85);
      for (const mine of this.state.mines) {
        this.mineGraphics.fillCircle(mine.x, mine.y, 6);
      }
    }

    this.enemyRenderer.update(deltaMs);

    if (this.isPhase('gameover')) {
      this.popupRenderer.showGameOver();
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

  private updateDangerBorder(): void {
    const danger = this.state.enemyCount >= 40;
    if (danger && !this.dangerTween) {
      this.dangerTween = this.tweens.add({
        targets: this.dangerBorder,
        alpha: { from: 0, to: 0.7 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    } else if (!danger && this.dangerTween) {
      this.dangerTween.stop();
      this.dangerTween = undefined;
      this.dangerBorder.setAlpha(0);
    }
  }

  private isPhase(p: Phase): boolean {
    return this.state.phase === p;
  }

  private onBossKilled(): void {
    this.state.isPaused = true;
    const rewards = this.state.generateRewards(3);
    this.popupRenderer.showReward(2, rewards);
  }

  private onPause(): void {
    if (this.state.isPaused || this.state.phase === 'gameover' || this.state.phase === 'victory') return;
    this.state.isPaused = true;
    this.popupRenderer.showPause(
      () => { this.state.isPaused = false; },
      () => { this.scene.start('StageSelectScene'); },
    );
  }

  private gemContinue(): void {
    if (!this.state.useGemContinue()) return;
    this.enemyRenderer.clearAll();
    this.banner?.destroy(); this.banner = undefined;
    this.popupRenderer.hideGameOver();
  }

  private showBanner(text: string, color: string): void {
    if (this.banner) return;
    this.banner = this.add.text(CENTER_X, CENTER_Y, text, {
      fontFamily: 'monospace', fontSize: '24px', color, align: 'center',
    }).setOrigin(0.5);
  }

}
