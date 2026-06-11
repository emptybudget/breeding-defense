import Phaser from 'phaser';
import { BREEDING_DURATION_MS } from '../../game/config';
import { GameState } from '../../game/GameState';
import { UnitData, UnitRace } from '../../game/types';
import { getUnitCombatStats } from '../../game/unitHelpers';
import { RACE_COLORS, RACE_EMOJI, UNIT_SPRITE_SIZE, unitTextureKey } from '../constants';
import { AttackKind } from './EnemyRenderer';

type UnitGameObject = Phaser.GameObjects.Text | Phaser.GameObjects.Image;

export class UnitRenderer {
  private scene: Phaser.Scene;
  private state: GameState;

  private unitObjects = new Map<number, UnitGameObject>();
  private rangeCircles = new Map<number, Phaser.GameObjects.Graphics>();
  private heartTexts = new Map<number, Phaser.GameObjects.Text>();
  private zzzTexts = new Map<number, Phaser.GameObjects.Text>();
  private lockTexts = new Map<number, Phaser.GameObjects.Text>();
  private highlightGraphics = new Map<number, Phaser.GameObjects.Graphics>();
  private motionTweens = new Map<number, Phaser.Tweens.Tween>();
  private draggingId: number | null = null;

  constructor(scene: Phaser.Scene, state: GameState) {
    this.scene = scene;
    this.state = state;
  }

  addUnit(unit: UnitData): void {
    const range = this.getUnitRange(unit.race);
    const color = RACE_COLORS[unit.race];

    const rangeGfx = this.scene.add.graphics().setDepth(0);
    rangeGfx.lineStyle(2, color, 0.6);
    rangeGfx.strokeCircle(0, 0, range);
    rangeGfx.setPosition(unit.x, unit.y);
    rangeGfx.setVisible(false); // 드래그 시에만 표시
    this.rangeCircles.set(unit.id, rangeGfx);

    const textureKey = unitTextureKey(unit.race, unit.tier);
    let label: UnitGameObject;
    if (this.scene.textures.exists(textureKey)) {
      const size = UNIT_SPRITE_SIZE[unit.tier];
      label = this.scene.add.image(unit.x, unit.y, textureKey)
        .setDisplaySize(size, size).setDepth(1);
    } else {
      const fontSize = unit.tier >= 4 ? '36px' : unit.tier === 3 ? '30px' : unit.tier === 2 ? '26px' : '20px';
      label = this.scene.add.text(unit.x, unit.y, RACE_EMOJI[unit.race], {
        fontSize,
      }).setOrigin(0.5).setDepth(1);
    }

    label.setInteractive({ useHandCursor: true });
    this.scene.input.setDraggable(label);
    label.setData('unitId', unit.id);

    this.unitObjects.set(unit.id, label);
  }

  removeUnit(id: number): void {
    const go = this.unitObjects.get(id);
    if (go) this.scene.tweens.killTweensOf(go);
    this.motionTweens.delete(id);
    if (this.draggingId === id) this.draggingId = null;
    this.unitObjects.get(id)?.destroy();       this.unitObjects.delete(id);
    this.rangeCircles.get(id)?.destroy();      this.rangeCircles.delete(id);
    this.heartTexts.get(id)?.destroy();        this.heartTexts.delete(id);
    this.zzzTexts.get(id)?.destroy();          this.zzzTexts.delete(id);
    this.lockTexts.get(id)?.destroy();         this.lockTexts.delete(id);
    this.highlightGraphics.get(id)?.destroy(); this.highlightGraphics.delete(id);
  }

