import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TIER3_STATS } from '../../game/config';
import { GameState } from '../../game/GameState';
import { HybridRace, Race, Reward, Tier3Race, UnitData } from '../../game/types';
import { CENTER_X, CENTER_Y, RACE_EMOJI } from '../constants';

// Recipe lookup tables (Phaser-layer only, not game logic)
const TIER1_RECIPES: Record<Race, HybridRace[]> = {
  Human: ['Human_Beast', 'Human_Robot'],
  Beast: ['Human_Beast', 'Beast_Robot'],
  Robot: ['Human_Robot', 'Beast_Robot'],
};

const TIER2_RECIPES: Record<HybridRace, Tier3Race[]> = {
  Human_Beast: ['Cyborg_Wizard', 'Griffin'],
  Human_Robot: ['Cyborg_Wizard', 'Dino_Mecha'],
  Beast_Robot: ['Dino_Mecha', 'Griffin'],
};

const HYBRID_INGREDIENTS: Record<HybridRace, [Race, Race]> = {
  Human_Beast: ['Human', 'Beast'],
  Human_Robot: ['Human', 'Robot'],
  Beast_Robot: ['Beast', 'Robot'],
};

export class PopupRenderer {
  private scene: Phaser.Scene;
  private state: GameState;
  private onRestart: () => void;
  private onGemContinue: () => void;
  private onInfiniteMode: () => void;
  private onStageSelect: () => void;

  private gameOverContainer?: Phaser.GameObjects.Container;
  private victoryContainer?: Phaser.GameObjects.Container;
  private dimOverlay?: Phaser.GameObjects.Rectangle;
  private rewardContainer?: Phaser.GameObjects.Container;
  private allRewards: Reward[] = [];

