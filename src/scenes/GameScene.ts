import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  SELL_GOLD_TIER1,
  SELL_GOLD_TIER2,
  SELL_GOLD_TIER3,
  TRACK_WAYPOINTS,
  UNIT_ZONE,
} from '../game/config';
import { GameState, Phase } from '../game/GameState';
import { CENTER_X, CENTER_Y } from './constants';
import { EnemyRenderer } from './render/EnemyRenderer';
import { HudRenderer } from './render/HudRenderer';
import { NotificationRenderer } from './render/NotificationRenderer';
import { PopupRenderer } from './render/PopupRenderer';
import { UnitRenderer } from './render/UnitRenderer';

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private enemyRenderer!: EnemyRenderer;
  private hudRenderer!: HudRenderer;
  private popupRenderer!: PopupRenderer;
  private banner?: Phaser.GameObjects.Text;
  private notificationRenderer!: NotificationRenderer;
  private unitRenderer!: UnitRenderer;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.state = new GameState();
    this.notificationRenderer = new NotificationRenderer(this);
    this.unitRenderer = new UnitRenderer(this, this.state);
    this.hudRenderer = new HudRenderer(
      this,
      () => { const unit = this.state.summon(); if (unit) this.unitRenderer.addUnit(unit); },
      () => { this.state.upgradePopulation(); },
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
    );
    this.enemyRenderer = new EnemyRenderer(
      this,
      this.state,
      () => { this.onBossKilled(); },
    );

    // Track
    const g = this.add.graphics();
    g.lineStyle(36, 0x333333, 1);
    g.strokeRect(
      TRACK_WAYPOINTS[0].x, TRACK_WAYPOINTS[0].y,
      TRACK_WAYPOINTS[1].x - TRACK_WAYPOINTS[0].x,
      TRACK_WAYPOINTS[3].y - TRACK_WAYPOINTS[0].y,
    );

    this.enemyRenderer.create();
    this.hudRenderer.create(this.state);

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
    this.hudRenderer.update(this.state);

    // Boss spawn triggered by tick()
    if (this.state.pendingBossSpawn) {
      this.state.pendingBossSpawn = false;
      this.enemyRenderer.spawnBoss();
      this.notificationRenderer.add('👹 보스가 등장했습니다!', '#ff6666');
    }

    // Victory check
    if (this.isPhase('victory')) {
      if (!this.popupRenderer.hasVictoryPopup) this.popupRenderer.showVictory();
      return;
    }

    // Pause guard — skip all gameplay when reward popup is active
    if (this.state.isPaused) return;

    this.unitRenderer.syncOverlays();
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

  private isPhase(p: Phase): boolean {
    return this.state.phase === p;
  }

  private onBossKilled(): void {
    this.state.isPaused = true;
    const rewards = this.state.generateRewards(3);
    this.popupRenderer.showReward(2, rewards);
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
      this.unitRenderer.removeUnit(droppedId);
      this.notificationRenderer.add(`💰 유닛 판매 +${sellGold}G`, '#ffd700');
      return;
    }

    // Breeding units can't act
    if (droppedUnit.isBreeding) {
      go.setPosition(droppedUnit.x, droppedUnit.y);
      return;
    }

    const targetId = this.unitRenderer.getNearestUnitId(go.x, go.y, droppedId, 35);

    if (targetId === null) {
      // Empty space — all tiers can move
      if (this.isValidUnitPosition(go.x, go.y)) {
        this.state.moveUnit(droppedId, go.x, go.y);
        this.unitRenderer.getRangeCircle(droppedId)?.setPosition(go.x, go.y);
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
        this.unitRenderer.removeUnit(droppedId);
        this.unitRenderer.removeUnit(targetId);
        this.unitRenderer.addUnit(result);
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
        this.unitRenderer.getRangeCircle(droppedId)?.setPosition(snapX, snapY);
        this.unitRenderer.startBreedingEffect(droppedId, targetId);
      }
    } else {
      const result = this.state.synthesize(droppedId, targetId);
      if (result) {
        this.unitRenderer.removeUnit(droppedId);
        this.unitRenderer.removeUnit(targetId);
        this.unitRenderer.addUnit(result);
      }
    }
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
