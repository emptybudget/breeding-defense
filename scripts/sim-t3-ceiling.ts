// P0-3 (34-t3-usability §4 D) — T3-only 승리 천장 시뮬 (Phaser 없음, 순수 로직)
//   실행: npx esbuild scripts/sim-t3-ceiling.ts --bundle --platform=node --format=esm --outfile=/tmp/simt3.mjs && node /tmp/simt3.mjs
//
// 질문: 영혼이 T4에 안 모인 판(T4 0기)에서 W2/W3 정규 7분 승리가 가능한가? 특히 Phase C 보스(4:30+, HP 65/15).
// 방법: sim-freeze의 tick→spawn→move→combat 루프를 그대로 쓰되 (실제 GameState/runCombat 순수 레이어),
//   ① 보스 HP를 EnemyRenderer.spawnBoss 실제 공식으로 교체(옛 sim-freeze는 hp:75 하드코딩 — 무효),
//   ② 고정 빌드 3종을 state.units에 직접 주입(T4 0기 제약 = 빌드 ①②),
//   ③ 보스 보상 버프는 '주입 가정'이 아니라 보스/미니보스 처치 시 발생(emergent)으로 부여 — 실제 카드 경제 모사.
// 패배 판정은 게임 그대로: enemyCount>40 → gameover (트랙은 닫힌 루프라 개별 누수 없음, '누수'=보스 랩 누적/개체수 압력).
//
// ⚠️ 이건 '천장' 테스트: 유닛을 중앙 클러스터에 최적 배치(사거리·샤먼 오라 최대) → best-case DPS.
//   여기서도 정규 승리가 안 되면 실전(분산 배치)은 더 나쁘다 = 강한 fail 신호.
import { GameState } from '../src/game/GameState';
import {
  ENEMY_TYPES, KILL_REWARD, TANK_KILL_REWARD, WORLD_CONFIGS,
  BOSS_PHASE_B_START_MS, BOSS_PHASE_C_START_MS,
  BOSS_HP_PHASE_B_SCALAR, BOSS_HP_PHASE_C_SCALAR,
  BOSS_SPEED_PHASE_A, BOSS_SPEED_PHASE_B, BOSS_SPEED_PHASE_C,
  BOSS_KILL_REWARD_PHASE_A, BOSS_KILL_REWARD_PHASE_B, BOSS_KILL_REWARD_PHASE_C,
  ELITE_HP_BOSS_RATIO, ELITE_BASE_SPEED, ELITE_KILL_REWARD, ELITE_SPAWN_START_MS,
  CRIT_INIT_PROB, CRIT_PROB_INC, DOUBLE_ATK_INIT_PROB, DOUBLE_ATK_PROB_INC,
  WorldStageConfig,
} from '../src/game/config';
import { makeUnit } from '../src/game/unitHelpers';
import { EnemyType, UnitData, UnitRace } from '../src/game/types';

// ── seeded RNG (Math.random 오버라이드로 crit/double 결정론화) ──────────────
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

let fails = 0;
const failMsg = (m: string) => { console.error('  ✗ ' + m); fails++; };

