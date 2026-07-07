import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../../game/config';
import { GameState } from '../../../game/GameState';
import { ANS, drawDivider, drawPanelAt } from '../../artnouveau';
import { CENTER_X, CENTER_Y } from '../../constants';
import { SoundManager } from '../../SoundManager';
import { JuicyButton } from '../../ui/JuicyButton';
import { appendDpsMeter } from './shared';

export class GameOverPopup {
  private scene: Phaser.Scene;
  private state: GameState;
  private onRestart: () => void;
  private onGemContinue: () => void;
  private onStageSelect: () => void;
  private onAdRevive: () => void;
  private sfx?: SoundManager;

  private container?: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    state: GameState,
    onRestart: () => void,
    onGemContinue: () => void,
    onStageSelect: () => void,
    onAdRevive: () => void,
    sfx?: SoundManager,
  ) {
    this.scene = scene;
    this.state = state;
    this.onRestart = onRestart;
    this.onGemContinue = onGemContinue;
    this.onStageSelect = onStageSelect;
    this.onAdRevive = onAdRevive;
    this.sfx = sfx;
  }

  get isShown(): boolean {
    return !!this.container;
  }

  show(isNewRecord = false): void {
    if (this.container) return;

    const hasAd = !this.state.adReviveUsed;
    const panelH = hasAd ? 400 : 360;
    const container = this.scene.add.container(CENTER_X, CENTER_Y).setDepth(20);

    const bgGfx = this.scene.add.graphics();
    drawPanelAt(bgGfx, 290, panelH);

    const divGfx = this.scene.add.graphics();
    drawDivider(divGfx, -120, -panelH / 2 + 58, 240);

    const title = this.scene.add.text(0, -panelH / 2 + 22, 'GAME OVER', {
      fontFamily: 'monospace', fontSize: '24px', color: '#ff5555',
    }).setOrigin(0.5);

    const recordLine = isNewRecord ? '  🏆 최고 기록 갱신!' : '';
    const timeText = this.scene.add.text(0, -panelH / 2 + 66, `생존 시간: ${this.state.formatTimer()}${recordLine}`, {
      fontFamily: 'monospace', fontSize: '13px', color: isNewRecord ? ANS.GOLD_TEXT : ANS.PARCH,
    }).setOrigin(0.5);

    const restartBtn = new JuicyButton({
      scene: this.scene, x: 0, y: -panelH / 2 + 100, width: 160, height: 48,
      label: '다시하기', variant: 'primary', fontSize: 15, sfx: this.sfx,
      onClick: () => { this.onRestart(); },
    });

    const hasGems = this.state.gems > 0;
    const gemBtn = new JuicyButton({
      scene: this.scene, x: 0, y: -panelH / 2 + 152, width: 220, height: 48,
      label: `💎 보석(${this.state.gems})로 이어하기`, variant: 'primary', fontSize: 13, sfx: this.sfx,
      onClick: () => { this.onGemContinue(); },
    }).setDisabled(!hasGems);

    const items: Phaser.GameObjects.GameObject[] = [bgGfx, divGfx, title, timeText, restartBtn.container, gemBtn.container];

    if (hasAd) {
      const adBtn = new JuicyButton({
        scene: this.scene, x: 0, y: -panelH / 2 + 204, width: 220, height: 48,
        label: '📺 광고 보고 부활 (1회)', variant: 'ghost', fontSize: 13, sfx: this.sfx,
        onClick: () => {
          adBtn.setDisabled(true);
          const dim = this.scene.add.rectangle(CENTER_X, CENTER_Y, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85).setDepth(50);
          const adText = this.scene.add.text(CENTER_X, CENTER_Y, '📺  광고 시청 중...', {
            fontFamily: 'monospace', fontSize: '18px', color: '#ffffff',
          }).setOrigin(0.5).setDepth(51);
          this.scene.time.delayedCall(1500, () => {
            this.scene.tweens.add({ targets: [dim, adText], alpha: 0, duration: 400,
              onComplete: () => { dim.destroy(); adText.destroy(); this.onAdRevive(); }
            });
          });
        },
      });
      items.push(adBtn.container);
    }

    const stageBtnY = hasAd ? -panelH / 2 + 254 : -panelH / 2 + 204;
    const stageBtn = new JuicyButton({
      scene: this.scene, x: 0, y: stageBtnY, width: 220, height: 48,
      label: '스테이지 선택으로 돌아가기', variant: 'ghost', fontSize: 12, sfx: this.sfx,
      onClick: () => { this.onStageSelect(); },
    });
    items.push(stageBtn.container);

    // DPS meter
    const dpsStartY = stageBtnY + 38;
    appendDpsMeter(this.scene, this.state, items, dpsStartY);

    container.add(items);
    this.container = container;
  }

  hide(): void {
    this.container?.destroy();
    this.container = undefined;
  }
}
