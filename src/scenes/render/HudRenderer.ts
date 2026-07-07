import Phaser from 'phaser';
import {
  DOCK_CENTER_Y, DOCK_H, DOCK_Y, GAME_WIDTH, HUD_BAR_H, HUD_BAR_Y, MAX_ENEMIES,
  NEST_SLOT_1_X, NEST_SLOT_2_X, NEST_SLOT_SIZE, SELL_EDGE_W, SUMMON_MAX_COST,
} from '../../game/config';
import { NestSlot } from '../../game/dockGeometry';
import { GameState } from '../../game/GameState';
import { ANS, drawHudBar } from '../artnouveau';
import { CENTER_X } from '../constants';
import { SoundManager } from '../SoundManager';
import { JuicyButton } from '../ui/JuicyButton';
import { UI } from '../ui/tokens';

// 라운드 세그먼트 바 — 시각 스캐폴드(경과시간/제한시간 비례). 실제 "ROUND n" 판정·배너는 M2.
const ROUND_TOTAL = 14;

type FadeableGO = Phaser.GameObjects.Graphics | Phaser.GameObjects.Text | Phaser.GameObjects.Container;

/** 골드/젬 재화 칩 — 아이콘 원 + 숫자 롤링(200ms) + scale 팝(120ms). */
class Chip {
  private readonly container: Phaser.GameObjects.Container;
  private readonly valueText: Phaser.GameObjects.Text;
  private readonly scene: Phaser.Scene;
  private displayed: number;
  private rollTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, iconColor: number, initial: number, depth: number) {
    this.scene = scene;
    this.displayed = initial;
    const h = 28;

    const bodyGfx = scene.add.graphics();
    bodyGfx.fillStyle(UI.panel, 1);
    bodyGfx.fillRoundedRect(-width / 2, -h / 2, width, h, h / 2);

    const iconGfx = scene.add.graphics();
    iconGfx.fillStyle(iconColor, 1);
    iconGfx.fillCircle(-width / 2 + 10, 0, 6);

    this.valueText = scene.add.text(8, 0, `${initial}`, {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
    }).setOrigin(0.5);

    this.container = scene.add.container(x, y, [bodyGfx, iconGfx, this.valueText]).setDepth(depth);
  }

  setValue(value: number): void {
    if (value === this.displayed) return;
    const from = this.displayed;
    this.displayed = value;
    this.rollTween?.stop();
    const state = { v: from };
    this.rollTween = this.scene.tweens.add({
      targets: state, v: value, duration: 200,
      onUpdate: () => { this.valueText.setText(`${Math.round(state.v)}`); },
    });
    this.scene.tweens.add({
      targets: this.container, scaleX: 1.15, scaleY: 1.15, duration: 120, yoyo: true,
    });
  }
}

