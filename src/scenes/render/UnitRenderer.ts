import Phaser from 'phaser';
import { BREEDING_DURATION_MS, HYBRID_STATS, RACE_STATS, TIER3_STATS } from '../../game/config';
import { GameState } from '../../game/GameState';
import { HybridRace, Race, Tier3Race, UnitData, UnitRace } from '../../game/types';
import { RACE_COLORS, RACE_EMOJI } from '../constants';

export class UnitRenderer {
  private scene: Phaser.Scene;
  private state: GameState;

  private unitObjects = new Map<number, Phaser.GameObjects.Text>();
  private rangeCircles = new Map<number, Phaser.GameObjects.Graphics>();
  private heartTexts = new Map<number, Phaser.GameObjects.Text>();
  private zzzTexts = new Map<number, Phaser.GameObjects.Text>();
  private lockTexts = new Map<number, Phaser.GameObjects.Text>();

  constructor(scene: Phaser.Scene, state: GameState) {
    this.scene = scene;
    this.state = state;
  }

  addUnit(unit: UnitData): void {
    const range = this.getUnitRange(unit.race);
    const color = RACE_COLORS[unit.race];

    const rangeGfx = this.scene.add.graphics().setDepth(0);
    rangeGfx.lineStyle(1, color, 0.2);
    rangeGfx.strokeCircle(0, 0, range);
    rangeGfx.setPosition(unit.x, unit.y);
    this.rangeCircles.set(unit.id, rangeGfx);

    const fontSize = unit.tier === 3 ? '30px' : unit.tier === 2 ? '26px' : '20px';
    const label = this.scene.add.text(unit.x, unit.y, RACE_EMOJI[unit.race], {
      fontSize,
    }).setOrigin(0.5).setDepth(1);

    label.setInteractive({ useHandCursor: true });
    this.scene.input.setDraggable(label);
    label.setData('unitId', unit.id);

    const clickState = { time: 0, x: 0, y: 0 };
    label.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      const now = Date.now();
      if (now - clickState.time < 300 && Math.hypot(ptr.x - clickState.x, ptr.y - clickState.y) < 10) {
        this.state.toggleLock(unit.id);
      }
      clickState.time = now;
      clickState.x = ptr.x;
      clickState.y = ptr.y;
    });

    this.unitObjects.set(unit.id, label);
  }

  removeUnit(id: number): void {
    this.unitObjects.get(id)?.destroy();    this.unitObjects.delete(id);
    this.rangeCircles.get(id)?.destroy();   this.rangeCircles.delete(id);
    this.heartTexts.get(id)?.destroy();     this.heartTexts.delete(id);
    this.zzzTexts.get(id)?.destroy();       this.zzzTexts.delete(id);
    this.lockTexts.get(id)?.destroy();      this.lockTexts.delete(id);
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
  }

  getRangeCircle(id: number): Phaser.GameObjects.Graphics | undefined {
    return this.rangeCircles.get(id);
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
    if (race in TIER3_STATS) return TIER3_STATS[race as Tier3Race].range;
    if (race in RACE_STATS) return RACE_STATS[race as Race].range;
    return HYBRID_STATS[race as HybridRace].range;
  }
}
