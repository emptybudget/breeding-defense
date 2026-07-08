import { describe, expect, it } from 'vitest';
import { WORLD_CONFIGS } from '../../src/game/config';
import { CHRONICLE, W1_5_CUTIN_LINE } from '../../src/game/lore';

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
