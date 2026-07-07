import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../../game/config';
import { GameState } from '../../../game/GameState';
import { Reward } from '../../../game/types';
import { ANS, drawDivider, drawPanelAt } from '../../artnouveau';
import { CENTER_X, CENTER_Y } from '../../constants';
import { SoundManager } from '../../SoundManager';
import { JuicyButton } from '../../ui/JuicyButton';

export class RewardPopup {
  private scene: Phaser.Scene;
  private state: GameState;
  private onGemChange: (delta: number) => void;
  private sfx?: SoundManager;
  private container?: Phaser.GameObjects.Container;
  private dimOverlay?: Phaser.GameObjects.Rectangle;
  private allRewards: Reward[] = [];

  constructor(scene: Phaser.Scene, state: GameState, onGemChange: (delta: number) => void, sfx?: SoundManager) {
    this.scene = scene;
    this.state = state;
    this.onGemChange = onGemChange;
    this.sfx = sfx;
  }

  get isShown(): boolean {
    return this.container !== undefined;
  }

  show(count: 2 | 3, pregenerated?: Reward[], opts?: { title?: string; allowExpand?: boolean }): void {
    this.container?.destroy();
    this.dimOverlay?.destroy();

    if (pregenerated) this.allRewards = pregenerated;
    const titleText = opts?.title ?? '⚔️ 보스 처치!\n보상을 선택하세요';
    const allowExpand = opts?.allowExpand ?? true;

    this.dimOverlay = this.scene.add
      .rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72)
      .setDepth(15)
      .setInteractive(); // 딤 영역 탭이 아래 필드(유닛 드래그·버튼)로 관통하는 것 차단

    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(16);

    const bgGfx = this.scene.add.graphics();
    drawPanelAt(bgGfx, 326, 230);

    const divGfx = this.scene.add.graphics();
    drawDivider(divGfx, -140, -68, 280);

    const title = this.scene.add.text(0, -95, titleText, {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.GOLD_TEXT, align: 'center',
    }).setOrigin(0.5);

    const rewards = this.allRewards.slice(0, count);
    const xPositions = count === 2 ? [-82, 82] : [-115, 0, 115];
    const cardWidth = count === 2 ? 150 : 100;

    const cards = rewards.map((reward, i) => new JuicyButton({
      scene: this.scene, x: xPositions[i], y: 16, width: cardWidth, height: 64,
      label: reward.label, variant: 'ghost', fontSize: 12, sfx: this.sfx,
      onClick: () => {
        this.state.applyReward(reward.type);
        this.close();
      },
    }));

    const items: Phaser.GameObjects.GameObject[] = [bgGfx, divGfx, title, ...cards.map(c => c.container)];

    if (allowExpand && count === 2 && this.state.gems > 0) {
      const expandBtn = new JuicyButton({
        scene: this.scene, x: 0, y: 88, width: 220, height: 48,
        label: `💎 선택지 추가 (보석 ${this.state.gems}개)`, variant: 'ghost', fontSize: 12, sfx: this.sfx,
        onClick: () => {
          if (this.state.gems <= 0) return;
          this.state.gems -= 1;
          this.onGemChange(-1);
          this.show(3);
        },
      });
      items.push(expandBtn.container);
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
