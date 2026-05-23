# breeding-defense — AI 핸드오프 컨텍스트

> 다른 AI와 협업 시 이 문서를 컨텍스트로 전달하세요. 매 갱신마다 최신화됩니다.
> 마지막 갱신: 2026-05-23 (Phase B~F 전체 커밋 — 2티어 기믹 전체 + 3/4티어 합성 + 메타프로그레션 상점)

## 개요
- 모바일 세로 디펜스 게임 (시간 생존형, 360x640).
- 플레이어가 유닛 소환 → **[교배: 같은 종족, a+b → a,b,c 개체수↑]** **[합성: 다른 종족, b+d → e 1티어↑]** 으로 적 방어.
- 패배: 화면 적 50마리 초과. 1차 승리: 10:00 도달. 이후 **오버클록 모드**(능력치 매초 기하급수 증가) 무한 지속, 최종 생존시간이 기록.
- 적 처치 시 골드 획득, 골드로 1티어 기본 유닛 랜덤 소환.

## 기술 스택
- **Vite 5** + **TypeScript 5** (strict) + **Phaser 3.80**
- 추후 **Capacitor**로 Android/iOS 패키징 예정
- 개발 환경: Firebase Studio (구 IDX) + 웹 Claude Code

## 🔮 대격변 업데이트 (✅ 구현 완료)

> 코어 판타지 강화 목적. **4티어 시스템**으로 확장. 구현은 Phase A→E 순서대로.

### 4티어 유닛 전체 구조

| 티어 | 종 수 | 생성 방법 |
|---|---|---|
| 1티어 | 6종 | 골드 소환 (1/6 균등) |
| 2티어 | 12종 | 다른 카테고리 1티어 두 개 합성 |
| 3티어 | 6종 | 특정 2티어 두 개 합성 (레시피 고정) |
| 4티어 | 1종 | 특정 3티어 세 개 합성 |

### 1티어 6종 스탯

| 유닛 | 카테고리 | 이모지 | range | dmg | intervalMs |
|---|---|---|---|---|---|
| Warrior | Human | ⚔️ | 50 | 2 | 1000 |
| Archer | Human | 🏹 | 150 | 1 | 1200 |
| Dog | Beast | 🐶 | 80 | 1 | 600 |
| Squirrel | Beast | 🐿️ | 130 | 1 | 1000 |
| Android | Robot | 🦾 | 60 | 3 | 1500 |
| Cannon | Robot | 🚀 | 180 | 2 | 2000 |

### 교배 규칙 (변경)

- **교배 조건:** 같은 카테고리(Human/Beast/Robot)이면 가능 (세부 종족 달라도 OK)
- **같은 세부 종족** (Warrior+Warrior): 85% 동종 복사, **15% 돌연변이** (같은 카테고리 내 다른 종)
- **다른 세부 종족** (Warrior+Archer): 50:50 확률로 자식 결정
- 소환도 의사-랜덤 권장: 최근 3개 중복 제외로 편향 방지

### 2티어 합성 레시피 12종

| 2티어 | 재료 | 기믹 |
|---|---|---|
| 🐺 Bio_Wolf | Warrior + Dog | 근접 인파이터 |
| 🐿️ Acorn_Girl | Warrior + Squirrel | 주변 아군 공속 오라 +20% |
| 🦅 Falcon_Eye | Archer + Dog | 딸피 우선 저격 |
| 🏹 Acorn_Hunter | Archer + Squirrel | 고속 연사 |
| 🧬 Cyborg_Slasher | Warrior + Android | 전방 광역 베기 |
| 🛡️ Cannon_Shooter | Warrior + Cannon | 적 넉백 |
| ⚡ Laser_Sniper | Archer + Android | 관통 레이저 |
| 💣 Missile_Gunner | Archer + Cannon | 3타겟 멀티샷 |
| 🐕 Blade_Hound | Dog + Android | 공격 시 공속 중첩 광전사 |
| ⚾ Gatling_Dog | Dog + Cannon | 스플래시 폭탄 (반경 40px 50% 피해) |
| ⚡ Electric_Coon | Squirrel + Android | 체인 라이트닝 (최대 2마리 연쇄) |
| 💔 Menhera_Squirrel | Squirrel + Cannon | 트랙 위 지뢰 매설 |

