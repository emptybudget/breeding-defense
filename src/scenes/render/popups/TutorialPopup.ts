import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../../game/config';
import { ANS } from '../../artnouveau';
import { CENTER_X, CENTER_Y } from '../../constants';

export function showTutorial(scene: Phaser.Scene, onDismiss: () => void): void {
  const bg = scene.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.88)
    .setDepth(30)
    .setInteractive();

  const lines = [
    '🎮  조합 가이드  🎮',
    '',
    '같은 카테고리끼리 드래그하면',
    '❤  교배  →  개체수 증가!',
    '(Human⚔️🏹 / Beast🐶🐿️ / Robot🦾🚀)',
    '',
    '다른 카테고리끼리 드래그하면',
    '🧬  합성  →  2티어 유닛 생성!',
    '예)  ⚔️+🐶=🐺  /  ⚔️+🦾=🧬',
    '',
    '2티어+2티어 합성 →  3티어!',
    '3티어 3개 근처에 모으면 → 🌟 4티어!',
    '',
    '유닛 탭 → 레시피 확인',
    '더블탭 → 🔒 잠금 토글',
    '',
    '🗑️  하단 드롭존에 드래그하면',
    '    유닛 판매  →  골드 환급!',
    '',
    '[ 화면을 터치하면 시작됩니다 ]',
  ];

  const text = scene.add.text(CENTER_X, CENTER_Y - 10, lines.join('\n'), {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: ANS.CREAM,
    align: 'center',
    lineSpacing: 7,
  }).setOrigin(0.5).setDepth(31);

  const dismiss = () => {
    bg.removeAllListeners();
    scene.tweens.add({
      targets: [bg, text],
      alpha: 0,
      duration: 300,
      onComplete: () => { bg.destroy(); text.destroy(); onDismiss(); },
    });
  };

  bg.on('pointerdown', dismiss);
}
