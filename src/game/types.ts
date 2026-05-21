export type Race = 'Human' | 'Beast' | 'Robot';
export type HybridRace = 'Human_Robot' | 'Human_Beast' | 'Beast_Robot';
export type UnitRace = Race | HybridRace;

export type EnemyType = 'NORMAL' | 'FAST';

export interface UnitData {
  id: number;
  race: UnitRace;
  tier: 1 | 2;
  x: number;
  y: number;
  lastAttackedAtMs: number;
  isBreeding: boolean;
  breedingEndMs: number;
  isExhausted: boolean;
  exhaustEndMs: number;
}

export interface EnemySnapshot {
  id: number;
  x: number;
  y: number;
  hp: number;
  progressScore: number;
  killReward: number;
}

export interface AttackEvent {
  unitX: number;
  unitY: number;
  enemyX: number;
  enemyY: number;
}

export interface CombatResult {
  attacks: AttackEvent[];
  killedIds: number[];
  hpUpdates: { id: number; hp: number }[];
}
