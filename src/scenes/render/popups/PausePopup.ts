import Phaser from 'phaser';
import { GameState } from '../../../game/GameState';
import { ANS, drawDivider, drawPanelAt } from '../../artnouveau';
import { CENTER_X, CENTER_Y } from '../../constants';
import { appendDpsMeter } from './shared';

export class PausePopup {
  private scene: Phaser.Scene;
  private state: GameState;
  private container?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, state: GameState) {
    this.scene = scene;
    this.state = state;
  }

  show(
    onResume: () => void,
    onQuit: () => void,
    sound: { muted: () => boolean; toggle: () => void },
  ): void {
    if (this.container) return;

    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(20);

    const bgGfx = this.scene.add.graphics();
    drawPanelAt(bgGfx, 290, 460);

    const divGfx = this.scene.add.graphics();
    drawDivider(divGfx, -120, -108, 240);

    const title = this.scene.add.text(0, -130, '⏸  일시정지', {
      fontFamily: 'monospace', fontSize: '20px', color: ANS.GOLD,
    }).setOrigin(0.5);

    const stats = [
      `경과 시간 : ${this.state.formatTimer()}`,
      `현재 골드 : ${this.state.gold} G`,
      `보유 유닛 : ${this.state.units.length} / ${this.state.maxUnits}`,
      `잔여 적   : ${this.state.enemyCount} / 50`,
      `보유 보석 : 💎 ${this.state.gems}`,
    ].join('\n');

    const statsText = this.scene.add.text(0, -48, stats, {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.PARCH,
      align: 'left', lineSpacing: 8,
    }).setOrigin(0.5);

    const resumeBtn = this.scene.add.text(-68, 80, '  ▶ 계속하기  ', {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.CREAM,
      backgroundColor: '#2a3a1e', padding: { x: 10, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerdown', () => {
      container.destroy();
      this.container = undefined;
      onResume();
    });

    const quitBtn = this.scene.add.text(72, 80, '  🚪 종료  ', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffaaaa',
      backgroundColor: '#3a1a1a', padding: { x: 10, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    quitBtn.on('pointerdown', () => {
      container.destroy();
      this.container = undefined;
      onQuit();
    });

    // Sound toggle button
    const muteLabel = () => sound.muted() ? '🔇 소리 OFF' : '🔊 소리 ON';
    const muteBtn = this.scene.add.text(0, 130, muteLabel(), {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.CREAM,
      backgroundColor: '#2a2418', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    muteBtn.on('pointerdown', () => {
      sound.toggle();
      muteBtn.setText(muteLabel());
    });

    const pauseItems: Phaser.GameObjects.GameObject[] = [bgGfx, divGfx, title, statsText, resumeBtn, quitBtn, muteBtn];
    appendDpsMeter(this.scene, this.state, pauseItems, 152); // 마지막 줄이 패널 내부 테두리(+224) 안에 들어오도록
    container.add(pauseItems);
    this.container = container;
  }
}
