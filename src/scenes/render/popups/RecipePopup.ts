import Phaser from 'phaser';
import { DISCOVERY_TOTAL, GAME_HEIGHT, GAME_WIDTH, TIER3_STATS, TIER4_STATS } from '../../../game/config';
import { HybridRace, Tier1Race, Tier3Race, UnitData } from '../../../game/types';
import { ASTRAL_GOD_RECIPE, HYBRID_RACES, TIER1_RACES, getTier2Recipes, getTier3Recipes } from '../../../game/unitHelpers';
import { ANS, drawPanelAt } from '../../artnouveau';
import { CENTER_X, CENTER_Y, RACE_EMOJI } from '../../constants';

export class RecipePopup {
  private scene: Phaser.Scene;
  private recipeContainer?: Phaser.GameObjects.Container;
  private recipeBookContainer?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // ── 유닛 탭 → 단일 유닛 레시피 ─────────────────────────────────────────────
  showRecipe(unit: UnitData, onClose: () => void): void {
    if (this.recipeContainer) return;

    const dim = this.scene.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65)
      .setDepth(20).setInteractive();

    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(21);
    this.recipeContainer = container;

    const close = () => {
      container.destroy(); this.recipeContainer = undefined;
      dim.destroy();
      onClose();
    };
    dim.on('pointerdown', close);

    let lines: string[] = [];

    if (unit.tier === 1) {
      const race = unit.race as Tier1Race;
      const emoji = RACE_EMOJI[race];
      const recipes = getTier2Recipes(race);
      lines = [
        `${emoji}  ${race}`,
        '─────────────────',
        ...recipes.map(({ partner, result }) =>
          `${emoji} + ${RACE_EMOJI[partner]} = ${RACE_EMOJI[result]} ${result}`
        ),
      ];
    } else if (unit.tier === 2) {
      const race = unit.race as HybridRace;
      const emoji = RACE_EMOJI[race];
      const recipe = getTier3Recipes(race)[0];
      lines = [
        `${emoji}  ${race}`,
        '─────────────────',
      ];
      if (recipe) {
        lines.push(`${emoji} + ${RACE_EMOJI[recipe.partner]} = ${RACE_EMOJI[recipe.result]} ${recipe.result}`);
      } else {
        lines.push('레시피 없음');
      }
    } else if (unit.tier === 3) {
      const tier3 = unit.race as Tier3Race;
      const stats = TIER3_STATS[tier3];
      const emoji = RACE_EMOJI[tier3];
      lines = [
        `${emoji}  ${tier3}`,
        '─────────────────',
        `범위: ${stats.range}px`,
        `대미지: ${stats.damage}`,
        `공격속도: ${stats.attackIntervalMs}ms`,
        `동시 타겟: ${stats.maxTargets}`,
      ];
      if (ASTRAL_GOD_RECIPE.includes(tier3)) {
        const others = ASTRAL_GOD_RECIPE.filter(r => r !== tier3);
        lines.push('─────────────────');
        lines.push(`🌟 Astral_God 재료`);
        lines.push(`+ ${others.map(r => `${RACE_EMOJI[r]}`).join(' + ')} = 🌟`);
      }
    } else {
      const stats = TIER4_STATS['Astral_God'];
      lines = [
        `🌟  Astral_God`,
        '─────────────────',
        '✨ 세 세계의 융합체',
        `레시피: 🦅 + 🌩️ + 🧙`,
        '─────────────────',
        `범위: ${stats.range}px`,
        `대미지: ${stats.damage}`,
        `공격속도: ${stats.attackIntervalMs}ms`,
        `동시 타겟: ${stats.maxTargets}`,
      ];
    }

    const bgH = 60 + lines.length * 22;
    const bgGfx = this.scene.add.graphics();
    drawPanelAt(bgGfx, 270, bgH);

    const closeBtn = this.scene.add.text(110, -(bgH / 2) + 14, ' X ', {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
      backgroundColor: '#3a2020', padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', close);

    const content = this.scene.add.text(0, 8, lines.join('\n'), {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5);

    container.add([bgGfx, closeBtn, content]);
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

    const closeBtn = this.scene.add.text(110, -(bgH / 2) + 14, ' X ', {
      fontFamily: 'monospace', fontSize: '13px', color: ANS.CREAM,
      backgroundColor: '#3a2020', padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', close);

    container.add([bgGfx, closeBtn]);

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
