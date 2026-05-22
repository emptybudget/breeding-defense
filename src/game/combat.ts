import { CRIT_DAMAGE_MULT } from './config';
import { AttackEvent, CombatResult, EnemySnapshot, UnitData } from './types';
import { getUnitCombatStats } from './unitHelpers';

export function runCombat(
  units: UnitData[],
  snapshots: EnemySnapshot[],
  elapsedMs: number,
  criticalProbability: number,
  doubleAttackProbability: number,
  globalDamageBonus: number,
): CombatResult & { killRewards: number[] } {
  const now = elapsedMs;
  const attacks: AttackEvent[] = [];
  const killedSet = new Set<number>();
  const killRewards: number[] = [];
  const liveHp = new Map<number, number>(snapshots.map(e => [e.id, e.hp]));

  for (const unit of units) {
    if (unit.isBreeding) continue;
    const stats = getUnitCombatStats(unit.race);
    if (now - unit.lastAttackedAtMs < stats.attackIntervalMs) continue;

    const inRange = snapshots
      .filter(e => !killedSet.has(e.id) && Math.hypot(e.x - unit.x, e.y - unit.y) <= stats.range)
      .sort((a, b) => b.progressScore - a.progressScore)
      .slice(0, stats.maxTargets);
    if (inRange.length === 0) continue;

    unit.lastAttackedAtMs = now;
    for (const target of inRange) {
      const baseDmg = stats.damage + globalDamageBonus;
      let finalDmg = baseDmg;
      let isCrit = false;
      if (criticalProbability > 0 && Math.random() < criticalProbability) {
        finalDmg = Math.ceil(finalDmg * CRIT_DAMAGE_MULT);
        isCrit = true;
      }
      if (Math.random() < doubleAttackProbability) finalDmg *= 2;
      const newHp = (liveHp.get(target.id) ?? target.hp) - finalDmg;
      liveHp.set(target.id, newHp);
      attacks.push({ unitX: unit.x, unitY: unit.y, enemyX: target.x, enemyY: target.y, isCrit });
      if (newHp <= 0) {
        killedSet.add(target.id);
        killRewards.push(target.killReward);
      }
    }
  }

  const killedIds = [...killedSet];
  const hpUpdates = snapshots
    .filter(e => !killedSet.has(e.id) && liveHp.get(e.id) !== e.hp)
    .map(e => ({ id: e.id, hp: liveHp.get(e.id)! }));

  return { attacks, killedIds, hpUpdates, killRewards };
}
