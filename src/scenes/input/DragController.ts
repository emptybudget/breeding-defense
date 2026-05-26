import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  SELL_GOLD_TIER1,
  SELL_GOLD_TIER2,
  SELL_GOLD_TIER3,
  SELL_GOLD_TIER4,
} from '../../game/config';
import { GameState } from '../../game/GameState';
import { ASTRAL_GOD_RECIPE, getCategory, getTier3Recipes } from '../../game/unitHelpers';
import { HybridRace, Tier1Race, Tier3Race, UnitData } from '../../game/types';
import { NotificationRenderer } from '../render/NotificationRenderer';
import { PopupRenderer } from '../render/PopupRenderer';
import { UnitRenderer } from '../render/UnitRenderer';
import { SoundManager } from '../SoundManager';

export class DragController {
  private scene: Phaser.Scene;
  private state: GameState;
  private unitRenderer: UnitRenderer;
  private notificationRenderer: NotificationRenderer;
  private popupRenderer: PopupRenderer;
  private sfx?: SoundManager;

  private dragStartX = 0;
  private dragStartY = 0;
  private lastTapUnitId = -1;
  private lastTapTime = 0;

  constructor(
    scene: Phaser.Scene,
    state: GameState,
    unitRenderer: UnitRenderer,
    notificationRenderer: NotificationRenderer,
    popupRenderer: PopupRenderer,
    sfx?: SoundManager,
  ) {
    this.scene = scene;
    this.state = state;
    this.unitRenderer = unitRenderer;
    this.notificationRenderer = notificationRenderer;
    this.popupRenderer = popupRenderer;
    this.sfx = sfx;
  }

  register(): void {
    this.scene.input.on('dragstart', (ptr: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject) => {
      const label = go as Phaser.GameObjects.Text;
      label.setDepth(4);
      this.dragStartX = ptr.x;
      this.dragStartY = ptr.y;
      const unitId = label.getData('unitId') as number;
      this.unitRenderer.getRangeCircle(unitId)?.setVisible(true);
      const draggedUnit = this.state.units.find(u => u.id === unitId);
      if (draggedUnit) this.unitRenderer.setHighlights(this.getValidPartners(draggedUnit));
    });

    this.scene.input.on('drag', (_ptr: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
      const label = go as Phaser.GameObjects.Text;
      label.x = dragX;
      label.y = dragY;
      const unitId = label.getData('unitId') as number;
      this.unitRenderer.getRangeCircle(unitId)?.setPosition(dragX, dragY);
    });

    this.scene.input.on('dragend', (ptr: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject) => {
      const label = go as Phaser.GameObjects.Text;
      label.setDepth(1);
      const unitId = label.getData('unitId') as number;
      this.unitRenderer.getRangeCircle(unitId)?.setVisible(false);
      this.unitRenderer.clearHighlights();

      const dist = Math.hypot(ptr.x - this.dragStartX, ptr.y - this.dragStartY);
      if (dist < 8) {
        // Tap — only when game is not paused by other popups
        if (!this.state.isPaused) {
          const now = Date.now();
          if (unitId === this.lastTapUnitId && now - this.lastTapTime < 300) {
            // Double-tap → lock toggle
            this.state.toggleLock(unitId);
            this.lastTapUnitId = -1;
          } else {
            // Single tap → recipe popup
            this.lastTapUnitId = unitId;
            this.lastTapTime = now;
            const unit = this.state.units.find(u => u.id === unitId);
            if (unit) {
              this.state.isPaused = true;
              this.popupRenderer.showRecipe(unit, () => { this.state.isPaused = false; });
            }
          }
        }
        // Snap back to state position
        const unit = this.state.units.find(u => u.id === unitId);
        if (unit) label.setPosition(unit.x, unit.y);
        return;
      }

      this.handleDrop(unitId, label);
    });
  }

