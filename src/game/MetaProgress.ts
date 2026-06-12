import { DISCOVERY_MILESTONES, type UpgradeKey } from './config';

const STORAGE_KEY = 'bd_meta';

export interface MetaData {
  gems: number;
  levels: Record<UpgradeKey, number>;
  unlockedStages: number[];
  stageRecords: Record<string, number>; // stageId → best elapsedMs
  discovered: string[];                 // G3: 도감 — 첫 제작한 유닛 종
  claimedMilestones: number[];          // G3: 보석 지급 완료된 마일스톤 count
}

const DEFAULT_LEVELS: Record<UpgradeKey, number> = {
  startingGold: 0,
  summonCost: 0,
  unitCap: 0,
  autoGold: 0,
  gameSpeed2x: 0,
  jackpotSummon: 0,
};

export class MetaProgress {
  private data: MetaData;

  constructor() {
    this.data = this.load();
  }

  private load(): MetaData {
    const empty = (): MetaData => ({
      gems: 0, levels: { ...DEFAULT_LEVELS }, unlockedStages: [], stageRecords: {},
      discovered: [], claimedMilestones: [],
    });
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return empty();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = JSON.parse(raw) as any;
      return {
        gems: p.gems ?? p.stars ?? 0,         // migrate old 'stars' field
        levels: { ...DEFAULT_LEVELS, ...p.levels },
        unlockedStages: p.unlockedStages ?? [],
        stageRecords: p.stageRecords ?? {},
        discovered: p.discovered ?? [],
        claimedMilestones: p.claimedMilestones ?? [],
      };
    } catch {
      return empty();
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  get gems(): number { return this.data.gems; }
  getLevel(key: UpgradeKey): number { return this.data.levels[key]; }
  getData(): MetaData { return this.data; }
  get discovered(): readonly string[] { return this.data.discovered; }

  /** G3: 첫 제작 기록. 새로 달성한 마일스톤의 보석 합계 반환 (없으면 0). */
  discover(race: string): number {
    if (this.data.discovered.includes(race)) return 0;
    this.data.discovered.push(race);
    let gems = 0;
    for (const m of DISCOVERY_MILESTONES) {
      if (this.data.discovered.length >= m.count && !this.data.claimedMilestones.includes(m.count)) {
        this.data.claimedMilestones.push(m.count);
        gems += m.gems;
      }
    }
    this.data.gems += gems;
    this.save();
    return gems;
  }

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

  getStageRecord(stageId: number): number | null {
    const v = this.data.stageRecords[String(stageId)];
    return v !== undefined ? v : null;
  }

  /** Returns true if this is a new record. */
  setStageRecord(stageId: number, ms: number): boolean {
    const key = String(stageId);
    const prev = this.data.stageRecords[key] ?? null;
    if (prev === null || ms > prev) {
      this.data.stageRecords[key] = ms;
      this.save();
      return true;
    }
    return false;
  }

  formatRecord(ms: number, isInfinite: boolean): string {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return isInfinite ? `무한 ${m}:${s}` : `최고 기록: ${m}:${s}`;
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
