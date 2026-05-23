import { HYBRID_STATS, TIER1_STATS, TIER3_STATS, TIER4_STATS } from './config';
import { HybridRace, Race, Tier1Race, Tier3Race, Tier4Race, UnitData, UnitRace } from './types';

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

// Returns all tier-2 synthesis options for a given tier-1 unit
export function getTier2Recipes(race: Tier1Race): Array<{ partner: Tier1Race; result: HybridRace }> {
  return Object.entries(TIER2_RECIPE_MAP)
    .filter(([key]) => key.split('+').includes(race))
    .map(([key, result]) => {
      const [a, b] = key.split('+') as [Tier1Race, Tier1Race];
      return { partner: a === race ? b : a, result };
    });
}

// Tier-3 synthesis recipes: sorted(a+b) → Tier3Race
const TIER3_RECIPE_MAP: Record<string, Tier3Race> = {
  'Acorn_Hunter+Cannon_Shooter':    'Cyborg_Wizard',
  'Cyborg_Slasher+Gatling_Dog':     'Dino_Mecha',
  'Bio_Wolf+Falcon_Eye':            'Griffin',
  'Electric_Coon+Laser_Sniper':     'Thunder_Hawk',
  'Acorn_Girl+Blade_Hound':         'Berserk_Shaman',
  'Menhera_Squirrel+Missile_Gunner': 'Chaos_Artillery',
};

export function resolveTier3Race(a: HybridRace, b: HybridRace): Tier3Race | null {
  return TIER3_RECIPE_MAP[[a, b].sort().join('+')] ?? null;
}

// Returns the tier-3 recipe for a given tier-2 unit (each tier-2 appears in at most 1 recipe)
export function getTier3Recipes(race: HybridRace): Array<{ partner: HybridRace; result: Tier3Race }> {
  return Object.entries(TIER3_RECIPE_MAP)
    .filter(([key]) => key.split('+').includes(race))
    .map(([key, result]) => {
      const [a, b] = key.split('+') as [HybridRace, HybridRace];
      return { partner: a === race ? b : a, result };
    });
}

// Tier-4: Astral_God requires Griffin + Thunder_Hawk + Cyborg_Wizard (any 2 in range trigger 3-way check)
export const ASTRAL_GOD_RECIPE: readonly Tier3Race[] = ['Cyborg_Wizard', 'Griffin', 'Thunder_Hawk'];

// If a and b are two of the three Astral_God ingredients, returns the missing third; else null
export function resolveAstralGodThird(a: Tier3Race, b: Tier3Race): Tier3Race | null {
  if (!ASTRAL_GOD_RECIPE.includes(a) || !ASTRAL_GOD_RECIPE.includes(b) || a === b) return null;
  return ASTRAL_GOD_RECIPE.find(r => r !== a && r !== b) ?? null;
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
  if (race in TIER4_STATS) return TIER4_STATS[race as Tier4Race];
  if (race in TIER3_STATS) return TIER3_STATS[race as Tier3Race];
  if (race in TIER1_STATS) return { ...TIER1_STATS[race as Tier1Race], maxTargets: 1 };
  return HYBRID_STATS[race as HybridRace];
}

export function makeUnit(id: number, race: UnitRace, tier: 1 | 2 | 3 | 4, x: number, y: number): UnitData {
  return { id, race, tier, x, y, lastAttackedAtMs: 0, isBreeding: false, breedingEndMs: 0, isExhausted: false, exhaustEndMs: 0, isLocked: false };
}
