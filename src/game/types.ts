export type Race = 'Human' | 'Beast' | 'Robot';

export interface UnitData {
  id: number;
  race: Race;
  tier: 1;
  x: number;
  y: number;
}
