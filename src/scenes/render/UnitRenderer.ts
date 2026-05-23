import Phaser from 'phaser';
import { BREEDING_DURATION_MS } from '../../game/config';
import { GameState } from '../../game/GameState';
import { HybridRace, Tier1Race, Tier3Race, UnitData, UnitRace } from '../../game/types';
import { getCategory, getUnitCombatStats, resolveAstralGodThird, resolveTier3Race } from '../../game/unitHelpers';
import { RACE_COLORS, RACE_EMOJI } from '../constants';

export class UnitRenderer {
  private scene: Phaser.Scene;
  private state: GameState;

  private unitObjects = new Map<number, Phaser.GameObjects.Text>();
  private rangeCircles = new Map<number, Phaser.GameObjects.Graphics>();
  private heartTexts = new Map<number, Phaser.GameObjects.Text>();
  private zzzTexts = new Map<number, Phaser.GameObjects.Text>();
  private lockTexts = new Map<number, Phaser.GameObjects.Text>();
  private glowRings = new Map<number, Phaser.GameObjects.Graphics>();

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

    const fontSize = unit.tier >= 4 ? '36px' : unit.tier === 3 ? '30px' : unit.tier === 2 ? '26px' : '20px';
    const label = this.scene.add.text(unit.x, unit.y, RACE_EMOJI[unit.race], {
      fontSize,
    }).setOrigin(0.5).setDepth(1);

    label.setInteractive({ useHandCursor: true });
    this.scene.input.setDraggable(label);
    label.setData('unitId', unit.id);

    this.unitObjects.set(unit.id, label);
  }

  removeUnit(id: number): void {
    this.unitObjects.get(id)?.destroy();    this.unitObjects.delete(id);
    this.rangeCircles.get(id)?.destroy();   this.rangeCircles.delete(id);
    this.heartTexts.get(id)?.destroy();     this.heartTexts.delete(id);
    this.zzzTexts.get(id)?.destroy();       this.zzzTexts.delete(id);
    this.lockTexts.get(id)?.destroy();      this.lockTexts.delete(id);
    this.glowRings.get(id)?.destroy();      this.glowRings.delete(id);
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
    this.syncZzzTexts();
    this.syncLockTexts();
    this.syncGlowRings();
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

  private syncGlowRings(): void {
    const capable = this.getSynthesisCapableIds();

    for (const [id, gfx] of this.glowRings) {
      if (!capable.has(id)) { gfx.destroy(); this.glowRings.delete(id); }
    }

    const pulse = 0.35 + 0.35 * Math.sin(this.scene.time.now / 300);

    for (const id of capable) {
      const go = this.unitObjects.get(id);
      if (!go) continue;
      const unit = this.state.units.find(u => u.id === id);
      if (!unit) continue;

      const radius = unit.tier === 3 ? 22 : unit.tier === 2 ? 18 : 14;
      const color = RACE_COLORS[unit.race];

      let gfx = this.glowRings.get(id);
      if (!gfx) { gfx = this.scene.add.graphics().setDepth(0); this.glowRings.set(id, gfx); }

      gfx.clear();
      gfx.lineStyle(3, color, pulse);
      gfx.strokeCircle(go.x, go.y, radius);
      gfx.lineStyle(6, color, pulse * 0.35);
      gfx.strokeCircle(go.x, go.y, radius + 5);
    }
  }

  private getSynthesisCapableIds(): Set<number> {
    const capable = new Set<number>();
    const units = this.state.units;

    for (let i = 0; i < units.length; i++) {
      const a = units[i];
      if (a.isLocked || a.isBreeding || a.isExhausted || a.tier === 4) continue;

      for (let j = i + 1; j < units.length; j++) {
        const b = units[j];
        if (b.isLocked || b.isBreeding || b.isExhausted || b.tier === 4) continue;
        if (a.tier !== b.tier) continue;

        let canSynth = false;
        if (a.tier === 1) {
          canSynth = getCategory(a.race as Tier1Race) !== getCategory(b.race as Tier1Race);
        } else if (a.tier === 2) {
          canSynth = resolveTier3Race(a.race as HybridRace, b.race as HybridRace) !== null;
        } else if (a.tier === 3) {
          canSynth = resolveAstralGodThird(a.race as Tier3Race, b.race as Tier3Race) !== null;
        }

        if (canSynth) { capable.add(a.id); capable.add(b.id); }
      }
    }

    return capable;
  }

  private getUnitRange(race: UnitRace): number {
    return getUnitCombatStats(race).range;
  }
}
