import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../game/config';
import { AN, ANS, drawPanelAt } from './artnouveau';
import { CENTER_X, CENTER_Y } from './constants';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  preload(): void {
    if (!this.textures.exists('title_keyvisual')) {
      this.load.image('title_keyvisual', 'assets/ui/title_keyvisual.png');
    }
  }

  create(): void {
    // Background
    this.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, AN.BG_DEEP);

    // 타이틀 키비주얼 — 어두운 바탕 위 중앙, 세로 화면에 맞춰 커버 크롭
    if (this.textures.exists('title_keyvisual')) {
      const kv = this.add.image(CENTER_X, CENTER_Y, 'title_keyvisual').setDepth(0);
      const src = kv.width, srcH = kv.height;
      const scale = Math.max(GAME_WIDTH / src, GAME_HEIGHT / srcH); // cover
      kv.setScale(scale).setAlpha(0.9);
    }

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