### 3티어 합성 레시피 6종

| 3티어 | 재료 | 컨셉 |
|---|---|---|
| 🧙 Cyborg_Wizard | Cannon_Shooter + Acorn_Hunter | 포방+정밀 → 기계+마법 마법사 |
| 🌋 Dino_Mecha | Gatling_Dog + Cyborg_Slasher | 폭탄+근력 → 메카 공룡 |
| 🦅 Griffin | Falcon_Eye + Bio_Wolf | 매+늑대 → 하늘+땅 맹수 |
| ⚡ Thunder_Hawk | Laser_Sniper + Electric_Coon | 관통+체인 → 연쇄 전격 저격수 |
| 🌿 Berserk_Shaman | Acorn_Girl + Blade_Hound | 오라+광전사 → 전장 광란 버프 |
| 💥 Chaos_Artillery | Missile_Gunner + Menhera_Squirrel | 멀티샷+지뢰 → 폭발물 전문 포격수 |

### 4티어 — Astral_God 🌟

**레시피:** `Griffin` + `Thunder_Hawk` + `Cyborg_Wizard`

자연 맹수 + 번개 + 마법기계 = 세 세계 융합 최종 존재.
비용: 최소 tier-1 12개 → 군대 거의 전부 갈아넣는 궁극의 "Pop" 유닛.

### 구현 Phase 로드맵

| Phase | 내용 | 핵심 파일 |
|---|---|---|
| **A** ✅ | 1티어 6종 타입/스탯/소환/교배 재배선 | `types.ts`, `config.ts`, `GameState.ts`, `unitHelpers.ts`, `constants.ts` |
| **B** ✅ | 2티어 기믹 1차: Falcon_Eye(딸피우선), Acorn_Hunter(연사), Missile_Gunner(멀티샷), Cyborg_Slasher(광역) | `combat.ts`, `config.ts`, `unitHelpers.ts` |
| **C** ✅ | 2티어 기믹 2차: Cannon_Shooter(넉백), Gatling_Dog(스플래시), Electric_Coon(체인) | `combat.ts`, `types.ts`, `EnemyRenderer.ts` |
| **D** ✅ | 2티어 기믹 3차: Acorn_Girl(오라), Blade_Hound(공속중첩), Menhera_Squirrel(지뢰) | `combat.ts`, `GameState.ts`, `types.ts`, `config.ts`, `GameScene.ts` |
| **E** ✅ | 3티어 6종 + 4티어 Astral_God + 레시피 팝업 개편 | `unitHelpers.ts`, `PopupRenderer.ts`, `combat.ts`, `config.ts`, `types.ts`, `constants.ts`, `GameState.ts`, `UnitRenderer.ts`, `DragController.ts` |
| **F** ✅ | 메타프로그레션 상점 (StageSelectScene) + 별 화폐 + 영구 강화 4종 | `MetaProgress.ts`(신규), `config.ts`, `GameState.ts`, `GameScene.ts`, `StageSelectScene.ts` |

---

## 아키텍처 규칙 (중요)
**데이터 레이어와 Phaser 레이어 분리.** `src/game/*` 는 Phaser를 import하지 않는 순수 TS. 모든 상태/규칙은 여기. `src/scenes/*` 는 그래픽/입력만 담당.

## 파일 구조
```
breeding-defense/
├── CLAUDE.md                # 코딩 가이드라인 (세션 시작 자동 로드)
├── PROGRESS.md              # 이 문서
├── .claude/agents/          # 프로젝트 서브에이전트 (brainstormer, game-designer, refactor-expert)
├── index.html               # canvas mount (#game)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.ts              # Phaser.Game 부트 (씬 배열: TitleScene→StageSelectScene→GameScene)
    ├── game/                # 🧠 순수 데이터 레이어 (Phaser 의존 0)
    │   ├── config.ts        # 모든 상수
    │   ├── types.ts         # Race, UnitData 등
    │   └── GameState.ts     # phase / 타이머 / 경제 / 유닛 / 전투 처리
    └── scenes/              # 🎨 Phaser 레이어
        ├── TitleScene.ts            # 타이틀 화면 → StageSelectScene
        ├── StageSelectScene.ts      # 스테이지 선택 → GameScene
        ├── GameScene.ts             # ~140줄 오케스트레이터
        ├── constants.ts             # RACE_COLORS, RACE_EMOJI, SELL_ZONE 좌표
        ├── render/
        │   ├── HudRenderer.ts
        │   ├── EnemyRenderer.ts
        │   ├── UnitRenderer.ts
        │   ├── PopupRenderer.ts
        │   └── NotificationRenderer.ts
        └── input/
            └── DragController.ts
```

