export type Race = 'Human' | 'Beast' | 'Robot';

export interface UnitData {
  id: number;
  race: Race;
  tier: 1;
  x: number;
  y: number;
  lastAttackedAtMs: number;
}

export interface EnemySnapshot {
  id: number;
  x: number;
  y: number;
  hp: number;
  progressScore: number;
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
