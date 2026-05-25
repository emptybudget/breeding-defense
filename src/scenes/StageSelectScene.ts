import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, META_UPGRADES, STAGE_CONFIGS, StageId, UpgradeKey } from '../game/config';
import { MetaProgress } from '../game/MetaProgress';
import { CENTER_X, CENTER_Y } from './constants';

export class StageSelectScene extends Phaser.Scene {
  constructor() {
    super('StageSelectScene');
  }

  create(): void {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const meta = new MetaProgress();

    this.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0x060612);

    // Title
    this.add.text(CENTER_X, 46, 'STAGES', {
      fontFamily: 'monospace', fontSize: '28px', color: '#ffd700',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Stars display
    this.add.text(CENTER_X, 82, `⭐ ${meta.stars}개`, {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffd700',
    }).setOrigin(0.5);
    this.add.text(CENTER_X, 104, '승리 시 ⭐3개 획득', {
      fontFamily: 'monospace', fontSize: '11px', color: '#666666',
    }).setOrigin(0.5);

    // Stage buttons (stage 2 unlocks at 3⭐, stage 3 at 9⭐)
    this.makeStageButton(CENTER_X, 140, 1, meta.stars, 0);
    this.makeStageButton(CENTER_X, 200, 2, meta.stars, 3);
    this.makeStageButton(CENTER_X, 260, 3, meta.stars, 9);

    // Divider
    const div = this.add.graphics();
    div.lineStyle(1, 0x333355, 1);
    div.lineBetween(30, 292, GAME_WIDTH - 30, 292);

    // Shop header
    this.add.text(CENTER_X, 310, '🛒 영구 강화', {
      fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa',
    }).setOrigin(0.5);

    // Upgrade rows (centers at y=348, 408, 468, 528)
    const keys: UpgradeKey[] = ['startingGold', 'summonCost', 'unitCap', 'autoGold'];
    keys.forEach((key, i) => this.makeUpgradeRow(meta, key, 348 + i * 58));
  }

  private makeStageButton(x: number, y: number, stageId: number, stars: number, requiredStars: number): void {
    const cfg = STAGE_CONFIGS[stageId as StageId];
    const unlocked = stars >= requiredStars;
    const label = unlocked ? cfg.name : `🔒 ${cfg.name} (${requiredStars}⭐ 필요)`;
    const bgColor = unlocked ? '#1e3d1e' : '#1a1a2a';
    const textColor = unlocked ? '#ffffff' : '#666666';

    const btn = this.add.text(x, y, `  ${label}  `, {
      fontFamily: 'monospace', fontSize: '16px', color: textColor,
      backgroundColor: bgColor, padding: { x: 16, y: 10 },
    }).setOrigin(0.5);

    if (unlocked) {
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#2e5e2e' }));
      btn.on('pointerout', () => btn.setStyle({ backgroundColor: bgColor }));
      btn.on('pointerdown', () => {
        btn.disableInteractive();
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene', { stageId });
        });
      });
    }
  }

  private makeUpgradeRow(meta: MetaProgress, key: UpgradeKey, y: number): void {
    const upg = META_UPGRADES[key];
    const level = meta.getLevel(key);
    const isMax = level >= upg.maxLevel;
    const cost = isMax ? 0 : upg.costs[level];
    const canBuy = !isMax && meta.stars >= cost;

    // Card background
    const cardColor = isMax ? 0x1a1a0a : 0x0e0e1e;
    const borderColor = isMax ? 0x887700 : 0x2a2a55;
    this.add.rectangle(CENTER_X, y, 320, 50, cardColor)
      .setStrokeStyle(1, borderColor);

    // Left: name
    this.add.text(30, y - 10, `${upg.emoji} ${upg.label}`, {
      fontFamily: 'monospace', fontSize: '13px',
      color: isMax ? '#ccaa00' : '#dddddd',
    }).setOrigin(0, 0.5);

    // Left: level + effect hint
    const levelStr = isMax ? 'MAX' : `Lv.${level}/${upg.maxLevel}`;
    this.add.text(30, y + 10, `${levelStr}  ${upg.desc}`, {
      fontFamily: 'monospace', fontSize: '10px', color: '#666688',
    }).setOrigin(0, 0.5);

    // Right: buy button or MAX badge
    if (isMax) {
      this.add.text(335, y, '✅ MAX', {
        fontFamily: 'monospace', fontSize: '12px', color: '#ccaa00',
        padding: { x: 8, y: 6 },
      }).setOrigin(1, 0.5);
    } else {
      const btnBg = canBuy ? '#1a3a0a' : '#1a1a1a';
      const btnColor = canBuy ? '#88ee44' : '#555555';
      const btn = this.add.text(335, y, `${cost}⭐ 업`, {
        fontFamily: 'monospace', fontSize: '12px', color: btnColor,
        backgroundColor: btnBg, padding: { x: 8, y: 6 },
      }).setOrigin(1, 0.5);

      if (canBuy) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#2a5a1a' }));
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
