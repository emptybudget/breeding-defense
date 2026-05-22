import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  SELL_GOLD_TIER1,
  SELL_GOLD_TIER2,
  SELL_GOLD_TIER3,
  UNIT_ZONE,
} from '../../game/config';
import { GameState } from '../../game/GameState';
import { NotificationRenderer } from '../render/NotificationRenderer';
import { UnitRenderer } from '../render/UnitRenderer';

export class DragController {
  private scene: Phaser.Scene;
  private state: GameState;
  private unitRenderer: UnitRenderer;
  private notificationRenderer: NotificationRenderer;

  constructor(
    scene: Phaser.Scene,
    state: GameState,
    unitRenderer: UnitRenderer,
    notificationRenderer: NotificationRenderer,
  ) {
    this.scene = scene;
    this.state = state;
    this.unitRenderer = unitRenderer;
    this.notificationRenderer = notificationRenderer;
  }

  register(): void {
    this.scene.input.on('dragstart', (_ptr: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject) => {
      (go as Phaser.GameObjects.Text).setDepth(4);
    });
    this.scene.input.on('drag', (_ptr: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
      const label = go as Phaser.GameObjects.Text;
      label.x = dragX;
      label.y = dragY;
    });
    this.scene.input.on('dragend', (_ptr: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject, _dropped: boolean) => {
      const label = go as Phaser.GameObjects.Text;
      label.setDepth(1);
      const unitId = label.getData('unitId') as number;
      this.handleDrop(unitId, label);
    });
  }

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
}
