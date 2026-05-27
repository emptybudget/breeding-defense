import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, MAX_ENEMIES, SUMMON_MAX_COST, VICTORY_TIME_MS } from '../../game/config';
import { GameState } from '../../game/GameState';
import { ANS, drawHudBar } from '../artnouveau';
import { CENTER_X, SELL_ZONE_X } from '../constants';

export class HudRenderer {
  private scene: Phaser.Scene;
  private onSummon: () => void;
  private onPopUpgrade: () => void;

  private timerText!: Phaser.GameObjects.Text;
  private countText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private unitText!: Phaser.GameObjects.Text;
  private gemsText!: Phaser.GameObjects.Text;
  private summonBtn!: Phaser.GameObjects.Text;
  private popBtn!: Phaser.GameObjects.Text;
  private soulText!: Phaser.GameObjects.Text;
  private speedBtn?: Phaser.GameObjects.Text;
  private unitPulseTween?: Phaser.Tweens.Tween;
  private onPause: () => void;
  private onRecipeBook: () => void;
  private onSoulShop: () => void;
  private onToggleSpeed: () => void;
  private getSpeedMult: () => number;
  private speed2xUnlocked: boolean;

  constructor(
    scene: Phaser.Scene,
    onSummon: () => void,
    onPopUpgrade: () => void,
    onPause: () => void,
    onRecipeBook: () => void,
    onSoulShop: () => void,
    onToggleSpeed: () => void,
    getSpeedMult: () => number,
    speed2xUnlocked: boolean,
  ) {
    this.scene = scene;
    this.onSummon = onSummon;
    this.onPopUpgrade = onPopUpgrade;
    this.onPause = onPause;
    this.onRecipeBook = onRecipeBook;
    this.onSoulShop = onSoulShop;
    this.onToggleSpeed = onToggleSpeed;
    this.getSpeedMult = getSpeedMult;
    this.speed2xUnlocked = speed2xUnlocked;
  }