## 주요 상수 (src/game/config.ts)
| 상수 | 값 | 설명 |
|---|---|---|
| `GAME_WIDTH` / `GAME_HEIGHT` | 360 / 640 | 캔버스 크기 |
| `MAX_ENEMIES` | 50 | 초과 시 게임 오버 |
| `CLEAR_TIME_MS` | 600000 (10분) | 1차 클리어 (오버클록 진입) |
| `ENEMY_SPAWN_INTERVAL_MS` | **2500 (DEV, 출시 5000)** | 기본 스폰 주기 |
| `VICTORY_TIME_MS` | **120000 (DEV 2분, 출시 420000=7분)** | 승리 조건 |
| `ENEMY_BASE_SPEED` / `ENEMY_BASE_HP` | 40 px/sec / 1 | 오버클록 기준 |
| `OVERCLOCK_HP_GROWTH` / `_SPEED_GROWTH` / `_SPAWN_DECAY` | 1.05 / 1.03 / 0.97 | 매초 |
| `MINUTE_HP_MULT` / `_SPEED_MULT` | 1.25 / 1.2 | 1분마다 누적 (HP는 game-designer C 조정으로 1.5→1.25) |
| `STARTING_GOLD` / `STARTING_GEMS` | 100 / 3 | 시작 자원 |
| `KILL_REWARD` / `BOSS_KILL_REWARD` | 5 / 50 | 처치 보상 |
| `GOLD_AUTO_RECOVERY_PER_SEC` | 2 | 골드 매초 자동 회복 (game-designer B) |
| `UNIT_CAP` | 5 | 초기 유닛 한도 (사회성으로 증가) |
| `SUMMON_BASE_COST` / `_INCREMENT` | 10 / 2 | 첫 소환 비용 + 누적 증가 |
| `POPULATION_UPGRADE_BASE_COST` / `_INCREASE` | 50 / 10 | 사회성 업그레이드 |
| `BOSS_HP_MULT` | 15 | 보스 HP = NORMAL × 15 |
| `SPAWN_ACCEL_INTERVAL_MS` / `_DECAY` | 30000 / 0.85 | 매 30초 스폰 가속 |
| `CRIT_DAMAGE_MULT` | 1.5 | 치명타 배율 |
| `REWARD_GOLD_AMOUNT` | 150 | 보상 카드 골드 |
| `BREEDING_DURATION_MS` / `_EXHAUST_DURATION_MS` | 3000 / 3000 | 교배 시간 / 탈진 시간 |
| `TRACK_BASE_*` + `TRACK_UNIT_ZONE_PADDING` | — | 트랙 기준 좌표, 매판 ±10~20px 노이즈 |
| `ENEMY_TYPES.NORMAL` / `.FAST` | hp5속40 / hp2속75 | 적 종류 |
| `RACE_STATS` / `HYBRID_STATS` / `TIER3_STATS` / `TIER4_STATS` | — | 종족별 전투 스탯 (range/damage/attackIntervalMs/maxTargets) |
| `SELL_GOLD_TIER1/2/3/4` | 10 / 30 / 60 / 150 | 판매 보상 |
| `META_STARS_PER_VICTORY` | 3 | 승리 시 별 지급 |
| `META_UPGRADES` | 4종 (startingGold/summonCost/unitCap/autoGold) | 메타 상점 영구 강화 정의 |
| `TWIN_INIT_PROB` / `_INC` | 0.10 / 0.02 | 쌍둥이 확률 |
| `DOUBLE_ATK_INIT_PROB` / `_INC` | 0.10 / 0.02 | 더블어택 확률 |

