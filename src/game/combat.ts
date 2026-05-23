import {
  ACORN_GIRL_AURA_RADIUS, BLADE_HOUND_MAX_STACKS, CRIT_DAMAGE_MULT, MINE_TRIGGER_RADIUS,
  THUNDER_HAWK_CHAIN_COUNT, THUNDER_HAWK_CHAIN_MULT, THUNDER_HAWK_CHAIN_RANGE,
  BERSERK_SHAMAN_AURA_RADIUS, BERSERK_SHAMAN_AURA_BUFF,
  ASTRAL_GOD_CHAIN_COUNT, ASTRAL_GOD_CHAIN_MULT, ASTRAL_GOD_CHAIN_RANGE,
} from './config';
import { AttackEvent, CombatResult, EnemySnapshot, Mine, UnitData } from './types';
import { getUnitCombatStats } from './unitHelpers';

const CANNON_SHOOTER_KB_DIST = 60;
const GATLING_DOG_SPLASH_RADIUS = 40;
const GATLING_DOG_SPLASH_MULT = 0.5;
const ELECTRIC_COON_CHAIN_RANGE = 100;
const ELECTRIC_COON_MAX_CHAINS = 2;
const ELECTRIC_COON_CHAIN_MULT = 0.5;

export function runCombat(
  units: UnitData[],
  snapshots: EnemySnapshot[],
  elapsedMs: number,
  criticalProbability: number,
  doubleAttackProbability: number,
  globalDamageBonus: number,
  mines: Mine[],
): CombatResult & { killRewards: number[]; newMinePositions: { x: number; y: number }[]; consumedMineIds: number[]; tierKillCounts: Map<number, number> } {
  const now = elapsedMs;
  const attacks: AttackEvent[] = [];
  const killedSet = new Set<number>();
  const killRewards: number[] = [];
  const knockbacks: { id: number; dx: number; dy: number }[] = [];
  const liveHp = new Map<number, number>(snapshots.map(e => [e.id, e.hp]));
  const newMinePositions: { x: number; y: number }[] = [];
  const consumedMineIds: number[] = [];
  const tierKillCounts = new Map<number, number>();

  // Gimmick: Acorn_Girl — aura +20% attack speed for all allies within radius
  const auraBuffedIds = new Set<number>();
  for (const girl of units) {
    if (girl.race !== 'Acorn_Girl' || girl.isBreeding) continue;
    for (const ally of units) {
      if (ally.id === girl.id) continue;
      if (Math.hypot(ally.x - girl.x, ally.y - girl.y) <= ACORN_GIRL_AURA_RADIUS) {
        auraBuffedIds.add(ally.id);
      }
    }
  }

  // Gimmick: Berserk_Shaman — wide aura +40% attack speed (includes self)
  const berserkerBuffedIds = new Set<number>();
  for (const shaman of units) {
    if (shaman.race !== 'Berserk_Shaman' || shaman.isBreeding) continue;
    for (const ally of units) {
      if (Math.hypot(ally.x - shaman.x, ally.y - shaman.y) <= BERSERK_SHAMAN_AURA_RADIUS) {
        berserkerBuffedIds.add(ally.id);
      }
    }
  }

  // Mine detonation: existing mines trigger on first enemy within radius
  for (const mine of mines) {
    for (const e of snapshots) {
      if (killedSet.has(e.id)) continue;
      if (Math.hypot(e.x - mine.x, e.y - mine.y) > MINE_TRIGGER_RADIUS) continue;
      consumedMineIds.push(mine.id);
      const newHp = (liveHp.get(e.id) ?? e.hp) - mine.damage;
      liveHp.set(e.id, newHp);
      attacks.push({ unitX: mine.x, unitY: mine.y, enemyX: e.x, enemyY: e.y, isCrit: false });
      if (newHp <= 0) { killedSet.add(e.id); killRewards.push(e.killReward); }
      break;
    }
  }

  for (const unit of units) {
    if (unit.isBreeding) continue;
    const stats = getUnitCombatStats(unit.race);

    // Effective attack interval: Blade_Hound stacks + Acorn_Girl aura
    let effectiveInterval = stats.attackIntervalMs;
    if (unit.race === 'Blade_Hound') {
      effectiveInterval /= 1 + (unit.attackSpeedStacks ?? 0) * 0.2;
    }
    if (auraBuffedIds.has(unit.id)) effectiveInterval *= 0.8;
    if (berserkerBuffedIds.has(unit.id)) effectiveInterval *= (1 - BERSERK_SHAMAN_AURA_BUFF);

    if (now - unit.lastAttackedAtMs < effectiveInterval) continue;

    const inRange = snapshots.filter(
      e => !killedSet.has(e.id) && Math.hypot(e.x - unit.x, e.y - unit.y) <= stats.range,
    );

    // Gimmick: Falcon_Eye — 딸피 우선 저격
    const sorted = unit.race === 'Falcon_Eye'
      ? inRange.sort((a, b) => (liveHp.get(a.id) ?? a.hp) - (liveHp.get(b.id) ?? b.hp))
      : inRange.sort((a, b) => b.progressScore - a.progressScore);

    // Gimmick: Cyborg_Slasher — 전방 광역 베기 (all in range)
    const targets = unit.race === 'Cyborg_Slasher' ? sorted : sorted.slice(0, stats.maxTargets);
    if (targets.length === 0) continue;

    unit.lastAttackedAtMs = now;

    // Gimmick: Blade_Hound — gain 1 stack per attack
    if (unit.race === 'Blade_Hound') {
      unit.attackSpeedStacks = Math.min(BLADE_HOUND_MAX_STACKS, (unit.attackSpeedStacks ?? 0) + 1);
    }

    // Gimmick: Acorn_Hunter — 3-hit burst per cycle
    const burstCount = unit.race === 'Acorn_Hunter' ? 3 : 1;

    for (const target of targets) {
      // Gimmick: Menhera_Squirrel — place mine at target position, no direct damage
      if (unit.race === 'Menhera_Squirrel') {
        newMinePositions.push({ x: target.x, y: target.y });
        attacks.push({ unitX: unit.x, unitY: unit.y, enemyX: target.x, enemyY: target.y, isCrit: false });
        continue;
      }

      for (let burst = 0; burst < burstCount; burst++) {
        if (killedSet.has(target.id)) break;
        const baseDmg = stats.damage + globalDamageBonus;
        let finalDmg = baseDmg;
        const isCrit = unit.race === 'Astral_God' ||
          (criticalProbability > 0 && Math.random() < criticalProbability);
        if (isCrit) finalDmg = Math.ceil(finalDmg * CRIT_DAMAGE_MULT);
        if (Math.random() < doubleAttackProbability) finalDmg *= 2;
        const newHp = (liveHp.get(target.id) ?? target.hp) - finalDmg;
        liveHp.set(target.id, newHp);
        attacks.push({ unitX: unit.x, unitY: unit.y, enemyX: target.x, enemyY: target.y, isCrit });
        if (newHp <= 0) {
          killedSet.add(target.id);
          killRewards.push(target.killReward);
          tierKillCounts.set(unit.tier, (tierKillCounts.get(unit.tier) ?? 0) + 1);
        } else if (unit.race === 'Cannon_Shooter') {
          // Gimmick: Cannon_Shooter — 넉백
          const dx = target.x - unit.x;
          const dy = target.y - unit.y;
          const len = Math.hypot(dx, dy) || 1;
          knockbacks.push({ id: target.id, dx: (dx / len) * CANNON_SHOOTER_KB_DIST, dy: (dy / len) * CANNON_SHOOTER_KB_DIST });
        }

        // Gimmick: Gatling_Dog — 스플래시 폭탄 (50% dmg within 40px)
        if (unit.race === 'Gatling_Dog') {
          const splashDmg = Math.max(1, Math.ceil(finalDmg * GATLING_DOG_SPLASH_MULT));
          for (const splash of snapshots) {
            if (killedSet.has(splash.id) || splash.id === target.id) continue;
            if (Math.hypot(splash.x - target.x, splash.y - target.y) > GATLING_DOG_SPLASH_RADIUS) continue;
            const splashHp = (liveHp.get(splash.id) ?? splash.hp) - splashDmg;
            liveHp.set(splash.id, splashHp);
            attacks.push({ unitX: unit.x, unitY: unit.y, enemyX: splash.x, enemyY: splash.y, isCrit: false });
            if (splashHp <= 0) { killedSet.add(splash.id); killRewards.push(splash.killReward); }
          }
        }

        // Gimmick: Electric_Coon — 체인 라이트닝 (chains to up to 2 nearest enemies)
        if (unit.race === 'Electric_Coon' && !killedSet.has(target.id)) {
          let chainSrc = target;
          let chainDmg = finalDmg;
          const chained = new Set<number>([target.id]);
          for (let c = 0; c < ELECTRIC_COON_MAX_CHAINS; c++) {
            chainDmg = Math.max(1, Math.ceil(chainDmg * ELECTRIC_COON_CHAIN_MULT));
            const next = snapshots
              .filter(e => !killedSet.has(e.id) && !chained.has(e.id) &&
                Math.hypot(e.x - chainSrc.x, e.y - chainSrc.y) <= ELECTRIC_COON_CHAIN_RANGE)
              .sort((a, b) =>
                Math.hypot(a.x - chainSrc.x, a.y - chainSrc.y) -
                Math.hypot(b.x - chainSrc.x, b.y - chainSrc.y))[0];
            if (!next) break;
            chained.add(next.id);
            const chainHp = (liveHp.get(next.id) ?? next.hp) - chainDmg;
            liveHp.set(next.id, chainHp);
            attacks.push({ unitX: chainSrc.x, unitY: chainSrc.y, enemyX: next.x, enemyY: next.y, isCrit: false });
            if (chainHp <= 0) { killedSet.add(next.id); killRewards.push(next.killReward); tierKillCounts.set(unit.tier, (tierKillCounts.get(unit.tier) ?? 0) + 1); }
            chainSrc = next;
          }
        }

        // Gimmick: Thunder_Hawk — chain lightning (3 chains, 80% each)
        if (unit.race === 'Thunder_Hawk' && !killedSet.has(target.id)) {
          let chainSrc = target;
          let chainDmg = finalDmg;
          const chained = new Set<number>([target.id]);
          for (let c = 0; c < THUNDER_HAWK_CHAIN_COUNT; c++) {
            chainDmg = Math.max(1, Math.ceil(chainDmg * THUNDER_HAWK_CHAIN_MULT));
            const next = snapshots
              .filter(e => !killedSet.has(e.id) && !chained.has(e.id) &&
                Math.hypot(e.x - chainSrc.x, e.y - chainSrc.y) <= THUNDER_HAWK_CHAIN_RANGE)
              .sort((a, b) =>
                Math.hypot(a.x - chainSrc.x, a.y - chainSrc.y) -
                Math.hypot(b.x - chainSrc.x, b.y - chainSrc.y))[0];
            if (!next) break;
            chained.add(next.id);
            const chainHp = (liveHp.get(next.id) ?? next.hp) - chainDmg;
            liveHp.set(next.id, chainHp);
            attacks.push({ unitX: chainSrc.x, unitY: chainSrc.y, enemyX: next.x, enemyY: next.y, isCrit: false });
            if (chainHp <= 0) { killedSet.add(next.id); killRewards.push(next.killReward); tierKillCounts.set(unit.tier, (tierKillCounts.get(unit.tier) ?? 0) + 1); }
            chainSrc = next;
          }
        }

        // Gimmick: Chaos_Artillery — also plant mine at each hit location
        if (unit.race === 'Chaos_Artillery') {
          newMinePositions.push({ x: target.x, y: target.y });
        }

        // Gimmick: Astral_God — chain lightning (4 chains, 90% each, crit)
        if (unit.race === 'Astral_God' && !killedSet.has(target.id)) {
          let chainSrc = target;
          let chainDmg = finalDmg;
          const chained = new Set<number>([target.id]);
          for (let c = 0; c < ASTRAL_GOD_CHAIN_COUNT; c++) {
            chainDmg = Math.max(1, Math.ceil(chainDmg * ASTRAL_GOD_CHAIN_MULT));
            const next = snapshots
              .filter(e => !killedSet.has(e.id) && !chained.has(e.id) &&
                Math.hypot(e.x - chainSrc.x, e.y - chainSrc.y) <= ASTRAL_GOD_CHAIN_RANGE)
              .sort((a, b) =>
                Math.hypot(a.x - chainSrc.x, a.y - chainSrc.y) -
                Math.hypot(b.x - chainSrc.x, b.y - chainSrc.y))[0];
            if (!next) break;
            chained.add(next.id);
            const chainHp = (liveHp.get(next.id) ?? next.hp) - chainDmg;
            liveHp.set(next.id, chainHp);
            attacks.push({ unitX: chainSrc.x, unitY: chainSrc.y, enemyX: next.x, enemyY: next.y, isCrit: true });
            if (chainHp <= 0) { killedSet.add(next.id); killRewards.push(next.killReward); }
            chainSrc = next;
          }
        }
      }
    }
  }

  const killedIds = [...killedSet];
  const hpUpdates = snapshots
    .filter(e => !killedSet.has(e.id) && liveHp.get(e.id) !== e.hp)
    .map(e => ({ id: e.id, hp: liveHp.get(e.id)! }));

  return { attacks, killedIds, hpUpdates, killRewards, knockbacks, newMinePositions, consumedMineIds, tierKillCounts };
}