/** 둥지 슬롯(M1b) — 비어있음: goldDim 점선 / 점유·근접중: gold 실선 + 펄스. 점유 시 유닛 아이콘 표시. */
class NestSlotView {
  readonly gfx: Phaser.GameObjects.Graphics;
  readonly iconText: Phaser.GameObjects.Text;
  private readonly scene: Phaser.Scene;
  private readonly r: number;
  private occupied = false;
  private hovered = false;
  private pulseTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, cx: number, cy: number, size: number, depth: number) {
    this.scene = scene;
    this.r = size / 2;
    this.gfx = scene.add.graphics().setPosition(cx, cy).setDepth(depth);
    this.iconText = scene.add.text(cx, cy, '', { fontSize: '22px' }).setOrigin(0.5).setDepth(depth + 1);
    this.redraw();
  }

  setState(occupied: boolean, hovered: boolean): void {
    if (occupied === this.occupied && hovered === this.hovered) return;
    this.occupied = occupied;
    this.hovered = hovered;
    this.redraw();
    const active = occupied || hovered;
    if (active && !this.pulseTween) {
      this.pulseTween = this.scene.tweens.add({
        targets: this.gfx, alpha: { from: 1, to: 0.5 }, duration: 500, yoyo: true, repeat: -1,
      });
    } else if (!active && this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween = undefined;
      this.gfx.setAlpha(1);
    }
  }

  /** 점유 유닛 아이콘(이모지) 설정 — null이면 비움. */
  setIcon(emoji: string | null): void {
    this.iconText.setText(emoji ?? '');
  }

  destroy(): void {
    this.pulseTween?.stop();
    this.gfx.destroy();
    this.iconText.destroy();
  }

  private redraw(): void {
    const g = this.gfx;
    g.clear();
    if (this.occupied || this.hovered) {
      g.lineStyle(2, UI.gold, 1);
      g.strokeCircle(0, 0, this.r);
      return;
    }
    g.lineStyle(2, UI.goldDim, 1);
    const segments = 12;
    for (let i = 0; i < segments; i += 2) {
      g.beginPath();
      g.arc(0, 0, this.r, (i / segments) * Math.PI * 2, ((i + 1) / segments) * Math.PI * 2, false);
      g.strokePath();
    }
  }
}

export class HudRenderer {
  private scene: Phaser.Scene;
  private sfx?: SoundManager;
  private onSummon: () => void;
  private onPopUpgrade: () => void;
  private onPause: () => void;
  private onSoulShop: () => void;

  private timerText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private segmentGfx!: Phaser.GameObjects.Graphics;
  private ringGfx!: Phaser.GameObjects.Graphics;
  private ringCountText!: Phaser.GameObjects.Text;
  private ringPulseTween?: Phaser.Tweens.Tween;
  private goldChip!: Chip;
  private gemChip!: Chip;
  private summonBtn!: JuicyButton;
  private summonBadgeGfx!: Phaser.GameObjects.Graphics;
  private summonBadgeText!: Phaser.GameObjects.Text;
  private popBtn!: JuicyButton;
  private soulBtn?: JuicyButton;

  private calmDockObjects: FadeableGO[] = [];
  private dragDockObjects: FadeableGO[] = [];
  private dragMode = false;
  private nestSlots: (NestSlotView | undefined)[] = [undefined, undefined];
  private nestOccupiedState: [boolean, boolean] = [false, false];
  private sellLabelTexts: Phaser.GameObjects.Text[] = [];

  constructor(
    scene: Phaser.Scene,
    onSummon: () => void,
    onPopUpgrade: () => void,
    onPause: () => void,
    onSoulShop: () => void,
    sfx: SoundManager,
  ) {
    this.scene = scene;
    this.onSummon = onSummon;
    this.onPopUpgrade = onPopUpgrade;
    this.onPause = onPause;
    this.onSoulShop = onSoulShop;
    this.sfx = sfx;
  }

