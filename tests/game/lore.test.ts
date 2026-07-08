import { describe, expect, it } from 'vitest';
import { WORLD_CONFIGS } from '../../src/game/config';
import { CHRONICLE, UNIT_LORE, W1_5_CUTIN_LINE } from '../../src/game/lore';

describe('M2 연대기(CHRONICLE)', () => {
  const allStageNames = Object.values(WORLD_CONFIGS).flatMap(stages => Object.values(stages).map(s => s.name));

  it('WORLD_CONFIGS의 15개 스테이지 name과 CHRONICLE 키가 정확히 일치', () => {
    expect(allStageNames.length).toBe(15);
    expect(Object.keys(CHRONICLE).sort()).toEqual([...allStageNames].sort());
  });

  it('전부 28자 이하', () => {
    for (const line of Object.values(CHRONICLE)) {
      expect(line.length).toBeLessThanOrEqual(28);
    }
  });

  it('W1-5 컷인 문구도 28자 이하', () => {
    expect(W1_5_CUTIN_LINE.length).toBeLessThanOrEqual(28);
  });
});

describe('M4 유닛 도감·부화 대사(UNIT_LORE, 24-lore-units.md §2~5)', () => {
  it('25종 전부(T1 6·T2 12·T3 6·T4 1) 키가 존재하고 birthCry가 비어있지 않다', () => {
    expect(Object.keys(UNIT_LORE)).toHaveLength(25);
    for (const entry of Object.values(UNIT_LORE)) {
      expect(entry.birthCry.length).toBeGreaterThan(0);
      expect(entry.dex.length).toBeGreaterThan(0);
      expect(entry.epithet.length).toBeGreaterThan(0);
    }
  });

  it('Astral_God 부화 대사는 혈통명 치환 토큰(〈가문명〉)을 포함한다', () => {
    expect(UNIT_LORE.Astral_God.birthCry).toContain('〈가문명〉');
  });
});
