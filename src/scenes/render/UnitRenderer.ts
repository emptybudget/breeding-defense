import Phaser from 'phaser';
import { findApexUnit } from '../../game/breeding';
import { EGG_HATCH_MS, GEN_VISUALS } from '../../game/config';
import { GameState } from '../../game/GameState';
import { UNIT_LORE } from '../../game/lore';
import { FAMILY_OF_RACE } from '../../game/naming';
import { FamilyKey, MutationGrade, UnitData, UnitRace } from '../../game/types';
import { getUnitCombatStats } from '../../game/unitHelpers';
import { ANS } from '../artnouveau';
import { RACE_COLORS, RACE_EMOJI, UNIT_SPRITE_SIZE, unitTextureKey } from '../constants';
import { SoundManager } from '../SoundManager';
import { UI } from '../ui/tokens';
import { AttackKind } from './EnemyRenderer';

type UnitGameObject = Phaser.GameObjects.Text | Phaser.GameObjects.Image;

// 명가 아트: 계열 알 텍스처 (Human=검문/Beast=야수문/Robot=강철문)
const EGG_TEXTURE_OF_FAMILY: Record<FamilyKey, string> = {
  sword: 'egg_human', fang: 'egg_beast', steel: 'egg_robot',
};

export class UnitRenderer {
  private scene: Phaser.Scene;
  private state: GameState;
  private sfx?: SoundManager;
  private onHatchRevealed?: (mutation: MutationGrade | undefined) => void;

  private unitObjects = new Map<number, UnitGameObject>();
  private rangeCircles = new Map<number, Phaser.GameObjects.Graphics>();
  private lockTexts = new Map<number, Phaser.GameObjects.Text>();
  private nestWaitTexts = new Map<number, Phaser.GameObjects.Text>();
  private highlightGraphics = new Map<number, Phaser.GameObjects.Graphics>();
  private motionTweens = new Map<number, Phaser.Tweens.Tween>();
  private draggingId: number | null = null;

  // M4: Gen 형태 표기(R4) — 유닛별 링/뿔/왕관 Graphics
  private genOverlays = new Map<number, Phaser.GameObjects.Graphics>();
  private genPulseTweens = new Map<number, Phaser.Tweens.Tween>();

  // M4: 정점 유닛 계열 문장 오버레이 (E22) — 단일 재사용 Graphics
  private apexCrestGfx?: Phaser.GameObjects.Graphics;
  private apexUnitId: number | null = null;
  private apexFamily: FamilyKey | null = null;

