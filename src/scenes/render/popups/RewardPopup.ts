import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../../game/config';
import { GameState } from '../../../game/GameState';
import { Reward } from '../../../game/types';
import { ANS, drawDivider, drawPanelAt } from '../../artnouveau';
import { CENTER_X, CENTER_Y } from '../../constants';

export class RewardPopup {
  private scene: Phaser.Scene;
  private state: GameState;
  private onGemChange: (delta: number) => void;
  private container?: Phaser.GameObjects.Container;
  private dimOverlay?: Phaser.GameObjects.Rectangle;
  private allRewards: Reward[] = [];

  constructor(scene: Phaser.Scene, state: GameState, onGemChange: (delta: number) => void) {
    this.scene = scene;
    this.state = state;
    this.onGemChange = onGemChange;
  }

  show(count: 2 | 3, pregenerated?: Reward[]): void {
    this.container?.destroy();
    this.dimOverlay?.destroy();

    if (pregenerated) this.allRewards = pregenerated;

    this.dimOverlay = this.scene.add
      .rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72)
      .setDepth(15);

    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(16);

    const bgGfx = this.scene.add.graphics();
    drawPanelAt(bgGfx, 326, 230);

    const divGfx = this.scene.add.graphics();
    drawDivider(divGfx, -140, -68, 280);

    const title = this.scene.add.text(0, -95, '⚔️ 보스 처치!\n보상을 선택하세요', {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.GOLD_TEXT, align: 'center',
    }).setOrigin(0.5);

    const rewards = this.allRewards.slice(0, count);
    const xPositions = count === 2 ? [-82, 82] : [-115, 0, 115];

    const cards = rewards.map((reward, i) => {
      const card = this.scene.add.text(xPositions[i], 16, reward.label, {
        fontFamily: 'monospace', fontSize: '12px', color: ANS.CREAM,
        backgroundColor: '#1e2840', padding: { x: 10, y: 16 },
        align: 'center',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      card.on('pointerover', () => card.setStyle({ backgroundColor: '#2a3860' }));
      card.on('pointerout', () => card.setStyle({ backgroundColor: '#1e2840' }));
      card.on('pointerdown', () => {
        this.state.applyReward(reward.type);
        if (reward.type === 'gem') this.onGemChange(1);
        this.close();
      });
      return card;
    });

    const items: Phaser.GameObjects.GameObject[] = [bgGfx, divGfx, title, ...cards];

    if (count === 2 && this.state.gems > 0) {
      const expandBtn = this.scene.add.text(0, 100, `💎 선택지 추가 (보석 ${this.state.gems}개)`, {
        fontFamily: 'monospace', fontSize: '12px', color: ANS.TEAL,
        backgroundColor: '#102030', padding: { x: 12, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      expandBtn.on('pointerdown', () => {
        if (this.state.gems <= 0) return;
        this.state.gems -= 1;
        this.onGemChange(-1);
        this.show(3);
      });
      items.push(expandBtn);
    }

    container.add(items);
    this.container = container;
  }

  private close(): void {
    this.container?.destroy();
    this.container = undefined;
    this.dimOverlay?.destroy();
    this.dimOverlay = undefined;
    this.allRewards = [];
  }
}