// ── 빌드 3종 (전부 완성 로스터를 t=0에 주입 → 교배 경제 혼입 제거, 순수 DPS 질문 격리) ──
//   위치: 중앙(180,306) 타이트 클러스터 → 샤먼 오라 r200 전원 포함 + 각 사거리로 트랙 커버.
type Spec = { race: UnitRace; tier: 1 | 2 | 3 | 4; gen: number };
const CENTER = { x: 180, y: 306 };
function placeBuild(state: GameState, specs: Spec[]): void {
  state.units.length = 0;
  specs.forEach((s, i) => {
    // 반경 ≤36px 링 배치 — 샤먼 오라(200) 내부, 상호 근접
    const ang = (i / specs.length) * Math.PI * 2;
    const r = i === 0 ? 0 : 30;
    const u = makeUnit(1000 + i, s.race, s.tier, CENTER.x + Math.cos(ang) * r, CENTER.y + Math.sin(ang) * r);
    (u as UnitData).gen = s.gen as UnitData['gen'];
    state.units.push(u);
  });
}
// ① T3 상비군 (T4 0기): 현실 Phase-C 로스터 — 샤먼(오라)·Dino(처형)·Griffin(일격엔진)·Wizard(광역) + T2 잔여 2
const BUILD_T3_ARMY: Spec[] = [
  { race: 'Berserk_Shaman', tier: 3, gen: 2 },
  { race: 'Dino_Mecha',     tier: 3, gen: 3 },
  { race: 'Griffin',        tier: 3, gen: 3 },
  { race: 'Cyborg_Wizard',  tier: 3, gen: 2 },
  { race: 'Bio_Wolf',       tier: 2, gen: 2 },
  { race: 'Laser_Sniper',   tier: 2, gen: 1 },
];
// ② T2-only 대조군: T3 도달 실패 판 — 강한 T2 6종
const BUILD_T2_ONLY: Spec[] = [
  { race: 'Cyborg_Slasher', tier: 2, gen: 3 },
  { race: 'Laser_Sniper',   tier: 2, gen: 2 },
  { race: 'Missile_Gunner', tier: 2, gen: 2 },
  { race: 'Bio_Wolf',       tier: 2, gen: 2 },
  { race: 'Acorn_Girl',     tier: 2, gen: 1 },
  { race: 'Blade_Hound',    tier: 2, gen: 3 },
];
// ③ T4 1기 + T3 대조군 (12-F1 Gen3 T4 튜닝 기준선): 이게 편안히 이기고 ①이 못 이기면 갭 정량화
const BUILD_T4_ONE: Spec[] = [
  { race: 'Astral_God',     tier: 4, gen: 3 },
  { race: 'Dino_Mecha',     tier: 3, gen: 3 },
  { race: 'Griffin',        tier: 3, gen: 3 },
  { race: 'Berserk_Shaman', tier: 3, gen: 2 },
  { race: 'Bio_Wolf',       tier: 2, gen: 2 },
];

// ── enemy 모델 ──
interface SimEnemy { id: number; x: number; y: number; hp: number; speed: number; wpIdx: number; killReward: number; isBoss: boolean; isMiniboss: boolean; spawnMs: number; laps: number }

interface RunResult { win: boolean; endMs: number; peakCount: number; phaseCKillMs: number[]; bossesUnkilled: number; bossLapsTotal: number }