  create(state: GameState): void {
    // ── 상단 바 (y24~68, 44px) ──────────────────────────────────────────
    const topGfx = this.scene.add.graphics().setDepth(5);
    topGfx.setPosition(0, HUD_BAR_Y);
    drawHudBar(topGfx, GAME_WIDTH, HUD_BAR_H);
    const barCenterY = HUD_BAR_Y + HUD_BAR_H / 2;

    let x = 8;
    this.segmentGfx = this.scene.add.graphics().setDepth(6);
    this.segmentGfx.setPosition(x + 30, barCenterY);
    x += 60 + 8;

    this.roundText = this.scene.add.text(x + 14, barCenterY, `R1/${ROUND_TOTAL}`, {
      fontFamily: 'monospace', fontSize: '11px', color: ANS.GOLD,
    }).setOrigin(0.5).setDepth(6);
    x += 28 + 8;

    this.timerText = this.scene.add.text(x, barCenterY, '00:00', {
      fontFamily: 'monospace', fontSize: '15px', color: ANS.CREAM,
    }).setOrigin(0, 0.5).setDepth(6);
    x += 40 + 8;

    this.ringGfx = this.scene.add.graphics().setDepth(6);
    this.ringGfx.setPosition(x + 16, barCenterY);
    this.ringCountText = this.scene.add.text(x + 16, barCenterY, '0', {
      fontFamily: 'monospace', fontSize: '10px', color: ANS.CREAM,
    }).setOrigin(0.5).setDepth(6);
    x += 32 + 8;

    this.goldChip = new Chip(this.scene, x + 22, barCenterY, 44, UI.gold, state.gold, 6);
    x += 44 + 8;

    this.gemChip = new Chip(this.scene, x + 22, barCenterY, 44, UI.teal, state.gems, 6);
    x += 44 + 8;

    // ⏸ — 시각 44×44(바 높이와 동일, 삐져나옴 없음) / 히트 48×48(MIN_HIT_PX)
    new JuicyButton({
      scene: this.scene, x: x + 22, y: barCenterY, width: 48, height: 48,
      visualWidth: 44, visualHeight: 44, label: '⏸', variant: 'ghost', fontSize: 16,
      depth: 6, sfx: this.sfx, onClick: () => { this.onPause(); },
    });

    // ── 독 (y536~624, 88px) ─────────────────────────────────────────────
    const dockGfx = this.scene.add.graphics().setDepth(5);
    dockGfx.fillStyle(UI.bgDeep, 1);
    dockGfx.fillRect(0, DOCK_Y, GAME_WIDTH, DOCK_H);
    dockGfx.lineStyle(1, UI.goldDim, 1);
    dockGfx.lineBetween(0, DOCK_Y, GAME_WIDTH, DOCK_Y);
    const dockCenterY = DOCK_Y + DOCK_H / 2;

    this.popBtn = new JuicyButton({
      scene: this.scene, x: 64, y: dockCenterY, width: 56, height: 48,
      label: `한도+1\n${state.populationUpgradeCost}G`, variant: 'ghost', fontSize: 11,
      depth: 6, sfx: this.sfx, onClick: () => { this.onPopUpgrade(); },
    });

    this.summonBtn = new JuicyButton({
      scene: this.scene, x: CENTER_X, y: dockCenterY, width: 96, height: 64,
      label: `소환 (${state.summonCost}G)`, variant: 'primary', fontSize: 14,
      depth: 6, sfx: this.sfx, onClick: () => { this.onSummon(); },
    });
    this.summonBadgeGfx = this.scene.add.graphics().setDepth(7);
    this.summonBadgeGfx.setPosition(CENTER_X + 48 - 4, dockCenterY - 32 + 4);
    this.summonBadgeText = this.scene.add.text(CENTER_X + 48 - 4, dockCenterY - 32 + 4, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#1a1a0f',
    }).setOrigin(0.5).setDepth(8);

    this.calmDockObjects.push(this.popBtn.container, this.summonBtn.container, this.summonBadgeGfx, this.summonBadgeText);

    if (state.features.soulShop) {
      this.soulBtn = new JuicyButton({
        scene: this.scene, x: 296, y: dockCenterY, width: 56, height: 48,
        label: `🔮상점\n💀${state.enhancePoints}`, variant: 'ghost', fontSize: 11,
        depth: 6, sfx: this.sfx, onClick: () => { this.onSoulShop(); },
      });
      this.calmDockObjects.push(this.soulBtn.container);
    }

    // ── 독 드래그 컨텍스트 모드 (M1b) — 둥지 슬롯 2 + 가장자리 판매존 2 ──────
    if (state.features.breed) {
      [NEST_SLOT_1_X, NEST_SLOT_2_X].forEach((cx, i) => {
        const view = new NestSlotView(this.scene, cx, DOCK_CENTER_Y, NEST_SLOT_SIZE, 6);
        view.gfx.setVisible(false);
        view.iconText.setVisible(false);
        this.nestSlots[i] = view;
        this.dragDockObjects.push(view.gfx, view.iconText);
      });
    }

