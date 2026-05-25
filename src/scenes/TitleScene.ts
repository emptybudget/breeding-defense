import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/config';
import { AN, ANS, drawPanelAt } from './artnouveau';
import { CENTER_X, CENTER_Y } from './constants';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    // Background
    this.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, AN.BG_DEEP);

    // Decorative AN panel behind title text
    const frameGfx = this.add.graphics();
    frameGfx.setPosition(CENTER_X, CENTER_Y - 80);
    drawPanelAt(frameGfx, 260, 110);

    this.add.text(CENTER_X, CENTER_Y - 98, 'Breeding\nDefense', {
      fontFamily: 'monospace',
      fontSize: '44px',
      color: ANS.GOLD_TEXT,
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Sub-decoration: vine dot row
    const decoGfx = this.add.graphics();
    decoGfx.fillStyle(AN.VINE_MAIN, 0.7);
    for (let i = 0; i < 7; i++) {
      decoGfx.fillCircle(CENTER_X - 54 + i * 18, CENTER_Y + 10, i === 3 ? 3.5 : 2);
    }
    decoGfx.fillStyle(AN.GOLD_MAIN, 1);
    decoGfx.fillCircle(CENTER_X, CENTER_Y + 10, 3.5);

    const prompt = this.add.text(CENTER_X, CENTER_Y + 80, '[ 화면을 터치하여 시작 ]', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: ANS.TEAL,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.15,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.input.once('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('StageSelectScene');
      });
    });
  }
}