  // M4: 알 부화 연출 (R7) — 판당 교배는 한 번에 하나뿐이라 단일 인스턴스로 충분
  private eggTickEvent?: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene, state: GameState, sfx?: SoundManager,
    onHatchRevealed?: (mutation: MutationGrade | undefined) => void,
  ) {
    this.scene = scene;
    this.state = state;
    this.sfx = sfx;
    this.onHatchRevealed = onHatchRevealed;
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

    // M4: Gen 형태 표기(R4) — Gen3+ 스케일 배율(왕관 1.10/1.18)을 카드 본체에도 적용
    const gen = unit.gen ?? 0;
    const visuals = gen >= 1 && gen <= 4 ? GEN_VISUALS[gen as 1 | 2 | 3 | 4] : undefined;
    const scaleMult = visuals?.scaleMult ?? 1;
    if (scaleMult !== 1) label.scaleY *= scaleMult;

    // M2: 카드 뒤집기 연출(0.35s) — scaleX 0→최종값
    const targetScaleX = label.scaleX * scaleMult;
    label.scaleX = 0;
    this.scene.tweens.add({ targets: label, scaleX: targetScaleX, duration: 350, ease: 'Back.easeOut' });
    this.sfx?.playSFX('cardFlip');

    this.unitObjects.set(unit.id, label);
    if (visuals) this.addGenOverlay(unit, visuals);
  }

  private addGenOverlay(unit: UnitData, visuals: typeof GEN_VISUALS[1]): void {
    const gfx = this.scene.add.graphics().setPosition(unit.x, unit.y).setDepth(1);
    gfx.lineStyle(2, UI.gold, 0.8);
    if (visuals.ring) gfx.strokeCircle(0, 0, 20);
    if (visuals.horn) {
      gfx.fillStyle(UI.gold, 1);
      gfx.fillTriangle(-6, -18, 0, -30, 6, -18);
    }
    if (visuals.crown) {
      gfx.fillStyle(UI.gold, 1);
      gfx.fillTriangle(-10, -18, -10, -30, -4, -22);
      gfx.fillTriangle(-4, -18, -4, -32, 4, -22);
      gfx.fillTriangle(4, -18, 4, -30, 10, -22);
      gfx.fillRect(-10, -18, 20, 4);
    }
    this.genOverlays.set(unit.id, gfx);
    if (visuals.pulse) {
      this.genPulseTweens.set(unit.id, this.scene.tweens.add({
        targets: gfx, alpha: { from: 1, to: 0.55 }, duration: 500, yoyo: true, repeat: -1,
      }));
    }
  }

  removeUnit(id: number): void {
    const go = this.unitObjects.get(id);
    if (go) this.scene.tweens.killTweensOf(go);
    this.motionTweens.delete(id);
    if (this.draggingId === id) this.draggingId = null;
    this.unitObjects.get(id)?.destroy();       this.unitObjects.delete(id);
    this.rangeCircles.get(id)?.destroy();      this.rangeCircles.delete(id);
    this.lockTexts.get(id)?.destroy();         this.lockTexts.delete(id);
    this.nestWaitTexts.get(id)?.destroy();     this.nestWaitTexts.delete(id);
    this.highlightGraphics.get(id)?.destroy(); this.highlightGraphics.delete(id);
    this.genPulseTweens.get(id)?.stop();       this.genPulseTweens.delete(id);
    this.genOverlays.get(id)?.destroy();       this.genOverlays.delete(id);
  }

  /** 둥지에서 파트너를 기다리는 유닛 위에 🪺 마커 표시/제거 (M1b — 교배 대기 가시화). */
  setNestWaiting(id: number, waiting: boolean): void {
    const existing = this.nestWaitTexts.get(id);
    if (waiting) {
      if (existing) return;
      const go = this.unitObjects.get(id);
      if (!go) return;
      const t = this.scene.add.text(go.x, go.y - 24, '🪺', {
        fontSize: '13px',
      }).setOrigin(0.5).setDepth(2);
      this.nestWaitTexts.set(id, t);
    } else if (existing) {
      existing.destroy();
      this.nestWaitTexts.delete(id);
    }
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

  // M4: 하트 대신 알(Graphics 스텁) + 게이지 + 3회 심장박동 SFX → EGG_HATCH_MS 후 등급 리빌.
  // 부모의 계열 → 알 색. lineage 우선, 없으면 race(T1) 매핑, 최종 폴백 sword.
  private eggFamily(id: number): FamilyKey {
    const u = this.state.units.find(x => x.id === id);
    if (u?.lineageId != null) {
      const fam = this.state.lineages.get(u.lineageId)?.family;
      if (fam) return fam;
    }
    return (FAMILY_OF_RACE as Record<string, FamilyKey | undefined>)[u?.race ?? ''] ?? 'sword';
  }

  startBreedingEffect(idA: number, idB: number): void {
    const goA = this.unitObjects.get(idA);
    const goB = this.unitObjects.get(idB);
    if (!goA || !goB) return;

    const ex = (goA.x + goB.x) / 2;
    const ey = (goA.y + goB.y) / 2 - 10;

    // 계열 알 스프라이트 (텍스처 없으면 프로시저럴 타원 폴백)
    const eggKey = EGG_TEXTURE_OF_FAMILY[this.eggFamily(idA)];
    let egg: Phaser.GameObjects.GameObject;
    if (this.scene.textures.exists(eggKey)) {
      egg = this.scene.add.image(ex, ey, eggKey).setDisplaySize(46, 54).setDepth(2);
    } else {
      const g = this.scene.add.graphics().setPosition(ex, ey).setDepth(2);
      g.fillStyle(UI.cream, 1); g.fillEllipse(0, 0, 18, 24);
      g.lineStyle(2, UI.gold, 1); g.strokeEllipse(0, 0, 18, 24);
      egg = g;
    }

    const gaugeGfx = this.scene.add.graphics().setPosition(ex, ey).setDepth(2);
    this.scene.tweens.addCounter({
      from: 0, to: 1, duration: EGG_HATCH_MS,
      onUpdate: tw => {
        const ratio = tw?.getValue() ?? 0;
        gaugeGfx.clear();
        gaugeGfx.lineStyle(2, UI.goldMid, 1);
        gaugeGfx.beginPath();
        gaugeGfx.arc(0, 0, 28, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(-90 + 360 * ratio), false);
        gaugeGfx.strokePath();
      },
    });

    this.eggTickEvent = this.scene.time.addEvent({
      delay: EGG_HATCH_MS / 3, repeat: 2,
      callback: () => this.sfx?.playSFX('eggTick'),
    });

    this.scene.time.delayedCall(EGG_HATCH_MS, () => {
      egg.destroy();
      gaugeGfx.destroy();
      this.eggTickEvent?.remove();
      this.eggTickEvent = undefined;

      const born = this.state.completeBreeding(idA, idB);
      const hatch = this.state.pendingHatch;
      this.state.pendingHatch = null;

      for (const u of born) this.addUnit(u);
      // M3: 부모 2 소모 — 상태에서 사라진 부모 스프라이트 정리
      this.removeStaleUnits(this.state.units.map(u => u.id));

      if (hatch) {
        this.playHatchFlourish(ex, ey, hatch.race, hatch.mutation);
        this.onHatchRevealed?.(hatch.mutation);
      }
    });
  }

  private playHatchFlourish(x: number, y: number, race: UnitRace, mutation?: MutationGrade): void {
    if (mutation === 'legend') {
      this.sfx?.playSFX('hatchLegend');
      this.hatchBurst(x, y, 0xffffff, 1.4, 620); // 순금 원본, 최대 폭발
    } else if (mutation === 'rare') {
      this.sfx?.playSFX('hatchRare');
      this.hatchBurst(x, y, UI.silver, 0.9, 540);  // 은색 tint + 축소
    } else {
      this.sfx?.playSFX('hatchCommon');
      this.burstFlourish(x, y, UI.goldDim, '', 500); // 일반: 버스트 미사용(낙차 위계)
    }
    // M4: 부화 배너 대사(등급 연출 아래, 0.8s) — 24-lore-units.md §2~§5
    const cry = UNIT_LORE[race]?.birthCry;
    if (cry) {
      const t = this.scene.add.text(x, y + 22, cry, {
        fontFamily: 'monospace', fontSize: '10px', color: ANS.CREAM,
      }).setOrigin(0.5).setDepth(3).setAlpha(0);
      this.scene.tweens.add({ targets: t, alpha: 1, duration: 100 });
      this.scene.tweens.add({ targets: t, alpha: 0, delay: 500, duration: 200, onComplete: () => t.destroy() });
    }
  }

  // 전설/희귀 부화 버스트 — fx_hatch_burst 순금 텍스처(ADD). 희귀는 은tint+축소.
  private hatchBurst(x: number, y: number, tint: number, maxScale: number, durationMs: number): void {
    if (!this.scene.textures.exists('fx_hatch_burst')) {
      this.burstFlourish(x, y, tint, '', durationMs); // 폴백
      return;
    }
    const base = 110 / 256; // 텍스처 256² → 기준 표시 크기
    const img = this.scene.add.image(x, y, 'fx_hatch_burst')
      .setDepth(3).setBlendMode(Phaser.BlendModes.ADD).setTint(tint).setScale(0);
    this.scene.tweens.add({ targets: img, scale: base * maxScale, duration: durationMs * 0.45, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: img, alpha: 0, delay: durationMs * 0.3, duration: durationMs * 0.7, onComplete: () => img.destroy() });
  }

  private burstFlourish(x: number, y: number, color: number, emoji: string, durationMs: number): void {
    const flash = this.scene.add.circle(x, y, 22, color, 0.5).setDepth(3);
    this.scene.tweens.add({ targets: flash, radius: 40, alpha: 0, duration: durationMs, onComplete: () => flash.destroy() });
    if (emoji) {
      const t = this.scene.add.text(x, y - 20, emoji, { fontSize: '20px' }).setOrigin(0.5).setDepth(3);
      this.scene.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: durationMs, onComplete: () => t.destroy() });
    }
  }

  syncOverlays(): void {
    this.syncIdleBob();
    this.syncLockTexts();
    this.syncNestWaitTexts();
    this.syncGenOverlays();
    this.updateApexCrest();
  }

  private syncGenOverlays(): void {
    for (const [id, gfx] of this.genOverlays) {
      const go = this.unitObjects.get(id);
      if (go) gfx.setPosition(go.x, go.y);
    }
  }

  // M4 E22: 정점 유닛(필드 내 최대 Gen 혈통 계승자) 계열 문장 — 변경 시에만 다시 그림, 위치는 매 프레임 갱신.
  private updateApexCrest(): void {
    const apex = findApexUnit(this.state.units);
    if (!apex) {
      this.apexCrestGfx?.setVisible(false);
      this.apexUnitId = null;
      return;
    }
    const family = apex.lineageId !== undefined ? this.state.lineages.get(apex.lineageId)?.family ?? null : null;
    if (apex.id !== this.apexUnitId || family !== this.apexFamily) {
      this.apexUnitId = apex.id;
      this.apexFamily = family;
      if (!this.apexCrestGfx) this.apexCrestGfx = this.scene.add.graphics().setDepth(3);
      this.drawApexCrest(this.apexCrestGfx, family);
    }
    const go = this.unitObjects.get(apex.id);
    if (go) this.apexCrestGfx?.setPosition(go.x, go.y - 34).setVisible(true);
  }

  private drawApexCrest(gfx: Phaser.GameObjects.Graphics, family: FamilyKey | null): void {
    gfx.clear();
    if (!family) return;
    gfx.lineStyle(2, UI.gold, 1);
    if (family === 'sword') {
      gfx.lineBetween(-6, 6, 6, -6);
      gfx.lineBetween(-6, -6, 6, 6);
      gfx.strokeCircle(0, 0, 9);
    } else if (family === 'fang') {
      gfx.fillStyle(UI.gold, 1);
      gfx.fillTriangle(-6, -8, 0, 8, 6, -8);
    } else {
      gfx.strokeRect(-7, -7, 14, 14);
      gfx.strokeCircle(0, 0, 4);
    }
  }

  private syncNestWaitTexts(): void {
    for (const [id, t] of this.nestWaitTexts) {
      const go = this.unitObjects.get(id);
      if (go) t.setPosition(go.x, go.y - 24);
    }
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
      // ⑥ T4 신: divine 공격 시 attack 프레임 0.15s 교차 표시
      if (kind === 'divine' && go instanceof Phaser.GameObjects.Image
          && this.scene.textures.exists('unit_astral_god_tier4_attack')) {
        const idleTex = go.texture.key;
        go.setTexture('unit_astral_god_tier4_attack');
        this.scene.time.delayedCall(150, () => { if (go.active) go.setTexture(idleTex); });
      }
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