> 3티어 dmg는 game-designer C 조정 후: Cyborg_Wizard 6 / Dino_Mecha 30 / Griffin 2.
> 신규 3티어: Thunder_Hawk(range220/dmg5/1100ms/체인3) / Berserk_Shaman(range100/dmg5/700ms/오라200px+40%) / Chaos_Artillery(range190/dmg3/1500ms/5타겟+지뢰)
> 4티어 Astral_God: range260/dmg10/300ms/8타겟/보장크리티컬/체인4. 레시피: Griffin+Thunder_Hawk+Cyborg_Wizard (100px 이내 3-way 합성).

## GameState API (src/game/GameState.ts)
- **상태:** `phase` ('playing'|'clear'|'overclock'|'gameover'|'victory'), `elapsedMs`, `enemyCount`, `gold`, `gems`, `units: UnitData[]`, `summonCost`, `maxUnits`, `populationUpgradeCost`, `pendingBossSpawn`, `criticalProbability`, `isInfiniteMode`, `pendingNotification`, `trackWaypoints`, `unitZone`
- **메서드:** `tick(deltaMs)`, `enterOverclock()`, `registerSpawn()`, `registerKill(reward)`, `summon()`, `upgradePopulation()`, `moveUnit(id,x,y)`, `sellUnit(id)`, `toggleLock(id)`, `useGemContinue()`, `startBreeding()`, `completeBreeding()`, `synthesize()`, `processCombat(snapshots)`, `generateRewards(count)`, `applyReward(type)`
- **게터:** `currentSpawnIntervalMs`, `currentEnemyHp`, `currentEnemySpeed`, `formatTimer()`

## 타입 (src/game/types.ts)
- `Race`: Human | Beast | Robot
- `HybridRace`: Bio_Wolf | Acorn_Girl | Falcon_Eye | Acorn_Hunter | Cyborg_Slasher | Cannon_Shooter | Laser_Sniper | Missile_Gunner | Blade_Hound | Gatling_Dog | Electric_Coon | Menhera_Squirrel
- `Tier3Race`: Cyborg_Wizard | Dino_Mecha | Griffin | Thunder_Hawk | Berserk_Shaman | Chaos_Artillery
- `Tier4Race`: Astral_God
- `UnitRace`: Tier1Race | HybridRace | Tier3Race | Tier4Race
- `EnemyType`: NORMAL | FAST
- `RewardType`: gem | gold | damage | maxUnits | twinProb | doubleAtk | crit
- `UnitData`: id, race, tier(1|2|3|4), x, y, lastAttackedAtMs, isBreeding, breedingEndMs, isExhausted, exhaustEndMs, isLocked
- `EnemySnapshot`, `AttackEvent`, `CombatResult` (combat I/O)

## 구현 완료 (그룹별)

### 핵심 루프
- 실시간 타이머 + 적 카운터 `N/50` + 보석 HUD
- 적 스폰 (트랙 웨이포인트 랜덤 시작 → 순환 이동)
- 50마리 초과 → 게임오버 팝업 (다시하기 / 보석 이어하기 / 스테이지선택)
- 10:00 → 오버클록 페이즈 (매초 적 능력치 스케일링)
- 1분 주기 영구 버프 (HP ×1.25, 속도 ×1.2 누적)
- 30초 주기 스폰 가속 + 보스 스폰
- 2분(DEV)/7분(출시) 승리 → 빅토리 팝업 3분기 [다시하기/무한모드/스테이지선택]
- 무한 모드: 승리 조건 패스, 난이도 가속 지속

### 경제
- 시작 100G + 매초 +2G 자동회복 + 처치 +5G (보스 +50G)
- 소환 비용 10G+2씩 누적
- 사회성 업그레이드 50G+10G씩 → maxUnits+1
- 보석 3개 시작, 이어하기 1소모 + 적 전멸
- 보스 처치 보상 카드 (2~3장, 💎로 3장 확장)

