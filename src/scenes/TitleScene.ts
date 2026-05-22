import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/config';
import { CENTER_X, CENTER_Y } from './constants';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    this.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0x060612);

    this.add.text(CENTER_X, CENTER_Y - 90, 'Breeding\nDefense', {
      fontFamily: 'monospace',
      fontSize: '44px',
      color: '#ffd700',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    const prompt = this.add.text(CENTER_X, CENTER_Y + 80, '[ 화면을 터치하여 시작 ]', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#aaaaff',
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
