import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/config';
import { MetaProgress } from '../game/MetaProgress';
import { FtueStepId } from '../game/types';
import { ANS } from './artnouveau';

export interface FtueTarget { x: number; y: number; w: number; h: number }
export type FtueGhost =
  | { type: 'tap'; at: { x: number; y: number } }
  | { type: 'drag'; from: { x: number; y: number }; to: { x: number; y: number } };

interface FtueStep {
  id: FtueStepId;
  target: FtueTarget | null; // null = 스포트라이트 없이 토스트만 (F11: 대상 버튼 소실)
  copy: string;
  forced: boolean;
  ghost?: FtueGhost;
  durationMs: number; // 비강제 자동 해제 시간 (강제 스텝은 complete() 호출 전까지 유지)
}

// M2: FTUE 인프라 — 스포트라이트+고스트+FIFO 큐. GameState는 읽기 전용, 데이터 레이어 오염 금지.
// 좌표는 항상 호출부(HudRenderer 게터 등)가 제공 — 이 파일 안에서 레이아웃을 재계산하지 않는다.
export class FtueController {
  private scene: Phaser.Scene;
  private meta: MetaProgress;
  private queue: FtueStep[] = [];
  private active: FtueStep | null = null;

  private dimBands: Phaser.GameObjects.Graphics[] = [];
  private borderGfx?: Phaser.GameObjects.Graphics;
  private borderTween?: Phaser.Tweens.Tween;
  private copyText?: Phaser.GameObjects.Text;
  private ghostGfx?: Phaser.GameObjects.Graphics;
  private ghostTween?: Phaser.Tweens.Tween;
  private skipText?: Phaser.GameObjects.Text;
  private autoDismissTimer?: Phaser.Time.TimerEvent;
  private dismissHandler?: () => void;

  constructor(scene: Phaser.Scene, meta: MetaProgress) {
    this.scene = scene;
    this.meta = meta;
  }

  get isForcingNormalSpeed(): boolean {
    return this.active?.forced ?? false;
  }

  isDone(id: FtueStepId): boolean {
    return this.meta.ftueDone.includes(id);
  }

  enqueue(id: FtueStepId, target: FtueTarget | null, copy: string, opts?: { forced?: boolean; ghost?: FtueGhost; durationMs?: number }): void {
    if (this.isDone(id)) return;
    if (this.active?.id === id || this.queue.some(s => s.id === id)) return;
    const step: FtueStep = {
      id, target, copy,
      forced: opts?.forced ?? false,
      ghost: opts?.ghost,
      durationMs: opts?.durationMs ?? 3000,
    };
    this.queue.push(step);
    if (!this.active) this.advance();
  }

  /** 강제 스텝 완료 신호 — 실제 이벤트(소환/합성 성공 등) 발생 지점에서 호출. 비강제 스텝의 자동/탭 해제도 내부적으로 이 경로를 탄다. */
  complete(id: FtueStepId): void {
    if (this.active?.id !== id) return;
    this.meta.markFtueDone(id);
    this.teardownActive();
    this.advance();
  }

  /** 우상단 "건너뛰기" — 현재+대기열 전체를 done 처리. */
  skip(): void {
    if (this.active) this.meta.markFtueDone(this.active.id);
    for (const s of this.queue) this.meta.markFtueDone(s.id);
    this.queue = [];
    this.teardownActive();
    this.active = null;
  }

  private advance(): void {
    const next = this.queue.shift();
    if (!next) { this.active = null; return; }
    this.active = next;
    this.showStep(next);
  }

