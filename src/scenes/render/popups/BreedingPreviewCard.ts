import Phaser from 'phaser';
import {
  BREED_BUTTON_H, BREED_BUTTON_W, BREED_BUTTON_X, BREED_BUTTON_Y,
  PREVIEW_CARD_H, PREVIEW_CARD_W, PREVIEW_CARD_X, PREVIEW_CARD_Y,
} from '../../../game/config';
import { UnitData } from '../../../game/types';
import { ANS, drawPanelAt } from '../../artnouveau';
import { RACE_EMOJI } from '../../constants';
import { SoundManager } from '../../SoundManager';
import { JuicyButton } from '../../ui/JuicyButton';

export interface BreedPreviewInfo { expectedGen: number; mutationChancePct: number; cross: boolean; }

/**
 * 둥지 2슬롯 충족 → 예상 혈통 카드 (R7, 세이프존 y100~420). 교배 버튼을 눌러야 실제
 * 확정된다 — 취소는 페어링된 유닛을 다시 드래그해서 빼내는 것(DragController가 hide() 호출).
 */
export class BreedingPreviewCard {
  private scene: Phaser.Scene;
  private sfx?: SoundManager;
  private container?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, sfx?: SoundManager) {
    this.scene = scene;
    this.sfx = sfx;
  }

  get isShown(): boolean {
    return this.container !== undefined;
  }

  show(a: UnitData, b: UnitData, preview: BreedPreviewInfo, onConfirm: () => void): void {
    this.hide();
    const cx = PREVIEW_CARD_X + PREVIEW_CARD_W / 2;
    const cy = PREVIEW_CARD_Y + PREVIEW_CARD_H / 2;
    const container = this.scene.add.container(cx, cy).setDepth(22);

    const bg = this.scene.add.graphics();
    drawPanelAt(bg, PREVIEW_CARD_W, PREVIEW_CARD_H);

    const parents = this.scene.add.text(0, -PREVIEW_CARD_H / 2 + 16, `${RACE_EMOJI[a.race]} + ${RACE_EMOJI[b.race]}`, {
      fontFamily: 'monospace', fontSize: '16px', color: ANS.CREAM,
    }).setOrigin(0.5);

    const genLine = this.scene.add.text(0, -32, `예상 Gen ${preview.expectedGen}`, {
      fontFamily: 'monospace', fontSize: '12px', color: ANS.GOLD_TEXT,
    }).setOrigin(0.5);

    const mutLine = this.scene.add.text(0, -12, `변이 확률 ${preview.mutationChancePct}%${preview.cross ? ' (이계열 도박)' : ''}`, {
      fontFamily: 'monospace', fontSize: '10px', color: ANS.DIM,
    }).setOrigin(0.5);

    // 변이 시 실제로 뭐가 바뀌는지 등급별 요약 (사용자 피드백 — "변이 확률 설명 부족" 반영)
    const gradeInfo = this.scene.add.text(0, 32, '변이하면? 일반=+10G · 희귀=Gen+1 · 전설=특성2+개명', {
      fontFamily: 'monospace', fontSize: '9px', color: ANS.DIM, align: 'center',
      wordWrap: { width: PREVIEW_CARD_W - 20 },
    }).setOrigin(0.5);

    const breedBtn = new JuicyButton({
      scene: this.scene,
      x: BREED_BUTTON_X + BREED_BUTTON_W / 2 - cx,
      y: BREED_BUTTON_Y + BREED_BUTTON_H / 2 - cy,
      width: BREED_BUTTON_W, height: BREED_BUTTON_H,
      label: '교배', variant: 'primary', sfx: this.sfx,
      onClick: onConfirm,
    });

    container.add([bg, parents, genLine, mutLine, gradeInfo, breedBtn.container]);
    this.container = container;
  }

  hide(): void {
    this.container?.destroy();
    this.container = undefined;
  }
}
