import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, META_UPGRADES, STAGE_CONFIGS, STAGE_UNLOCK_GEM_COST, StageId, UpgradeKey, VICTORY_TIME_MS } from '../game/config';
import { MetaProgress } from '../game/MetaProgress';
import { AN, ANS, drawDivider } from './artnouveau';
import { CENTER_X, CENTER_Y } from './constants';

export class StageSelectScene extends Phaser.Scene {
  constructor() {
    super('StageSelectScene');
  }

  create(): void {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const meta = new MetaProgress();

    this.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, AN.BG_DEEP);

    // Title
    this.add.text(CENTER_X, 46, 'STAGES', {
      fontFamily: 'monospace', fontSize: '28px', color: ANS.GOLD_TEXT,
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Gem display
    this.add.text(CENTER_X, 82, `💎 ${meta.gems}개`, {
      fontFamily: 'monospace', fontSize: '18px', color: ANS.TEAL,
    }).setOrigin(0.5);
    this.add.text(CENTER_X, 104, '승리 시 💎1개 획득', {
      fontFamily: 'monospace', fontSize: '11px', color: ANS.PARCH,
    }).setOrigin(0.5);

    // Stage buttons
    this.makeStageButton(CENTER_X, 140, 1, meta);
    this.makeStageButton(CENTER_X, 200, 2, meta);
    this.makeStageButton(CENTER_X, 260, 3, meta);

    // Divider
    const div = this.add.graphics();
    drawDivider(div, 30, 292, GAME_WIDTH - 60);

    // Shop header
    this.add.text(CENTER_X, 310, '🛒 영구 강화', {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.PARCH,
    }).setOrigin(0.5);

    // Upgrade rows
    const keys: UpgradeKey[] = ['startingGold', 'summonCost', 'unitCap', 'autoGold', 'gameSpeed2x'];
    keys.forEach((key, i) => this.makeUpgradeRow(meta, key, 336 + i * 52));
  }

  private makeStageButton(x: number, y: number, stageId: number, meta: MetaProgress): void {
    const cfg = STAGE_CONFIGS[stageId as StageId];
    const cost = STAGE_UNLOCK_GEM_COST[stageId] ?? 0;
    const isUnlocked = meta.isStageUnlocked(stageId);
    const canAfford = meta.gems >= cost;

    // Best record label (shown for unlocked stages)
    if (isUnlocked) {
      const recMs = meta.getStageRecord(stageId);
      if (recMs !== null) {
        const isInfinite = recMs > VICTORY_TIME_MS;
        const label = meta.formatRecord(recMs, isInfinite);
        this.add.text(x, y + 24, label, {
          fontFamily: 'monospace', fontSize: '11px', color: ANS.GOLD,
        }).setOrigin(0.5);
      }
    }

    if (isUnlocked) {
      // Play button
      const btn = this.add.text(x, y, `  ${cfg.name}  `, {
        fontFamily: 'monospace', fontSize: '16px', color: ANS.CREAM,
        backgroundColor: '#243a18', padding: { x: 16, y: 10 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#2e5020' }));
      btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#243a18' }));
      btn.on('pointerdown', () => {
        btn.disableInteractive();
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene', { stageId });
        });
      });
    } else if (canAfford) {
      // Unlock button
      const btn = this.add.text(x, y, `  🔓 ${cfg.name}  (💎${cost} 소비)  `, {
        fontFamily: 'monospace', fontSize: '14px', color: ANS.GOLD,
        backgroundColor: '#2a2810', padding: { x: 12, y: 10 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#3a3810' }));
      btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#2a2810' }));
      btn.on('pointerdown', () => {
        btn.disableInteractive();
        meta.unlockStage(stageId, cost);
        this.scene.restart();
      });
    } else {
      // Locked — can't afford
      this.add.text(x, y, `  🔒 ${cfg.name}  (💎${cost} 필요)  `, {
        fontFamily: 'monospace', fontSize: '14px', color: ANS.DIM,
        backgroundColor: '#1a1a18', padding: { x: 12, y: 10 },
      }).setOrigin(0.5);
    }
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
          this.scene.restart();
        });
      }
    }
  }
}
