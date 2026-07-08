import { describe, expect, it } from 'vitest';
import {
  generateBloodlineName, rollEpithet, FAMILY_OF_RACE, FAMILY_LABEL,
  NAME_PREFIX, NAME_SUFFIX, EPITHET_RARE, EPITHET_LEGEND,
} from '../../src/game/naming';
import { FamilyKey } from '../../src/game/types';

const FAMILIES: FamilyKey[] = ['sword', 'fang', 'steel'];
function scripted(v: number[]): () => number { let i = 0; return () => v[Math.min(i++, v.length - 1)]; }

describe('혈통명 생성 (08-naming-system)', () => {
  it('모든 접두+접미 조합이 7자 이하', () => {
    for (const fam of FAMILIES) {
      for (const p of NAME_PREFIX) {
        for (const s of NAME_SUFFIX[fam]) {
          expect((p + s).length).toBeLessThanOrEqual(7);
        }
      }
    }
  });

  it('접미는 계열 풀에서만 선택 (rng 주입 재현성)', () => {
    for (const fam of FAMILIES) {
      const name = generateBloodlineName(fam, scripted([0, 0]), new Set());
      expect(name).toBe(NAME_PREFIX[0] + NAME_SUFFIX[fam][0]);
    }
  });

  it('충돌 8회 초과 시 로마숫자 접미로 유일성 보장', () => {
    // rng가 항상 [0]을 반환 → 첫 조합만 시도, used에 이미 있어 8회 재롤 모두 충돌 → II
    const base = NAME_PREFIX[0] + NAME_SUFFIX.sword[0];
    expect(generateBloodlineName('sword', scripted([0, 0]), new Set([base]))).toBe(base + 'II');
    // base·baseII 둘 다 점유 → III
    expect(generateBloodlineName('sword', scripted([0, 0]), new Set([base, base + 'II']))).toBe(base + 'III');
  });

  it('used 충돌 없으면 그대로 반환', () => {
    const name = generateBloodlineName('fang', scripted([2 / 36, 3 / 12]), new Set());
    expect(NAME_PREFIX).toContain(name.slice(0, 2));
    expect(new Set([...NAME_SUFFIX.fang])).toContain(name.slice(2));
  });
});

describe('변이 칭호 매핑', () => {
  it('rare → EPITHET_RARE, legend → EPITHET_LEGEND, common → undefined', () => {
    expect(EPITHET_RARE).toContain(rollEpithet('rare', scripted([0]))!);
    expect(EPITHET_LEGEND).toContain(rollEpithet('legend', scripted([0]))!);
    expect(rollEpithet('common', scripted([0]))).toBeUndefined();
  });
});

describe('계열 매핑', () => {
  it('6종 T1 → 3계열 각 2종', () => {
    expect(FAMILY_OF_RACE).toEqual({
      Warrior: 'sword', Archer: 'sword',
      Dog: 'fang', Squirrel: 'fang',
      Android: 'steel', Cannon: 'steel',
    });
    expect(FAMILY_LABEL).toEqual({ sword: '검문', fang: '야수문', steel: '강철문' });
  });
});