function runOnce(stage: WorldStageConfig, build: Spec[], seed: number, emergentRewards: boolean): RunResult {
  const rng = mulberry32(seed);
  const realRandom = Math.random;
  Math.random = rng; // combat crit/double + 스폰 타입 롤 결정론화
  try {
    const state = new GameState(
      { gems: 0, levels: { startingGold: 0, summonCost: 0, unitCap: 2, autoGold: 0, gameSpeed2x: 0 }, stageRecords: {}, unlockedStages: [1] } as never,
      stage,
    );
    placeBuild(state, build);

    let enemies: SimEnemy[] = [];
    let nextId = 0;
    let spawnAcc = 0;
    let firstSpawn = false;
    let eliteTimer = 0;
    let peakCount = 0;
    let bossLapsTotal = 0;
    const phaseCKillMs: number[] = [];

    // emergent 보상: 보스/미니보스 처치 시 카드 1장 획득(밸런스 픽 순환) — 실제 경제 모사
    let rewardIdx = 0;
    const awardReward = () => {
      if (!emergentRewards) return;
      const pick = rewardIdx++ % 3;
      if (pick === 0) state.globalDamageBonus += 1;
      else if (pick === 1) state.criticalProbability = state.criticalProbability === 0 ? CRIT_INIT_PROB : Math.min(1, state.criticalProbability + CRIT_PROB_INC);
      else state.doubleAttackProbability = state.doubleAttackProbability === 0 ? DOUBLE_ATK_INIT_PROB : Math.min(1, state.doubleAttackProbability + DOUBLE_ATK_PROB_INC);
    };

    const FRAME = 16.67;
    const wps = state.trackWaypoints;

    const bossHpFor = (ms: number): number => {
      const hpScalar = ms >= BOSS_PHASE_C_START_MS ? BOSS_HP_PHASE_C_SCALAR : ms >= BOSS_PHASE_B_START_MS ? BOSS_HP_PHASE_B_SCALAR : 1;
      return Math.ceil(ENEMY_TYPES.NORMAL.hp * state.currentEnemyHp * stage.bossHpMult * hpScalar);
    };
    const bossSpeedFor = (ms: number): number => {
      const mult = ms >= BOSS_PHASE_C_START_MS ? BOSS_SPEED_PHASE_C : ms >= BOSS_PHASE_B_START_MS ? BOSS_SPEED_PHASE_B : BOSS_SPEED_PHASE_A;
      return ENEMY_TYPES.NORMAL.speed * (state.currentEnemySpeed / 40) * mult;
    };
    const bossRewardFor = (ms: number): number =>
      ms >= BOSS_PHASE_C_START_MS ? BOSS_KILL_REWARD_PHASE_C : ms >= BOSS_PHASE_B_START_MS ? BOSS_KILL_REWARD_PHASE_B : BOSS_KILL_REWARD_PHASE_A;

    const spawnStream = (forced?: EnemyType): void => {
      const wpIdx = Math.floor(rng() * wps.length);
      const wp = wps[wpIdx];
      let type: EnemyType;
      if (forced) type = forced;
      else if (state.elapsedMs >= stage.tankStartMs && rng() < stage.tankRatio) type = 'TANK';
      else type = rng() < stage.fastRatio ? 'FAST' : 'NORMAL';
      const def = ENEMY_TYPES[type];
      enemies.push({
        id: nextId++, x: wp.x, y: wp.y,
        hp: Math.ceil(def.hp * state.currentEnemyHp),
        speed: def.speed * (state.currentEnemySpeed / 40),
        wpIdx: (wpIdx + 1) % wps.length,
        killReward: type === 'TANK' ? TANK_KILL_REWARD : KILL_REWARD,
        isBoss: false, isMiniboss: false, spawnMs: state.elapsedMs, laps: 0,
      });
      state.registerSpawn();
    };
    const spawnElite = (isMiniboss: boolean): void => {
      const wpIdx = Math.floor(rng() * wps.length);
      const wp = wps[wpIdx];
      enemies.push({
        id: nextId++, x: wp.x, y: wp.y,
        hp: Math.ceil(ENEMY_TYPES.NORMAL.hp * state.currentEnemyHp * stage.bossHpMult * ELITE_HP_BOSS_RATIO),
        speed: ELITE_BASE_SPEED * (state.currentEnemySpeed / 40),
        wpIdx: (wpIdx + 1) % wps.length, killReward: ELITE_KILL_REWARD,
        isBoss: false, isMiniboss, spawnMs: state.elapsedMs, laps: 0,
      });
      state.registerSpawn();
    };

    const maxFrames = Math.ceil(stage.victoryTimeMs / FRAME) + 2;
    for (let f = 0; f < maxFrames; f++) {
      state.tick(FRAME);
      const ph = state.phase as string;
      if (ph === 'gameover') return { win: false, endMs: state.elapsedMs, peakCount, phaseCKillMs, bossesUnkilled: enemies.filter(e => e.isBoss).length, bossLapsTotal };
      if (ph === 'victory') return { win: true, endMs: state.elapsedMs, peakCount, phaseCKillMs, bossesUnkilled: enemies.filter(e => e.isBoss).length, bossLapsTotal };

      // 보스 스폰 (실제 공식)
      if (state.pendingBossSpawn) {
        state.pendingBossSpawn = false;
        const wp = wps[0];
        enemies.push({ id: nextId++, x: wp.x, y: wp.y, hp: bossHpFor(state.elapsedMs), speed: bossSpeedFor(state.elapsedMs), wpIdx: 1, killReward: bossRewardFor(state.elapsedMs), isBoss: true, isMiniboss: false, spawnMs: state.elapsedMs, laps: 0 });
        state.registerSpawn();
      }
      state.pendingBossAlert = false;
      // 스크립트 웨이브
      if (state.pendingScriptedWave) { const w = state.pendingScriptedWave; state.pendingScriptedWave = null; for (let i = 0; i < w.count; i++) spawnStream(w.type); }
      state.pendingScriptedWaveAlert = false;
      // 미니보스
      if (state.pendingMinibossSpawn) { state.pendingMinibossSpawn = false; spawnElite(true); }
      state.pendingSurge = false;

      // 일반 스트림
      if (!firstSpawn) { if (state.elapsedMs >= 5000) { firstSpawn = true; spawnAcc = 0; spawnStream(); } }
      else {
        spawnAcc += FRAME;
        const interval = state.currentSpawnIntervalMs;
        let guard = 0;
        while (spawnAcc >= interval) { spawnAcc -= interval; spawnStream(); if ((state.phase as string) === 'gameover') break; if (++guard > 2000) { failMsg('spawn runaway'); break; } }
      }
      // 엘리트
      if (stage.eliteIntervalMs !== null && state.elapsedMs >= ELITE_SPAWN_START_MS) {
        eliteTimer += FRAME;
        while (eliteTimer >= stage.eliteIntervalMs) { eliteTimer -= stage.eliteIntervalMs; spawnElite(false); }
      }

      // 이동
      for (const e of enemies) {
        const wp = wps[e.wpIdx];
        const dx = wp.x - e.x, dy = wp.y - e.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 8) { const nxt = (e.wpIdx + 1) % wps.length; if (nxt === 1) { e.laps++; if (e.isBoss) bossLapsTotal++; } e.wpIdx = nxt; continue; }
        const step = e.speed * (FRAME / 1000);
        e.x += (dx / dist) * step; e.y += (dy / dist) * step;
      }

      // 전투
      const snapshots = enemies.map(e => ({ id: e.id, x: e.x, y: e.y, hp: e.hp, progressScore: e.wpIdx * 1000 - Math.hypot(wps[e.wpIdx].x - e.x, wps[e.wpIdx].y - e.y), killReward: e.killReward }));
      const result = state.processCombat(snapshots);
      for (const { id, hp } of result.hpUpdates) { const e = enemies.find(x => x.id === id); if (e) e.hp = hp; }
      if (result.killedIds.length > 0) {
        const killed = new Set(result.killedIds);
        for (const e of enemies) {
          if (!killed.has(e.id)) continue;
          if ((e.isBoss || e.isMiniboss)) awardReward();
          if (e.isBoss && e.spawnMs >= BOSS_PHASE_C_START_MS) phaseCKillMs.push(state.elapsedMs - e.spawnMs);
        }
        enemies = enemies.filter(e => !killed.has(e.id));
      }
      if (state.enemyCount > peakCount) peakCount = state.enemyCount;
    }
    // 루프 소진 = 7분 도달했는데 victory 미플립(마지막 프레임 경계) → 승리로 간주
    return { win: (state.phase as string) !== 'gameover', endMs: state.elapsedMs, peakCount, phaseCKillMs, bossesUnkilled: enemies.filter(e => e.isBoss).length, bossLapsTotal };
  } finally {
    Math.random = realRandom;
  }
}