  setHighlights(ids: number[]): void {
    this.clearHighlights();
    for (const id of ids) {
      const go = this.unitObjects.get(id);
      if (!go) continue;
      const gfx = this.scene.add.graphics().setDepth(0);
      gfx.lineStyle(3, 0x00ffcc, 1);
      gfx.strokeCircle(go.x, go.y, 22);
      this.highlightGraphics.set(id, gfx);
      this.scene.tweens.add({
        targets: gfx,
        alpha: { from: 0.3, to: 1 },
        duration: 350,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  clearHighlights(): void {
    for (const gfx of this.highlightGraphics.values()) {
      this.scene.tweens.killTweensOf(gfx);
      gfx.destroy();
    }
    this.highlightGraphics.clear();
  }

  startBreedingEffect(idA: number, idB: number): void {
    const goA = this.unitObjects.get(idA);
    const goB = this.unitObjects.get(idB);
    if (!goA || !goB) return;

    const heartA = this.scene.add.text(goA.x, goA.y - 22, '❤', {
      fontSize: '14px', color: '#ff4444',
    }).setOrigin(0.5).setDepth(2);
    const heartB = this.scene.add.text(goB.x, goB.y - 22, '❤', {
      fontSize: '14px', color: '#ff4444',
    }).setOrigin(0.5).setDepth(2);
    this.heartTexts.set(idA, heartA);
    this.heartTexts.set(idB, heartB);

    this.scene.time.delayedCall(BREEDING_DURATION_MS, () => {
      heartA.destroy(); heartB.destroy();
      this.heartTexts.delete(idA); this.heartTexts.delete(idB);
      const born = this.state.completeBreeding(idA, idB);
      for (const u of born) this.addUnit(u);
    });
  }

  syncOverlays(): void {
    this.syncIdleBob();
    this.syncZzzTexts();
    this.syncLockTexts();
  }

  setDragging(id: number, dragging: boolean): void {
    this.draggingId = dragging ? id : (this.draggingId === id ? null : this.draggingId);
  }

  // 공격 모션: 근접 lunge / 원거리 반동 / 마법·체인 pulse
  // T2+는 이동 거리·스케일 배율이 더 크다
  playAttackMotion(id: number, kind: AttackKind, dirX: number, dirY: number): void {
    if (this.motionTweens.has(id) || id === this.draggingId) return;
    const go = this.unitObjects.get(id);
    const unit = this.state.units.find(u => u.id === id);
    if (!go || !unit) return;

    const tier = unit.tier;

    if (kind === 'magic' || kind === 'divine' || kind === 'chain') {
      const baseScaleX = go.scaleX, baseScaleY = go.scaleY;
      const mult = kind === 'divine' ? 1.28 : tier >= 2 ? 1.22 : 1.15;
      const dur = kind === 'chain' ? 70 : 90;
      this.motionTweens.set(id, this.scene.tweens.add({
        targets: go,
        scaleX: baseScaleX * mult, scaleY: baseScaleY * mult,
        duration: dur, yoyo: true, ease: 'Quad.easeOut',
        onComplete: () => {
          this.motionTweens.delete(id);
          go.setScale(baseScaleX, baseScaleY);
        },
      }));
      return;
    }

    const len = Math.hypot(dirX, dirY) || 1;
    const isSlash = kind === 'slash';
    const dist = isSlash ? (tier >= 2 ? 10 : 7) : -(tier >= 2 ? 6 : 4);
    this.motionTweens.set(id, this.scene.tweens.add({
      targets: go,
      x: unit.x + (dirX / len) * dist,
      y: unit.y + (dirY / len) * dist,
      duration: isSlash ? (tier >= 2 ? 90 : 80) : 60,
      yoyo: true, ease: 'Quad.easeOut',
      onComplete: () => {
        this.motionTweens.delete(id);
        go.setPosition(unit.x, unit.y);
      },
    }));
  }

  // 상시 idle bob (±2px) — 드래그/공격 모션 중인 유닛은 제외
  private syncIdleBob(): void {
    const t = this.state.elapsedMs;
    for (const unit of this.state.units) {
      if (unit.id === this.draggingId || this.motionTweens.has(unit.id)) continue;
      const go = this.unitObjects.get(unit.id);
      if (!go) continue;
      go.setPosition(unit.x, unit.y + Math.sin(t / 350 + unit.id * 1.7) * 2);
    }
  }

  getRangeCircle(id: number): Phaser.GameObjects.Graphics | undefined {
    return this.rangeCircles.get(id);
  }

  removeStaleUnits(liveIds: number[]): void {
    const liveSet = new Set(liveIds);
    for (const id of [...this.unitObjects.keys()]) {
      if (!liveSet.has(id)) this.removeUnit(id);
    }
  }

  getNearestUnitId(x: number, y: number, excludeId: number, radius: number): number | null {
    for (const [id, other] of this.unitObjects) {
      if (id === excludeId) continue;
      if (Math.hypot(x - other.x, y - other.y) <= radius) return id;
    }
    return null;
  }

  private syncZzzTexts(): void {
    for (const unit of this.state.units) {
      const go = this.unitObjects.get(unit.id);
      if (!go) continue;
      if (unit.isExhausted) {
        const existing = this.zzzTexts.get(unit.id);
        if (!existing) {
          const t = this.scene.add.text(go.x, go.y - 16, 'zzz', {
            fontSize: '11px', color: '#aaaaff',
          }).setOrigin(0.5).setDepth(2);
          this.zzzTexts.set(unit.id, t);
        } else {
          existing.setPosition(go.x, go.y - 16);
        }
      } else {
        const t = this.zzzTexts.get(unit.id);
        if (t) { t.destroy(); this.zzzTexts.delete(unit.id); }
      }
    }
  }

  private syncLockTexts(): void {
    for (const unit of this.state.units) {
      const go = this.unitObjects.get(unit.id);
      if (!go) continue;
      if (unit.isLocked) {
        const existing = this.lockTexts.get(unit.id);
        if (!existing) {
          const t = this.scene.add.text(go.x, go.y - 28, '🔒', {
            fontSize: '11px',
          }).setOrigin(0.5).setDepth(2);
          this.lockTexts.set(unit.id, t);
        } else {
          existing.setPosition(go.x, go.y - 28);
        }
      } else {
        const t = this.lockTexts.get(unit.id);
        if (t) { t.destroy(); this.lockTexts.delete(unit.id); }
      }
    }
  }

  private getUnitRange(race: UnitRace): number {
    return getUnitCombatStats(race).range;
  }
}