### 유닛 시스템
- 1티어 3종 (Human 파랑/Beast 초록/Robot 보라), 종족별 사거리(60/120/200) + 이모지(👦🐶🤖)
- 2티어 하이브리드 3종 (Human_Robot 청록 / Human_Beast 핑크 / Beast_Robot 주황) + 이모지(🦾🐺🦖)
- 3티어 3종 + 합성 레시피 + 이모지(🧙🌋🦅):
  - Cyborg_Wizard (H_B + H_R, range180/dmg6/3타겟)
  - Dino_Mecha (B_R + H_R, range150/dmg30)
  - Griffin (B_R + H_B, range220/dmg2/200ms)
- 사거리 원: 드래그 중에만 표시
- 종족별 stats: range/damage/attackIntervalMs 차별화
- 타겟팅: progressScore 기반 전진 우선
- 공격 플래시 선 (노란) + CRIT! 붉은 텍스트 연출

### 교배 / 합성 / 판매 / 잠금
- 드래그 35px 이내 타 유닛 드롭 → 종족 판정
- 교배: 같은 종족, 3초 쿨, 자식 1~2개(쌍둥이 확률), ❤ 연출
- 탈진: 부모 3초 zzz, 교배/합성 차단
- 합성: 다른 종족, 두 유닛 제거 → 상위 티어 1개
- 레시피 없는 3티어 조합 → 알림 차단
- 빈 공간 드롭 → 유닛 이동
- 🗑️ 드롭존 → 판매 (10/30/60G)
- 더블탭 (300ms) → 🔒 잠금 토글 (잠금 유닛 교배/합성 차단)
- 유닛 탭 → 레시피 팝업 (어떤 조합인지 안내)

### 적
- NORMAL (빨강 16×16, HP5) / FAST (노랑 10×10, HP2 속도75)
- 보스 (파랑 32×32, HP=NORMAL×15, 처치 50G)
- 각 적 상단 HP 바 (녹/황/적 전환)

### 보상 시스템 (보스 처치)
- 일시정지 + 딤 처리
- 6종: 💎보석+1 / 💰골드+150 / ⚔️공격력+1 / 🏠유닛한도+1 / 👶쌍둥이확률업 / ⚡더블어택업 / 🎯치명타
- 첫 보스 보상에 치명타 확정 포함

### 시각 / UX
- 매판 가변 트랙 (±10~20px 노이즈)
- 통합 알림 시스템 (하단 좌측 4줄 fade out)
- 교배 밀착 연출 (드래그 유닛이 대상 오른쪽 18px로 즉시 이동)
- 인게임 ⏸ 일시정지 버튼 (상단 HUD 중앙) → 경과시간/골드/유닛/적/보석 정산 팝업 → 계속하기 / 🚪 종료(스테이지 선택)

### Scene 루프
- TitleScene (로고 + 깜빡이는 터치 안내 → fade → StageSelectScene)
- StageSelectScene (Stage 1 버튼, stageId 데이터)
- GameScene (게임 본체)
- 게임오버/빅토리 → 스테이지선택 안전 전환 (`scene.start`)

### 튜토리얼
- 시작 시 교배/합성/판매 원페이지 오버레이 (isPaused, 터치로 fade out)

## 🎮 게임 디자인 결정 (코어 합의)

> 출퇴근 시간 디벨롭으로 누적되는 결정 사항. 모든 기능 결정은 "이게 코어 판타지 4박자를 강화하나?" 한 줄로 판정.

### 🧬 코어 판타지 (게임의 DNA)
**"스테이지를 보고 빌드를 짜고, 고생해서 고티어를 완성하면, 한 방에 쓸어버리는 쾌감"**

4박자 사이클:
1. **🧭 계획 (Plan)** — 스테이지의 적 보고 빌드 결정
2. **😤 고생 (Grind)** — 운 + 합성 + 자원 압박 사이 분투
3. **💥 폭발 (Pop)** — 고티어 완성 → 적 싹쓸이 카타르시스
4. **🔄 반복 (Loop)** — 다음 스테이지 → 새 적 → 새 빌드

