import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SUMMON_MAX_COST } from '../../game/config';
import { GameState } from '../../game/GameState';
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

  constructor(scene: Phaser.Scene, onSummon: () => void, onPopUpgrade: () => void, onPause: () => void) {
    this.scene = scene;
    this.onSummon = onSummon;
    this.onPopUpgrade = onPopUpgrade;
    this.onPause = onPause;
  }

  create(state: GameState): void {
    // Top HUD
    this.scene.add.rectangle(0, 0, GAME_WIDTH, 76, 0x111111).setOrigin(0, 0).setDepth(5);
    this.timerText = this.scene.add.text(12, 8, '00:00', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
    }).setDepth(6);
    this.gemsText = this.scene.add.text(CENTER_X, 8, 'Gem: 3', {
      fontFamily: 'monospace', fontSize: '16px', color: '#aaddff',
    }).setOrigin(0.5, 0).setDepth(6);
    this.countText = this.scene.add.text(GAME_WIDTH - 12, 8, '0 / 50', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffaaaa',
    }).setOrigin(1, 0).setDepth(6);
    this.goldText = this.scene.add.text(12, 42, 'Gold: 100', {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffd700',
    }).setDepth(6);
    this.unitText = this.scene.add.text(GAME_WIDTH - 12, 42, `Units: 0/${state.maxUnits}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#aaffaa',
    }).setOrigin(1, 0).setDepth(6);

    this.scene.add.text(CENTER_X, 44, ' ⏸ ', {
      fontFamily: 'monospace', fontSize: '13px', color: '#cccccc',
      backgroundColor: '#333344', padding: { x: 7, y: 3 },
    }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { this.onPause(); });

    // Bottom bar
    this.scene.add.rectangle(0, GAME_HEIGHT - 76, GAME_WIDTH, 76, 0x111111).setOrigin(0, 0).setDepth(5);

    this.summonBtn = this.scene.add.text(80, GAME_HEIGHT - 52, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
      backgroundColor: '#335533', padding: { x: 10, y: 8 },
    }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true });
    this.summonBtn.on('pointerdown', () => { this.onSummon(); });

    this.popBtn = this.scene.add.text(210, GAME_HEIGHT - 52, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff',
      backgroundColor: '#553322', padding: { x: 10, y: 8 },
    }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true });
    this.popBtn.on('pointerdown', () => { this.onPopUpgrade(); });

    // Sell zone (bottom-right)
    this.scene.add.text(SELL_ZONE_X, SELL_ZONE_Y, '🗑️', {
      fontSize: '20px', backgroundColor: '#551111', padding: { x: 6, y: 4 },
    }).setOrigin(0.5).setDepth(6);
  }

  update(state: GameState): void {
    this.timerText.setText(state.formatTimer());
    this.countText.setText(`${state.enemyCount} / 50`);
    this.goldText.setText(`Gold: ${state.gold}`);
    this.unitText.setText(`Units: ${state.units.length}/${state.maxUnits}`);
    this.gemsText.setText(`Gem: ${state.gems}`);
    const atMax = state.summonCost >= SUMMON_MAX_COST;
    this.summonBtn.setText(atMax ? `소환 (MAX)` : `소환 (${state.summonCost}G)`);
    this.popBtn.setText(`사회성 (${state.populationUpgradeCost}G)`);
  }
}
