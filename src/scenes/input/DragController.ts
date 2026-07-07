import Phaser from 'phaser';
import {
  DOCK_Y,
  DRAG_LIFT_OFFSET_Y,
  DRAG_SNAP_DIST,
  GAME_HEIGHT,
  GAME_WIDTH,
  SELL_GOLD_TIER1,
  SELL_GOLD_TIER2,
  SELL_GOLD_TIER3,
  SELL_GOLD_TIER4,
  UNIT_MAX_HALF_H,
} from '../../game/config';
import { distToNestSlot, getNestSlotRect, isInSellZone, NestSlot } from '../../game/dockGeometry';
import { GameState } from '../../game/GameState';
import { ASTRAL_GOD_RECIPE, getCategory, getTier3Recipes } from '../../game/unitHelpers';
import { HybridRace, Tier1Race, Tier3Race, UnitData } from '../../game/types';
import { HudRenderer } from '../render/HudRenderer';
import { NotificationRenderer } from '../render/NotificationRenderer';
import { PopupRenderer } from '../render/PopupRenderer';
import { UnitRenderer } from '../render/UnitRenderer';
import { RACE_EMOJI } from '../constants';
import { SoundManager } from '../SoundManager';

export class DragController {
  private scene: Phaser.Scene;
  private state: GameState;
  private unitRenderer: UnitRenderer;
  private notificationRenderer: NotificationRenderer;
  private popupRenderer: PopupRenderer;
  private hudRenderer: HudRenderer;
  private sfx?: SoundManager;

  private dragStartX = 0;
  private dragStartY = 0;
  private lastTapUnitId = -1;
  private lastTapTime = 0;

  // M1b: 둥지 슬롯 점유 유닛 id (null = 비어있음)
  private nestOccupants: [number | null, number | null] = [null, null];

  constructor(
    scene: Phaser.Scene,
    state: GameState,
    unitRenderer: UnitRenderer,
    notificationRenderer: NotificationRenderer,
    popupRenderer: PopupRenderer,
    hudRenderer: HudRenderer,
    sfx?: SoundManager,
  ) {
    this.scene = scene;
    this.state = state;
    this.unitRenderer = unitRenderer;
    this.notificationRenderer = notificationRenderer;
    this.popupRenderer = popupRenderer;
    this.hudRenderer = hudRenderer;
    this.sfx = sfx;
  }

  register(): void {
    this.scene.input.on('dragstart', (ptr: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject) => {
      const label = go as Phaser.GameObjects.Text;
      label.setDepth(4);
      this.dragStartX = ptr.x;
      this.dragStartY = ptr.y;
      const unitId = label.getData('unitId') as number;
      this.unitRenderer.setDragging(unitId, true);
      this.unitRenderer.getRangeCircle(unitId)?.setVisible(true);

      const draggedUnit = this.state.units.find(u => u.id === unitId);
      if (draggedUnit) {
        this.hudRenderer.enterDragMode(this.sellLabelFor(draggedUnit));
        if (draggedUnit.tier !== 1) {
          this.unitRenderer.setHighlights(this.getValidPartners(draggedUnit));
        }
      }
    });

    this.scene.input.on('drag', (_ptr: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
      const label = go as Phaser.GameObjects.Text;
      const liftedY = dragY + DRAG_LIFT_OFFSET_Y;
      label.x = dragX;
      label.y = liftedY;
      const unitId = label.getData('unitId') as number;
      this.unitRenderer.getRangeCircle(unitId)?.setPosition(dragX, liftedY);

      const unit = this.state.units.find(u => u.id === unitId);
      if (unit && unit.tier === 1 && this.state.features.breed && !unit.isLocked) {
        this.hudRenderer.highlightNestSlot(this.findNearestOpenSlot(dragX, liftedY, unitId));
      } else {
        this.hudRenderer.highlightNestSlot(null);
      }
    });

    this.scene.input.on('dragend', (ptr: Phaser.Input.Pointer, go: Phaser.GameObjects.GameObject) => {
      const label = go as Phaser.GameObjects.Text;
      label.setDepth(1);
      const unitId = label.getData('unitId') as number;
      this.unitRenderer.setDragging(unitId, false);
      this.unitRenderer.getRangeCircle(unitId)?.setVisible(false);
      this.unitRenderer.clearHighlights();

      const dist = Math.hypot(ptr.x - this.dragStartX, ptr.y - this.dragStartY);
      if (dist < 8) {
        // Tap — only when game is not paused by other popups
        if (!this.state.isPaused) {
          const now = Date.now();
          if (unitId === this.lastTapUnitId && now - this.lastTapTime < 300) {
            // Double-tap → lock toggle
            if (!this.state.features.lock) return;
            this.state.toggleLock(unitId);
            this.lastTapUnitId = -1;
          } else {
            // Single tap → 바텀시트(둥지로/판매) — 드래그 대안
            this.lastTapUnitId = unitId;
            this.lastTapTime = now;
            const unit = this.state.units.find(u => u.id === unitId);
            if (unit && !unit.isLocked && !unit.isBreeding) {
              const canNest = unit.tier === 1 && this.state.features.breed;
              const canSell = this.state.features.sell;
              if (canNest || canSell) {
                this.state.isPaused = true;
                this.popupRenderer.showUnitActions(
                  unit, { canNest, canSell },
                  () => { this.sendToNest(unitId); },
                  () => { this.sellUnitById(unitId); },
                  () => { this.state.isPaused = false; },
                );
              }
            }
          }
        }
        // Snap back to state position
        const unit = this.state.units.find(u => u.id === unitId);
        if (unit) label.setPosition(unit.x, unit.y);
        this.hudRenderer.exitDragMode();
        return;
      }

      this.handleDrop(unitId, label);
      this.hudRenderer.exitDragMode();
    });
  }

