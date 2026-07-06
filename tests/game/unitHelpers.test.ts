import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ASTRAL_GOD_RECIPE,
  getCategory,
  getOffspringRace,
  getTier2Recipes,
  getUnitCombatStats,
  HYBRID_RACES,
  resolveAstralGodThird,
  resolveTier2Race,
  resolveTier3Race,
  TIER1_RACES,
} from '../../src/game/unitHelpers';
import { Tier3Race, UnitRace } from '../../src/game/types';

afterEach(() => vi.restoreAllMocks());

describe('카테고리 매핑', () => {
  it('T1 6종 → Human/Beast/Robot', () => {
    expect(getCategory('Warrior')).toBe('Human');
    expect(getCategory('Archer')).toBe('Human');
    expect(getCategory('Dog')).toBe('Beast');
    expect(getCategory('Squirrel')).toBe('Beast');
    expect(getCategory('Android')).toBe('Robot');
    expect(getCategory('Cannon')).toBe('Robot');
  });
});

describe('T2 합성 레시피 (12종)', () => {
  const RECIPES: Array<[string, string, string]> = [
    ['Warrior', 'Dog', 'Bio_Wolf'],
    ['Warrior', 'Squirrel', 'Acorn_Girl'],
    ['Archer', 'Dog', 'Falcon_Eye'],
    ['Archer', 'Squirrel', 'Acorn_Hunter'],
    ['Warrior', 'Android', 'Cyborg_Slasher'],
    ['Warrior', 'Cannon', 'Cannon_Shooter'],
    ['Archer', 'Android', 'Laser_Sniper'],
    ['Archer', 'Cannon', 'Missile_Gunner'],
    ['Dog', 'Android', 'Blade_Hound'],
    ['Dog', 'Cannon', 'Gatling_Dog'],
    ['Squirrel', 'Android', 'Electric_Coon'],
    ['Squirrel', 'Cannon', 'Menhera_Squirrel'],
  ];

  it.each(RECIPES)('%s + %s → %s (순서 무관)', (a, b, result) => {
    expect(resolveTier2Race(a as never, b as never)).toBe(result);
    expect(resolveTier2Race(b as never, a as never)).toBe(result);
  });

  it('같은 카테고리 T1끼리는 합성 불가', () => {
    expect(resolveTier2Race('Warrior', 'Archer')).toBeNull();
    expect(resolveTier2Race('Dog', 'Squirrel')).toBeNull();
    expect(resolveTier2Race('Android', 'Cannon')).toBeNull();
  });

  it('모든 T1은 정확히 4개의 T2 레시피를 가진다', () => {
    for (const race of TIER1_RACES) {
      expect(getTier2Recipes(race)).toHaveLength(4);
    }
  });
});

describe('T3 합성 레시피 (6종)', () => {
  const RECIPES: Array<[string, string, string]> = [
    ['Cannon_Shooter', 'Acorn_Hunter', 'Cyborg_Wizard'],
    ['Gatling_Dog', 'Cyborg_Slasher', 'Dino_Mecha'],
    ['Falcon_Eye', 'Bio_Wolf', 'Griffin'],
    ['Laser_Sniper', 'Electric_Coon', 'Thunder_Hawk'],
    ['Acorn_Girl', 'Blade_Hound', 'Berserk_Shaman'],
    ['Missile_Gunner', 'Menhera_Squirrel', 'Chaos_Artillery'],
  ];

  it.each(RECIPES)('%s + %s → %s (순서 무관)', (a, b, result) => {
    expect(resolveTier3Race(a as never, b as never)).toBe(result);
    expect(resolveTier3Race(b as never, a as never)).toBe(result);
  });
});

describe('T4 Astral_God 3-way 레시피', () => {
  it('재료 2개가 주어지면 빠진 3번째를 반환', () => {
    expect(resolveAstralGodThird('Griffin', 'Thunder_Hawk')).toBe('Cyborg_Wizard');
    expect(resolveAstralGodThird('Cyborg_Wizard', 'Griffin')).toBe('Thunder_Hawk');
    expect(resolveAstralGodThird('Thunder_Hawk', 'Cyborg_Wizard')).toBe('Griffin');
  });

  it('레시피 외 재료·동일 재료는 null', () => {
    expect(resolveAstralGodThird('Dino_Mecha', 'Griffin')).toBeNull();
    expect(resolveAstralGodThird('Griffin', 'Griffin')).toBeNull();
  });

  it('레시피는 정확히 3종', () => {
    expect(ASTRAL_GOD_RECIPE).toHaveLength(3);
  });
});

describe('교배 자식 종 결정', () => {
  it('다른 종 부모 → 자식은 반드시 부모 둘 중 하나', () => {
    for (let i = 0; i < 50; i++) {
      expect(['Warrior', 'Archer']).toContain(getOffspringRace('Warrior', 'Archer'));
    }
  });

  it('동종 부모 + 비변이 롤(0.5) → 동종 복사', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(getOffspringRace('Dog', 'Dog')).toBe('Dog');
  });

  it('동종 부모 + 변이 롤(0.9) → 같은 카테고리의 다른 종', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    expect(getOffspringRace('Dog', 'Dog')).toBe('Squirrel');
  });
});

describe('전투 스탯 무결성', () => {
  const T3: Tier3Race[] = ['Cyborg_Wizard', 'Dino_Mecha', 'Griffin', 'Thunder_Hawk', 'Berserk_Shaman', 'Chaos_Artillery'];
  const ALL: UnitRace[] = [...TIER1_RACES, ...HYBRID_RACES, ...T3, 'Astral_God'];

  it('25종 전부 유효한 스탯을 반환한다', () => {
    for (const race of ALL) {
      const s = getUnitCombatStats(race);
      expect(s.range).toBeGreaterThan(0);
      expect(s.damage).toBeGreaterThan(0);
      expect(s.attackIntervalMs).toBeGreaterThan(0);
      expect(s.maxTargets).toBeGreaterThanOrEqual(1);
    }
  });
});