  private getValidPartners(dragged: UnitData): number[] {
    if (dragged.tier === 4) return [];
    if (dragged.tier === 1) {
      return this.state.units
        .filter(u => u.id !== dragged.id && u.tier === 1 && !u.isLocked && !u.isExhausted && !u.isBreeding)
        .map(u => u.id);
    }
    if (dragged.tier === 2) {
      const partnerRaces = new Set(getTier3Recipes(dragged.race as HybridRace).map(r => r.partner));
      return this.state.units
        .filter(u => u.id !== dragged.id && u.tier === 2 && partnerRaces.has(u.race as HybridRace) && !u.isLocked)
        .map(u => u.id);
    }
    if (dragged.tier === 3 && ASTRAL_GOD_RECIPE.includes(dragged.race as Tier3Race)) {
      return this.state.units
        .filter(u => u.id !== dragged.id && u.tier === 3 && ASTRAL_GOD_RECIPE.includes(u.race as Tier3Race) && !u.isLocked)
        .map(u => u.id);
    }
    return [];
  }

  private showSynthesisEffect(tier: number): void {
    if (tier < 3) return;
    this.state.isPaused = true;
    this.scene.time.delayedCall(300, () => { this.state.isPaused = false; });
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const isTier4 = tier === 4;
    const flashColor = isTier4 ? 0xffffff : 0xffcc00;
    const flashAlpha = isTier4 ? 0.9 : 0.5;
    const flashDuration = isTier4 ? 600 : 300;
    const label = isTier4 ? '🌟 ASTRAL GOD!! 🌟' : '✨ ULTIMATE! ✨';
    const fontSize = isTier4 ? '40px' : '30px';
    const textColor = isTier4 ? '#ffdd00' : '#00ffcc';
    const strokeThickness = isTier4 ? 6 : 4;
    const textDuration = isTier4 ? 2000 : 1200;

    const flash = this.scene.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, flashColor, flashAlpha).setDepth(10);
    this.scene.tweens.add({ targets: flash, alpha: 0, duration: flashDuration, onComplete: () => flash.destroy() });

    const text = this.scene.add.text(cx, cy, label, {
      fontFamily: 'monospace', fontSize, color: textColor,
      stroke: '#000000', strokeThickness,
    }).setOrigin(0.5).setDepth(11);
    this.scene.tweens.add({ targets: text, y: cy - 80, alpha: 0, duration: textDuration, onComplete: () => text.destroy() });

