import Phaser from 'phaser';
import { GameState } from '../../../game/GameState';
import { ANS, drawDivider, drawPanelAt } from '../../artnouveau';
import { CENTER_X, CENTER_Y } from '../../constants';
import { appendDpsMeter } from './shared';

export class VictoryPopup {
  private scene: Phaser.Scene;
  private state: GameState;
  private onRestart: () => void;
  private onInfiniteMode: () => void;
  private onStageSelect: () => void;

  private container?: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    state: GameState,
    onRestart: () => void,
    onInfiniteMode: () => void,
    onStageSelect: () => void,
  ) {
    this.scene = scene;
    this.state = state;
    this.onRestart = onRestart;
    this.onInfiniteMode = onInfiniteMode;
    this.onStageSelect = onStageSelect;
  }

  get isShown(): boolean {
    return !!this.container;
  }

  show(isNewRecord = false): void {
    if (this.container) return;

    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(20);

    const bgGfx = this.scene.add.graphics();
    drawPanelAt(bgGfx, 310, 350);

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

    const restartBtn = this.scene.add.text(-95, -22, ' 다시하기 ', {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
      backgroundColor: '#2a3a1e', padding: { x: 8, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => { this.onRestart(); });

    const infiniteBtn = this.scene.add.text(0, -22, ' 무한 모드 ', {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
      backgroundColor: '#1e3040', padding: { x: 8, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    infiniteBtn.on('pointerdown', () => {
      container.destroy();
      this.container = undefined;
      this.onInfiniteMode();
    });

    const menuBtn = this.scene.add.text(95, -22, ' 스테이지선택 ', {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
      backgroundColor: '#202038', padding: { x: 8, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => { this.onStageSelect(); });

    const items: Phaser.GameObjects.GameObject[] = [bgGfx, divGfx, title, gemReward, timeText, gemInfo, restartBtn, infiniteBtn, menuBtn];

    // DPS meter below buttons
    appendDpsMeter(this.scene, this.state, items, 18);

    container.add(items);
    this.container = container;
  }
}
