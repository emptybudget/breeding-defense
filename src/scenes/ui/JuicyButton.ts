import Phaser from 'phaser';
import { ANS } from '../artnouveau';
import { SoundManager } from '../SoundManager';
import { clampHitArea, UI } from './tokens';

export type ButtonVariant = 'primary' | 'ghost' | 'danger';

export interface JuicyButtonConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  variant?: ButtonVariant;
  fontSize?: number;
  depth?: number;
  sfx?: SoundManager;
  onClick: () => void;
  /**
   * 그려지는 본체 크기(기본값=width/height). 히트영역(width/height, MIN_HIT_PX 이상 강제)보다
   * 작게 지정하면 본체는 좁은 크롬 안에 들어가면서 터치 여백만 안 보이게 확장된다
   * (예: 44px 높이 상단 바의 ⏸ 아이콘 — 본체는 44지만 히트박스는 48).
   */
  visualWidth?: number;
  visualHeight?: number;
}

/**
 * 공용 라운드+금테 버튼. pointerup + 8px 슬롭 판정, pressed scale 0.94/80ms + 햅틱,
 * disabled(입력 무시), pulse(유도용 금테 점멸) 상태 지원.
 * 스펙 원천: docs/redesign/17-ui-design-tokens.md §1~2.
 */
export class JuicyButton {
  readonly container: Phaser.GameObjects.Container;

  private scene: Phaser.Scene;
  private bodyGfx: Phaser.GameObjects.Graphics;
  private labelText: Phaser.GameObjects.Text;
  private sfx?: SoundManager;
  private onClickCb: () => void;
  private variant: ButtonVariant;
  private w: number;
  private h: number;
  private visualW: number;
  private visualH: number;
  private disabled = false;
  private pressed = false;
  private pulseTween?: Phaser.Tweens.Tween;
  private pulseAlpha = 1;
  private downX = 0;
  private downY = 0;
  private downActive = false;

  constructor(cfg: JuicyButtonConfig) {
    const { w, h } = clampHitArea(cfg.width, cfg.height, import.meta.env.DEV);
    this.w = w;
    this.h = h;
    this.visualW = cfg.visualWidth ?? w;
    this.visualH = cfg.visualHeight ?? h;
    this.scene = cfg.scene;
    this.sfx = cfg.sfx;
    this.onClickCb = cfg.onClick;
    this.variant = cfg.variant ?? 'primary';

    this.bodyGfx = cfg.scene.add.graphics();
    this.labelText = cfg.scene.add.text(0, 0, cfg.label, {
      fontFamily: 'monospace',
      fontSize: `${cfg.fontSize ?? 14}px`,
      color: ANS.CREAM,
      align: 'center',
    }).setOrigin(0.5);

    this.container = cfg.scene.add.container(cfg.x, cfg.y, [this.bodyGfx, this.labelText]).setDepth(cfg.depth ?? 6);
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(-this.w / 2, -this.h / 2, this.w, this.h),
      Phaser.Geom.Rectangle.Contains,
    );
    this.container.on('pointerdown', this.handleDown, this);
    this.container.on('pointerup', this.handleUp, this);
    this.container.on('pointerupoutside', this.handleCancel, this);
    this.container.on('pointerout', this.handleCancel, this);

    this.redraw();
  }

  setLabel(text: string): this {
    this.labelText.setText(text);
    return this;
  }

  setDisabled(v: boolean): this {
    if (this.disabled === v) return this;
    this.disabled = v;
    this.redraw();
    return this;
  }

  setPulse(on: boolean): this {
    if (on && !this.pulseTween) {
      const state = { alpha: 0.5 };
      this.pulseTween = this.scene.tweens.add({
        targets: state, alpha: 1.0, duration: UI.pulseMs, yoyo: true, repeat: -1,
        onUpdate: () => { this.pulseAlpha = state.alpha; this.redraw(); },
      });
    } else if (!on && this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween = undefined;
      this.pulseAlpha = 1;
      this.redraw();
    }
    return this;
  }

  destroy(): void {
    this.pulseTween?.stop();
    this.container.destroy();
  }

  private handleDown(pointer: Phaser.Input.Pointer): void {
    if (this.disabled) return;
    this.downX = pointer.x;
    this.downY = pointer.y;
    this.downActive = true;
    this.pressed = true;
    this.redraw();
    this.scene.tweens.add({
      targets: this.container, scaleX: UI.pressScale, scaleY: UI.pressScale,
      duration: UI.pressMs, yoyo: true,
    });
  }

  private handleUp(pointer: Phaser.Input.Pointer): void {
    if (!this.downActive) return;
    this.downActive = false;
    this.pressed = false;
    this.redraw();
    if (this.disabled) return;
    const dx = pointer.x - this.downX;
    const dy = pointer.y - this.downY;
    if (Math.hypot(dx, dy) > UI.slopPx) return;
    this.sfx?.playSFX('button');
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(10);
    this.onClickCb();
  }

  private handleCancel(): void {
    if (!this.downActive) return;
    this.downActive = false;
    this.pressed = false;
    this.redraw();
  }

  private bodyColor(): number {
    if (this.disabled) return UI.disabled;
    if (this.pressed) return UI.panelHi;
    return this.variant === 'danger' ? UI.danger : UI.panel;
  }

  private borderColor(): number {
    return this.variant === 'primary' ? UI.gold : UI.goldDim;
  }

  private bodyAlpha(): number {
    return this.variant === 'ghost' && !this.pressed ? 0.6 : 1;
  }

  private redraw(): void {
    const g = this.bodyGfx;
    const x = -this.visualW / 2;
    const y = -this.visualH / 2;
    g.clear();

    g.fillStyle(this.bodyColor(), this.bodyAlpha());
    g.fillRoundedRect(x, y, this.visualW, this.visualH, UI.radius);

    g.lineStyle(UI.border, this.borderColor(), this.pulseAlpha);
    g.strokeRoundedRect(x, y, this.visualW, this.visualH, UI.radius);

    // top highlight (볼록 착시)
    g.lineStyle(1, UI.cream, 0.15);
    g.lineBetween(x + UI.radius, y + 1, x + this.visualW - UI.radius, y + 1);

    // bottom shadow (두께 착시)
    g.lineStyle(2, 0x000000, 0.25);
    g.lineBetween(x + UI.radius, y + this.visualH - 1, x + this.visualW - UI.radius, y + this.visualH - 1);

    this.labelText.setColor(this.disabled ? ANS.DIM : ANS.CREAM);
  }
}
