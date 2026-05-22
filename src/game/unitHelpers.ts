import { HYBRID_STATS, TIER1_STATS, TIER3_STATS } from './config';
import { HybridRace, Race, Tier1Race, Tier3Race, UnitData, UnitRace } from './types';

export const TIER1_RACES: Tier1Race[] = ['Warrior', 'Archer', 'Dog', 'Squirrel', 'Android', 'Cannon'];

const CATEGORY_MAP: Record<Tier1Race, Race> = {
  Warrior: 'Human', Archer: 'Human',
  Dog: 'Beast',     Squirrel: 'Beast',
  Android: 'Robot', Cannon: 'Robot',
};

const CATEGORY_RACES: Record<Race, Tier1Race[]> = {
  Human: ['Warrior', 'Archer'],
  Beast: ['Dog', 'Squirrel'],
  Robot: ['Android', 'Cannon'],
};

export function getCategory(race: Tier1Race): Race {
  return CATEGORY_MAP[race];
}

// Tier-2 synthesis recipes: sorted(a+b) → HybridRace
const TIER2_RECIPE_MAP: Record<string, HybridRace> = {
  'Dog+Warrior':        'Bio_Wolf',
  'Squirrel+Warrior':   'Acorn_Girl',
  'Archer+Dog':         'Falcon_Eye',
  'Archer+Squirrel':    'Acorn_Hunter',
  'Android+Warrior':    'Cyborg_Slasher',
  'Cannon+Warrior':     'Cannon_Shooter',
  'Android+Archer':     'Laser_Sniper',
  'Archer+Cannon':      'Missile_Gunner',
  'Android+Dog':        'Blade_Hound',
  'Cannon+Dog':         'Gatling_Dog',
  'Android+Squirrel':   'Electric_Coon',
  'Cannon+Squirrel':    'Menhera_Squirrel',
};

export function resolveTier2Race(a: Tier1Race, b: Tier1Race): HybridRace | null {
  return TIER2_RECIPE_MAP[[a, b].sort().join('+')] ?? null;
}

// Tier-3 recipes: implemented in Phase E
export function resolveTier3Race(_a: HybridRace, _b: HybridRace): Tier3Race | null {
  return null;
}

// Returns all tier-2 synthesis options for a given tier-1 unit
export function getTier2Recipes(race: Tier1Race): Array<{ partner: Tier1Race; result: HybridRace }> {
  return Object.entries(TIER2_RECIPE_MAP)
    .filter(([key]) => key.split('+').includes(race))
    .map(([key, result]) => {
      const [a, b] = key.split('+') as [Tier1Race, Tier1Race];
      return { partner: a === race ? b : a, result };
    });
}

// Child race for breeding: same-category parents
export function getOffspringRace(parentA: Tier1Race, parentB: Tier1Race): Tier1Race {
  if (parentA === parentB) {
    // 85% same, 15% mutation (another of same category)
    if (Math.random() < 0.85) return parentA;
    const others = CATEGORY_RACES[getCategory(parentA)].filter(r => r !== parentA);
    return others[Math.floor(Math.random() * others.length)];
  }
  // Different same-category units: 50:50
  return Math.random() < 0.5 ? parentA : parentB;
}

export function getUnitCombatStats(race: UnitRace): { range: number; damage: number; attackIntervalMs: number; maxTargets: number } {
  if (race in TIER3_STATS) return TIER3_STATS[race as Tier3Race];
  if (race in TIER1_STATS) return { ...TIER1_STATS[race as Tier1Race], maxTargets: 1 };
  return { ...HYBRID_STATS[race as HybridRace], maxTargets: 1 };
}

export function makeUnit(id: number, race: UnitRace, tier: 1 | 2 | 3, x: number, y: number): UnitData {
  return { id, race, tier, x, y, lastAttackedAtMs: 0, isBreeding: false, breedingEndMs: 0, isExhausted: false, exhaustEndMs: 0, isLocked: false };
}
