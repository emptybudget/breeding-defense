import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SUMMON_MAX_COST, VICTORY_TIME_MS } from '../../game/config';
import { GameState } from '../../game/GameState';
import { ANS, drawHudBar } from '../artnouveau';
import { CENTER_X, SELL_ZONE_X, SELL_ZONE_Y } from '../constants';

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
  private onPause: () => void;
  private onRecipeBook: () => void;

  constructor(scene: Phaser.Scene, onSummon: () => void, onPopUpgrade: () => void, onPause: () => void, onRecipeBook: () => void) {
    this.scene = scene;
    this.onSummon = onSummon;
    this.onPopUpgrade = onPopUpgrade;
    this.onPause = onPause;
    this.onRecipeBook = onRecipeBook;
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

    // Bottom HUD — Art Nouveau frame
    const botGfx = this.scene.add.graphics().setDepth(5);
    botGfx.setPosition(0, GAME_HEIGHT - 76);
    drawHudBar(botGfx, GAME_WIDTH, 76);

    this.summonBtn = this.scene.add.text(80, GAME_HEIGHT - 52, '', {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.CREAM,
      backgroundColor: '#2c3418', padding: { x: 10, y: 8 },
    }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true });
    this.summonBtn.on('pointerdown', () => { this.onSummon(); });

    this.popBtn = this.scene.add.text(230, GAME_HEIGHT - 52, '', {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.CREAM,
      backgroundColor: '#3d2810', padding: { x: 10, y: 8 },
    }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true });
    this.popBtn.on('pointerdown', () => { this.onPopUpgrade(); });

    // Sell zone
    this.scene.add.text(SELL_ZONE_X, SELL_ZONE_Y, '🗑️', {
      fontSize: '20px', backgroundColor: '#3d1a0a', padding: { x: 6, y: 4 },
    }).setOrigin(0.5).setDepth(6);
  }

  update(state: GameState): void {
    this.timerText.setText(state.formatTimer());
    if (state.phase === 'playing') {
      const remaining = VICTORY_TIME_MS - state.elapsedMs;
      this.timerText.setColor(remaining <= 60000 ? '#ff4444' : remaining <= 180000 ? '#ffdd00' : ANS.CREAM);
    } else {
      this.timerText.setColor(ANS.CREAM);
    }
    this.countText.setText(`${state.enemyCount} / 50`);
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
    this.popBtn.setText(`사회성 (${state.populationUpgradeCost}G)`);
  }
}
