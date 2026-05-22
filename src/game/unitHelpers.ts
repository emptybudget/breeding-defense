import { HYBRID_STATS, RACE_STATS, TIER3_STATS } from './config';
import { HybridRace, Race, Tier3Race, UnitData, UnitRace } from './types';

export const RACES: Race[] = ['Human', 'Beast', 'Robot'];

export const TIER3_RECIPES: Record<string, Tier3Race> = {
  'Human_Beast+Human_Robot': 'Cyborg_Wizard',
  'Beast_Robot+Human_Robot': 'Dino_Mecha',
  'Beast_Robot+Human_Beast': 'Griffin',
};

export function getUnitCombatStats(race: UnitRace): { range: number; damage: number; attackIntervalMs: number; maxTargets: number } {
  if (race in TIER3_STATS) return TIER3_STATS[race as Tier3Race];
  if (race in RACE_STATS) return { ...RACE_STATS[race as Race], maxTargets: 1 };
  return { ...HYBRID_STATS[race as HybridRace], maxTargets: 1 };
}

export function resolveTier3Race(a: HybridRace, b: HybridRace): Tier3Race | null {
  return TIER3_RECIPES[[a, b].sort().join('+')] ?? null;
}

export function resolveHybridRace(a: Race, b: Race): HybridRace {
  const sorted = [a, b].sort().join('+');
  const map: Record<string, HybridRace> = {
    'Beast+Human': 'Human_Beast',
    'Human+Robot': 'Human_Robot',
    'Beast+Robot': 'Beast_Robot',
  };
  return map[sorted] ?? 'Human_Beast';
}

export function makeUnit(id: number, race: UnitRace, tier: 1 | 2 | 3, x: number, y: number): UnitData {
  return { id, race, tier, x, y, lastAttackedAtMs: 0, isBreeding: false, breedingEndMs: 0, isExhausted: false, exhaustEndMs: 0, isLocked: false };
}