### 정체성
- **머지 디펜스 베이스 + 시간 생존형 "버티는 쾌감" 가미**
- 참고 게임 (확정):
  - **메인: 히어로즈 랜덤 디펜스** — 영웅 랜덤 소환 + 합성 + PvE 디펜스, 한국형 머지 디펜스 정수
  - **서브1: 운빨존많겜** — 랜덤성 + 시간 생존 + 합성 압박
  - **서브2: Vampire Survivors** — 시간 생존 페이스, 후반 카타르시스
- 한 판 길이: **7분** (출퇴근 한 사이클)
- 콘텐츠 모델: PvE 메인 / 엔드콘텐츠 = 점수 경쟁 (추후)

### 시스템 결정
| 시스템 | 결정 |
|---|---|
| 골드 공급 | 적 처치 + 매초 +2G 자동 회복 ✅ |
| 종족 선택 소환 | **철회** — 랜덤 묘미 유지, 추후 고급 소환/확률 조작 시스템으로 확장 |
| SP / 스킬 | 추후 (사용 가능한 스킬 도입 시점에 같이) |
| 시너지 | 도입 — 메뉴 영구 업그레이드로 해금 |
| 메타프로그레션 | 메뉴 영구 업그레이드 트리 (시너지 / 패시브 / 유닛 해금) |
| 스테이지 | 도입 필수 — 스테이지마다 다른 적/필드 (척추) — Stage 1만 구현됨 |
| 고티어 선택권 | 부분 — 레시피 팝업으로 "어떤 조합이 뭐 되나" 공개 |

### 미결정 (다음 출퇴근 토픽 후보)
- [ ] 스테이지 구조: 개수 / 선형·맵·챕터 / 클리어 조건
- [x] 메타프로그레션 트리: 1차 구현 완료 (영구 강화 4종 + 별 화폐) — Phase F
- [ ] 메타프로그레션 확장: 시너지 해금 / 스타터 유닛 선택 / 2차 업그레이드 트리
- [ ] 시너지 카탈로그: 종족간/티어간 시너지 5~10개
- [ ] 아트 방향: 이모지 유지 / 픽셀 / 일러스트
- [ ] 수익 모델: F2P 광고 / IAP / 프리미엄

---

## 🎯 재미 증대 후보 기능 (game-designer 진단 2026-05-23)

> 참고 게임: 히어로즈 랜덤 디펜스 / 운빨존많겜 / Vampire Survivors / Auto Chess / Legion TD / Merge Mansion
> 우선순위: 구현 비용 대비 효과 기준 정렬

### 🔴 1순위 — Pop 살리기 (대격변 완료 직후 필수)

| # | 기능 | 출처 | 박자 | 비고 |
|---|---|---|---|---|
| G | **3/4티어 완성 시 0.3초 슬로우 + 화면 플래시 ULTIMATE 연출** | VS | **Pop** | Astral_God 구현됐지만 연출 無 — 지금 가장 허전한 곳 |
| A | 적 40마리 이상 → 화면 테두리 붉은 맥동 | VS | Grind | 구현비용 最低, 효과 確실 |
| B | 합성 가능한 유닛 쌍 → 빛나는 테두리 강조 | 운빨존많겜 | Grind | 12종 시대에 더욱 필요 — 테두리만, 텍스트 알림 X |

### 🟡 2순위 — Plan·Grind 강화 (풀플레이 후)

| # | 기능 | 출처 | 박자 | 비고 |
|---|---|---|---|---|
| C | 웨이브 예고창 (다음 BOSS 예고 1줄, 우상단) | 히랜디 | Plan | BOSS만 표시, 상세 예고는 긴장감 죽임 |
| H | 킬 스트릭: 1초 내 5킬 → 보너스 골드 +10G | VS | Pop | combat.ts 변수 1개 추가 |
| F | 잘못된 합성 시 "분해?" 팝업 → 골드 일부 환급 | 히랜디 | Grind | 레시피 없는 조합 차단 → 분해 선택지로 교체 |
| D | 티어별 킬 카운터 + 보너스 골드 (2티어 50킬 → +30G) | 히랜디 | Grind | 단순 HUD 1줄 |
| E | 보스 10초 이내 처치 → 보상 카드 +1장 | 운빨존많겜 | Grind+Pop | 첫 보스는 타임 보너스 없이 |

