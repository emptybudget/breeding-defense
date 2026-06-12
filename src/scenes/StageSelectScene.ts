import Phaser from 'phaser';
import { DEV_UNLOCK_ALL_WORLDS, GAME_HEIGHT, GAME_WIDTH, META_UPGRADES, WORLD_CONFIGS, WorldId, WorldStageId, UpgradeKey } from '../game/config';
import { MetaProgress } from '../game/MetaProgress';
import { AN, ANS, drawDivider } from './artnouveau';
import { CENTER_X, CENTER_Y } from './constants';

export class StageSelectScene extends Phaser.Scene {
  private selectedWorld: WorldId = 1;

  constructor() {
    super('StageSelectScene');
  }

  create(): void {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const meta = new MetaProgress();
    const data = (this.scene.settings.data as Record<string, unknown>) ?? {};
    this.selectedWorld = ((data.selectedWorld as WorldId) ?? 1);

    this.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, AN.BG_DEEP);

    // Title
    this.add.text(CENTER_X, 38, 'STAGES', {
      fontFamily: 'monospace', fontSize: '26px', color: ANS.GOLD_TEXT,
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Gem display
    this.add.text(CENTER_X, 68, `💎 ${meta.gems}개`, {
      fontFamily: 'monospace', fontSize: '16px', color: ANS.TEAL,
    }).setOrigin(0.5);

    // World tabs
    this.drawWorldTabs(meta);

    // Stage grid for selected world
    this.drawStageGrid(meta);

    // Divider
    const div = this.add.graphics();
    drawDivider(div, 30, 278, GAME_WIDTH - 60);

    // Shop header
    this.add.text(CENTER_X, 296, '🛒 영구 강화', {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.PARCH,
    }).setOrigin(0.5);

    // Upgrade rows
    const keys: UpgradeKey[] = ['startingGold', 'summonCost', 'unitCap', 'autoGold', 'gameSpeed2x', 'jackpotSummon'];
    keys.forEach((key, i) => this.makeUpgradeRow(meta, key, 326 + i * 50));
  }

  private isWorldUnlocked(worldId: WorldId): boolean {
    if (DEV_UNLOCK_ALL_WORLDS) return true;
    if (worldId === 1) return true;
    // Production: W1 fully cleared → W2; W2 fully cleared → W3
    // For now just allow W1 always, others blocked without DEV flag
    return false;
  }

  private drawWorldTabs(meta: MetaProgress): void {
    const worlds: WorldId[] = [1, 2, 3];
    const labels = ['W1 튜토리얼', 'W2 본게임', 'W3 하드'];
    const xPositions = [70, 180, 290];

    worlds.forEach((w, i) => {
      const isSelected = this.selectedWorld === w;
      const isUnlocked = this.isWorldUnlocked(w);
      const bg = isSelected ? '#2e5020' : isUnlocked ? '#1a2810' : '#1a1a14';
      const color = isSelected ? ANS.GOLD_TEXT : isUnlocked ? ANS.CREAM : ANS.DIM;
      const label = isUnlocked ? labels[i] : `🔒 ${labels[i]}`;

      const btn = this.add.text(xPositions[i], 100, label, {
        fontFamily: 'monospace', fontSize: '11px', color,
        backgroundColor: bg, padding: { x: 6, y: 5 },
      }).setOrigin(0.5);

      if (isUnlocked) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => { if (!isSelected) btn.setStyle({ backgroundColor: '#263818' }); });
        btn.on('pointerout', () => { if (!isSelected) btn.setStyle({ backgroundColor: bg }); });
        btn.on('pointerdown', () => {
          if (isSelected) return;
          this.scene.restart({ selectedWorld: w });
        });
      }
    });

    void meta; // used in drawStageGrid
  }

  private drawStageGrid(meta: MetaProgress): void {
    const stages: WorldStageId[] = [1, 2, 3, 4, 5];
    // Row 1: stages 1-3 at y=165; Row 2: stages 4-5 at y=225
    const positions: { x: number; y: number }[] = [
      { x: 60, y: 165 }, { x: 180, y: 165 }, { x: 300, y: 165 },
      { x: 120, y: 225 }, { x: 240, y: 225 },
    ];

    stages.forEach((s, i) => {
      const cfg = WORLD_CONFIGS[this.selectedWorld][s];
      const recMs = meta.getStageRecord(this.selectedWorld * 10 + s);
      const { x, y } = positions[i];

      // Record label
      if (recMs !== null) {
        const isInfinite = recMs > cfg.victoryTimeMs;
        this.add.text(x, y + 24, meta.formatRecord(recMs, isInfinite), {
          fontFamily: 'monospace', fontSize: '9px', color: ANS.GOLD,
        }).setOrigin(0.5);
      }

      const btn = this.add.text(x, y, cfg.name, {
        fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
        backgroundColor: '#243a18', padding: { x: 8, y: 6 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#2e5020' }));
      btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#243a18' }));
      btn.on('pointerdown', () => {
        btn.disableInteractive();
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene', { world: this.selectedWorld, stage: s });
        });
      });
    });
  }

  private makeUpgradeRow(meta: MetaProgress, key: UpgradeKey, y: number): void {
    const upg = META_UPGRADES[key];
    const level = meta.getLevel(key);
    const isMax = level >= upg.maxLevel;
    const cost = isMax ? 0 : upg.costs[level];
    const canBuy = !isMax && meta.gems >= cost;

    const cardColor = isMax ? AN.BG_DARK : AN.BG_DEEP;
    const borderColor = isMax ? AN.GOLD_MID : AN.VINE_DARK;
    this.add.rectangle(CENTER_X, y, 320, 46, cardColor)
      .setStrokeStyle(1, borderColor);

    this.add.text(30, y - 10, `${upg.emoji} ${upg.label}`, {
      fontFamily: 'monospace', fontSize: '13px',
      color: isMax ? ANS.GOLD : ANS.CREAM,
    }).setOrigin(0, 0.5);

    const levelStr = isMax ? 'MAX' : `Lv.${level}/${upg.maxLevel}`;
    this.add.text(30, y + 10, `${levelStr}  ${upg.desc}`, {
      fontFamily: 'monospace', fontSize: '10px', color: ANS.PARCH,
    }).setOrigin(0, 0.5);

    if (isMax) {
      this.add.text(335, y, '✅ MAX', {
        fontFamily: 'monospace', fontSize: '12px', color: ANS.GOLD,
        padding: { x: 8, y: 6 },
      }).setOrigin(1, 0.5);
    } else {
      const btnBg = canBuy ? '#243a10' : '#1a1a14';
      const btnColor = canBuy ? ANS.VINE : ANS.DIM;
      const btn = this.add.text(335, y, `💎${cost} 업`, {
        fontFamily: 'monospace', fontSize: '12px', color: btnColor,
        backgroundColor: btnBg, padding: { x: 8, y: 6 },
      }).setOrigin(1, 0.5);

      if (canBuy) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#2a5018' }));
        btn.on('pointerout', () => btn.setStyle({ backgroundColor: btnBg }));
        btn.on('pointerdown', () => {
          btn.disableInteractive();
          meta.buyUpgrade(key, cost, upg.maxLevel);
          this.scene.restart({ selectedWorld: this.selectedWorld });
        });
      }
    }
  }
}
