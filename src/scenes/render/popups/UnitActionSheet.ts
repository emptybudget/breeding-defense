import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../../game/config';
import { UnitData } from '../../../game/types';
import { ANS } from '../../artnouveau';
import { CENTER_X } from '../../constants';
import { SoundManager } from '../../SoundManager';
import { JuicyButton } from '../../ui/JuicyButton';
import { UI } from '../../ui/tokens';

const SHEET_H = 240;

export interface UnitActionSheetOptions {
  canNest: boolean;
  canSell: boolean;
}

/**
 * 유닛 탭 → 바텀시트 '둥지로'/'판매' 2탭 경로 (드래그 대안, M1b).
 * 스펙: docs/redesign/17-ui-design-tokens.md §5 (높이 240·상단 라운드16·bgDeep 0.97·그랩 핸들·200ms 슬라이드).
 */
export class UnitActionSheet {
  private scene: Phaser.Scene;
  private sfx?: SoundManager;
  private container?: Phaser.GameObjects.Container;
  private dim?: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, sfx?: SoundManager) {
    this.scene = scene;
    this.sfx = sfx;
  }

  get isShown(): boolean {
    return !!this.container;
  }

  show(
    unit: UnitData,
    opts: UnitActionSheetOptions,
    onNest: () => void,
    onSell: () => void,
    onClose: () => void,
  ): void {
    if (this.container || (!opts.canNest && !opts.canSell)) return;

    const dim = this.scene.add.rectangle(CENTER_X, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5)
      .setDepth(24).setInteractive();
    this.dim = dim;

    const restY = GAME_HEIGHT - SHEET_H / 2;
    const container = this.scene.add.container(CENTER_X, restY + SHEET_H).setDepth(25);
    this.container = container;

    const close = () => {
      this.dim?.destroy();
      this.dim = undefined;
      this.container?.destroy();
      this.container = undefined;
      onClose();
    };
    dim.on('pointerdown', close);

    const bg = this.scene.add.graphics();
    bg.fillStyle(UI.bgDeep, 0.97);
    bg.fillRoundedRect(-GAME_WIDTH / 2, -SHEET_H / 2, GAME_WIDTH, SHEET_H, { tl: 16, tr: 16, bl: 0, br: 0 });
    bg.lineStyle(1, UI.goldDim, 1);
    bg.lineBetween(-GAME_WIDTH / 2, -SHEET_H / 2, GAME_WIDTH / 2, -SHEET_H / 2);

    const handle = this.scene.add.graphics();
    handle.fillStyle(UI.goldDim, 0.8);
    handle.fillRoundedRect(-18, -SHEET_H / 2 + 10, 36, 4, 2);

    const title = this.scene.add.text(0, -SHEET_H / 2 + 32, unit.race.replace(/_/g, ' '), {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.GOLD,
    }).setOrigin(0.5);

    const items: Phaser.GameObjects.GameObject[] = [bg, handle, title];
    let row = 0;
    const nextY = () => -20 + row++ * 60;

    if (opts.canNest) {
      const btn = new JuicyButton({
        scene: this.scene, x: 0, y: nextY(), width: 220, height: 48,
        label: '🪺 둥지로', variant: 'primary', sfx: this.sfx,
        onClick: () => { close(); onNest(); },
      });
      items.push(btn.container);
    }
    if (opts.canSell) {
      const btn = new JuicyButton({
        scene: this.scene, x: 0, y: nextY(), width: 220, height: 48,
        label: '🗑 판매', variant: 'danger', sfx: this.sfx,
        onClick: () => { close(); onSell(); },
      });
      items.push(btn.container);
    }

    container.add(items);
    this.scene.tweens.add({ targets: container, y: restY, duration: 200, ease: 'Quad.easeOut' });
  }
}