  create(state: GameState): void {
    // Top HUD — Art Nouveau frame
    const topGfx = this.scene.add.graphics().setDepth(5);
    drawHudBar(topGfx, GAME_WIDTH, 76);

    this.timerText = this.scene.add.text(28, 8, '00:00', {
      fontFamily: 'monospace', fontSize: '20px', color: ANS.CREAM,
    }).setDepth(6);

    this.gemsText = this.scene.add.text(CENTER_X, 8, 'Gem: 3', {
      fontFamily: 'monospace', fontSize: '16px', color: ANS.TEAL,
    }).setOrigin(0.5, 0).setDepth(6);

    this.countText = this.scene.add.text(GAME_WIDTH - 28, 8, '0 / 50', {
      fontFamily: 'monospace', fontSize: '18px', color: ANS.RED_SOFT,
    }).setOrigin(1, 0).setDepth(6);

    this.goldText = this.scene.add.text(28, 42, 'Gold: 100', {
      fontFamily: 'monospace', fontSize: '16px', color: ANS.GOLD_TEXT,
    }).setDepth(6);

    this.unitText = this.scene.add.text(GAME_WIDTH - 28, 42, `Units: 0/${state.maxUnits}`, {
      fontFamily: 'monospace', fontSize: '16px', color: ANS.VINE,
    }).setOrigin(1, 0).setDepth(6);

    this.scene.add.text(CENTER_X - 26, 44, ' ⏸ ', {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
      backgroundColor: '#2a2418', padding: { x: 7, y: 3 },
    }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { this.onPause(); });

    this.scene.add.text(CENTER_X + 26, 44, ' 📖 ', {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
      backgroundColor: '#2a2418', padding: { x: 7, y: 3 },
    }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { this.onRecipeBook(); });

    if (this.speed2xUnlocked) {
      this.speedBtn = this.scene.add.text(CENTER_X + 64, 44, '1×', {
        fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
        backgroundColor: '#2a2418', padding: { x: 6, y: 3 },
      }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { this.onToggleSpeed(); });
    }

    // Bottom HUD — Art Nouveau frame
    const botGfx = this.scene.add.graphics().setDepth(5);
    botGfx.setPosition(0, GAME_HEIGHT - 76);
    drawHudBar(botGfx, GAME_WIDTH, 76);

    // Bottom bar row 1: summon | pop upgrade | sell zone
    this.summonBtn = this.scene.add.text(70, GAME_HEIGHT - 56, '', {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.CREAM,
      backgroundColor: '#2c3418', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true });
    this.summonBtn.on('pointerdown', () => { this.onSummon(); });

    this.popBtn = this.scene.add.text(210, GAME_HEIGHT - 56, '', {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.CREAM,
      backgroundColor: '#3d2810', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true });
    this.popBtn.on('pointerdown', () => { this.onPopUpgrade(); });

    this.scene.add.text(SELL_ZONE_X, GAME_HEIGHT - 56, '🗑️', {
      fontSize: '20px', backgroundColor: '#3d1a0a', padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setDepth(6);

    // Bottom bar row 2: soul count | soul shop button
    this.soulText = this.scene.add.text(80, GAME_HEIGHT - 22, '💀 영혼: 0', {
      fontFamily: 'monospace', fontSize: '12px', color: '#cc88ff',
    }).setOrigin(0.5).setDepth(6);

    this.scene.add.text(255, GAME_HEIGHT - 22, ' 🔮 영혼 상점 ', {
      fontFamily: 'monospace', fontSize: '11px', color: ANS.CREAM,
      backgroundColor: '#1a0a2a', padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { this.onSoulShop(); });
  }

  update(state: GameState): void {
    this.timerText.setText(state.formatTimer());
    if (state.phase === 'playing') {
      const remaining = VICTORY_TIME_MS - state.elapsedMs;
      this.timerText.setColor(remaining <= 60000 ? '#ff4444' : remaining <= 180000 ? '#ffdd00' : ANS.CREAM);
    } else {
      this.timerText.setColor(ANS.CREAM);
    }
    this.countText.setText(`${state.enemyCount} / ${MAX_ENEMIES}`);
    this.goldText.setText(`Gold: ${state.gold}`);
    this.unitText.setText(`Units: ${state.units.length}/${state.maxUnits}`);
    this.gemsText.setText(`Gem: ${state.gems}`);

    const atCap = state.units.length >= state.maxUnits;
    const atMax = state.summonCost >= SUMMON_MAX_COST;
    this.summonBtn.setText(atCap ? '소환 (FULL)' : atMax ? '소환 (MAX)' : `소환 (${state.summonCost}G)`);
    this.summonBtn.setStyle({
      backgroundColor: atCap ? '#1a1a14' : '#2c3418',
      color: atCap ? ANS.DIM : ANS.CREAM,
    });
    this.popBtn.setText(`한도+1 (${state.populationUpgradeCost}G)`);

    // U1: pulse unitText when at capacity
    if (atCap && !this.unitPulseTween) {
      this.unitText.setColor('#ff8844');
      this.unitPulseTween = this.scene.tweens.add({
        targets: this.unitText, alpha: { from: 1, to: 0.3 },
        duration: 400, yoyo: true, repeat: -1,
      });
    } else if (!atCap && this.unitPulseTween) {
      this.unitPulseTween.stop();
      this.unitPulseTween = undefined;
      this.unitText.setAlpha(1).setColor(ANS.VINE);
    }

    this.soulText.setText(`💀 영혼: ${state.enhancePoints}`);

    if (this.speedBtn) {
      const mult = this.getSpeedMult();
      this.speedBtn.setText(mult === 2 ? '2×' : '1×');
      this.speedBtn.setStyle({
        backgroundColor: mult === 2 ? '#3d3010' : '#2a2418',
        color: mult === 2 ? ANS.GOLD_TEXT : ANS.CREAM,
      });
    }
  }
}
