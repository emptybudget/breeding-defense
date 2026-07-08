import { beforeEach, describe, expect, it } from 'vitest';
import { migrateSave, emptyMeta, MetaProgress } from '../../src/game/MetaProgress';
import { makeUnit } from '../../src/game/unitHelpers';
import { SAVE_SCHEMA_VERSION } from '../../src/game/config';

function installFakeLocalStorage(): void {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(), key: () => null, length: 0,
  } as Storage;
}

describe('세이브 스키마 v1→v2 마이그레이션 (E9)', () => {
  it('구버전(schemaVersion 부재) 로드 시 신규 필드 기본값 + migrated=true', () => {
    const { data, migrated } = migrateSave({ gems: 5, levels: {}, unlockedStages: [3], speed2xRefunded: true });
    expect(migrated).toBe(true);
    expect(data.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(data.pity).toEqual({ rareMiss: 0, legendMiss: 0 });
    expect(data.mutationsSeen).toEqual({ common: 0, rare: 0, legend: 0 });
    expect(data.gems).toBe(5);           // 기존 필드 보존
    expect(data.unlockedStages).toEqual([3]);
  });

  it('v2 데이터 재로드 시 무변경(migrated=false), 기존 피티/변이 보존', () => {
    const v2 = {
      schemaVersion: SAVE_SCHEMA_VERSION, gems: 0, levels: {}, speed2xRefunded: true,
      pity: { rareMiss: 7, legendMiss: 55 }, mutationsSeen: { common: 2, rare: 1, legend: 0 },
    };
    const { data, migrated } = migrateSave(v2);
    expect(migrated).toBe(false);
    expect(data.pity).toEqual({ rareMiss: 7, legendMiss: 55 });
    expect(data.mutationsSeen.rare).toBe(1);
  });

  it('exhaust 필드 제거 — v2 유닛 형태엔 isExhausted/exhaustEndMs 없음', () => {
    const u = makeUnit(1, 'Warrior', 1, 0, 0);
    expect('isExhausted' in u).toBe(false);
    expect('exhaustEndMs' in u).toBe(false);
  });

  it('emptyMeta는 v2 스키마', () => {
    expect(emptyMeta().schemaVersion).toBe(SAVE_SCHEMA_VERSION);
  });
});

describe('MetaProgress 피티 영속 왕복', () => {
  beforeEach(() => { installFakeLocalStorage(); });

  it('setPity → 재로드 후에도 유지', () => {
    const mp = new MetaProgress();
    mp.setPity({ rareMiss: 5, legendMiss: 30 });
    const reloaded = new MetaProgress();
    expect(reloaded.getPity()).toEqual({ rareMiss: 5, legendMiss: 30 });
  });

  it('recordMutation 누적', () => {
    const mp = new MetaProgress();
    mp.recordMutation('common'); mp.recordMutation('common'); mp.recordMutation('rare');
    expect(mp.mutationsSeen).toEqual({ common: 2, rare: 1, legend: 0 });
    const reloaded = new MetaProgress();
    expect(reloaded.mutationsSeen.common).toBe(2);
  });

  it('구버전 저장(v1) 로드 시 자동 v2 정규화 후 저장', () => {
    localStorage.setItem('bd_meta', JSON.stringify({ gems: 2, levels: {} }));
    const mp = new MetaProgress();
    expect(mp.getPity()).toEqual({ rareMiss: 0, legendMiss: 0 });
    const raw = JSON.parse(localStorage.getItem('bd_meta')!);
    expect(raw.schemaVersion).toBe(SAVE_SCHEMA_VERSION); // 로드 시 정규화 저장됨
  });
});
