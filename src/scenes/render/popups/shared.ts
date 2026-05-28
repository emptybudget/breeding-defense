import Phaser from 'phaser';
import { GameState } from '../../../game/GameState';
import { ANS, drawDivider } from '../../artnouveau';
import { RACE_EMOJI } from '../../constants';

// 팝업 하단 DPS 미터 — Pause/GameOver/Victory에서 공용 사용
export function appendDpsMeter(
  scene: Phaser.Scene,
  state: GameState,
  items: Phaser.GameObjects.GameObject[],
  startY: number,
): void {
  const dealers = state.getTopDamageDealers(3);
  if (dealers.length === 0) return;

  const divGfx = scene.add.graphics();
  drawDivider(divGfx, -110, startY, 220);
  items.push(divGfx);

  const header = scene.add.text(0, startY + 14, '⚔️ 딜 순위', {
    fontFamily: 'monospace', fontSize: '11px', color: ANS.GOLD,
  }).setOrigin(0.5);
  items.push(header);

  const medals = ['🥇', '🥈', '🥉'];
  dealers.forEach(({ race, total }, i) => {
    const emoji = RACE_EMOJI[race] ?? '?';
    const label = `${medals[i]} ${emoji} ${race.replace(/_/g, ' ')}  ${total}`;
    const row = scene.add.text(0, startY + 32 + i * 16, label, {
      fontFamily: 'monospace', fontSize: '11px', color: ANS.PARCH,
    }).setOrigin(0.5);
    items.push(row);
  });
}
