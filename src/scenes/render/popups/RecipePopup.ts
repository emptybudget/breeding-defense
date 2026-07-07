import Phaser from 'phaser';
import { DISCOVERY_TOTAL, GAME_HEIGHT, GAME_WIDTH } from '../../../game/config';
import { ASTRAL_GOD_RECIPE, HYBRID_RACES, TIER1_RACES, getTier2Recipes, getTier3Recipes } from '../../../game/unitHelpers';
import { ANS, drawPanelAt } from '../../artnouveau';
import { CENTER_X, CENTER_Y, RACE_EMOJI } from '../../constants';
import { SoundManager } from '../../SoundManager';
import { JuicyButton } from '../../ui/JuicyButton';

export class RecipePopup {
  private scene: Phaser.Scene;
  private sfx?: SoundManager;
  private recipeBookContainer?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, sfx?: SoundManager) {
    this.scene = scene;
    this.sfx = sfx;
  }

  // ── HUD 📖 → 전체 레시피북 ────────────────────────────────────────────────
  // G3: discovered(첫 제작 도감)에 없는 결과 유닛은 회색 + ❓ 뱃지
  showRecipeBook(onClose: () => void, discovered: ReadonlySet<string>): void {
    if (this.recipeBookContainer) return;

    const dim = this.scene.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75)
      .setDepth(20).setInteractive();

    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(21);
    this.recipeBookContainer = container;

    const close = () => {
      container.destroy(); this.recipeBookContainer = undefined;
      dim.destroy();
      onClose();
    };
    dim.on('pointerdown', close);

    type Line = { text: string; result?: string };
    const tier1to2: Line[] = [];
    const seen2 = new Set<string>();
    for (const race of TIER1_RACES) {
      for (const { partner, result } of getTier2Recipes(race)) {
        const key = [race, partner].sort().join('+');
        if (!seen2.has(key)) {
          seen2.add(key);
          tier1to2.push({ text: `${RACE_EMOJI[race]}+${RACE_EMOJI[partner]} = ${RACE_EMOJI[result]} ${result}`, result });
        }
      }
    }

    const tier2to3: Line[] = [];
    const seen3 = new Set<string>();
    for (const race of HYBRID_RACES) {
      for (const { partner, result } of getTier3Recipes(race)) {
        const key = [race, partner].sort().join('+');
        if (!seen3.has(key)) {
          seen3.add(key);
          tier2to3.push({ text: `${RACE_EMOJI[race]}+${RACE_EMOJI[partner]} = ${RACE_EMOJI[result]} ${result}`, result });
        }
      }
    }

    const astralLine: Line = {
      text: `${ASTRAL_GOD_RECIPE.map(r => RACE_EMOJI[r]).join('+')} = 🌟 Astral_God`,
      result: 'Astral_God',
    };

    const lines: Line[] = [
      { text: `📖  합성 레시피 북 (도감 ${discovered.size}/${DISCOVERY_TOTAL})` },
      { text: '─ 1티어 → 2티어 ─' },
      ...tier1to2,
      { text: '─ 2티어 → 3티어 ─' },
      ...tier2to3,
      { text: '─ 3티어 → 4티어 ─' },
      astralLine,
    ];

    const bgH = lines.length * 15 + 52;
    const bgGfx = this.scene.add.graphics();
    drawPanelAt(bgGfx, 270, bgH);

    const closeBtn = new JuicyButton({
      scene: this.scene, x: 110, y: -(bgH / 2) + 26, width: 48, height: 48,
      visualWidth: 32, visualHeight: 32, label: 'X', variant: 'danger', fontSize: 14,
      sfx: this.sfx, onClick: close,
    });

    container.add([bgGfx, closeBtn.container]);

    lines.forEach((ln, i) => {
      const undiscovered = ln.result !== undefined && !discovered.has(ln.result);
      const text = this.scene.add.text(-120, -(bgH / 2) + 30 + i * 15, undiscovered ? `${ln.text} ❓` : ln.text, {
        fontFamily: 'monospace', fontSize: '11px',
        color: undiscovered ? ANS.DIM : ANS.CREAM,
      }).setOrigin(0, 0);
      container.add(text);
    });
  }
}
