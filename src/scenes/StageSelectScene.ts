import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/config';
import { CENTER_X, CENTER_Y } from './constants';

export class StageSelectScene extends Phaser.Scene {
  constructor() {
    super('StageSelectScene');
  }

  create(): void {
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0x060612);

    this.add.text(CENTER_X, 120, 'STAGES', {
      fontFamily: 'monospace',
      fontSize: '34px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(CENTER_X, 168, '스테이지를 선택하세요', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);

    this.makeStageButton(CENTER_X, CENTER_Y, 1);
  }

  private makeStageButton(x: number, y: number, stageId: number): void {
    const btn = this.add.text(x, y, `  스테이지 ${stageId}  `, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#1e3d1e',
      padding: { x: 24, y: 18 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#2e5e2e' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#1e3d1e' }));
    btn.on('pointerdown', () => {
      btn.disableInteractive();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { stageId });
      });
    });
  }
}
