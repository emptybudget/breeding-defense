// 프리징 재현용 순수 데이터 레이어 시뮬레이션 (Phaser 없음)
// GameScene/EnemyRenderer의 흐름을 모사: tick → spawn → move → combat
import { GameState } from '../src/game/GameState';
import { ENEMY_TYPES, KILL_REWARD, WORLD_CONFIGS } from '../src/game/config';

const state = new GameState(
  { gems: 0, levels: { startingGold: 0, summonCost: 0, unitCap: 0, autoGold: 0, gameSpeed2x: 0 }, stageRecords: {}, unlockedStages: [1] } as never,
  WORLD_CONFIGS[2][1],
);

interface SimEnemy { id: number; x: number; y: number; hp: number; speed: number; wpIdx: number; killReward: number }
let enemies: SimEnemy[] = [];
let nextId = 0;
let spawnAcc = 0;
let firstSpawn = false;

// 유닛 10개 강제 배치 (소환 비용 무시)
for (let i = 0; i < 10; i++) {
  state.gold += 100;
  const u = state.summon();
  if (!u) break;
}
console.log('units:', state.units.length, state.units.map(u => u.race).join(','));

const FRAME = 16.67;
const start = Date.now();
let lastLog = 0;

for (let f = 0; f < (3 * 60 * 1000) / FRAME; f++) {
  state.tick(FRAME);
  if ((state.phase as string) === 'gameover' || (state.phase as string) === 'victory') {
    console.log('phase end:', state.phase, 'at', state.formatTimer());
    break;
  }

  // boss spawn flag 소비
  if (state.pendingBossSpawn) {
    state.pendingBossSpawn = false;
    const wp = state.trackWaypoints[0];
    enemies.push({ id: nextId++, x: wp.x, y: wp.y, hp: 75, speed: 24, wpIdx: 1, killReward: 50 });
    state.registerSpawn();
  }
  state.pendingBossAlert = false;

  // spawning
  if (!firstSpawn) {
    if (state.elapsedMs >= 5000) { firstSpawn = true; spawnAcc = 0; spawnOne(); }
  } else {
    spawnAcc += FRAME;
    const interval = state.currentSpawnIntervalMs;
    let guard = 0;
    while (spawnAcc >= interval) {
      spawnAcc -= interval;
      spawnOne();
      if (++guard > 1000) { console.log('SPAWN LOOP RUNAWAY, interval=', interval); process.exit(1); }
    }
  }

  // movement
  const wps = state.trackWaypoints;
  for (const e of enemies) {
    const wp = wps[e.wpIdx];
    const dx = wp.x - e.x, dy = wp.y - e.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) { e.wpIdx = (e.wpIdx + 1) % wps.length; continue; }
    const step = e.speed * (FRAME / 1000);
    e.x += (dx / dist) * step; e.y += (dy / dist) * step;
  }

  // combat
  const snapshots = enemies.map(e => ({
    id: e.id, x: e.x, y: e.y, hp: e.hp,
    progressScore: e.wpIdx * 1000 - Math.hypot(wps[e.wpIdx].x - e.x, wps[e.wpIdx].y - e.y),
    killReward: e.killReward,
  }));
  const result = state.processCombat(snapshots);
  for (const { id, hp } of result.hpUpdates) {
    const e = enemies.find(x => x.id === id); if (e) e.hp = hp;
  }
  const killed = new Set(result.killedIds);
  enemies = enemies.filter(e => !killed.has(e.id));

  // 매 10초 합성 시도: 서로 다른 tier1 두 개를 강제로 같은 위치에서 합성
  if (state.elapsedMs - lastLog >= 10000) {
    lastLog = state.elapsedMs;
    const t1 = state.units.filter(u => u.tier === 1 && !u.isBreeding && !u.isExhausted);
    let synthDone = '';
    outer: for (let i = 0; i < t1.length; i++) {
      for (let j = i + 1; j < t1.length; j++) {
        if (t1[i].race !== t1[j].race) {
          const r = state.synthesize(t1[i].id, t1[j].id);
          if (r) { synthDone = `${t1[i].race}+${t1[j].race}→${r.race}`; break outer; }
        }
      }
    }
    console.log(state.formatTimer(), 'enemies:', enemies.length, 'units:', state.units.length, 'gold:', state.gold, synthDone);
  }
}

function spawnOne(): void {
  const wps = state.trackWaypoints;
  const wpIdx = Math.floor(Math.random() * wps.length);
  const wp = wps[wpIdx];
  const fast = Math.random() < 0.5;
  const def = fast ? ENEMY_TYPES.FAST : ENEMY_TYPES.NORMAL;
  enemies.push({
    id: nextId++, x: wp.x, y: wp.y,
    hp: Math.ceil(def.hp * state.currentEnemyHp),
    speed: def.speed * (state.currentEnemySpeed / 40),
    wpIdx: (wpIdx + 1) % wps.length,
    killReward: KILL_REWARD,
  });
  state.registerSpawn();
}

console.log('SIM DONE in', Date.now() - start, 'ms — 순수 레이어 무한루프 없음');