// ── 배치 실행 ──
const SEEDS = 60;
function median(xs: number[]): number { if (xs.length === 0) return NaN; const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; }

function runBatch(label: string, stage: WorldStageConfig, build: Spec[], emergent: boolean): { winRate: number; peakMed: number; killMed: number; unkilledMean: number } {
  let wins = 0; const peaks: number[] = []; const kills: number[] = []; let unkilled = 0;
  for (let s = 0; s < SEEDS; s++) {
    const r = runOnce(stage, build, 7000 + s * 13, emergent);
    if (r.win) wins++;
    peaks.push(r.peakCount);
    kills.push(...r.phaseCKillMs);
    unkilled += r.bossesUnkilled;
  }
  const winRate = wins / SEEDS;
  const peakMed = median(peaks);
  const killMed = median(kills);
  const unkilledMean = unkilled / SEEDS;
  console.log(`    ${label.padEnd(22)} 승률 ${(winRate * 100).toFixed(0).padStart(3)}%  개체수peak ${String(peakMed).padStart(2)}/40  PhaseC보스처치중앙값 ${isNaN(killMed) ? ' n/a' : (killMed / 1000).toFixed(1) + 's'}  판당미처치보스 ${unkilledMean.toFixed(1)}`);
  return { winRate, peakMed, killMed, unkilledMean };
}

