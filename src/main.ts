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

// M2: 프리징 계측 (경량, 소킹 10판 무재현 확정 시 이 블록+#fatal-error 오버레이 함께 제거)
// 링버퍼 — 최근 console.error/warn 20개 보관, 워치독 발동 시 함께 덤프
const consoleRing: string[] = [];
function pushRing(prefix: string, args: unknown[]): void {
  consoleRing.push(`[${prefix}] ${args.map(a => String(a)).join(' ')}`);
  if (consoleRing.length > 20) consoleRing.shift();
}
const origError = console.error.bind(console);
const origWarn = console.warn.bind(console);
console.error = (...args: unknown[]) => { pushRing('error', args); origError(...args); };
console.warn = (...args: unknown[]) => { pushRing('warn', args); origWarn(...args); };

// RAF 워치독 — Phaser의 poststep 이벤트가 3초 이상 안 오면 RAF 체인 사망으로 간주, 재시작 버튼 노출
let lastTickAt = Date.now();
let restartShown = false;
let restartBtn: HTMLButtonElement | null = null;
let closeBtn: HTMLButtonElement | null = null;
function showFreezeRestartButton(): void {
  if (restartShown) return;
  restartShown = true;
  showFatalError(`[WATCHDOG] RAF 3초 이상 정지 감지\n최근 로그:\n${consoleRing.join('\n')}`);
  restartBtn = document.createElement('button');
  restartBtn.textContent = '재시작';
  restartBtn.style.cssText =
    'position:fixed;top:8px;right:96px;z-index:10000;padding:8px 16px;' +
    'background:#c44;color:#fff;border:none;border-radius:4px;font:14px monospace;';
  restartBtn.onclick = () => location.reload();
  document.body.appendChild(restartBtn);

  // 탭 전환 등으로 인한 오탐일 수 있으므로 새로고침 없이 닫는 옵션도 제공
  closeBtn = document.createElement('button');
  closeBtn.textContent = '닫기';
  closeBtn.style.cssText =
    'position:fixed;top:8px;right:8px;z-index:10000;padding:8px 16px;' +
    'background:#555;color:#fff;border:none;border-radius:4px;font:14px monospace;';
  closeBtn.onclick = () => {
    document.getElementById('fatal-error')?.remove();
    restartBtn?.remove();
    closeBtn?.remove();
    restartShown = false;
    lastTickAt = Date.now();
  };
  document.body.appendChild(closeBtn);
}
setInterval(() => {
  if (document.visibilityState === 'visible' && Date.now() - lastTickAt > 3000) showFreezeRestartButton();
}, 1000);
// 백그라운드 탭 복귀 시 RAF 공백을 진짜 프리징으로 오인하지 않도록 즉시 리셋
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') lastTickAt = Date.now();
});

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0d0c08',
  // 사운드는 전부 커스텀 SoundManager(자체 AudioContext)가 처리 — Phaser 내장 오디오는 미사용.
  // Phaser가 오디오 디바이스를 잡으려다 실패해 내뱉는 unhandledrejection("failed to start the audio device") 차단.
  audio: { noAudio: true },
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
game.events.on('poststep', () => { lastTickAt = Date.now(); });