  private recipeContainer?: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    state: GameState,
    onRestart: () => void,
    onGemContinue: () => void,
    onInfiniteMode: () => void,
    onStageSelect: () => void,
  ) {
    this.scene = scene;
    this.state = state;
    this.onRestart = onRestart;
    this.onGemContinue = onGemContinue;
    this.onInfiniteMode = onInfiniteMode;
    this.onStageSelect = onStageSelect;
  }

  get hasGameOverPopup(): boolean {
    return !!this.gameOverContainer;
  }

  get hasVictoryPopup(): boolean {
    return !!this.victoryContainer;
  }

  // ── Tutorial ──────────────────────────────────────────────────────────────

  showTutorial(onDismiss: () => void): void {
    const bg = this.scene.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.88)
      .setDepth(30)
      .setInteractive();

    const lines = [
      '🎮  조합 가이드  🎮',
      '',
      '같은 종족끼리 드래그하면',
      '❤  교배  →  개체수 증가!',
      '',
      '다른 종족끼리 드래그하면',
      '🦾  합성  →  티어 상승!',
      '',
      '예)  👦+👦=👦  /  👦+🐶=🐺  /  🐺+🦾=🧙',
      '',
      '🗑️  하단 드롭존에 드래그하면',
      '    유닛 판매  →  골드 환급!',
      '',
      '[ 화면을 터치하면 시작됩니다 ]',
    ];

    const text = this.scene.add.text(CENTER_X, CENTER_Y - 10, lines.join('\n'), {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 7,
    }).setOrigin(0.5).setDepth(31);

    const dismiss = () => {
      bg.removeAllListeners();
      this.scene.tweens.add({
        targets: [bg, text],
        alpha: 0,
        duration: 300,
        onComplete: () => { bg.destroy(); text.destroy(); onDismiss(); },
      });
    };

    bg.on('pointerdown', dismiss);
  }

  // ── Recipe popup ──────────────────────────────────────────────────────────

  showRecipe(unit: UnitData, onClose: () => void): void {
    if (this.recipeContainer) return;

    const dim = this.scene.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65)
      .setDepth(20).setInteractive();

    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(21);
    this.recipeContainer = container;

    const close = () => {
      container.destroy(); this.recipeContainer = undefined;
      dim.destroy();
      onClose();
    };
    dim.on('pointerdown', close);

    let lines: string[] = [];

    if (unit.tier === 1) {
      const race = unit.race as Race;
      const emoji = RACE_EMOJI[race];
      lines = [
        `${emoji}  ${race}`,
        '─────────────────',
        ...TIER1_RECIPES[race].map(hybrid => {
          const [a, b] = HYBRID_INGREDIENTS[hybrid];
          const other = a === race ? b : a;
          return `${emoji} + ${RACE_EMOJI[other]} = ${RACE_EMOJI[hybrid]} ${hybrid}`;
        }),
      ];
    } else if (unit.tier === 2) {
      const hybrid = unit.race as HybridRace;
      const emoji = RACE_EMOJI[hybrid];
      lines = [
        `${emoji}  ${hybrid}`,
        '─────────────────',
        ...TIER2_RECIPES[hybrid].map(tier3 => {
          const otherHybrid = (Object.keys(TIER2_RECIPES) as HybridRace[]).find(
            h => h !== hybrid && TIER2_RECIPES[h].includes(tier3),
          )!;
          return `${emoji} + ${RACE_EMOJI[otherHybrid]} = ${RACE_EMOJI[tier3]} ${tier3}`;
        }),
      ];
    } else {
      const tier3 = unit.race as Tier3Race;
      const stats = TIER3_STATS[tier3];
      const emoji = RACE_EMOJI[tier3];
      lines = [
        `${emoji}  최종 티어!`,
        `${tier3}`,
        '─────────────────',
        `범위: ${stats.range}px`,
        `대미지: ${stats.damage}`,
        `공격속도: ${stats.attackIntervalMs}ms`,
        `동시 타겟: ${stats.maxTargets}`,
      ];
    }

    const bgH = 60 + lines.length * 22;
    const bg = this.scene.add.rectangle(0, 0, 270, bgH, 0x111133, 0.97);

    const closeBtn = this.scene.add.text(110, -(bgH / 2) + 14, ' X ', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
      backgroundColor: '#443333', padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', close);

    const content = this.scene.add.text(0, 8, lines.join('\n'), {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5);

    container.add([bg, closeBtn, content]);
  }

  // ── Game Over ─────────────────────────────────────────────────────────────

  showGameOver(): void {
    if (this.gameOverContainer) return;

    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(20);
    const bg = this.scene.add.rectangle(0, 0, 290, 250, 0x000000, 0.88);
    const title = this.scene.add.text(0, -95, 'GAME OVER', {
      fontFamily: 'monospace', fontSize: '24px', color: '#ff5555',
    }).setOrigin(0.5);

    const restartBtn = this.scene.add.text(0, -38, '  다시하기  ', {
      fontFamily: 'monospace', fontSize: '15px', color: '#ffffff',
      backgroundColor: '#334433', padding: { x: 14, y: 9 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => { this.onRestart(); });

    const hasGems = this.state.gems > 0;
    const gemBtn = this.scene.add.text(0, 26, `  보석(${this.state.gems})로 이어하기  `, {
      fontFamily: 'monospace', fontSize: '14px',
      color: hasGems ? '#ffffff' : '#666666',
      backgroundColor: hasGems ? '#334455' : '#222222',
      padding: { x: 14, y: 9 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: hasGems });
    if (hasGems) gemBtn.on('pointerdown', () => { this.onGemContinue(); });

    const stageBtn = this.scene.add.text(0, 90, '스테이지 선택으로 돌아가기', {
      fontFamily: 'monospace', fontSize: '12px', color: '#aaaaaa',
      backgroundColor: '#1a1a1a', padding: { x: 10, y: 7 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    stageBtn.on('pointerdown', () => { this.onStageSelect(); });

    container.add([bg, title, restartBtn, gemBtn, stageBtn]);
    this.gameOverContainer = container;
  }

  hideGameOver(): void {
    this.gameOverContainer?.destroy();
    this.gameOverContainer = undefined;
  }

  // ── Victory ───────────────────────────────────────────────────────────────

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

    const menuBtn = this.scene.add.text(95, 30, ' 스테이지선택 ', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
      backgroundColor: '#333355', padding: { x: 8, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => { this.onStageSelect(); });

    container.add([bg, title, gemInfo, restartBtn, infiniteBtn, menuBtn]);
    this.victoryContainer = container;
  }

  // ── Boss Reward ───────────────────────────────────────────────────────────

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
