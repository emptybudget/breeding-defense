import Phaser from 'phaser';
import { GAME_HEIGHT } from '../../game/config';

export class NotificationRenderer {
  private scene: Phaser.Scene;
  private texts: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  add(message: string, color = '#ffffff'): void {
    for (const t of this.texts) t.y -= 20;
    if (this.texts.length >= 4) this.texts.shift()?.destroy();
    const t = this.scene.add.text(8, GAME_HEIGHT - 82, message, {
      fontFamily: 'monospace', fontSize: '11px', color,
      stroke: '#000000', strokeThickness: 2,
    }).setDepth(7);
    this.texts.push(t);
    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: t, alpha: 0, duration: 600,
        onComplete: () => {
          t.destroy();
          const idx = this.texts.indexOf(t);
          if (idx >= 0) this.texts.splice(idx, 1);
        },
      });
    });
  }
}