  private sellLabelFor(unit: UnitData): string {
    const gold = unit.tier === 4 ? SELL_GOLD_TIER4 : unit.tier === 3 ? SELL_GOLD_TIER3 : unit.tier === 2 ? SELL_GOLD_TIER2 : SELL_GOLD_TIER1;
    return `판매 ${gold}G`;
  }

  private getValidPartners(dragged: UnitData): number[] {
    if (dragged.tier === 4 || dragged.tier === 1) return [];
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

  // M1b: 둥지 슬롯 교배 페어링 판정 — 같은 카테고리 tier1, 잠금·교배중 아님
  private canPairInNest(a: UnitData, b: UnitData): boolean {
    if (a.tier !== 1 || b.tier !== 1) return false;
    if (a.isLocked || b.isLocked) return false;
    if (a.isBreeding || b.isBreeding) return false;
    return getCategory(a.race as Tier1Race) === getCategory(b.race as Tier1Race);
  }

  private findNearestOpenSlot(x: number, y: number, unitId: number): NestSlot | null {
    for (const slot of [0, 1] as const) {
      if (distToNestSlot(x, y, slot) <= DRAG_SNAP_DIST) {
        const occ = this.nestOccupants[slot];
        if (occ === null || occ === unitId) return slot;
      }
    }
    return null;
  }

  private vacateNestSlot(slot: NestSlot | -1): void {
    if (slot === -1) return;
    const occupant = this.nestOccupants[slot];
    if (occupant !== null) this.unitRenderer.setNestWaiting(occupant, false);
    this.nestOccupants[slot] = null;
    this.hudRenderer.setNestSlotOccupied(slot, false);
  }

  private bounceLocked(go: Phaser.GameObjects.Text, unit: UnitData): void {
    go.setPosition(unit.x, unit.y);
    this.scene.tweens.add({
      targets: go, x: unit.x + 6, duration: 45, yoyo: true, repeat: 3,
      onComplete: () => go.setPosition(unit.x, unit.y),
    });
    if (typeof navigator.vibrate === 'function') navigator.vibrate(15);
  }

  // 코어 판정: 드래그 드롭과 탭 바텀시트 '둥지로' 둘 다 이걸 공유한다.
  private tryNestPlace(slot: NestSlot, id: number, unit: UnitData): 'placed' | 'bred' | 'incompatible' | 'cap-full' {
    const otherSlot: NestSlot = slot === 0 ? 1 : 0;
    const otherId = this.nestOccupants[otherSlot];

    const place = () => {
      const rect = getNestSlotRect(slot);
      // 독 배경(depth5, 오파크)이 필드 스프라이트(depth1)를 가리므로 실제 유닛은 슬롯 바로 위
      // 필드 안쪽에 세운다 — 둥지 아이콘 자체는 HudRenderer가 그대로 y=DOCK_CENTER_Y에 그린다.
      const parkY = this.state.unitZone.y2 - UNIT_MAX_HALF_H;
      this.state.moveUnit(id, rect.x + rect.w / 2, parkY);
      this.nestOccupants[slot] = id;
      this.hudRenderer.setNestSlotOccupied(slot, true, RACE_EMOJI[unit.race]);
      this.unitRenderer.setNestWaiting(id, true);
    };

    if (otherId === null || otherId === id) {
      place();
      return 'placed';
    }

    const otherUnit = this.state.units.find(u => u.id === otherId);
    if (!otherUnit || !this.canPairInNest(otherUnit, unit)) return 'incompatible';

    // GameState.startBreeding과 동일한 정원 체크 — 실패가 예상되면 슬롯에 넣지 않고 되돌린다
    const pendingOffspring = this.state.units.filter(u => u.isBreeding).length / 2;
    if (this.state.units.length + pendingOffspring >= this.state.maxUnits) return 'cap-full';

    place();
    const started = this.state.startBreeding(otherId, id);
    if (started) {
      // 둘 다 교배 시작 → 대기 마커 제거(교배 하트로 대체), 슬롯 비우기
      this.unitRenderer.setNestWaiting(id, false);
      this.unitRenderer.setNestWaiting(otherId, false);
      this.nestOccupants = [null, null];
      this.hudRenderer.setNestSlotOccupied(0, false);
      this.hudRenderer.setNestSlotOccupied(1, false);
      this.unitRenderer.startBreedingEffect(otherId, id);
      this.sfx?.playSFX('breed');
      return 'bred';
    }
    return 'placed';
  }

  private handleNestDrop(slot: NestSlot, id: number, go: Phaser.GameObjects.Text, unit: UnitData): void {
    const outcome = this.tryNestPlace(slot, id, unit);
    // place()가 성공 시 unit.x/y를 이미 갱신했고, 실패 시엔 손대지 않았으므로
    // 두 경우 모두 unit.x/y를 그대로 따라가면 성공=스냅, 실패=원위치가 된다.
    go.setPosition(unit.x, unit.y);
    this.unitRenderer.getRangeCircle(id)?.setPosition(unit.x, unit.y);
    if (outcome === 'placed' || outcome === 'bred') return;
    if (outcome === 'incompatible') {
      this.notificationRenderer.add('⚠️ 같은 카테고리 유닛만 교배 가능', '#ff8844');
    } else {
      this.notificationRenderer.add('⚠️ 유닛 한도 가득 참! 한도+1 필요', '#ff8844');
      if (typeof navigator.vibrate === 'function') navigator.vibrate(30);
    }
  }

  /** 유닛 탭 바텀시트 '둥지로' — 드래그 없이 빈 슬롯(자신이 이미 점유한 슬롯 포함)에 배치. */
  sendToNest(unitId: number): void {
    const unit = this.state.units.find(u => u.id === unitId);
    if (!unit || unit.tier !== 1 || unit.isLocked || unit.isBreeding) return;
    const prevSlot = this.nestOccupants.indexOf(unitId);
    const openSlot: NestSlot | undefined = prevSlot === 0 || prevSlot === 1
      ? prevSlot
      : this.nestOccupants[0] === null ? 0 : this.nestOccupants[1] === null ? 1 : undefined;
    if (openSlot === undefined) {
      this.notificationRenderer.add('⚠️ 둥지 슬롯이 가득함', '#ff8844');
      return;
    }
    const outcome = this.tryNestPlace(openSlot, unitId, unit);
    if (outcome === 'incompatible') {
      this.notificationRenderer.add('⚠️ 같은 카테고리 유닛만 교배 가능', '#ff8844');
    } else if (outcome === 'cap-full') {
      this.notificationRenderer.add('⚠️ 유닛 한도 가득 참! 한도+1 필요', '#ff8844');
    }
  }

  /** 유닛 탭 바텀시트 '판매' — 드래그 없이 즉시 판매. */
  sellUnitById(unitId: number): void {
    const unit = this.state.units.find(u => u.id === unitId);
    if (!unit) return;
    const prevSlot = this.nestOccupants.indexOf(unitId);
    this.vacateNestSlot(prevSlot === 0 || prevSlot === 1 ? prevSlot : -1);
    const sellGold = unit.tier === 4 ? SELL_GOLD_TIER4 : unit.tier === 3 ? SELL_GOLD_TIER3 : unit.tier === 2 ? SELL_GOLD_TIER2 : SELL_GOLD_TIER1;
    this.state.sellUnit(unitId);
    this.unitRenderer.removeUnit(unitId);
    this.notificationRenderer.add(`💰 유닛 판매 +${sellGold}G`, '#ffd700');
  }

  private showSynthesisEffect(tier: number): void {
    if (tier < 3) return;
    this.state.isPaused = true;
    this.scene.time.delayedCall(300, () => { this.state.isPaused = false; });
    // Haptic: tier-4 = heavy triple, tier-3 = double pulse
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(tier === 4 ? [100, 50, 150, 50, 200] : [80, 40, 120]);
    }
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

  private isValidUnitPosition(x: number, y: number): boolean {
    const z = this.state.unitZone;
    return (
      x >= z.x1 && x <= z.x2 &&
      y >= z.y1 && y <= Math.min(z.y2, DOCK_Y)
    );
  }

  private handleDrop(droppedId: number, go: Phaser.GameObjects.Text): void {
    const droppedUnit = this.state.units.find(u => u.id === droppedId);
    if (!droppedUnit) return;

    const prevSlot = this.nestOccupants.indexOf(droppedId) as NestSlot | -1;

    // Sell zone (highest priority) — 독 좌우 가장자리 (드래그 컨텍스트 모드)
    if (this.state.features.sell && isInSellZone(go.x, go.y)) {
      this.vacateNestSlot(prevSlot);
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

    // M1b: 둥지 슬롯 드롭(교배 대기) — tier1 전용
    if (droppedUnit.tier === 1 && this.state.features.breed) {
      const slot = this.findNearestOpenSlot(go.x, go.y, droppedId);
      if (slot !== null) {
        if (droppedUnit.isLocked) {
          this.vacateNestSlot(prevSlot);
          this.bounceLocked(go, droppedUnit);
          return;
        }
        // 다른 슬롯으로 옮겨 담는 경우 이전 슬롯을 먼저 비운다(양쪽 중복 점유 방지)
        if (prevSlot !== -1 && prevSlot !== slot) this.vacateNestSlot(prevSlot);
        this.handleNestDrop(slot, droppedId, go, droppedUnit);
        return;
      }
    }

    this.vacateNestSlot(prevSlot);

    // 둥지에서 대기 중인 유닛은 필드 상호작용(합성 타겟 등) 대상에서 제외
    const rawTargetId = this.unitRenderer.getNearestUnitId(go.x, go.y, droppedId, 35);
    const targetId = rawTargetId !== null && this.nestOccupants.includes(rawTargetId) ? null : rawTargetId;

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
      if (!this.state.features.synthesize) return;
      if (droppedUnit.isLocked || targetUnit.isLocked) return;
      this.trySynthesize(droppedId, targetId, /* cleanupStale */ true);
      return;
    }

    // Mixed-tier interactions involving tier-3 → block
    if (droppedUnit.tier === 3 || targetUnit.tier === 3) return;

    // Tier-2 + Tier-2 → tier-3 synthesis
    if (droppedUnit.tier === 2 && targetUnit.tier === 2) {
      if (!this.state.features.synthesize) return;
      if (droppedUnit.isLocked || targetUnit.isLocked) return;
      this.trySynthesize(droppedId, targetId, /* cleanupStale */ false);
      return;
    }

    // Mismatched tiers → snap back already done
    if (droppedUnit.tier !== 1 || targetUnit.tier !== 1) return;

    // Tier-1 + Tier-1: 겹치기 교배는 M1b에서 폐기(둥지 슬롯으로 대체) — 남는 경로는 카테고리
    // 조합 합성뿐(예: Warrior+Dog → Bio_Wolf). 같은 카테고리는 synthesize()가 레시피 없음으로 처리.
    if (droppedUnit.isLocked || targetUnit.isLocked) return;
    if (this.state.features.synthesize) {
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
