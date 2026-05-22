export type Race = 'Human' | 'Beast' | 'Robot'; // Category type (internal logic only)
export type Tier1Race = 'Warrior' | 'Archer' | 'Dog' | 'Squirrel' | 'Android' | 'Cannon';
export type HybridRace =
  'Bio_Wolf' | 'Acorn_Girl' | 'Falcon_Eye' | 'Acorn_Hunter' |
  'Cyborg_Slasher' | 'Cannon_Shooter' | 'Laser_Sniper' | 'Missile_Gunner' |
  'Blade_Hound' | 'Gatling_Dog' | 'Electric_Coon' | 'Menhera_Squirrel';
export type Tier3Race = 'Cyborg_Wizard' | 'Dino_Mecha' | 'Griffin'; // Phase E에서 재설계
export type UnitRace = Tier1Race | HybridRace | Tier3Race;

export type EnemyType = 'NORMAL' | 'FAST';

export type RewardType = 'gem' | 'gold' | 'damage' | 'maxUnits' | 'twinProb' | 'doubleAtk' | 'crit';

export interface Reward {
  type: RewardType;
  label: string;
}

export interface UnitData {
  id: number;
  race: UnitRace;
  tier: 1 | 2 | 3;
  x: number;
  y: number;
  lastAttackedAtMs: number;
  isBreeding: boolean;
  breedingEndMs: number;
  isExhausted: boolean;
  exhaustEndMs: number;
  isLocked: boolean;
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
  isCrit: boolean;
}

export interface CombatResult {
  attacks: AttackEvent[];
  killedIds: number[];
  hpUpdates: { id: number; hp: number }[];
}
