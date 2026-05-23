import type { UpgradeKey } from './config';

const STORAGE_KEY = 'bd_meta';

export interface MetaData {
  stars: number;
  levels: Record<UpgradeKey, number>;
}

const DEFAULT_LEVELS: Record<UpgradeKey, number> = {
  startingGold: 0,
  summonCost: 0,
  unitCap: 0,
  autoGold: 0,
};

export class MetaProgress {
  private data: MetaData;

  constructor() {
    this.data = this.load();
  }

  private load(): MetaData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { stars: 0, levels: { ...DEFAULT_LEVELS } };
      const parsed = JSON.parse(raw) as Partial<MetaData>;
      return {
        stars: parsed.stars ?? 0,
        levels: { ...DEFAULT_LEVELS, ...parsed.levels },
      };
    } catch {
      return { stars: 0, levels: { ...DEFAULT_LEVELS } };
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  get stars(): number { return this.data.stars; }
  getLevel(key: UpgradeKey): number { return this.data.levels[key]; }
  getData(): MetaData { return this.data; }

  addStars(n: number): void {
    this.data.stars += n;
    this.save();
  }

  buyUpgrade(key: UpgradeKey, cost: number, maxLevel: number): boolean {
    if (this.data.levels[key] >= maxLevel) return false;
    if (this.data.stars < cost) return false;
    this.data.stars -= cost;
    this.data.levels[key] += 1;
    this.save();
    return true;
  }
}