### 🟢 3순위 — 중기 (친구 피드백 반영 후)

| # | 기능 | 출처 | 박자 | 비고 |
|---|---|---|---|---|
| I | 소환 1회 리롤 (골드 5G) | 히랜디 | Plan | 너무 싸면 랜덤 묘미 소멸 |
| L | 합성 레시피 북 버튼 (전체 트리 상시 열람) | 히랜디 | Plan | 4티어까지 생긴 지금 필요성 증가, 탭 시 일시정지 |
| J | 전방/후방 배치 존 분리 | 히랜디 | Plan | 360px에서 구역 색만, 드래그 자유도 유지 |
| K | 골드 갬블 버튼 | 운빨존많겜 | Grind | 위험도 높음 — 검증 후 도입 |

### ⚪ 장기 (7월 이후)

| # | 기능 | 출처 | 박자 | 비고 |
|---|---|---|---|---|
| M | 스테이지별 필드 기믹 (Stage 2 = 트랙 2줄 분기 등) | Legion TD | Plan+Loop | 스테이지 시스템 확장과 묶어서 |
| N | 오버클록 진입 시 BGM 전환 | VS | Loop | 사운드 에셋 도입 후 1순위 |
| O | 유닛 공격 누적 → 레벨업 (dmg +20%) | Merge Mansion | Grind | UnitData 구조 변경 필요 |

---

## 🗓️ 마일스톤

### 🎯 5월 마일스톤 (2026-05-31): 친구 클로즈 테스트
**"폴리시보다 피드백. 일단 친구들 손에 쥐여주기."** Firebase Hosting 웹 URL 배포.

**작업 순서:** GameState 분리 → 리팩토링 → 게임 내실 다지기 → 튜토리얼 → DEV값 원복 → 풀플레이 → 배포 → 사전 → 본격

**진행 상황:**
- [x] **[0] GameState.ts 분리** — 456줄 → 390줄 + `unitHelpers.ts`(34줄) + `combat.ts`(56줄)
- [x] **[1] 리팩토링 8/8** — GameScene 747→140줄, 매니저 7개 분리
- [x] **[2] 게임 내실 다지기** (game-designer B/C 적용, A 철회)
  - [x] **B**: 골드 +2/sec 자동회복
  - [x] **C**: `MINUTE_HP_MULT` 1.5→1.25, 3티어 dmg ×2 (Dino 30 / Wizard 6 / Griffin 2)
  - [x] **A 철회**: 랜덤 묘미 유지 (사용자 결정)
- [x] **[3] 튜토리얼 + 보너스 UX** (시작 오버레이, 드래그 시에만 사거리원, 탭→레시피 팝업, 더블탭→잠금)
- [x] **추가**: TitleScene / StageSelectScene / Scene 루프 / 가변 트랙
- [x] **[4] DEV값 → 출시값** (`VICTORY_TIME_MS` 420000=7분 / `ENEMY_SPAWN_INTERVAL_MS` 5000) + 소환 비용 상한 30G (`SUMMON_MAX_COST`)
- [ ] **[5] 7분 풀플레이** → 미친 수치 1~2개 즉시 조정
- [ ] **[6] Firebase Hosting 배포** + 공유 URL
- [ ] **[7] 사전 테스트** (본인 폰 + 친구 1명) → 치명 버그 픽스
- [ ] **[8] 친구 본격 공유** (2~5명, 피드백 수집)

### 🎯 6월 마일스톤: 폴리시
친구 피드백 반영 후. 후보: 시각 폴리시(파티클·데미지숫자·카메라셰이크), 최고기록 localStorage, 실제 폰 호환 테스트, 5월 피드백 기반 밸런싱.

### 🎯 7~8월 마일스톤: 출시 준비
재미 검증 후. 후보: 사운드/음악, 메인 메뉴+설정, 메타프로그레션 트리, 스테이지 시스템 확장, 콘텐츠 확장.

### 🎯 이후: 모바일 패키징 (Capacitor)
Android 먼저 → iOS. 스토어 메타 (아이콘/스플래시/권한/스크린샷). 수익 모델 결정 후 IAP/광고.

