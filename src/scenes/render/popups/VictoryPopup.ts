import Phaser from 'phaser';
import { GameState } from '../../../game/GameState';
import { CHRONICLE } from '../../../game/lore';
import { ANS, drawDivider, drawPanelAt } from '../../artnouveau';
import { CENTER_X, CENTER_Y } from '../../constants';
import { SoundManager } from '../../SoundManager';
import { JuicyButton } from '../../ui/JuicyButton';
import { appendDpsMeter } from './shared';

export class VictoryPopup {
  private scene: Phaser.Scene;
  private state: GameState;
  private onRestart: () => void;
  private onInfiniteMode: () => void;
  private onStageSelect: () => void;
  private sfx?: SoundManager;

  private container?: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    state: GameState,
    onRestart: () => void,
    onInfiniteMode: () => void,
    onStageSelect: () => void,
    sfx?: SoundManager,
  ) {
    this.scene = scene;
    this.state = state;
    this.onRestart = onRestart;
    this.onInfiniteMode = onInfiniteMode;
    this.onStageSelect = onStageSelect;
    this.sfx = sfx;
  }

  get isShown(): boolean {
    return !!this.container;
  }

  show(isNewRecord = false): void {
    if (this.container) return;

    // M2: 연대기(CHRONICLE) 1줄 삽입으로 패널 24px 확장, 버튼·DPS미터 하단 시프트
    const CHRONICLE_SHIFT = 24;
    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(20);

    const bgGfx = this.scene.add.graphics();
    drawPanelAt(bgGfx, 310, 350 + CHRONICLE_SHIFT);

    const divGfx = this.scene.add.graphics();
    drawDivider(divGfx, -130, -118, 260);

    const title = this.scene.add.text(0, -152, '🏆 VICTORY 🏆', {
      fontFamily: 'monospace', fontSize: '22px', color: ANS.GOLD_TEXT, align: 'center',
    }).setOrigin(0.5);

    const gemReward = this.scene.add.text(0, -112, '💎 +1 보석 획득!', {
      fontFamily: 'monospace', fontSize: '17px', color: ANS.TEAL, align: 'center',
    }).setOrigin(0.5);

    const recordSuffix = isNewRecord ? '  🏆' : '';
    const timeText = this.scene.add.text(0, -84, `생존 시간: ${this.state.formatTimer()}${recordSuffix}`, {
      fontFamily: 'monospace', fontSize: '13px', color: isNewRecord ? ANS.GOLD_TEXT : ANS.PARCH, align: 'center',
    }).setOrigin(0.5);

    const gemInfo = this.scene.add.text(0, -62, `현재 💎 ${this.state.gems}개`, {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.PARCH, align: 'center',
    }).setOrigin(0.5);

    // M2: 연대기 1줄 — 승리 시에만 노출(패배 경로는 GameOverPopup이라 자동 미표시)
    const chronicleLine = CHRONICLE[this.state.stageConfig.name];
    const chronicleText = chronicleLine
      ? this.scene.add.text(0, -40, chronicleLine, {
          fontFamily: 'monospace', fontSize: '11px', color: ANS.TEAL, align: 'center',
        }).setOrigin(0.5)
      : undefined;

    const restartBtn = new JuicyButton({
      scene: this.scene, x: -95, y: -22 + CHRONICLE_SHIFT, width: 84, height: 48,
      label: '다시하기', variant: 'primary', fontSize: 12, sfx: this.sfx,
      onClick: () => { this.onRestart(); },
    });

    const infiniteBtn = new JuicyButton({
      scene: this.scene, x: 0, y: -22 + CHRONICLE_SHIFT, width: 84, height: 48,
      label: '무한 모드', variant: 'ghost', fontSize: 12, sfx: this.sfx,
      onClick: () => {
        container.destroy();
        this.container = undefined;
        this.onInfiniteMode();
      },
    });

    const menuBtn = new JuicyButton({
      scene: this.scene, x: 95, y: -22 + CHRONICLE_SHIFT, width: 84, height: 48,
      label: '스테이지선택', variant: 'ghost', fontSize: 11, sfx: this.sfx,
      onClick: () => { this.onStageSelect(); },
    });

    const items: Phaser.GameObjects.GameObject[] = [
      bgGfx, divGfx, title, gemReward, timeText, gemInfo,
      restartBtn.container, infiniteBtn.container, menuBtn.container,
    ];
    if (chronicleText) items.push(chronicleText);

    // DPS meter below buttons
    appendDpsMeter(this.scene, this.state, items, 18 + CHRONICLE_SHIFT);

    container.add(items);
    this.container = container;
  }
}