  private showStep(step: FtueStep): void {
    if (step.target) {
      this.drawDim(step.target, step.forced);
      this.drawBorder(step.target);
    }

    const copyY = step.target ? Math.min(step.target.y + step.target.h + 26, GAME_HEIGHT - 40) : GAME_HEIGHT - 120;
    this.copyText = this.scene.add.text(GAME_WIDTH / 2, copyY, step.copy, {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM, align: 'center',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(41);

    if (step.ghost) this.drawGhost(step.ghost);

    this.skipText = this.scene.add.text(GAME_WIDTH - 8, 8, '건너뛰기', {
      fontFamily: 'monospace', fontSize: '11px', color: ANS.PARCH,
    }).setOrigin(1, 0).setDepth(41).setInteractive({ useHandCursor: true });
    this.skipText.on('pointerdown', () => this.skip());

    if (!step.forced) {
      // 비강제: 입력을 가로채지 않고(no blocking rect) 다음 탭을 관찰만 해서 해제
      this.dismissHandler = () => { this.complete(step.id); };
      this.scene.input.once('pointerdown', this.dismissHandler);
      this.autoDismissTimer = this.scene.time.delayedCall(step.durationMs, () => {
        if (this.dismissHandler) this.scene.input.off('pointerdown', this.dismissHandler);
        this.complete(step.id);
      });
    }
    // 강제 스텝은 drawDim(forced=true)이 스포트라이트 밖 입력을 흡수 — 해제는 외부 complete() 호출로만.
  }

  private drawDim(t: FtueTarget, forced: boolean): void {
    const mk = (x: number, y: number, w: number, h: number) => {
      const g = this.scene.add.graphics().setDepth(38);
      if (w > 0 && h > 0) {
        g.fillStyle(0x000000, 0.6);
        g.fillRect(x, y, w, h);
        if (forced) g.setInteractive(new Phaser.Geom.Rectangle(x, y, w, h), Phaser.Geom.Rectangle.Contains);
      }
      return g;
    };
    this.dimBands = [
      mk(0, 0, GAME_WIDTH, t.y),
      mk(0, t.y + t.h, GAME_WIDTH, GAME_HEIGHT - (t.y + t.h)),
      mk(0, t.y, t.x, t.h),
      mk(t.x + t.w, t.y, GAME_WIDTH - (t.x + t.w), t.h),
    ];
  }

  private drawBorder(t: FtueTarget): void {
    const g = this.scene.add.graphics().setDepth(40);
    g.lineStyle(2, 0xffd24a, 1);
    g.strokeRect(t.x, t.y, t.w, t.h);
    this.borderGfx = g;
    this.borderTween = this.scene.tweens.add({ targets: g, alpha: { from: 1, to: 0.4 }, duration: 500, yoyo: true, repeat: -1 });
  }

  private drawGhost(ghost: FtueGhost): void {
    const g = this.scene.add.graphics().setDepth(41);
    g.fillStyle(0xfff8e6, 0.8);
    g.fillCircle(0, 0, 14);
    this.ghostGfx = g;
    if (ghost.type === 'tap') {
      g.setPosition(ghost.at.x, ghost.at.y);
      this.ghostTween = this.scene.tweens.add({ targets: g, scale: 0.7, duration: 600, yoyo: true, repeat: -1 });
    } else {
      g.setPosition(ghost.from.x, ghost.from.y);
      this.ghostTween = this.scene.tweens.add({
        targets: g, x: ghost.to.x, y: ghost.to.y, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
  }

  private teardownActive(): void {
    this.dimBands.forEach(b => b.destroy());
    this.dimBands = [];
    this.borderTween?.stop(); this.borderTween = undefined;
    this.borderGfx?.destroy(); this.borderGfx = undefined;
    this.copyText?.destroy(); this.copyText = undefined;
    this.ghostTween?.stop(); this.ghostTween = undefined;
    this.ghostGfx?.destroy(); this.ghostGfx = undefined;
    this.skipText?.destroy(); this.skipText = undefined;
    this.autoDismissTimer?.remove(); this.autoDismissTimer = undefined;
    if (this.dismissHandler) { this.scene.input.off('pointerdown', this.dismissHandler); this.dismissHandler = undefined; }
  }
}
