import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './game/config';
import { GameScene } from './scenes/GameScene';
import { StageSelectScene } from './scenes/StageSelectScene';
import { TitleScene } from './scenes/TitleScene';

// [임시 디버그] 프리징 원인 추적용 — 런타임 예외를 화면에 표시 (원인 확정 후 제거)
function showFatalError(msg: string): void {
  let el = document.getElementById('fatal-error');
  if (!el) {
    el = document.createElement('div');
    el.id = 'fatal-error';
    el.style.cssText =
      'position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#400;color:#fca;' +
      'font:11px monospace;padding:8px;white-space:pre-wrap;max-height:45%;overflow:auto';
    document.body.appendChild(el);
  }
  el.textContent += msg + '\n\n';
}
window.addEventListener('error', (e) => {
  showFatalError(`[ERROR] ${e.message}\n${e.filename}:${e.lineno}:${e.colno}\n${e.error?.stack ?? ''}`);
});
window.addEventListener('unhandledrejection', (e) => {
  const r = e.reason as Error | undefined;
  showFatalError(`[PROMISE] ${r?.message ?? String(e.reason)}\n${r?.stack ?? ''}`);
});

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0d0c08',
  render: {
    // 256px 원본 → 32~58px 다운스케일 품질 개선 (POT 텍스처 밉맵)
    mipmapFilter: 'LINEAR_MIPMAP_LINEAR',
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [TitleScene, StageSelectScene, GameScene],
});
