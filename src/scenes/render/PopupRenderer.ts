import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TIER1_ENHANCE_COST, TIER1_ENHANCE_MAX, TIER2_ENHANCE_COST, TIER2_ENHANCE_MAX, TIER3_STATS, TIER4_STATS } from '../../game/config';
import { GameState } from '../../game/GameState';
import { HybridRace, Reward, Tier1Race, Tier3Race, UnitData } from '../../game/types';
import { ASTRAL_GOD_RECIPE, HYBRID_RACES, TIER1_RACES, getTier2Recipes, getTier3Recipes } from '../../game/unitHelpers';
import { ANS, drawDivider, drawPanelAt } from '../artnouveau';
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
  private recipeBookContainer?: Phaser.GameObjects.Container;
  private pauseContainer?: Phaser.GameObjects.Container;
  private soulShopContainer?: Phaser.GameObjects.Container;

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

    const text = this.scene.add.text(CENTER_X, CENTER_Y - 10, lines.join('\n'), {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: ANS.CREAM,
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

  showPause(
    onResume: () => void,
    onQuit: () => void,
    sound: { muted: () => boolean; toggle: () => void },
  ): void {
    if (this.pauseContainer) return;

    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(20);

    const bgGfx = this.scene.add.graphics();
    drawPanelAt(bgGfx, 290, 318);

    const divGfx = this.scene.add.graphics();
    drawDivider(divGfx, -120, -108, 240);

    const title = this.scene.add.text(0, -130, '⏸  일시정지', {
      fontFamily: 'monospace', fontSize: '20px', color: ANS.GOLD,
    }).setOrigin(0.5);

    const stats = [
      `경과 시간 : ${this.state.formatTimer()}`,
      `현재 골드 : ${this.state.gold} G`,
      `보유 유닛 : ${this.state.units.length} / ${this.state.maxUnits}`,
      `잔여 적   : ${this.state.enemyCount} / 50`,
      `보유 보석 : 💎 ${this.state.gems}`,
    ].join('\n');

    const statsText = this.scene.add.text(0, -48, stats, {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.PARCH,
      align: 'left', lineSpacing: 8,
    }).setOrigin(0.5);

    const resumeBtn = this.scene.add.text(-68, 80, '  ▶ 계속하기  ', {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.CREAM,
      backgroundColor: '#2a3a1e', padding: { x: 10, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerdown', () => {
      container.destroy();
      this.pauseContainer = undefined;
      onResume();
    });

    const quitBtn = this.scene.add.text(72, 80, '  🚪 종료  ', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffaaaa',
      backgroundColor: '#3a1a1a', padding: { x: 10, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    quitBtn.on('pointerdown', () => {
      container.destroy();
      this.pauseContainer = undefined;
      onQuit();
    });

    // Sound toggle button
    const muteLabel = () => sound.muted() ? '🔇 소리 OFF' : '🔊 소리 ON';
    const muteBtn = this.scene.add.text(0, 130, muteLabel(), {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.CREAM,
      backgroundColor: '#2a2418', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    muteBtn.on('pointerdown', () => {
      sound.toggle();
      muteBtn.setText(muteLabel());
    });

    container.add([bgGfx, divGfx, title, statsText, resumeBtn, quitBtn, muteBtn]);
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
    const bgGfx = this.scene.add.graphics();
    drawPanelAt(bgGfx, 270, bgH);

    const closeBtn = this.scene.add.text(110, -(bgH / 2) + 14, ' X ', {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
      backgroundColor: '#3a2020', padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', close);

    const content = this.scene.add.text(0, 8, lines.join('\n'), {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5);

    container.add([bgGfx, closeBtn, content]);
  }

  // ── Recipe Book ───────────────────────────────────────────────────────────

  showRecipeBook(onClose: () => void): void {
    if (this.recipeBookContainer) return;

    const dim = this.scene.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75)
      .setDepth(20).setInteractive();

    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(21);
    this.recipeBookContainer = container;

    const close = () => {
      container.destroy(); this.recipeBookContainer = undefined;
      dim.destroy();
      onClose();
    };
    dim.on('pointerdown', close);

    const tier1to2: string[] = [];
    const seen2 = new Set<string>();
    for (const race of TIER1_RACES) {
      for (const { partner, result } of getTier2Recipes(race)) {
        const key = [race, partner].sort().join('+');
        if (!seen2.has(key)) {
          seen2.add(key);
          tier1to2.push(`${RACE_EMOJI[race]}+${RACE_EMOJI[partner]} = ${RACE_EMOJI[result]} ${result}`);
        }
      }
    }

    const tier2to3: string[] = [];
    const seen3 = new Set<string>();
    for (const race of HYBRID_RACES) {
      for (const { partner, result } of getTier3Recipes(race)) {
        const key = [race, partner].sort().join('+');
        if (!seen3.has(key)) {
          seen3.add(key);
          tier2to3.push(`${RACE_EMOJI[race]}+${RACE_EMOJI[partner]} = ${RACE_EMOJI[result]} ${result}`);
        }
      }
    }

    const astralLine = `${ASTRAL_GOD_RECIPE.map(r => RACE_EMOJI[r]).join('+')} = 🌟 Astral_God`;

    const lines = [
      '📖  합성 레시피 북',
      '─ 1티어 → 2티어 ─',
      ...tier1to2,
      '─ 2티어 → 3티어 ─',
      ...tier2to3,
      '─ 3티어 → 4티어 ─',
      astralLine,
    ];

    const bgH = lines.length * 15 + 52;
    const bgGfx = this.scene.add.graphics();
    drawPanelAt(bgGfx, 270, bgH);

    const closeBtn = this.scene.add.text(110, -(bgH / 2) + 14, ' X ', {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
      backgroundColor: '#3a2020', padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', close);

    const content = this.scene.add.text(-120, -(bgH / 2) + 30, lines.join('\n'), {
      fontFamily: 'monospace', fontSize: '11px', color: ANS.CREAM,
      align: 'left', lineSpacing: 4,
    }).setOrigin(0, 0);

    container.add([bgGfx, closeBtn, content]);
  }

  // ── Game Over ─────────────────────────────────────────────────────────────

  showGameOver(): void {
    if (this.gameOverContainer) return;

    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(20);

    const bgGfx = this.scene.add.graphics();
    drawPanelAt(bgGfx, 290, 280);

    const divGfx = this.scene.add.graphics();
    drawDivider(divGfx, -120, -82, 240);

    const title = this.scene.add.text(0, -110, 'GAME OVER', {
      fontFamily: 'monospace', fontSize: '24px', color: '#ff5555',
    }).setOrigin(0.5);

    const timeText = this.scene.add.text(0, -62, `생존 시간: ${this.state.formatTimer()}`, {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.PARCH,
    }).setOrigin(0.5);

    const restartBtn = this.scene.add.text(0, -20, '  다시하기  ', {
      fontFamily: 'monospace', fontSize: '15px', color: ANS.CREAM,
      backgroundColor: '#2a3a1e', padding: { x: 14, y: 9 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => { this.onRestart(); });

    const hasGems = this.state.gems > 0;
    const gemBtn = this.scene.add.text(0, 46, `  보석(${this.state.gems})로 이어하기  `, {
      fontFamily: 'monospace', fontSize: '14px',
      color: hasGems ? ANS.CREAM : ANS.DIM,
      backgroundColor: hasGems ? '#1e3040' : '#1a1a14',
      padding: { x: 14, y: 9 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: hasGems });
    if (hasGems) gemBtn.on('pointerdown', () => { this.onGemContinue(); });

    const stageBtn = this.scene.add.text(0, 110, '스테이지 선택으로 돌아가기', {
      fontFamily: 'monospace', fontSize: '12px', color: ANS.PARCH,
      backgroundColor: '#1a1a0e', padding: { x: 10, y: 7 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    stageBtn.on('pointerdown', () => { this.onStageSelect(); });

    container.add([bgGfx, divGfx, title, timeText, restartBtn, gemBtn, stageBtn]);
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

    const bgGfx = this.scene.add.graphics();
    drawPanelAt(bgGfx, 310, 270);

    const divGfx = this.scene.add.graphics();
    drawDivider(divGfx, -130, -82, 260);

    const title = this.scene.add.text(0, -110, '🏆 VICTORY 🏆', {
      fontFamily: 'monospace', fontSize: '22px', color: ANS.GOLD_TEXT, align: 'center',
    }).setOrigin(0.5);

    const gemReward = this.scene.add.text(0, -73, '💎 +1 보석 획득!', {
      fontFamily: 'monospace', fontSize: '18px', color: ANS.TEAL, align: 'center',
    }).setOrigin(0.5);

    const timeText = this.scene.add.text(0, -42, `생존 시간: ${this.state.formatTimer()}`, {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.PARCH, align: 'center',
    }).setOrigin(0.5);

    const gemInfo = this.scene.add.text(0, -16, `현재 💎 ${this.state.gems}개`, {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.PARCH, align: 'center',
    }).setOrigin(0.5);

    const restartBtn = this.scene.add.text(-95, 42, ' 다시하기 ', {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
      backgroundColor: '#2a3a1e', padding: { x: 8, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', () => { this.onRestart(); });

    const infiniteBtn = this.scene.add.text(0, 42, ' 무한 모드 ', {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
      backgroundColor: '#1e3040', padding: { x: 8, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    infiniteBtn.on('pointerdown', () => {
      container.destroy();
      this.victoryContainer = undefined;
      this.onInfiniteMode();
    });

    const menuBtn = this.scene.add.text(95, 42, ' 스테이지선택 ', {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
      backgroundColor: '#202038', padding: { x: 8, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => { this.onStageSelect(); });

    container.add([bgGfx, divGfx, title, gemReward, timeText, gemInfo, restartBtn, infiniteBtn, menuBtn]);
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
        this.closeReward();
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

  // ── Soul Shop ─────────────────────────────────────────────────────────────

  showSoulShop(onUnitSummon: (unit: UnitData) => void, onClose: () => void): void {
    if (this.soulShopContainer) return;

    const state = this.state;
    const dim = this.scene.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78)
      .setDepth(24).setInteractive();

    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(25);
    this.soulShopContainer = container;

    const close = () => {
      container.destroy(); this.soulShopContainer = undefined;
      dim.destroy();
      onClose();
    };
    dim.on('pointerdown', close);

    // Panel: 310 × 380 centered → screen y 130~510 (safe zone)
    const bgGfx = this.scene.add.graphics();
    drawPanelAt(bgGfx, 310, 380);

    const title = this.scene.add.text(0, -174, '💀 보스의 영혼 상점', {
      fontFamily: 'monospace', fontSize: '16px', color: '#cc88ff',
    }).setOrigin(0.5);

    const soulCountText = this.scene.add.text(0, -148, '', {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.PARCH,
    }).setOrigin(0.5);

    const div1 = this.scene.add.graphics();
    drawDivider(div1, -130, -130, 260);

    // ── 강화 section ─────────────────────────────────────────────────────────
    const enhanceLabel = this.scene.add.text(-130, -115, '⚔️  강화', {
      fontFamily: 'monospace', fontSize: '12px', color: ANS.GOLD,
    }).setOrigin(0, 0.5);

    const t1LabelText = this.scene.add.text(-126, -90, '', {
      fontFamily: 'monospace', fontSize: '12px', color: ANS.CREAM,
    }).setOrigin(0, 0.5);
    const t1Btn = this.scene.add.text(118, -90, '', {
      fontFamily: 'monospace', fontSize: '11px', color: ANS.CREAM,
      backgroundColor: '#2a1a08', padding: { x: 8, y: 5 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    t1Btn.on('pointerdown', () => { if (state.upgradeTier1Atk()) refresh(); });

    const t2LabelText = this.scene.add.text(-126, -62, '', {
      fontFamily: 'monospace', fontSize: '12px', color: ANS.CREAM,
    }).setOrigin(0, 0.5);
    const t2Btn = this.scene.add.text(118, -62, '', {
      fontFamily: 'monospace', fontSize: '11px', color: ANS.CREAM,
      backgroundColor: '#08182a', padding: { x: 8, y: 5 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    t2Btn.on('pointerdown', () => { if (state.upgradeTier2Atk()) refresh(); });

    const div2 = this.scene.add.graphics();
    drawDivider(div2, -130, -38, 260);

    // ── 유닛 구매 section ────────────────────────────────────────────────────
    const unitBuyLabel = this.scene.add.text(-130, -22, '🎯  유닛 직접 구매', {
      fontFamily: 'monospace', fontSize: '12px', color: ANS.GOLD,
    }).setOrigin(0, 0.5);

    const unitCostText = this.scene.add.text(-130, 2, '', {
      fontFamily: 'monospace', fontSize: '11px', color: ANS.PARCH,
    }).setOrigin(0, 0.5);

    const unitFullText = this.scene.add.text(0, 2, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ff8844',
    }).setOrigin(0.5);

    // 6 unit buttons: 3 cols × 2 rows
    const cols = [-96, 0, 96];
    const unitRows = [
      ['Warrior', 'Archer', 'Dog'],
      ['Squirrel', 'Android', 'Cannon'],
    ] as Tier1Race[][];

    const unitBtns: Phaser.GameObjects.Text[] = [];
    unitRows.forEach((row, rowIdx) => {
      const y = 42 + rowIdx * 48;
      row.forEach((race, colIdx) => {
        const emoji = RACE_EMOJI[race] ?? '?';
        const btn = this.scene.add.text(cols[colIdx], y, `${emoji}\n${race}`, {
          fontFamily: 'monospace', fontSize: '10px', color: ANS.CREAM,
          backgroundColor: '#1a1040', padding: { x: 8, y: 6 },
          align: 'center',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => {
          const unit = state.soulSummonUnit(race);
          if (unit) { onUnitSummon(unit); refresh(); }
        });
        unitBtns.push(btn);
      });
    });

    const closeBtn = this.scene.add.text(0, 158, '  ✖ 닫기  ', {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
      backgroundColor: '#3a2020', padding: { x: 16, y: 7 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', close);

    const refresh = () => {
      soulCountText.setText(`보유 영혼: 💀 ${state.enhancePoints}`);

      const t1Maxed = state.tier1AtkBonus >= TIER1_ENHANCE_MAX;
      const t1CanBuy = !t1Maxed && state.enhancePoints >= TIER1_ENHANCE_COST;
      t1LabelText.setText(`1티어 강화 +1 dmg  (${state.tier1AtkBonus}/${TIER1_ENHANCE_MAX})`);
      t1Btn.setText(t1Maxed ? '최대' : `${TIER1_ENHANCE_COST}pt 구매`);
      t1Btn.setStyle({ color: t1CanBuy ? ANS.CREAM : ANS.DIM, backgroundColor: t1CanBuy ? '#2a1a08' : '#111108' });

      const t2Maxed = state.tier2AtkBonus >= TIER2_ENHANCE_MAX;
      const t2CanBuy = !t2Maxed && state.enhancePoints >= TIER2_ENHANCE_COST;
      t2LabelText.setText(`2티어 강화 +1 dmg  (${state.tier2AtkBonus}/${TIER2_ENHANCE_MAX})`);
      t2Btn.setText(t2Maxed ? '최대' : `${TIER2_ENHANCE_COST}pt 구매`);
      t2Btn.setStyle({ color: t2CanBuy ? ANS.CREAM : ANS.DIM, backgroundColor: t2CanBuy ? '#08182a' : '#080811' });

      const isFull = state.units.length >= state.maxUnits;
      unitCostText.setText(isFull ? '' : `현재 비용: ${state.soulSummonCost}pt`);
      unitFullText.setText(isFull ? '유닛 한도 초과' : '');

      const canBuyUnit = !isFull && state.enhancePoints >= state.soulSummonCost;
      unitBtns.forEach(btn => {
        btn.setStyle({ color: canBuyUnit ? ANS.CREAM : ANS.DIM, backgroundColor: canBuyUnit ? '#1a1040' : '#0d0a1e' });
      });
    };

    refresh();

    container.add([
      bgGfx, title, soulCountText, div1,
      enhanceLabel, t1LabelText, t1Btn, t2LabelText, t2Btn, div2,
      unitBuyLabel, unitCostText, unitFullText, ...unitBtns,
      closeBtn,
    ]);
  }
}
