import { DISCOVERY_MILESTONES, SAVE_SCHEMA_VERSION, type UpgradeKey } from './config';
import { FtueStepId, MutationGrade } from './types';
import { PityState } from './breeding';

const STORAGE_KEY = 'bd_meta';
const SPEED2X_REFUND_GEMS = 3;

export interface MetaData {
  schemaVersion: number;                // M3: 세이브 스키마 버전 (E9 마이그레이션 체인)
  gems: number;
  levels: Record<UpgradeKey, number>;
  unlockedStages: number[];
  stageRecords: Record<string, number>; // stageId → best elapsedMs
  discovered: string[];                 // G3: 도감 — 첫 제작한 유닛 종
  claimedMilestones: number[];          // G3: 보석 지급 완료된 마일스톤 count
  ftueDone: FtueStepId[];               // M2: 완료된 FTUE 스텝
  speed2xRefunded: boolean;             // M2: 2배속 W1 무료화 환불 마이그레이션 1회 완료 플래그
  pity: PityState;                      // M3: 희귀/전설 피티 영속 (12-F3)
  mutationsSeen: Record<MutationGrade, number>; // M3: 변이 등급별 누적 (E19)
}

const DEFAULT_LEVELS: Record<UpgradeKey, number> = {
  startingGold: 0,
  summonCost: 0,
  unitCap: 0,
  autoGold: 0,
  gameSpeed2x: 0,
  jackpotSummon: 0,
};

export function emptyMeta(): MetaData {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    gems: 0, levels: { ...DEFAULT_LEVELS }, unlockedStages: [], stageRecords: {},
    discovered: [], claimedMilestones: [], ftueDone: [], speed2xRefunded: true,
    pity: { rareMiss: 0, legendMiss: 0 },
    mutationsSeen: { common: 0, rare: 0, legend: 0 },
  };
}

/**
 * 세이브 마이그레이션 (E9) — 버전별 체인. 구버전(schemaVersion 부재 = v1)은 신규 필드 기본값 채움.
 * migrated=true면 호출측이 save()로 정규화된 스키마를 다시 기록.
 * @param p 파싱된 localStorage 객체 (any)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateSave(p: any): { data: MetaData; migrated: boolean } {
  const version = p.schemaVersion ?? 1;
  const levels = { ...DEFAULT_LEVELS, ...p.levels };

  // M2: 2배속 W1 무료화 — 기구매자 3💎 환불, speed2xRefunded 플래그로 1회만 게이팅
  const alreadyRefunded = p.speed2xRefunded ?? false;
  let gems = p.gems ?? p.stars ?? 0; // migrate legacy 'stars' field
  if (!alreadyRefunded && levels.gameSpeed2x > 0) gems += SPEED2X_REFUND_GEMS;

  const data: MetaData = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    gems,
    levels,
    unlockedStages: p.unlockedStages ?? [],
    stageRecords: p.stageRecords ?? {},
    discovered: p.discovered ?? [],
    claimedMilestones: p.claimedMilestones ?? [],
    ftueDone: p.ftueDone ?? [],
    speed2xRefunded: true,
    // v1→v2: 피티/변이 카운터 신규 (부재 시 0)
    pity: {
      rareMiss: p.pity?.rareMiss ?? 0,
      legendMiss: p.pity?.legendMiss ?? 0,
    },
    mutationsSeen: {
      common: p.mutationsSeen?.common ?? 0,
      rare: p.mutationsSeen?.rare ?? 0,
      legend: p.mutationsSeen?.legend ?? 0,
    },
  };
  const migrated = !alreadyRefunded || version < SAVE_SCHEMA_VERSION;
  return { data, migrated };
}

export class MetaProgress {
  private data: MetaData;

  constructor() {
    const { data, migrated } = this.load();
    this.data = data;
    if (migrated) this.save();
  }

  private load(): { data: MetaData; migrated: boolean } {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { data: emptyMeta(), migrated: false };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = JSON.parse(raw) as any;
      return migrateSave(p);
    } catch {
      return { data: emptyMeta(), migrated: false };
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  get gems(): number { return this.data.gems; }
  getLevel(key: UpgradeKey): number { return this.data.levels[key]; }
  getData(): MetaData { return this.data; }
  get discovered(): readonly string[] { return this.data.discovered; }
  get ftueDone(): readonly FtueStepId[] { return this.data.ftueDone; }

  /** M2: FTUE 스텝 완료 기록 (1회성, 중복 호출 안전). */
  markFtueDone(id: FtueStepId): void {
    if (this.data.ftueDone.includes(id)) return;
    this.data.ftueDone.push(id);
    this.save();
  }

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

  /** M3: 희귀/전설 피티 영속 (12-F3) — 판 시작 시 read, 교배마다 write. */
  getPity(): PityState { return { ...this.data.pity }; }
  setPity(pity: PityState): void {
    this.data.pity = { rareMiss: pity.rareMiss, legendMiss: pity.legendMiss };
    this.save();
  }

  /** M3: 변이 등급 누적 기록 (E19 — 도감 팡파레 근거). */
  recordMutation(grade: MutationGrade): void {
    this.data.mutationsSeen[grade] += 1;
    this.save();
  }
  get mutationsSeen(): Readonly<Record<MutationGrade, number>> { return this.data.mutationsSeen; }

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
