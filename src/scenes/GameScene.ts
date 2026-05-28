import Phaser from 'phaser';
import { BOSS_KILL_ENHANCE_POINT, BOSS_PHASE_C_START_MS, BOSS_PHASE_B_START_MS, GAME_HEIGHT, GAME_WIDTH } from '../game/config';
import { GameState, Phase } from '../game/GameState';
import { MetaProgress } from '../game/MetaProgress';
import { CENTER_X, CENTER_Y } from './constants';
import { DragController } from './input/DragController';
import { EnemyRenderer } from './render/EnemyRenderer';
import { HudRenderer } from './render/HudRenderer';
import { NotificationRenderer } from './render/NotificationRenderer';
import { PopupRenderer } from './render/PopupRenderer';
import { UnitRenderer } from './render/UnitRenderer';
import { SoundManager } from './SoundManager';

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
  private sfx!: SoundManager;
  private overclockSfxPlayed = false;
  private bossTimerText?: Phaser.GameObjects.Text;
  private speedMult: 1 | 2 = 1;
  private stageId = 1;
  private _lastCritHapticMs = 0;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.metaProgress = new MetaProgress();
    this.starsAwarded = false;
    this.overclockSfxPlayed = false;
    this.stageId = ((this.scene.settings.data as Record<string, unknown>)?.stageId as number) ?? 1;
    this.state = new GameState(this.metaProgress.getData(), this.stageId);
    this.sfx = new SoundManager();
    this.sfx.startBGM();
    this.notificationRenderer = new NotificationRenderer(this);
    this.unitRenderer = new UnitRenderer(this, this.state);
    const speed2xUnlocked = this.metaProgress.getLevel('gameSpeed2x') > 0;
    this.hudRenderer = new HudRenderer(
      this,
      () => { const unit = this.state.summon(); if (unit) this.unitRenderer.addUnit(unit); },
      () => { this.state.upgradePopulation(); },
      () => { this.onPause(); },
      () => { this.onRecipeBook(); },
      () => { this.onSoulShop(); },
      () => { this.toggleSpeedMult(); },
      () => this.speedMult,
      speed2xUnlocked,
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
      () => { this.adRevive(); },
    );
    this.enemyRenderer = new EnemyRenderer(
      this,
      this.state,
      () => { this.onBossKilled(); },
      this.sfx,
    );

    // Track (dynamic polygon each game)
    const g = this.add.graphics();
    g.lineStyle(36, 0x2a2818, 1);
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

    this.dragController = new DragController(this, this.state, this.unitRenderer, this.notificationRenderer, this.popupRenderer, this.sfx);
    this.dragController.register();

    // Blur / visibility → auto-pause to prevent game-over during interruptions
    this.game.events.on('blur', () => { this.autoPause(); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.autoPause();
    });

    // Show tutorial → stage intro → start
    this.state.isPaused = true;
    this.popupRenderer.showTutorial(() => {
      this.showStageIntro(() => { this.state.isPaused = false; });
    });
  }

  private autoPause(): void {
    if (this.state.phase === 'playing' || this.state.phase === 'overclock') {
      if (!this.state.isPaused) this.onPause();
    }
  }

  private showStageIntro(onDone: () => void): void {
    const text = this.add.text(CENTER_X, CENTER_Y - 40, this.state.stageConfig.name, {
      fontFamily: 'monospace', fontSize: '32px', color: '#ffd700',
      stroke: '#000000', strokeThickness: 5, align: 'center',
    }).setOrigin(0.5).setDepth(25).setAlpha(0);
    this.tweens.add({ targets: text, alpha: 1, duration: 400, onComplete: () => {
      this.time.delayedCall(800, () => {
        this.tweens.add({ targets: text, alpha: 0, duration: 500,
          onComplete: () => { text.destroy(); onDone(); }
        });
      });
    }});
  }

  update(_time: number, deltaMs: number): void {
    if (this.isPhase('gameover')) return;

    const scaledDelta = deltaMs * this.speedMult;
    this.state.tick(scaledDelta);

    // HUD always updates
    this.hudRenderer.update(this.state);
    this.updateDangerBorder();

    // Boss alert (5s before spawn)
    if (this.state.pendingBossAlert) {
      this.state.pendingBossAlert = false;
      this.notificationRenderer.add('⚠️ 보스 출현 5초 전!', '#ff8800');
      this.startBossPreAlert();
    }

    // Boss spawn triggered by tick()
    if (this.state.pendingBossSpawn) {
      this.state.pendingBossSpawn = false;
      this.enemyRenderer.spawnBoss();
      this.notificationRenderer.add('👹 보스가 등장했습니다!', '#ff6666');
      this.sfx.playSFX('boss');
      // Boss spawn camera effect
      this.cameras.main.shake(200, 0.012);
      const bossFlash = this.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setDepth(18);
      this.tweens.add({ targets: bossFlash, alpha: 0, duration: 300, onComplete: () => bossFlash.destroy() });
      // Show fast-kill countdown (skip first boss)
      if (this.state.bossCount > 1) {
        this.startBossCountdown();
      }
    }

    // Boss fast-kill countdown update
    if (this.bossTimerText && this.state.bossSpawnedAtMs !== null) {
      const remaining = this.state.stageConfig.bossTimeLimitMs - (this.state.elapsedMs - this.state.bossSpawnedAtMs);
      if (remaining <= 0) {
        this.bossTimerText.destroy();
        this.bossTimerText = undefined;
      } else {
        const secs = Math.ceil(remaining / 1000);
        this.bossTimerText.setText(`⚡ ${secs}초`);
        this.bossTimerText.setColor(secs <= 5 ? '#ff4444' : '#ffdd00');
      }
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
          this.metaProgress.addGems(1);
          this.starsAwarded = true;
        }
        const isNewRecord = this.metaProgress.setStageRecord(this.stageId, this.state.elapsedMs);
        if (isNewRecord) this.notificationRenderer.add('🏆 최고 기록 갱신!', '#ffd700');
        this.sfx.playSFX('victory');
        this.popupRenderer.showVictory(isNewRecord);
      }
      return;
    }

    // Throttled crit haptic (max once per 1.5 sec)
    if (this.state.pendingCritHaptic) {
      this.state.pendingCritHaptic = false;
      if (this.state.elapsedMs - this._lastCritHapticMs > 1500) {
        this._lastCritHapticMs = this.state.elapsedMs;
        if ('vibrate' in navigator) navigator.vibrate(30);
      }
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

    this.enemyRenderer.update(scaledDelta);

    if (this.isPhase('gameover')) {
      this.sfx.playSFX('gameover');
      const isNewRecord = this.metaProgress.setStageRecord(this.stageId, this.state.elapsedMs);
      this.popupRenderer.showGameOver(isNewRecord);
      return;
    }

    if (this.isPhase('clear')) {
      if (!this.overclockSfxPlayed) {
        this.overclockSfxPlayed = true;
        this.sfx.playSFX('overclock');
      }
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
    if ('vibrate' in navigator) navigator.vibrate([60, 30, 80]);
    const ms = this.state.elapsedMs;
    const isFastKill = this.state.bossCount > 1 &&
      this.state.bossSpawnedAtMs !== null &&
      (ms - this.state.bossSpawnedAtMs) <= this.state.stageConfig.bossTimeLimitMs;
    this.state.bossSpawnedAtMs = null;
    this.bossTimerText?.destroy();
    this.bossTimerText = undefined;

    // U5: Phase C boss kill cutscene
    if (ms >= BOSS_PHASE_C_START_MS) this.showPhaseCKillEffect();

    // Phase-based reward cards: Phase C always gets 3 cards (max 3)
    const baseCards = ms >= BOSS_PHASE_C_START_MS ? 3 : 2;
    const rewardCount = Math.min(isFastKill ? baseCards + 1 : baseCards, 3) as 2 | 3;

    if (isFastKill) this.notificationRenderer.add('⚡ 속전속결! 보상 +1', '#ffdd00');

    // Enhance point (보스의 영혼) on boss kill
    this.state.enhancePoints += BOSS_KILL_ENHANCE_POINT;
    const phaseLabel = ms >= BOSS_PHASE_C_START_MS ? '[진검] ' : ms >= BOSS_PHASE_B_START_MS ? '[시험] ' : '';
    this.notificationRenderer.add(`💀 ${phaseLabel}영혼 +${BOSS_KILL_ENHANCE_POINT}`, '#cc88ff');

    this.state.isPaused = true;
    const rewards = this.state.generateRewards(rewardCount + 1);
    this.popupRenderer.showReward(rewardCount, rewards);
  }

  private startBossCountdown(): void {
    this.bossTimerText?.destroy();
    this.bossTimerText = this.add.text(CENTER_X, 500, '⚡ --초', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffdd00',
    }).setOrigin(0.5).setDepth(10);
  }

  private startBossPreAlert(): void {
    const flash = this.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0xff2222, 0.12).setDepth(20);
    this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });
    for (let i = 5; i >= 1; i--) {
      this.time.delayedCall((5 - i) * 1000, () => {
        const ct = this.add.text(CENTER_X, CENTER_Y - 60, `⚠️ ${i}`, {
          fontFamily: 'monospace', fontSize: '40px', color: '#ff4444',
          stroke: '#000000', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(20);
        this.tweens.add({ targets: ct, alpha: 0, y: CENTER_Y - 90, duration: 900, onComplete: () => ct.destroy() });
      });
    }
  }

  private showPhaseCKillEffect(): void {
    this.cameras.main.shake(300, 0.015);
    const flash = this.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0.25).setDepth(20);
    this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });
    const text = this.add.text(CENTER_X, CENTER_Y - 50, '💀 BOSS DOWN! 💀', {
      fontFamily: 'monospace', fontSize: '28px', color: '#ff4444',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(21);
    this.tweens.add({ targets: text, y: CENTER_Y - 100, alpha: 0, duration: 1500, onComplete: () => text.destroy() });
  }

  private toggleSpeedMult(): void {
    this.speedMult = this.speedMult === 2 ? 1 : 2;
    // Also scale Phaser timers/tweens for consistent feel
    this.time.timeScale = this.speedMult;
    this.tweens.timeScale = this.speedMult;
  }

  private onPause(): void {
    if (this.state.isPaused || this.state.phase === 'gameover' || this.state.phase === 'victory') return;
    this.state.isPaused = true;
    this.popupRenderer.showPause(
      () => { this.state.isPaused = false; },
      () => { this.scene.start('StageSelectScene'); },
      { muted: () => this.sfx.muted, toggle: () => this.sfx.toggleMute() },
    );
  }

  private onRecipeBook(): void {
    if (this.state.isPaused || this.state.phase === 'gameover' || this.state.phase === 'victory') return;
    this.state.isPaused = true;
    this.popupRenderer.showRecipeBook(() => { this.state.isPaused = false; });
  }

  private onSoulShop(): void {
    if (this.state.isPaused || this.state.phase === 'gameover' || this.state.phase === 'victory') return;
    this.state.isPaused = true;
    this.popupRenderer.showSoulShop(
      (unit) => { this.unitRenderer.addUnit(unit); },
      () => { this.state.isPaused = false; },
    );
  }

  private gemContinue(): void {
    if (!this.state.useGemContinue()) return;
    this.enemyRenderer.clearAll();
    this.banner?.destroy(); this.banner = undefined;
    this.popupRenderer.hideGameOver();
  }

  private adRevive(): void {
    if (!this.state.useAdRevive()) return;
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

  shutdown(): void {
    this.sfx?.stopBGM();
  }
}
