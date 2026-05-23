import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TIER3_STATS, TIER4_STATS } from '../../game/config';
import { GameState } from '../../game/GameState';
import { HybridRace, Reward, Tier1Race, Tier3Race, UnitData } from '../../game/types';
import { ASTRAL_GOD_RECIPE, getTier2Recipes, getTier3Recipes } from '../../game/unitHelpers';
import { CENTER_X, CENTER_Y, RACE_EMOJI } from '../constants';

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
  private pauseContainer?: Phaser.GameObjects.Container;

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
      '같은 카테고리끼리 드래그하면',
      '❤  교배  →  개체수 증가!',
      '(Human⚔️🏹 / Beast🐶🐿️ / Robot🦾🚀)',
      '',
      '다른 카테고리끼리 드래그하면',
      '🧬  합성  →  2티어 유닛 생성!',
      '예)  ⚔️+🐶=🐺  /  ⚔️+🦾=🧬',
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

  // ── Pause ─────────────────────────────────────────────────────────────────

  showPause(onResume: () => void, onQuit: () => void): void {
    if (this.pauseContainer) return;

    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(20);
    const bg = this.scene.add.rectangle(0, 0, 290, 270, 0x000000, 0.92);

    const title = this.scene.add.text(0, -110, '⏸  일시정지', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5);

    const stats = [
      `경과 시간 : ${this.state.formatTimer()}`,
      `현재 골드 : ${this.state.gold} G`,
      `보유 유닛 : ${this.state.units.length} / ${this.state.maxUnits}`,
      `잔여 적   : ${this.state.enemyCount} / 50`,
      `보유 보석 : 💎 ${this.state.gems}`,
    ].join('\n');

    const statsText = this.scene.add.text(0, -30, stats, {
      fontFamily: 'monospace', fontSize: '14px', color: '#cccccc',
      align: 'left', lineSpacing: 8,
    }).setOrigin(0.5);

    const resumeBtn = this.scene.add.text(-68, 90, '  ▶ 계속하기  ', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
      backgroundColor: '#334433', padding: { x: 10, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerdown', () => {
      container.destroy();
      this.pauseContainer = undefined;
      onResume();
    });

    const quitBtn = this.scene.add.text(72, 90, '  🚪 종료  ', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffaaaa',
      backgroundColor: '#442222', padding: { x: 10, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    quitBtn.on('pointerdown', () => {
      container.destroy();
      this.pauseContainer = undefined;
      onQuit();
    });

    container.add([bg, title, statsText, resumeBtn, quitBtn]);
    this.pauseContainer = container;
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
      const race = unit.race as Tier1Race;
      const emoji = RACE_EMOJI[race];
      const recipes = getTier2Recipes(race);
      lines = [
        `${emoji}  ${race}`,
        '─────────────────',
        ...recipes.map(({ partner, result }) =>
          `${emoji} + ${RACE_EMOJI[partner]} = ${RACE_EMOJI[result]} ${result}`
        ),
      ];
    } else if (unit.tier === 2) {
      const race = unit.race as HybridRace;
      const emoji = RACE_EMOJI[race];
      const recipe = getTier3Recipes(race)[0];
      lines = [
        `${emoji}  ${race}`,
        '─────────────────',
      ];
      if (recipe) {
        lines.push(`${emoji} + ${RACE_EMOJI[recipe.partner]} = ${RACE_EMOJI[recipe.result]} ${recipe.result}`);
      } else {
        lines.push('레시피 없음');
      }
    } else if (unit.tier === 3) {
      const tier3 = unit.race as Tier3Race;
      const stats = TIER3_STATS[tier3];
      const emoji = RACE_EMOJI[tier3];
      lines = [
        `${emoji}  ${tier3}`,
        '─────────────────',
        `범위: ${stats.range}px`,
        `대미지: ${stats.damage}`,
        `공격속도: ${stats.attackIntervalMs}ms`,
        `동시 타겟: ${stats.maxTargets}`,
      ];
      if (ASTRAL_GOD_RECIPE.includes(tier3)) {
        const others = ASTRAL_GOD_RECIPE.filter(r => r !== tier3);
        lines.push('─────────────────');
        lines.push(`🌟 Astral_God 재료`);
        lines.push(`+ ${others.map(r => `${RACE_EMOJI[r]}`).join(' + ')} = 🌟`);
      }
    } else {
      const stats = TIER4_STATS['Astral_God'];
      lines = [
        `🌟  Astral_God`,
        '─────────────────',
        '✨ 세 세계의 융합체',
        `레시피: 🦅 + 🌩️ + 🧙`,
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
    const bg = this.scene.add.rectangle(0, 0, 290, 280, 0x000000, 0.88);
    const title = this.scene.add.text(0, -110, 'GAME OVER', {
      fontFamily: 'monospace', fontSize: '24px', color: '#ff5555',
    }).setOrigin(0.5);

    const timeText = this.scene.add.text(0, -70, `생존 시간: ${this.state.formatTimer()}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa',
    }).setOrigin(0.5);

    const restartBtn = this.scene.add.text(0, -28, '  다시하기  ', {
      fontFamily: 'monospace', fontSize: '15px', color: '#ffffff',
      backgroundColor: '#334433', padding: { x: 14, y: 9 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => { this.onRestart(); });

    const hasGems = this.state.gems > 0;
    const gemBtn = this.scene.add.text(0, 38, `  보석(${this.state.gems})로 이어하기  `, {
      fontFamily: 'monospace', fontSize: '14px',
      color: hasGems ? '#ffffff' : '#666666',
      backgroundColor: hasGems ? '#334455' : '#222222',
      padding: { x: 14, y: 9 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: hasGems });
    if (hasGems) gemBtn.on('pointerdown', () => { this.onGemContinue(); });

    const stageBtn = this.scene.add.text(0, 105, '스테이지 선택으로 돌아가기', {
      fontFamily: 'monospace', fontSize: '12px', color: '#aaaaaa',
      backgroundColor: '#1a1a1a', padding: { x: 10, y: 7 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    stageBtn.on('pointerdown', () => { this.onStageSelect(); });

    container.add([bg, title, timeText, restartBtn, gemBtn, stageBtn]);
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
    const bg = this.scene.add.rectangle(0, 0, 310, 270, 0x000000, 0.92);
    const title = this.scene.add.text(0, -115, '🏆 VICTORY 🏆', {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffd700', align: 'center',
    }).setOrigin(0.5);
    const stars = this.scene.add.text(0, -78, '⭐⭐⭐  +3', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffd700', align: 'center',
    }).setOrigin(0.5);
    const timeText = this.scene.add.text(0, -44, `생존 시간: ${this.state.formatTimer()}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa', align: 'center',
    }).setOrigin(0.5);
    const gemInfo = this.scene.add.text(0, -16, `보석 +1 획득! 현재 💎 ${this.state.gems}개`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#aaddff', align: 'center',
    }).setOrigin(0.5);

    const restartBtn = this.scene.add.text(-95, 42, ' 다시하기 ', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
      backgroundColor: '#334433', padding: { x: 8, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => { this.onRestart(); });

    const infiniteBtn = this.scene.add.text(0, 42, ' 무한 모드 ', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
      backgroundColor: '#334455', padding: { x: 8, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    infiniteBtn.on('pointerdown', () => {
      container.destroy();
      this.victoryContainer = undefined;
      this.onInfiniteMode();
    });

    const menuBtn = this.scene.add.text(95, 42, ' 스테이지선택 ', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffffff',
      backgroundColor: '#333355', padding: { x: 8, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => { this.onStageSelect(); });

    container.add([bg, title, stars, timeText, gemInfo, restartBtn, infiniteBtn, menuBtn]);
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
