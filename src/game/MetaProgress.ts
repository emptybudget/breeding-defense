import type { UpgradeKey } from './config';

const STORAGE_KEY = 'bd_meta';

export interface MetaData {
  gems: number;
  levels: Record<UpgradeKey, number>;
  unlockedStages: number[];
}

const DEFAULT_LEVELS: Record<UpgradeKey, number> = {
  startingGold: 0,
  summonCost: 0,
  unitCap: 0,
  autoGold: 0,
  gameSpeed2x: 0,
};

export class MetaProgress {
  private data: MetaData;

  constructor() {
    this.data = this.load();
  }

  private load(): MetaData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { gems: 0, levels: { ...DEFAULT_LEVELS }, unlockedStages: [] };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = JSON.parse(raw) as any;
      return {
        gems: p.gems ?? p.stars ?? 0,         // migrate old 'stars' field
        levels: { ...DEFAULT_LEVELS, ...p.levels },
        unlockedStages: p.unlockedStages ?? [],
      };
    } catch {
      return { gems: 0, levels: { ...DEFAULT_LEVELS }, unlockedStages: [] };
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  get gems(): number { return this.data.gems; }
  getLevel(key: UpgradeKey): number { return this.data.levels[key]; }
  getData(): MetaData { return this.data; }

  addGems(n: number): void {
    this.data.gems += n;
    this.save();
  }

  isStageUnlocked(stageId: number): boolean {
    if (stageId <= 2) return true;
    return this.data.unlockedStages.includes(stageId);
  }

  unlockStage(stageId: number, cost: number): boolean {
    if (this.data.gems < cost) return false;
    if (this.data.unlockedStages.includes(stageId)) return true;
    this.data.gems -= cost;
    this.data.unlockedStages.push(stageId);
    this.save();
    return true;
  }

  buyUpgrade(key: UpgradeKey, cost: number, maxLevel: number): boolean {
    if (this.data.levels[key] >= maxLevel) return false;
    if (this.data.gems < cost) return false;
    this.data.gems -= cost;
    this.data.levels[key] += 1;
    this.save();
    return true;
  }
}