    if (isTier4) {
      this.scene.cameras.main.shake(500, 0.02);
    }
  }

  private findClearPos(x: number, y: number): { x: number; y: number } | null {
    const dirs = [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]] as const;
    for (let step = 1; step <= 4; step++) {
      for (const [dx, dy] of dirs) {
        const nx = x + dx * step * 30;
        const ny = y + dy * step * 30;
        if (this.isValidUnitPosition(nx, ny) && !this.state.isOnTrack(nx, ny)) return { x: nx, y: ny };
      }
    }
    return null;
  }

  private isOnSellZone(x: number, y: number): boolean {
    return x >= GAME_WIDTH - 70 && y >= GAME_HEIGHT - 76;
  }

  private isValidUnitPosition(x: number, y: number): boolean {
    const z = this.state.unitZone;
    return (
      x >= z.x1 && x <= z.x2 &&
      y >= z.y1 && y <= Math.min(z.y2, GAME_HEIGHT - 76)
    );
  }

  private handleDrop(droppedId: number, go: Phaser.GameObjects.Text): void {
    const droppedUnit = this.state.units.find(u => u.id === droppedId);
    if (!droppedUnit) return;

    // Sell zone (highest priority)
    if (this.isOnSellZone(go.x, go.y)) {
      const sellGold = droppedUnit.tier === 4 ? SELL_GOLD_TIER4 : droppedUnit.tier === 3 ? SELL_GOLD_TIER3 : droppedUnit.tier === 2 ? SELL_GOLD_TIER2 : SELL_GOLD_TIER1;
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
        let dropX = go.x, dropY = go.y;
        if (this.state.isOnTrack(dropX, dropY)) {
          const cleared = this.findClearPos(dropX, dropY);
          if (cleared) { dropX = cleared.x; dropY = cleared.y; }
          else { go.setPosition(droppedUnit.x, droppedUnit.y); return; }
        }
        this.state.moveUnit(droppedId, dropX, dropY);
        go.setPosition(dropX, dropY);
        this.unitRenderer.getRangeCircle(droppedId)?.setPosition(dropX, dropY);
        return;
      }
      go.setPosition(droppedUnit.x, droppedUnit.y);
      return;
    }

    // Interaction
    go.setPosition(droppedUnit.x, droppedUnit.y); // snap back as default

    const targetUnit = this.state.units.find(u => u.id === targetId);
    if (!targetUnit || targetUnit.isBreeding) return;

    // Tier-4 units cannot interact
    if (droppedUnit.tier === 4 || targetUnit.tier === 4) return;

    // Tier-3 + Tier-3 → Astral_God (3-way synthesis)
    if (droppedUnit.tier === 3 && targetUnit.tier === 3) {
      if (droppedUnit.isLocked || targetUnit.isLocked) return;
      this.trySynthesize(droppedId, targetId, /* cleanupStale */ true);
      return;
    }

    // Mixed-tier interactions involving tier-3 → block
    if (droppedUnit.tier === 3 || targetUnit.tier === 3) return;

    // Tier-2 + Tier-2 → tier-3 synthesis
    if (droppedUnit.tier === 2 && targetUnit.tier === 2) {
      if (droppedUnit.isLocked || targetUnit.isLocked) return;
      this.trySynthesize(droppedId, targetId, /* cleanupStale */ false);
      return;
    }

    // Mismatched tiers → snap back already done
    if (droppedUnit.tier !== 1 || targetUnit.tier !== 1) return;

    // Tier-1 + Tier-1: check constraints
    if (droppedUnit.isExhausted || droppedUnit.isLocked) return;
    if (targetUnit.isExhausted || targetUnit.isLocked) return;

    const sameCategory =
      getCategory(droppedUnit.race as Tier1Race) === getCategory(targetUnit.race as Tier1Race);

    if (sameCategory) {
      const started = this.state.startBreeding(droppedId, targetId);
      if (!started && this.state.units.length >= this.state.maxUnits) {
        this.notificationRenderer.add('⚠️ 유닛 한도 가득 참! 한도+1 필요', '#ff8844');
      }
      if (started) {
        const snapX = Math.min(this.state.unitZone.x2, targetUnit.x + 18);
        const snapY = targetUnit.y;
        this.state.moveUnit(droppedId, snapX, snapY);
        go.setPosition(snapX, snapY);
        this.unitRenderer.getRangeCircle(droppedId)?.setPosition(snapX, snapY);
        this.unitRenderer.startBreedingEffect(droppedId, targetId);
        this.sfx?.playSFX('breed');
      }
    } else {
      this.trySynthesize(droppedId, targetId, /* cleanupStale */ false, /* showEffect */ false);
    }
  }

  private trySynthesize(idA: number, idB: number, cleanupStale: boolean, showEffect = true): void {
    const result = this.state.synthesize(idA, idB);
    if (result) {
      this.unitRenderer.removeUnit(idA);
      this.unitRenderer.removeUnit(idB);
      if (cleanupStale) this.unitRenderer.removeStaleUnits(this.state.units.map(u => u.id));
      this.unitRenderer.addUnit(result);
      if (showEffect) this.showSynthesisEffect(result.tier);
      this.sfx?.playSFX('synth');
    } else if (this.state.pendingNotification) {
      this.notificationRenderer.add(this.state.pendingNotification, '#ffaa44');
      this.state.pendingNotification = null;
    }
  }
}
