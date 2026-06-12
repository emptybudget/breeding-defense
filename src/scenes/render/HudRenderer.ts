import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, MAX_ENEMIES, MOBILE_SAFE_ZONE_BOTTOM, MOBILE_SAFE_ZONE_TOP, SUMMON_MAX_COST } from '../../game/config';
import { GameState } from '../../game/GameState';
import { ANS, drawHudBar } from '../artnouveau';
import { CENTER_X, SELL_ZONE_X } from '../constants';

export class HudRenderer {
  private scene: Phaser.Scene;
  private onSummon: () => void;
  private onPopUpgrade: () => void;

  private timerText!: Phaser.GameObjects.Text;
  private countText!: Phaser.GameObjects.Text;
  private enemyGaugeGfx!: Phaser.GameObjects.Graphics;
  private goldText!: Phaser.GameObjects.Text;
  private unitText!: Phaser.GameObjects.Text;
  private gemsText!: Phaser.GameObjects.Text;
  private summonBtn!: Phaser.GameObjects.Text;
  private popBtn!: Phaser.GameObjects.Text;
  private soulText?: Phaser.GameObjects.Text;
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
    const TOP = MOBILE_SAFE_ZONE_TOP;
    const BOT = MOBILE_SAFE_ZONE_BOTTOM;

    // Top HUD — Art Nouveau frame (taller to clear notch/dynamic island)
    const topGfx = this.scene.add.graphics().setDepth(5);
    drawHudBar(topGfx, GAME_WIDTH, 76 + TOP);

    this.timerText = this.scene.add.text(28, 8 + TOP, '00:00', {
      fontFamily: 'monospace', fontSize: '20px', color: ANS.CREAM,
    }).setDepth(6);

    this.gemsText = this.scene.add.text(CENTER_X, 8 + TOP, 'Gem: 3', {
      fontFamily: 'monospace', fontSize: '16px', color: ANS.TEAL,
    }).setOrigin(0.5, 0).setDepth(6);

    this.countText = this.scene.add.text(GAME_WIDTH - 28, 8 + TOP, '0 / 50', {
      fontFamily: 'monospace', fontSize: '18px', color: ANS.RED_SOFT,
    }).setOrigin(1, 0).setDepth(6);

    // G1: enemy capacity gauge (HRD) — under count text
    this.enemyGaugeGfx = this.scene.add.graphics().setDepth(6);

    this.goldText = this.scene.add.text(28, 42 + TOP, 'Gold: 100', {
      fontFamily: 'monospace', fontSize: '16px', color: ANS.GOLD_TEXT,
    }).setDepth(6);

    this.unitText = this.scene.add.text(GAME_WIDTH - 28, 42 + TOP, `Units: 0/${state.maxUnits}`, {
      fontFamily: 'monospace', fontSize: '16px', color: ANS.VINE,
    }).setOrigin(1, 0).setDepth(6);

    this.scene.add.text(CENTER_X - 26, 44 + TOP, ' ⏸ ', {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
      backgroundColor: '#2a2418', padding: { x: 7, y: 3 },
    }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { this.onPause(); });

    if (state.features.recipe) {
      this.scene.add.text(CENTER_X + 26, 44 + TOP, ' 📖 ', {
        fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
        backgroundColor: '#2a2418', padding: { x: 7, y: 3 },
      }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { this.onRecipeBook(); });
    }

    if (this.speed2xUnlocked) {
      this.speedBtn = this.scene.add.text(CENTER_X + 64, 44 + TOP, '1×', {
        fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
        backgroundColor: '#2a2418', padding: { x: 6, y: 3 },
      }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { this.onToggleSpeed(); });
    }

    // Bottom HUD — Art Nouveau frame (taller to clear home bar)
    const botGfx = this.scene.add.graphics().setDepth(5);
    botGfx.setPosition(0, GAME_HEIGHT - 76 - BOT);
    drawHudBar(botGfx, GAME_WIDTH, 76 + BOT);

    // Bottom bar row 1: summon | pop upgrade | sell zone
    this.summonBtn = this.scene.add.text(70, GAME_HEIGHT - 56 - BOT, '', {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.CREAM,
      backgroundColor: '#2c3418', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true });
    this.summonBtn.on('pointerdown', () => { this.onSummon(); });

    this.popBtn = this.scene.add.text(210, GAME_HEIGHT - 56 - BOT, '', {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.CREAM,
      backgroundColor: '#3d2810', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true });
    this.popBtn.on('pointerdown', () => { this.onPopUpgrade(); });

    if (state.features.sell) {
      this.scene.add.text(SELL_ZONE_X, GAME_HEIGHT - 56 - BOT, '🗑️', {
        fontSize: '20px', backgroundColor: '#3d1a0a', padding: { x: 6, y: 3 },
      }).setOrigin(0.5).setDepth(6);
    }

    // Bottom bar row 2: soul count | soul shop button
    if (state.features.soulShop) {
      this.soulText = this.scene.add.text(80, GAME_HEIGHT - 22 - BOT, '💀 영혼: 0', {
        fontFamily: 'monospace', fontSize: '12px', color: '#cc88ff',
      }).setOrigin(0.5).setDepth(6);

      this.scene.add.text(255, GAME_HEIGHT - 22 - BOT, ' 🔮 영혼 상점 ', {
        fontFamily: 'monospace', fontSize: '11px', color: ANS.CREAM,
        backgroundColor: '#1a0a2a', padding: { x: 8, y: 4 },
      }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { this.onSoulShop(); });
    }
  }

  update(state: GameState): void {
    this.timerText.setText(state.formatTimer());
    if (state.phase === 'playing') {
      const remaining = state.stageConfig.victoryTimeMs - state.elapsedMs;
      this.timerText.setColor(remaining <= 60000 ? '#ff4444' : remaining <= 180000 ? '#ffdd00' : ANS.CREAM);
    } else {
      this.timerText.setColor(ANS.CREAM);
    }
    this.countText.setText(`${state.enemyCount} / ${MAX_ENEMIES}`);

    // G1: enemy capacity gauge — 60% yellow / 80% red (danger border와 동일 임계)
    const ratio = Math.min(state.enemyCount / MAX_ENEMIES, 1);
    const gaugeW = 80;
    const gaugeX = GAME_WIDTH - 28 - gaugeW;
    const gaugeY = 31 + MOBILE_SAFE_ZONE_TOP;
    const fillColor = ratio >= 0.8 ? 0xff4444 : ratio >= 0.6 ? 0xffdd00 : 0x8aaa4a;
    this.enemyGaugeGfx.clear();
    this.enemyGaugeGfx.fillStyle(0x1a1a14, 1);
    this.enemyGaugeGfx.fillRect(gaugeX, gaugeY, gaugeW, 4);
    if (ratio > 0) {
      this.enemyGaugeGfx.fillStyle(fillColor, 1);
      this.enemyGaugeGfx.fillRect(gaugeX, gaugeY, Math.round(gaugeW * ratio), 4);
    }
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

    this.soulText?.setText(`💀 영혼: ${state.enhancePoints}`);

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
