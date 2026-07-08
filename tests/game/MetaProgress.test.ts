import { beforeEach, describe, expect, it } from 'vitest';
import { MetaProgress } from '../../src/game/MetaProgress';

// vitest 기본 환경(node)엔 localStorage가 없어 테스트 파일 안에서만 인메모리로 폴리필한다.
// (프로덕션 코드는 무변경 — MetaProgress.ts는 여전히 브라우저 localStorage를 그대로 사용)
function installFakeLocalStorage(): void {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as Storage;
}

describe('M2 2배속 W1 무료화 — 3젬 환불 마이그레이션', () => {
  beforeEach(() => { installFakeLocalStorage(); });

  it('gameSpeed2x 구매자는 최초 로드 시 3젬 환불, 재로드해도 중복 환불 없음', () => {
    localStorage.setItem('bd_meta', JSON.stringify({ gems: 0, levels: { gameSpeed2x: 1 } }));
    const first = new MetaProgress();
    expect(first.gems).toBe(3);

    const second = new MetaProgress();
    expect(second.gems).toBe(3);
  });

  it('gameSpeed2x 미구매자는 환불 없음', () => {
    localStorage.setItem('bd_meta', JSON.stringify({ gems: 5, levels: {} }));
    const mp = new MetaProgress();
    expect(mp.gems).toBe(5);
  });

  it('신규 유저(저장 데이터 없음)는 환불 로직이 발동하지 않음', () => {
    const mp = new MetaProgress();
    expect(mp.gems).toBe(0);
  });
});

describe('M2 FTUE 완료 기록', () => {
  beforeEach(() => { installFakeLocalStorage(); });

  it('markFtueDone은 중복 없이 누적·저장된다', () => {
    const mp = new MetaProgress();
    mp.markFtueDone('F1');
    mp.markFtueDone('F1');
    expect(mp.ftueDone).toEqual(['F1']);

    const reloaded = new MetaProgress();
    expect(reloaded.ftueDone).toEqual(['F1']);
  });
});
