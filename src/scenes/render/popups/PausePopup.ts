import Phaser from 'phaser';
import { GameState } from '../../../game/GameState';
import { ANS, drawDivider, drawPanelAt } from '../../artnouveau';
import { SoundManager } from '../../SoundManager';
import { CENTER_X, CENTER_Y } from '../../constants';
import { JuicyButton } from '../../ui/JuicyButton';
import { appendDpsMeter } from './shared';

export class PausePopup {
  private scene: Phaser.Scene;
  private state: GameState;
  private sfx?: SoundManager;
  private container?: Phaser.GameObjects.Container;
  private buttons: JuicyButton[] = [];

  constructor(scene: Phaser.Scene, state: GameState, sfx?: SoundManager) {
    this.scene = scene;
    this.state = state;
    this.sfx = sfx;
  }

  show(
    onResume: () => void,
    onQuit: () => void,
    sound: { muted: () => boolean; toggle: () => void },
    onRecipeBook?: () => void,
    speed2x?: { getMult: () => number; toggle: () => void },
  ): void {
    if (this.container) return;

    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(20);
    this.buttons = [];

    const bgGfx = this.scene.add.graphics();
    drawPanelAt(bgGfx, 290, 560);

    const divGfx = this.scene.add.graphics();
    drawDivider(divGfx, -120, -138, 240);

    const title = this.scene.add.text(0, -160, '⏸  일시정지', {
      fontFamily: 'monospace', fontSize: '20px', color: ANS.GOLD,
    }).setOrigin(0.5);

    const stats = [
      `경과 시간 : ${this.state.formatTimer()}`,
      `현재 골드 : ${this.state.gold} G`,
      `보유 유닛 : ${this.state.units.length} / ${this.state.maxUnits}`,
      `잔여 적   : ${this.state.enemyCount} / 50`,
      `보유 보석 : 💎 ${this.state.gems}`,
    ].join('\n');

    const statsText = this.scene.add.text(0, -78, stats, {
      fontFamily: 'monospace', fontSize: '14px', color: ANS.PARCH,
      align: 'left', lineSpacing: 8,
    }).setOrigin(0.5);

    const close = (after: () => void) => {
      this.buttons.forEach(b => b.destroy());
      this.buttons = [];
      container.destroy();
      this.container = undefined;
      after();
    };

    const resumeBtn = new JuicyButton({
      scene: this.scene, x: -68, y: 20, width: 120, height: 48, label: '▶ 계속하기',
      variant: 'primary', sfx: this.sfx, onClick: () => close(onResume),
    });
    const quitBtn = new JuicyButton({
      scene: this.scene, x: 72, y: 20, width: 120, height: 48, label: '🚪 종료',
      variant: 'danger', sfx: this.sfx, onClick: () => close(onQuit),
    });
    this.buttons.push(resumeBtn, quitBtn);

    // 레시피북 / 2배속 토글 — 상단 바에서 이전(2026-07-07): 348px 예산에 자리가 없어 여기로 통합
    const extraCount = (onRecipeBook ? 1 : 0) + (speed2x ? 1 : 0);
    let nextExtraSlot = 0;
    const extraX = () => (extraCount === 1 ? 0 : (nextExtraSlot++ === 0 ? -68 : 72));

    if (onRecipeBook) {
      const btn = new JuicyButton({
        scene: this.scene, x: extraX(), y: 72, width: 120, height: 48, label: '📖 레시피북',
        variant: 'ghost', fontSize: 12, sfx: this.sfx, onClick: () => close(onRecipeBook),
      });
      this.buttons.push(btn);
    }
    if (speed2x) {
      const speedLabel = () => (speed2x.getMult() === 2 ? '⏩ 2배속 ON' : '⏩ 2배속 OFF');
      const speedBtn = new JuicyButton({
        scene: this.scene, x: extraX(), y: 72, width: 120, height: 48, label: speedLabel(),
        variant: 'ghost', fontSize: 12, sfx: this.sfx, onClick: () => {
          speed2x.toggle();
          speedBtn.setLabel(speedLabel());
        },
      });
      this.buttons.push(speedBtn);
    }

    // Sound toggle button
    const muteLabel = () => sound.muted() ? '🔇 소리 OFF' : '🔊 소리 ON';
    const muteBtn = new JuicyButton({
      scene: this.scene, x: 0, y: 124, width: 160, height: 48, label: muteLabel(),
      variant: 'ghost', sfx: this.sfx, onClick: () => {
        sound.toggle();
        muteBtn.setLabel(muteLabel());
      },
    });
    this.buttons.push(muteBtn);

    const pauseItems: Phaser.GameObjects.GameObject[] = [
      bgGfx, divGfx, title, statsText,
      ...this.buttons.map(b => b.container),
    ];
    appendDpsMeter(this.scene, this.state, pauseItems, 160);
    container.add(pauseItems);
    this.container = container;
  }
}