    if (state.features.sell) {
      const sellY = DOCK_Y + DOCK_H / 2;
      [{ cx: SELL_EDGE_W / 2 }, { cx: GAME_WIDTH - SELL_EDGE_W / 2 }].forEach(({ cx }) => {
        const bg = this.scene.add.graphics().setDepth(6).setVisible(false);
        bg.fillStyle(UI.danger, 0.5);
        bg.fillRect(cx - SELL_EDGE_W / 2, DOCK_Y, SELL_EDGE_W, DOCK_H);
        bg.lineStyle(2, UI.goldDim, 0.8);
        const xSize = 8;
        bg.lineBetween(cx - xSize, sellY - xSize, cx + xSize, sellY + xSize);
        bg.lineBetween(cx - xSize, sellY + xSize, cx + xSize, sellY - xSize);
        const label = this.scene.add.text(cx, sellY + 20, '', {
          fontFamily: 'monospace', fontSize: '9px', color: ANS.CREAM,
        }).setOrigin(0.5).setDepth(6).setVisible(false);
        this.sellLabelTexts.push(label);
        this.dragDockObjects.push(bg, label);
      });
    }

    this.dragDockObjects.forEach(o => o.setAlpha(0));
  }

  /** 유닛 드래그 시작 — 독을 계산·소환 버튼에서 둥지/판매존으로 크로스페이드(300ms). */
  enterDragMode(sellLabel: string): void {
    if (this.dragMode) return;
    this.dragMode = true;
    this.sellLabelTexts.forEach(t => t.setText(sellLabel));
    this.scene.tweens.add({ targets: this.calmDockObjects, alpha: 0, duration: 300 });
    if (this.dragDockObjects.length > 0) {
      this.dragDockObjects.forEach(o => o.setVisible(true));
      this.scene.tweens.add({ targets: this.dragDockObjects, alpha: 1, duration: 300 });
    }
  }

  /**
   * 드래그 종료 — 항상 계산 독으로 복귀한다.
   * (대기 중인 유닛은 필드에 눈에 보이게 앉아 있고, 다음 드래그 때 슬롯 점유 상태는
   *  nestOccupiedState로 다시 표시되므로 독을 열어둘 필요가 없다. 소환 버튼도 항상 복귀.)
   */
  exitDragMode(): void {
    if (!this.dragMode) return;
    this.dragMode = false;
    this.scene.tweens.add({ targets: this.calmDockObjects, alpha: 1, duration: 300 });
    const objs = this.dragDockObjects;
    this.scene.tweens.add({
      targets: objs, alpha: 0, duration: 300,
      onComplete: () => objs.forEach(o => o.setVisible(false)),
    });
  }

  /** 드래그 중 근접 하이라이트(스냅 프리뷰) — 점유 상태는 유지한 채 hover만 갱신. */
  highlightNestSlot(slot: NestSlot | null): void {
    this.nestSlots.forEach((view, i) => view?.setState(this.nestOccupiedState[i], i === slot));
  }

  /** 유닛이 실제로 슬롯에 들어가거나(occupied=true, emoji로 아이콘 표시) 빠져나갈 때(false) 호출. */
  setNestSlotOccupied(slot: NestSlot, occupied: boolean, emoji?: string): void {
    this.nestOccupiedState[slot] = occupied;
    this.nestSlots[slot]?.setState(occupied, false);
    this.nestSlots[slot]?.setIcon(occupied ? (emoji ?? null) : null);
  }

  update(state: GameState): void {
    this.timerText.setText(state.formatTimer());
    if (state.phase === 'playing') {
      const remaining = state.stageConfig.victoryTimeMs - state.elapsedMs;
      this.timerText.setColor(remaining <= 60000 ? '#ff4444' : remaining <= 180000 ? '#ffdd00' : ANS.CREAM);
    } else {
      this.timerText.setColor(ANS.CREAM);
    }

    // 세그먼트 바 (시각 스캐폴드 — 경과/제한시간 비례)
    const roundRatio = state.stageConfig.victoryTimeMs > 0
      ? Phaser.Math.Clamp(state.elapsedMs / state.stageConfig.victoryTimeMs, 0, 1) : 0;
    const filled = Math.min(ROUND_TOTAL, Math.floor(roundRatio * ROUND_TOTAL));
    const pulse = 0.55 + 0.45 * Math.sin(this.scene.time.now / 250);
    this.drawSegments(filled, pulse);
    this.roundText.setText(`R${Math.min(filled + 1, ROUND_TOTAL)}/${ROUND_TOTAL}`);

    // 카운트 링 (적수/MAX_ENEMIES)
    const enemyRatio = Math.min(state.enemyCount / MAX_ENEMIES, 1);
    const ringColor = enemyRatio >= 0.8 ? 0xff4444 : enemyRatio >= 0.6 ? 0xffdd00 : 0x8aaa4a;
    this.drawRing(enemyRatio, ringColor);
    this.ringCountText.setText(`${state.enemyCount}`);
    if (enemyRatio >= 0.8 && !this.ringPulseTween) {
      this.ringPulseTween = this.scene.tweens.add({
        targets: this.ringGfx, alpha: { from: 1, to: 0.35 }, duration: 350, yoyo: true, repeat: -1,
      });
    } else if (enemyRatio < 0.8 && this.ringPulseTween) {
      this.ringPulseTween.stop();
      this.ringPulseTween = undefined;
      this.ringGfx.setAlpha(1);
    }

    this.goldChip.setValue(state.gold);
    this.gemChip.setValue(state.gems);

    const atCap = state.units.length >= state.maxUnits;
    const atMax = state.summonCost >= SUMMON_MAX_COST;
    this.summonBtn.setLabel(atCap ? '소환' : atMax ? '소환' : `소환 (${state.summonCost}G)`);
    this.summonBtn.setDisabled(atCap);
    this.summonBadgeGfx.clear();
    const badgeLabel = atCap ? 'FULL' : atMax ? 'MAX' : `${state.summonCost}G`;
    this.summonBadgeGfx.fillStyle(UI.gold, 1);
    this.summonBadgeGfx.fillCircle(0, 0, 12);
    this.summonBadgeText.setText(badgeLabel).setFontSize(atCap || atMax ? 8 : 9);

    this.popBtn.setLabel(`한도+1\n${state.populationUpgradeCost}G`);
    this.soulBtn?.setLabel(`🔮상점\n💀${state.enhancePoints}`);
  }

  private drawSegments(filled: number, currentPulseAlpha: number): void {
    const g = this.segmentGfx;
    const segW = 3;
    const gap = 1;
    const totalW = ROUND_TOTAL * segW + (ROUND_TOTAL - 1) * gap;
    const startX = -totalW / 2;
    g.clear();
    for (let i = 0; i < ROUND_TOTAL; i++) {
      const sx = startX + i * (segW + gap);
      let color: number = UI.goldDim;
      let alpha = 0.4;
      if (i < filled) { color = UI.gold; alpha = 1; } else if (i === filled) { color = UI.gold; alpha = currentPulseAlpha; }
      g.fillStyle(color, alpha);
      g.fillRect(sx, -3, segW, 6);
    }
  }

  private drawRing(ratio: number, color: number): void {
    const g = this.ringGfx;
    const r = 14;
    g.clear();
    g.lineStyle(3, 0x1a1a14, 1);
    g.strokeCircle(0, 0, r);
    if (ratio > 0) {
      g.lineStyle(3, color, 1);
      g.beginPath();
      g.arc(0, 0, r, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(-90 + 360 * ratio), false);
      g.strokePath();
    }
  }
}
