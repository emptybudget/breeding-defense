import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TIER1_ENHANCE_COST, TIER1_ENHANCE_MAX, TIER2_ENHANCE_COST, TIER2_ENHANCE_MAX } from '../../../game/config';
import { GameState } from '../../../game/GameState';
import { Tier1Race, UnitData } from '../../../game/types';
import { ANS, drawDivider, drawPanelAt } from '../../artnouveau';
import { CENTER_X, CENTER_Y, RACE_EMOJI } from '../../constants';

export class SoulShopPopup {
  private scene: Phaser.Scene;
  private state: GameState;
  private container?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, state: GameState) {
    this.scene = scene;
    this.state = state;
  }

  show(onUnitSummon: (unit: UnitData) => void, onClose: () => void): void {
    if (this.container) return;

    const state = this.state;
    const dim = this.scene.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.78)
      .setDepth(24).setInteractive();

    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(25);
    this.container = container;

    const close = () => {
      container.destroy(); this.container = undefined;
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