---

## 📐 디자인 의뢰 가이드 (메모)

> 친구/외주 AI에게 캐릭터 작업 맡길 때 참조. 상세 의뢰서는 `designer` 에이전트에 요청.

**캐릭터 원본 사양:**
- 1024×1024 PNG, **투명 배경 필수**, 정사각형
- 정면 + 중앙 + 가장자리 100~150px 여백
- 인게임 표시 64~96px 기준 → 다운스케일

**스토어/UI 자산:**
- 앱 아이콘: 1024×1024 (iOS), 512×512 (Play)
- 스플래시/타이틀 일러스트: 2048×2048 이상
- Play 피처 그래픽: 1024×500

**스타일 룰 (5개):**
1. 일관된 프롬프트 템플릿 + 동일 아티스트 reference
2. 투명 배경 (PNG alpha)
3. 정면/중앙/여백 100~150px
4. 종족별 메인 컬러 통일 (아래 색상 가이드)
5. 파일명 규칙: `unit_<race>_tier<N>.png`, `enemy_<type>.png`

**색상 가이드:**
| 종족 | 색 |
|---|---|
| Human | #4488ff (파랑) |
| Beast | #44cc44 (초록) |
| Robot | #aa44cc (보라) |
| Human_Robot | #00eeff (청록) |
| Human_Beast | #ff44aa (핑크) |
| Beast_Robot | #ff7700 (주황) |
| Cyborg_Wizard | #ffcc00 (노랑) |
| Dino_Mecha | #ff4400 (빨강) |
| Griffin | #00ffaa (민트) |

**최소 분량:** 유닛 9종 + 적 3종 = 12장. 추후 보스 + TANK 적 추가.

**워크플로우 권장:** 러프 1장 → 스타일 OK → 12장 풀세트 (스타일 안 맞으면 다시).

**아직 미결정 (사용자 결정 필요):**
- 톤: chibi / realistic / pixel / flat color
- 분위기: 다크 / 컬러풀 / 사이파이 / 판타지
- 세계관 1줄

---

## ⚠️ DEV 단축값 (출시 전 원복 필요)

빠른 반복을 위한 임시값. **출시 전 [4] 단계에서 원복.**

| 상수 | 현재 (DEV) | 출시 목표 |
|---|---|---|
| `VICTORY_TIME_MS` | 120000 (2분) | **420000 (7분)** |
| `ENEMY_SPAWN_INTERVAL_MS` | 2500 | **5000** |

## 🔍 game-designer 진단 이력 (참고)

2026-05-21 분석. 7분 풀플레이 시 박자별 강도: **Plan 망가짐 / Grind 중간 / Pop 약함 / Loop 약함**.

처방:
- **B (Grind 회복)** → 골드 자동회복 +2/sec ✅ 적용
- **C (Pop 회복)** → HP 1.5→1.25, 3티어 dmg ×2 ✅ 적용
- **A (Plan 도입)** → 종족 선택 소환 ❌ 철회 (랜덤 묘미 유지). 부분 보완: 레시피 팝업

나중에 고려: 최고기록 localStorage.
구현 완료: TANK 적 추가 (HP20/속도25/회색24px, 3분 이후 15% 확률, 처치 12G), 3티어/4티어 합성 완성 연출 (노랑 플래시 + 텍스트).

## 🏗️ 리팩토링
씬 레이어 완료 (1~8/8). GameScene 747줄 → 140줄 오케스트레이터 + 매니저 7개 분리. 데이터/Phaser 분리 원칙 유지.

**다음 라운드 (진행 중):** `GameState.ts` 456줄 분리 — 상단 "🚨 최우선 다음 작업" 섹션 참조.

## 실행 / 검증
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite, 출시 전 통과 필수
```

UI/게임플레이 검증은 사용자가 IDX 미리보기로 직접 (CLAUDE.md §6 — 헤드리스 검증 금지).

## 코딩 규칙
요약: **Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven / PROGRESS.md 동기 갱신 / 검증은 사용자가**. 상세는 `CLAUDE.md` 참조.
