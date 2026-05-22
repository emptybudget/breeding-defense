import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './game/config';
import { GameScene } from './scenes/GameScene';
import { StageSelectScene } from './scenes/StageSelectScene';
import { TitleScene } from './scenes/TitleScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#060612',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [TitleScene, StageSelectScene, GameScene],
});
