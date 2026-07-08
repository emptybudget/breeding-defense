import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../../game/config';
import { HybridRace, Tier1Race, Tier3Race, UnitData } from '../../../game/types';
import { ASTRAL_GOD_RECIPE, getTier2Recipes, getTier3Recipes } from '../../../game/unitHelpers';
import { ANS } from '../../artnouveau';
import { CENTER_X, RACE_EMOJI } from '../../constants';
import { SoundManager } from '../../SoundManager';
import { JuicyButton } from '../../ui/JuicyButton';
import { UI } from '../../ui/tokens';

export interface UnitActionSheetOptions {
  canNest: boolean;
  canSell: boolean;
  showRecipes: boolean; // features.synthesize — 합성 조합 표시 여부
}

const nice = (race: string) => race.replace(/_/g, ' ');

/** 이 유닛이 합성으로 무엇이 되는지 1줄씩 ("+파트너 → 결과"). 없으면 안내 1줄. */
function buildRecipeLines(unit: UnitData): { lines: string[]; muted: boolean } {
  if (unit.tier === 1) {
    const rs = getTier2Recipes(unit.race as Tier1Race);
    return { lines: rs.map(r => `+${RACE_EMOJI[r.partner]} → ${RACE_EMOJI[r.result]} ${nice(r.result)}`), muted: false };
  }
  if (unit.tier === 2) {
    const rs = getTier3Recipes(unit.race as HybridRace);
    return { lines: rs.map(r => `+${RACE_EMOJI[r.partner]} → ${RACE_EMOJI[r.result]} ${nice(r.result)}`), muted: false };
  }
  if (unit.tier === 3 && ASTRAL_GOD_RECIPE.includes(unit.race as Tier3Race)) {
    const others = ASTRAL_GOD_RECIPE.filter(r => r !== unit.race);
    return { lines: [`+${others.map(r => RACE_EMOJI[r]).join('+')} → 🌟 Astral God`], muted: false };
  }
  return { lines: ['합성 조합 없음 (최종 형태)'], muted: true };
}

/**
 * 유닛 탭 → 바텀시트. '둥지로'/'판매' 액션(M1b) + 합성 조합 레시피(사용자 요청).
 * 스펙 기반: docs/redesign/17-ui-design-tokens.md §5 (상단 라운드16·bgDeep 0.97·그랩 핸들·200ms 슬라이드).
 * 높이는 콘텐츠(레시피 줄 수·버튼 수)에 따라 동적.
 */
export class UnitActionSheet {
  private scene: Phaser.Scene;
  private sfx?: SoundManager;
  private container?: Phaser.GameObjects.Container;
  private dim?: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, sfx?: SoundManager) {
    this.scene = scene;
    this.sfx = sfx;
  }

  get isShown(): boolean {
    return !!this.container;
  }

  show(
    unit: UnitData,
    opts: UnitActionSheetOptions,
    onNest: () => void,
    onSell: () => void,
    onClose: () => void,
  ): void {
    const recipe = opts.showRecipes ? buildRecipeLines(unit) : { lines: [], muted: false };
    const btnCount = (opts.canNest ? 1 : 0) + (opts.canSell ? 1 : 0);
    if (this.container || (btnCount === 0 && recipe.lines.length === 0)) return;

    // 동적 높이 계산
    const TITLE_AREA = 46;
    const RECIPE_HEAD = recipe.lines.length ? 20 : 0;
    const RECIPE_LINE = 17;
    const recipeArea = RECIPE_HEAD + recipe.lines.length * RECIPE_LINE;
    const BTN_SLOT = 56;
    const SHEET_H = 24 + TITLE_AREA + recipeArea + btnCount * BTN_SLOT + 16;

    const dim = this.scene.add.rectangle(CENTER_X, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5)
      .setDepth(24).setInteractive();
    this.dim = dim;

    const restY = GAME_HEIGHT - SHEET_H / 2;
    const container = this.scene.add.container(CENTER_X, restY + SHEET_H).setDepth(25);
    this.container = container;

    const close = () => {
      this.dim?.destroy();
      this.dim = undefined;
      this.container?.destroy();
      this.container = undefined;
      onClose();
    };
    dim.on('pointerdown', close);

    const top = -SHEET_H / 2;

    const bg = this.scene.add.graphics();
    bg.fillStyle(UI.bgDeep, 0.97);
    bg.fillRoundedRect(-GAME_WIDTH / 2, top, GAME_WIDTH, SHEET_H, { tl: 16, tr: 16, bl: 0, br: 0 });
    bg.lineStyle(1, UI.goldDim, 1);
    bg.lineBetween(-GAME_WIDTH / 2, top, GAME_WIDTH / 2, top);

    const handle = this.scene.add.graphics();
    handle.fillStyle(UI.goldDim, 0.8);
    handle.fillRoundedRect(-18, top + 10, 36, 4, 2);

    const title = this.scene.add.text(0, top + 28, `${RACE_EMOJI[unit.race]} ${nice(unit.race)}`, {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.GOLD,
    }).setOrigin(0.5);

    const items: Phaser.GameObjects.GameObject[] = [bg, handle, title];
    let y = top + TITLE_AREA;

    // 합성 조합 레시피
    if (recipe.lines.length) {
      const head = this.scene.add.text(-GAME_WIDTH / 2 + 24, y, '합성 조합', {
        fontFamily: 'monospace', fontSize: '11px', color: ANS.DIM,
      }).setOrigin(0, 0.5);
      items.push(head);
      y += RECIPE_HEAD;
      for (const line of recipe.lines) {
        const t = this.scene.add.text(-GAME_WIDTH / 2 + 30, y, line, {
          fontFamily: 'monospace', fontSize: '12px', color: recipe.muted ? ANS.DIM : ANS.CREAM,
        }).setOrigin(0, 0.5);
        items.push(t);
        y += RECIPE_LINE;
      }
      y += 4;
    }

    // 액션 버튼
    if (opts.canNest) {
      const btn = new JuicyButton({
        scene: this.scene, x: 0, y: y + 24, width: 220, height: 48,
        label: '🪺 둥지로', variant: 'primary', sfx: this.sfx,
        onClick: () => { close(); onNest(); },
      });
      items.push(btn.container);
      y += BTN_SLOT;
    }
    if (opts.canSell) {
      const btn = new JuicyButton({
        scene: this.scene, x: 0, y: y + 24, width: 220, height: 48,
        label: '🗑 판매', variant: 'danger', sfx: this.sfx,
        onClick: () => { close(); onSell(); },
      });
      items.push(btn.container);
      y += BTN_SLOT;
    }

    container.add(items);
    this.scene.tweens.add({ targets: container, y: restY, duration: 200, ease: 'Quad.easeOut' });
  }
}
