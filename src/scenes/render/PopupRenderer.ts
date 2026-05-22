import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../game/config';
import { GameState } from '../../game/GameState';
import { Reward } from '../../game/types';
import { CENTER_X, CENTER_Y } from '../constants';

export class PopupRenderer {
  private scene: Phaser.Scene;
  private state: GameState;
  private onRestart: () => void;
  private onGemContinue: () => void;
  private onInfiniteMode: () => void;

  private gameOverContainer?: Phaser.GameObjects.Container;
  private victoryContainer?: Phaser.GameObjects.Container;
  private dimOverlay?: Phaser.GameObjects.Rectangle;
  private rewardContainer?: Phaser.GameObjects.Container;
  private allRewards: Reward[] = [];

  constructor(
    scene: Phaser.Scene,
    state: GameState,
    onRestart: () => void,
    onGemContinue: () => void,
    onInfiniteMode: () => void,
  ) {
    this.scene = scene;
    this.state = state;
    this.onRestart = onRestart;
    this.onGemContinue = onGemContinue;
    this.onInfiniteMode = onInfiniteMode;
  }

  get hasGameOverPopup(): boolean {
    return !!this.gameOverContainer;
  }

  get hasVictoryPopup(): boolean {
    return !!this.victoryContainer;
  }

  showGameOver(): void {
    if (this.gameOverContainer) return;

    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(20);
    const bg = this.scene.add.rectangle(0, 0, 290, 210, 0x000000, 0.88);
    const title = this.scene.add.text(0, -78, 'GAME OVER', {
      fontFamily: 'monospace', fontSize: '24px', color: '#ff5555',
    }).setOrigin(0.5);

    const restartBtn = this.scene.add.text(0, -24, '  다시하기  ', {
      fontFamily: 'monospace', fontSize: '15px', color: '#ffffff',
      backgroundColor: '#334433', padding: { x: 14, y: 9 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => { this.onRestart(); });

    const hasGems = this.state.gems > 0;
    const gemBtn = this.scene.add.text(0, 44, `  보석(${this.state.gems})로 이어하기  `, {
      fontFamily: 'monospace', fontSize: '14px',
      color: hasGems ? '#ffffff' : '#666666',
      backgroundColor: hasGems ? '#334455' : '#222222',
      padding: { x: 14, y: 9 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: hasGems });
    if (hasGems) gemBtn.on('pointerdown', () => { this.onGemContinue(); });

    container.add([bg, title, restartBtn, gemBtn]);
    this.gameOverContainer = container;
  }

  hideGameOver(): void {
    this.gameOverContainer?.destroy();
    this.gameOverContainer = undefined;
  }

  showVictory(): void {
    if (this.victoryContainer) return;

    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(20);
    const bg = this.scene.add.rectangle(0, 0, 310, 240, 0x000000, 0.92);
    const title = this.scene.add.text(0, -95, '🏆 VICTORY 🏆', {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffd700', align: 'center',
    }).setOrigin(0.5);
    const gemInfo = this.scene.add.text(0, -48, `보석 +1 획득! 현재 💎 ${this.state.gems}개`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#aaddff', align: 'center',
    }).setOrigin(0.5);

    const restartBtn = this.scene.add.text(-95, 30, ' 다시하기 ', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
      backgroundColor: '#334433', padding: { x: 8, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => { this.onRestart(); });

    const infiniteBtn = this.scene.add.text(0, 30, ' 무한 모드 ', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
      backgroundColor: '#334455', padding: { x: 8, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    infiniteBtn.on('pointerdown', () => {
      container.destroy();
      this.victoryContainer = undefined;
      this.onInfiniteMode();
    });

    const menuBtn = this.scene.add.text(95, 30, ' 메인메뉴 ', {
      fontFamily: 'monospace', fontSize: '13px', color: '#888888',
      backgroundColor: '#222222', padding: { x: 8, y: 8 },
    }).setOrigin(0.5).setAlpha(0.4);
    menuBtn.disableInteractive();

    container.add([bg, title, gemInfo, restartBtn, infiniteBtn, menuBtn]);
    this.victoryContainer = container;
  }

  showReward(count: 2 | 3, pregenerated?: Reward[]): void {
    this.rewardContainer?.destroy();
    this.dimOverlay?.destroy();

    if (pregenerated) this.allRewards = pregenerated;

    this.dimOverlay = this.scene.add
      .rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72)
      .setDepth(15);

    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(16);
    const bg = this.scene.add.rectangle(0, 0, 326, 230, 0x111122, 0.96);

    const title = this.scene.add.text(0, -95, '⚔️ 보스 처치!\n보상을 선택하세요', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffd700', align: 'center',
    }).setOrigin(0.5);

    const rewards = this.allRewards.slice(0, count);
    const xPositions = count === 2 ? [-82, 82] : [-115, 0, 115];

    const cards = rewards.map((reward, i) => {
      const card = this.scene.add.text(xPositions[i], 10, reward.label, {
        fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
        backgroundColor: '#1a3355', padding: { x: 10, y: 16 },
        align: 'center',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      card.on('pointerover', () => card.setStyle({ backgroundColor: '#2a5588' }));
      card.on('pointerout', () => card.setStyle({ backgroundColor: '#1a3355' }));
      card.on('pointerdown', () => {
        this.state.applyReward(reward.type);
        this.closeReward();
      });
      return card;
    });

    const items: Phaser.GameObjects.GameObject[] = [bg, title, ...cards];

    if (count === 2 && this.state.gems > 0) {
      const expandBtn = this.scene.add.text(0, 100, `💎 선택지 추가 (보석 ${this.state.gems}개)`, {
        fontFamily: 'monospace', fontSize: '12px', color: '#aaddff',
        backgroundColor: '#113344', padding: { x: 12, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      expandBtn.on('pointerdown', () => {
        if (this.state.gems <= 0) return;
        this.state.gems -= 1;
        this.showReward(3);
      });
      items.push(expandBtn);
    }

    container.add(items);
    this.rewardContainer = container;
  }

  private closeReward(): void {
    this.rewardContainer?.destroy();
    this.rewardContainer = undefined;
    this.dimOverlay?.destroy();
    this.dimOverlay = undefined;
    this.allRewards = [];
  }
}
