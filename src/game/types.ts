export type Race = 'Human' | 'Beast' | 'Robot'; // Category type (internal logic only)
export type Tier1Race = 'Warrior' | 'Archer' | 'Dog' | 'Squirrel' | 'Android' | 'Cannon';
export type HybridRace =
  'Bio_Wolf' | 'Acorn_Girl' | 'Falcon_Eye' | 'Acorn_Hunter' |
  'Cyborg_Slasher' | 'Cannon_Shooter' | 'Laser_Sniper' | 'Missile_Gunner' |
  'Blade_Hound' | 'Gatling_Dog' | 'Electric_Coon' | 'Menhera_Squirrel';
export type Tier3Race =
  'Cyborg_Wizard' | 'Dino_Mecha' | 'Griffin' |
  'Thunder_Hawk' | 'Berserk_Shaman' | 'Chaos_Artillery';
export type Tier4Race = 'Astral_God';
export type UnitRace = Tier1Race | HybridRace | Tier3Race | Tier4Race;

export type EnemyType = 'NORMAL' | 'FAST' | 'TANK';

export type RewardType = 'enhance' | 'gold' | 'damage' | 'maxUnits' | 'twinProb' | 'doubleAtk' | 'crit';

export interface Reward {
  type: RewardType;
  label: string;
}

export interface UnitData {
  id: number;
  race: UnitRace;
  tier: 1 | 2 | 3 | 4;
  x: number;
  y: number;
  lastAttackedAtMs: number;
  isBreeding: boolean;
  breedingEndMs: number;
  isExhausted: boolean;
  exhaustEndMs: number;
  isLocked: boolean;
  attackSpeedStacks?: number; // Blade_Hound berserk stacks
}

export interface Mine {
  id: number;
  x: number;
  y: number;
  damage: number;
  placedAtMs: number;
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
  damage: number;
  srcRace?: UnitRace;
  srcId?: number;
}

export interface CombatResult {
  attacks: AttackEvent[];
  killedIds: number[];
  hpUpdates: { id: number; hp: number }[];
  knockbacks: { id: number; dx: number; dy: number }[];
}
