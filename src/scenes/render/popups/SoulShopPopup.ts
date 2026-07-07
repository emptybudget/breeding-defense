import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TIER1_ENHANCE_COST, TIER1_ENHANCE_MAX, TIER2_ENHANCE_COST, TIER2_ENHANCE_MAX } from '../../../game/config';
import { GameState } from '../../../game/GameState';
import { Tier1Race, UnitData } from '../../../game/types';
import { ANS, drawDivider, drawPanelAt } from '../../artnouveau';
import { CENTER_X, CENTER_Y, RACE_EMOJI } from '../../constants';
import { SoundManager } from '../../SoundManager';
import { JuicyButton } from '../../ui/JuicyButton';

export class SoulShopPopup {
  private scene: Phaser.Scene;
  private state: GameState;
  private sfx?: SoundManager;
  private container?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, state: GameState, sfx?: SoundManager) {
    this.scene = scene;
    this.state = state;
    this.sfx = sfx;
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

    // Panel: 310 × 460 centered → screen y 90~550 (safe zone)
    const bgGfx = this.scene.add.graphics();
    drawPanelAt(bgGfx, 310, 460);

    const title = this.scene.add.text(0, -190, '💀 보스의 영혼 상점', {
      fontFamily: 'monospace', fontSize: '16px', color: '#cc88ff',
    }).setOrigin(0.5);

    const soulCountText = this.scene.add.text(0, -164, '', {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.PARCH,
    }).setOrigin(0.5);

    const div1 = this.scene.add.graphics();
    drawDivider(div1, -130, -146, 260);

    // ── 강화 section ─────────────────────────────────────────────────────────
    const enhanceLabel = this.scene.add.text(-130, -131, '⚔️  강화', {
      fontFamily: 'monospace', fontSize: '12px', color: ANS.GOLD,
    }).setOrigin(0, 0.5);

    const t1LabelText = this.scene.add.text(-126, -106, '', {
      fontFamily: 'monospace', fontSize: '12px', color: ANS.CREAM,
    }).setOrigin(0, 0.5);
    const t1Btn = new JuicyButton({
      scene: this.scene, x: 118, y: -106, width: 90, height: 48, label: '',
      variant: 'ghost', fontSize: 11, sfx: this.sfx,
      onClick: () => { if (state.upgradeTier1Atk()) refresh(); },
    });

    const t2LabelText = this.scene.add.text(-126, -54, '', {
      fontFamily: 'monospace', fontSize: '12px', color: ANS.CREAM,
    }).setOrigin(0, 0.5);
    const t2Btn = new JuicyButton({
      scene: this.scene, x: 118, y: -54, width: 90, height: 48, label: '',
      variant: 'ghost', fontSize: 11, sfx: this.sfx,
      onClick: () => { if (state.upgradeTier2Atk()) refresh(); },
    });

    const div2 = this.scene.add.graphics();
    drawDivider(div2, -130, -24, 260);

    // ── 유닛 구매 section ────────────────────────────────────────────────────
    const unitBuyLabel = this.scene.add.text(-130, -8, '🎯  유닛 직접 구매', {
      fontFamily: 'monospace', fontSize: '12px', color: ANS.GOLD,
    }).setOrigin(0, 0.5);

    const unitCostText = this.scene.add.text(-130, 16, '', {
      fontFamily: 'monospace', fontSize: '11px', color: ANS.PARCH,
    }).setOrigin(0, 0.5);

    const unitFullText = this.scene.add.text(60, 16, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ff8844',
    }).setOrigin(0.5);

    // 6 unit buttons: 3 cols × 2 rows
    const cols = [-96, 0, 96];
    const unitRows = [
      ['Warrior', 'Archer', 'Dog'],
      ['Squirrel', 'Android', 'Cannon'],
    ] as Tier1Race[][];

    const unitBtns: JuicyButton[] = [];
    unitRows.forEach((row, rowIdx) => {
      const y = 54 + rowIdx * 56;
      row.forEach((race, colIdx) => {
        const emoji = RACE_EMOJI[race] ?? '?';
        const btn = new JuicyButton({
          scene: this.scene, x: cols[colIdx], y, width: 84, height: 48,
          label: `${emoji}\n${race}`, variant: 'ghost', fontSize: 10, sfx: this.sfx,
          onClick: () => {
            const unit = state.soulSummonUnit(race);
            if (unit) { onUnitSummon(unit); refresh(); }
          },
        });
        unitBtns.push(btn);
      });
    });

    const closeBtn = new JuicyButton({
      scene: this.scene, x: 0, y: 190, width: 120, height: 48, label: '✖ 닫기',
      variant: 'danger', fontSize: 13, sfx: this.sfx, onClick: close,
    });

    const refresh = () => {
      soulCountText.setText(`보유 영혼: 💀 ${state.enhancePoints}`);

      const t1Maxed = state.tier1AtkBonus >= TIER1_ENHANCE_MAX;
      const t1CanBuy = !t1Maxed && state.enhancePoints >= TIER1_ENHANCE_COST;
      t1LabelText.setText(`1티어 강화 +1 dmg  (${state.tier1AtkBonus}/${TIER1_ENHANCE_MAX})`);
      t1Btn.setLabel(t1Maxed ? '최대' : `${TIER1_ENHANCE_COST}pt 구매`).setDisabled(t1Maxed || !t1CanBuy);

      const t2Maxed = state.tier2AtkBonus >= TIER2_ENHANCE_MAX;
      const t2CanBuy = !t2Maxed && state.enhancePoints >= TIER2_ENHANCE_COST;
      t2LabelText.setText(`2티어 강화 +1 dmg  (${state.tier2AtkBonus}/${TIER2_ENHANCE_MAX})`);
      t2Btn.setLabel(t2Maxed ? '최대' : `${TIER2_ENHANCE_COST}pt 구매`).setDisabled(t2Maxed || !t2CanBuy);

      const isFull = state.units.length >= state.maxUnits;
      unitCostText.setText(isFull ? '' : `현재 비용: ${state.soulSummonCost}pt`);
      unitFullText.setText(isFull ? '유닛 한도 초과' : '');

      const canBuyUnit = !isFull && state.enhancePoints >= state.soulSummonCost;
      unitBtns.forEach(btn => { btn.setDisabled(!canBuyUnit); });
    };

    refresh();

    container.add([
      bgGfx, title, soulCountText, div1,
      enhanceLabel, t1LabelText, t1Btn.container, t2LabelText, t2Btn.container, div2,
      unitBuyLabel, unitCostText, unitFullText, ...unitBtns.map(b => b.container),
      closeBtn.container,
    ]);
  }
}