const STAGES: { key: string; cfg: WorldStageConfig }[] = [
  { key: 'W2-1', cfg: WORLD_CONFIGS[2][1] },
  { key: 'W2-5', cfg: WORLD_CONFIGS[2][5] },
  { key: 'W3-1', cfg: WORLD_CONFIGS[3][1] },
  { key: 'W3-5', cfg: WORLD_CONFIGS[3][5] },
];

console.log('P0-3 T3-only 승리 천장 시뮬 (T4 0기, best-case 중앙 클러스터 배치, 60시드/셀)');
console.log('  emergent 보상 = 보스/미니보스 처치 시 카드 1장 순환 획득(damage/crit/double) — 실제 경제 모사\n');

const summary: { stage: string; t3: number; t2: number; t4: number }[] = [];
for (const { key, cfg } of STAGES) {
  console.log(`━━ ${key} (보스HP×${cfg.bossHpMult}, victory ${cfg.victoryTimeMs / 60000}분) ━━`);
  const t3 = runBatch('① T3 상비군(T4 0기)', cfg, BUILD_T3_ARMY, true);
  runBatch('  └ FLOOR(무보상)', cfg, BUILD_T3_ARMY, false);
  const t2 = runBatch('② T2-only 대조군', cfg, BUILD_T2_ONLY, true);
  const t4 = runBatch('③ T4 1기+T3 기준선', cfg, BUILD_T4_ONE, true);
  summary.push({ stage: key, t3: t3.winRate, t2: t2.winRate, t4: t4.winRate });
  console.log('');
}

// ── 게이트 판정 ──
// 게이트 = ① T3 상비군이 정규 승리 가능(누수 한도 내). 기준선 ③가 이기는데 ①이 못 이기면 T3 천장 미달.
console.log('━━ 게이트 판정 ━━');
const GATE_WIN = 0.6; // T3 상비군 승률 하한 (best-case 배치라 이보다 낮으면 실전은 확실히 fail)
let gatePass = true;
for (const s of summary) {
  const t3ok = s.t3 >= GATE_WIN;
  const baselineWins = s.t4 >= GATE_WIN;
  const gap = baselineWins && !t3ok;
  console.log(`  ${s.stage}: T3 ${(s.t3 * 100).toFixed(0)}% / T2 ${(s.t2 * 100).toFixed(0)}% / T4기준선 ${(s.t4 * 100).toFixed(0)}%  ${t3ok ? '✅ T3 통과' : gap ? '❌ T3 천장 미달(기준선은 승리)' : '⚠️ 스테이지 자체가 빡셈'}`);
  if (!t3ok) gatePass = false;
}

console.log('\n' + (gatePass && fails === 0
  ? '✅ GATE PASS — T3 상비군만으로 정규 승리 가능. A안/C안 보류 유지, 34번 D 종결.'
  : '❌ GATE FAIL — T3 천장 미달. 34번 §4 노브 후보 3개(자동적용 금지, 사용자 결정):\n' +
    '   ⑴ BOSS_HP_PHASE_C_SCALAR 하향 재조정  ⑵ A안(T3 영혼 강화 트랙) 착수  ⑶ 32번 B안(T4 필드 상한 1)과 결합 재검토'));
process.exit(gatePass && fails === 0 ? 0 : 1);
