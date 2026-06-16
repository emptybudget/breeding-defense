# breeding-defense — AI 핸드오프 컨텍스트

> 다른 AI와 협업 시 이 문서를 컨텍스트로 전달.
> 마지막 갱신: 2026-06-16 (GD1 컷인 + GD2 브리핑 + GD3 미니보스 보상 완료. 다음: GD4~GD6(P3, 출시 직후) / G5 재논의)

## ⚠️ 임시 디버그 코드 (프리징 원인 확정 후 제거)

- `main.ts`에 런타임 에러 화면 표시 오버레이(`#fatal-error`) 삽입됨 — 인게임 프리징(보스 처치 시점 의심) 원인 추적용. 프리징 재발 없으면 제거.
- `scripts/sim-freeze.ts` — 순수 데이터 레이어 3분 시뮬레이션 (프리징 진단용, 순수 레이어 무죄 확인 완료). 함께 제거 가능.

## 🚨 다음 작업

### 🥇 P0 — 게임 디자인 신규 과제 (2026-06-12 확정, 투입 순서대로)

> HRD(히어로즈 랜덤 디펜스)·뱀파이어 서바이벌 벤치마킹. game-designer 분석 + 사용자 승인 완료.
> **G1·G2는 풀플레이 측정 무영향 → 즉시 투입. G4·G5는 밸런스 영향 → 풀플레이 검증 게이트 측정 후.**

| # | 항목 | 내용 | 난이도 | 시점 |
|---|---|---|---|---|
| G1 | ✅ **적 한계 게이지 바** (HRD) | HudRenderer 상단 적 카운트 아래 80px 채움 바(높이 4px). 60%→노랑 / 80%→빨강(danger 테두리와 동일 임계). `MAX_ENEMIES` 50→40 + danger `*0.8` 연동 포함 | 소 | **완료 (2026-06-12)** |
| G2 | ✅ **잭팟 소환** (HRD) — **💎 메타 상점 해금** | META_UPGRADES `jackpotSummon`(💎2, maxLevel 1). 해금 후 `summon()` 4%(`JACKPOT_TIER2_PROB`)로 2티어 12종 랜덤 등장 + 축소 연출(플래시+셰이크 80ms+🎰 텍스트). `GameState.jackpotEnabled`는 GameScene이 W1 제외 조건으로 설정 | 소~중 | **완료 (2026-06-12)** |
| G3 | ✅ **유닛 도감 + 마일스톤** (HRD/VS) | `MetaProgress.discovered`/`claimedMilestones` — `GameState.pendingDiscoveries`를 GameScene update가 드레인 → `discover()`. 레시피북 헤더 도감 N/25, 미제작 결과 유닛 회색+❓. 마일스톤 10종=💎1 / 18종=💎2 / 25종=💎3 (`DISCOVERY_MILESTONES`, 묶음 한정) | 중 | **완료 (2026-06-12)** |
| G4 | ✅ **스크립트 웨이브 타임라인** (VS) | `WorldStageConfig.scriptedWaves?: {atMs, type, count}[]` (config.ts). W2~W3 10개 스테이지 각 1개씩 등록 (W1 제외). `GameState.tick()`이 5초 전 `pendingScriptedWaveAlert`(보스 예고 텔레그래프 재사용) → 도달 시 `pendingScriptedWave`에 `count=min(설정, MAX_ENEMIES-enemyCount-10)` 안전 마진 적용 후 세팅. `EnemyRenderer.spawnScriptedWave()`가 `spawnEnemy(forcedType)` 재사용해 일괄 스폰 | 중 | **완료 (2026-06-16)** |
| G5 | **라스트 스탠드 피날레** (VS) | `victoryTimeMs-60s`에 "FINAL WAVE" 배너 + 스폰 간격 ×0.6 (5분 surge와 동일 tick 플래그 패턴). **HP/속도 추가 금지 — 밀도만** (surge와 중첩 방지) | 소 | **보류 — 7분 도달률 미측정, 체감상 문제 생기면 재논의** |

### 풀플레이 검증 게이트 — ✅ 측정 완료 (2026-06-16, W2-5)

| 지표 | 목표값 | 실측 | 판정 |
|---|---|---|---|
| 4티어 완성 평균 시점 | 4:00~5:00 | **4~5분** | ✅ 목표 충족, U7 조정 불필요 |
| Phase C 보스 처치 시간 | 3~5초 | 페이즈 구분 체감 안 됨 (사용자 보고) | ⚠️ 측정 불가 — 아래 신규 후보 참고 |
| 강화 점 사용 패턴 | 1티어 3/5, 2티어 2/3 | 미보고 | — |
| 7분 도달률 | 50~70% | 별도 측정 안 함, 현행 유지 결정 | ✅ 현행 유지 (변경 없음) |

**종합:** 난이도 나쁘지 않음. 4티어 1개로 끝까지 살짝 부족한 느낌이 "낫배드"로 평가됨 — 의도된 긴장감으로 판단, 추가 난이도 조정 보류.
**게이트 결론:** G4 투입 가능. G5(난이도 보강)는 7분 도달률 미측정으로 보류 — 도달률이 체감상 문제되면 재논의.
**보스 페이즈 전환 피드백 부족** — 사용자 보고: 페이즈 구분이 체감 안 됨. → **GD1(보스 페이즈 전환 컷인) 완료 (2026-06-16)** (아래 출시 폴리시 후보 참조).

### 남은 후보 (우선순위)

| 박자 | # | 항목 | 비고 |
|---|---|---|---|
| Plan/Grind | R | ✅ **보상 카드 풀 교체** — `DOUBLE_ATK_PROB_INC` 0.02→0.05 / `CRIT_PROB_INC` 0.10→0.07 / `TWIN_PROB_INC` 0.02→0.05 / gem 카드→💀 강화점+1 카드(`RewardType` 'gem'→'enhance'). 카드 라벨 % 상수 연동 | **완료 (2026-06-12)** |
| — | W1 | ✅ **config.ts** — `WORLD_CONFIGS` 15스테이지 / `StageFeatures` / `FIVE_MIN_SURGE_MULT` / `DEV_UNLOCK_ALL_WORLDS` 추가 완료 | **완료** |
| — | W2 | ✅ **types.ts** — config.ts에서 이미 export, scene 레이어에서 직접 import 가능 확인 | **완료** |
| — | W3 | ✅ **GameState.ts** — `WorldStageConfig` 수신, `features` 저장, `fiveMinSurgeApplied`+`pendingSurge`+`_surgeMult`, `victoryTimeMs` 교체, `STAGE_CONFIGS` 의존 제거, `maxBossPhase===0` 시 보스 스폰 억제 | **완료** |
| — | W4 | ✅ **StageSelectScene.ts** — 월드 탭(W1/W2/W3) + 스테이지 5개 그리드. `DEV_UNLOCK_ALL_WORLDS` 기반 잠금. `{world, stage}` 전달 | **완료** |
| — | W5 | ✅ **GameScene.ts** — `features` 기반 UI 조건부 표시(recipe/soulShop/sell/breed/synthesize/lock). W1 튜토리얼 힌트 텍스트. surge 처리. 기록 키 `world*10+stage` | **완료** |
| Grind | V | ✅ **5분 이후 적 강화** — W3 작업에서 이미 구현 확인 (2026-06-12). `FIVE_MIN_SURGE_MULT=1.5`, `tick()` 1회 발동, `enemyRenderer.applySurge()`로 기존 적 포함 적용, 월드 2·3 전용 | **완료** |
| Art | ART | **이모지 폴백 제거** — NovelAI 확정에 따라 `CHARACTER_ASSETS` 미등록 유닛의 이모지 렌더 경로 제거. T3·T4 스프라이트 생성 후 적용 | P2 — T3 스프라이트 확보 선행 |
| Grind | U7 | 분당 곱 1.25→1.35 (Phase C 너무 쉬우면) | 풀플레이 후 결정 |
| Pop | U4 | 2티어 기믹 가시성 패스 — 지뢰 8→12px·폭발 30→50px+셰이크 80ms / 체인 두께 1→2px·표시 80→160ms / 넉백 100ms tween+잔상 / 스플래시 반경원 0.2s 표시 / 오라 수혜자 화살표 0.5s 점멸 | P2 — 신규 이펙트 6개/frame 상한, 적 35+ 시 강도 50% 감쇠 |
| Grind | D | 티어별 킬 카운터 + 보너스 골드 | P2 — HUD 1줄 |
| Plan | I | 소환 1회 리롤 (골드 5G) | P3 — 너무 싸면 랜덤 묘미 소멸 |
| Plan | J | 전방/후방 배치 존 분리 | P3 — 360px에서 구역 색만 |
| Pop | U11 | Astral_God 보이스 SFX (BGM/SFX는 구현됨) | P3 — 6월 사운드 폴리시 |
| Plan/Loop | M | 스테이지별 필드 기믹 (Stage 2 트랙 분기 등) | 장기 |
| Grind | O | 유닛 공격 누적 → 레벨업 (dmg +20%) | 장기 — UnitData 구조 변경 필요 |

### 🎀 출시 폴리시 후보 — 게임 디자인 (2026-06-16, game-designer 분석 + 사용자 승인)

> 출시 "재미 끌어올리기" 10개 분석 중 **채택 7개**. 제외 3개: 오버킬 연쇄 / 4티어 각성 궁극기 / 합성 미리보기 고스트.
> 기존 후보 B(위협 브리핑)·K(골드 갬블)는 여기로 통합. **우선순위별 정렬 — GD1·GD2부터 즉시 투입.**

#### 🥇 P1 — 출시 전 즉시 (난이도 하 · 밸런스 무영향 · 사용자 보고 약점 직격)

| # | 박자 | 항목 | 내용 | 난이도 |
|---|---|---|---|---|
| GD1 | Pop/Plan | ✅ **보스 페이즈 전환 컷인** | Phase B/C 경계(`BOSS_PHASE_B/C_START_MS`) 시간 도달 시 `GameState.tick()`이 `pendingPhaseTransition`(2/3) 세팅 → GameScene이 드레인. 0.4s 시뮬레이션 프리즈(`phaseFreezeUntilMs`로 `scaledDelta=0`, 입력 핸들러 무영향) + 색 플래시(보라/검) + "PHASE 2/3" 배너(1.2s). 스테이지 `maxBossPhase` 도달 시에만 발동. 적 30+ 시 프리즈·셰이크 생략(배너만) | **완료 (2026-06-16)** |
| GD2 | Plan | ✅ **스테이지 위협 브리핑** (구 B) | StageSelect 스테이지 **탭 → 브리핑 확인 패널**(2단계, 즉시출격 폐지). `buildThreatBriefing(cfg)`가 `WORLD_CONFIGS`에서 적 구성 최대 3줄 생성: `🐝 고속형 N%` / `🐢 탱크 M:SS부터 N%`(tankRatio>0 시) / `👹 N페이즈·💀엘리트·🔥5분강화·🌊러시`(없으면 입문). **적 행동 서술만, 유닛 추천 X**. 패널 `[출격]`→`launchStage` / `[닫기]`·바깥탭→`closeBriefing` | **완료 (2026-06-16)** |

#### 🥈 P2 — 출시 전 (밸런스 영향 → 풀플레이 검증 게이트 후)

| # | 박자 | 항목 | 내용 | 난이도 |
|---|---|---|---|---|
| GD3 | Pop/Plan | ✅ **미니 보스(엘리트 웨이브) 보상** | **엘리트 스테이지(`eliteIntervalMs!==null`)** 한정, `MINIBOSS_TIMES_MS`=1:30·3:30 고정 2회. `GameState.tick()`이 `minibossTimes` lazy-init(웨이브 충돌 보정 포함) → `pendingMinibossSpawn` → GameScene `spawnMiniboss()`(엘리트 32px+금빛 틴트). 처치 시 `pendingMinibossReward` → `generateMinibossRewards()` 축소 풀(💰+60·쌍둥이·더블·치명타, **enhance/maxUnits/damage 제외, 보스 풀 분리**) 2장 중 1택, 보석 확장 X. **G4 충돌 가드:** 웨이브 atMs와 ±6s 이내면 미니보스를 웨이브+7s로 미룸(W3-3/4/5 1:30 충돌 해소). 신규 `RewardType:'goldSmall'`(`MINIBOSS_GOLD_AMOUNT`=60) | **완료 (2026-06-16)** |

#### 🥉 P3 — 출시 직후 첫 패치 (리텐션/Loop, 데이터 보고 튜닝)

| # | 박자 | 항목 | 내용 | 난이도 |
|---|---|---|---|---|
| GD4 | Loop | **일일 도전 스테이지** | 하루 1개 날짜 시드 변형(탱크 러시/고속전/골드 절반). 클리어 시 💎1(1회). `MetaProgress.lastDailyClearedDate`. **미클리어 누적·패널티 금지**(피로 방지). `WorldStageConfig` 래퍼로 변형 생성, 신규 엔진 없음. D1/D7 리텐션 | 중 |
| GD5 | Loop/Grind | **누적 도전 과제** | "탱크 100처치 / 보스 10격파 / 4티어 5완성" 등 **5~8개**. 달성 시 💎(1회, 반복농사 차단). `registerKill`·`unitDamageMap` 카운팅 재사용 + `MetaProgress` 누적 카운터. 도감(G3) UI 재사용. 자연 플레이 1~2주 달성 수치 | 중 |
| GD6 | Loop | **빌드 결과 카드** | Victory/GameOver에 "이번 판 요약"(최종 빌드 아이콘 줄 + 총킬 + 최고콤보 + Top3 DPS) + 1탭 공유. `getTopDamageDealers` 재사용. 공유는 Capacitor 후 OS API — 출시 전엔 캡처 화면만. 정보 4개 상한. 바이럴 훅 | 하~중 |

#### ⚠️ P3 — 검증 후 (위험도 높음, EV 음수 필수)

| # | 박자 | 항목 | 내용 | 난이도 |
|---|---|---|---|---|
| GD7 | Grind | **골드 갬블 버튼 — 💎2 메타 해금** (구 K) | `META_UPGRADES.goldGamble`(💎2, maxLevel 1) — **메타 해금형 확정**(G2 잭팟 패턴 복붙, 신규 노출 차단). 🎰 50G 베팅 → **잭팟10%×3(150G) / 더블25%×2(100G) / 본전20%×1(50G) / 꽝45%×0** = EV −5G(−10%). 즉시소환 제거 → 결과를 골드로 통일(슬롯 충돌 제거). 가드레일: 1판 3회 캡(`GAMBLE_MAX_PER_GAME=3`) + 5분 후 등장(`GAMBLE_UNLOCK_MS=300000`, `fiveMinSurgeApplied` 타이밍) + W1 봉인 + gold≥50 게이트 + 베팅 즉시 차감. 잭팟 연출 G2 재사용. 꽝은 0.4s 가벼운 흔들림만. **`EV<0` 단위테스트 권장** | 소~중 |

---

## 🗺️ 월드·스테이지 설계 (확정)

### 월드 1 — 튜토리얼 (UI 잠금 해제 순서)

| 스테이지 | 제한시간 | 새로 해금되는 UI | 적 구성 | 보스 |
|---|---|---|---|---|
| W1-1 | 2분 | 소환만 | NORMAL 100% | 없음 |
| W1-2 | 2분 | 교배 버튼 | NORMAL 100% | 없음 |
| W1-3 | 3분 | 합성·판매존 | NORMAL 80% / FAST 20% | 없음 |
| W1-4 | 3분 | 잠금(더블탭)·영혼상점 | NORMAL 60% / FAST 30% / TANK 10% | Phase A |
| W1-5 | 4분 | 레시피북·메타업그레이드 전부 | NORMAL 50% / FAST 35% / TANK 15% | Phase A·B |

- 숨겨진 버튼/존은 완전히 안 보임 (disabled가 아니라 invisible)
- 5분 강화 미적용 (어차피 최장 4분)

### 월드 2 — 본게임 (현행 Stage 1·2 기반)

| 스테이지 | 제한시간 | 적 구성 | 특이사항 |
|---|---|---|---|
| W2-1 | 7분 | NORMAL 70% / FAST 30% | Stage 1 현행과 동일 |
| W2-2 | 7분 | NORMAL 60% / FAST 40% | spawnInterval 단축 |
| W2-3 | 7분 | NORMAL 55% / FAST 30% / TANK 15% | Stage 2 현행과 동일 |
| W2-4 | 7분 | NORMAL 50% / FAST 25% / TANK 25% | TANK 비율 상승 |
| W2-5 | 7분 | NORMAL 45% / FAST 30% / TANK 25% | ELITE 등장, 보스HP×1.5 |

### 월드 3 — 하드 (현행 Stage 3 기반)

| 스테이지 | 제한시간 | 적 구성 | 특이사항 |
|---|---|---|---|
| W3-1 | 7분 | NORMAL 40% / FAST 35% / TANK 25% | Stage 3 현행과 동일 |
| W3-2 | 7분 | NORMAL 35% / FAST 35% / TANK 30% | spawnInterval 단축 |
| W3-3 | 7분 | NORMAL 30% / FAST 30% / TANK 40% | TANK 고밀도 |
| W3-4 | 7분 | NORMAL 25% / FAST 40% / TANK 35% | ELITE 45s→30s |
| W3-5 | 7분 | NORMAL 20% / FAST 40% / TANK 40% | 보스HP×1.5 + 5분 강화 ×2.0 |

### 잠금 정책

- 개발 중: `DEV_UNLOCK_ALL_WORLDS = true` → 전부 선택 가능
- 출시: W1 5스테이지 전부 클리어 → W2 해금 / W2 전부 클리어 → W3 해금

### 5분 강화 (`FIVE_MIN_SURGE_MULT`)

- 월드 2·3에만 적용
- 300,000ms 경과 시 적 HP·Speed에 `×1.5` 1회 즉시 적용 (`fiveMinSurgeApplied` 플래그로 중복 방지)
- `GameState.tick()` 내부 처리

### 구현 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `src/game/config.ts` | `STAGE_CONFIGS` → `WORLD_CONFIGS[world][stage]` 재구성. `FIVE_MIN_SURGE_MULT`, `DEV_UNLOCK_ALL_WORLDS` 추가 |
| `src/game/types.ts` | `StageFeatures` 타입(summon/breed/synthesize/sell/lock/soulShop/recipe/meta). `WorldStageConfig` 타입 |
| `src/game/GameState.ts` | 생성자에 `features: StageFeatures` 수신. `fiveMinSurgeApplied` 플래그. `tick()`에 surge 로직 |
| `src/scenes/StageSelectScene.ts` | 월드 탭(W1/W2/W3) + 스테이지 5개 그리드. 잠금 표시(🔒) |
| `src/scenes/GameScene.ts` | `features` 기반 UI 조건부 표시 (summonBtn, breedBtn, sellZone, soulShopBtn, recipeBtn 등) |

---

## 🎮 코어 판타지 (게임의 DNA)

**"스테이지를 보고 빌드를 짜고, 고생해서 고티어를 완성하면, 한 방에 쓸어버리는 쾌감"**

4박자 사이클:
1. **🧭 Plan** — 스테이지의 적 보고 빌드 결정
2. **😤 Grind** — 운 + 합성 + 자원 압박 사이 분투
3. **💥 Pop** — 고티어 완성 → 적 싹쓸이 카타르시스
4. **🔄 Loop** — 다음 스테이지 → 새 적 → 새 빌드

**참고 게임:** 히어로즈 랜덤 디펜스(메인) / 운빨존많겜 / Vampire Survivors
**한 판 길이:** 7분 (출퇴근 한 사이클)
**모델:** PvE 메인 / 엔드콘텐츠 = 점수 경쟁(추후)

### 시스템 결정

| 시스템 | 결정 |
|---|---|
| 골드 공급 | 적 처치 + 매초 +2G 자동회복 |
| 종족 선택 소환 | 철회 — 랜덤 묘미 유지 |
| 시너지 | 메뉴 영구 업그레이드로 해금 |
| 메타프로그레션 | 영구 강화 4종 + 보석 화폐 (Phase F 완료) |
| 스테이지 | 월드 1/2/3 × 5스테이지(총 15). **월드 1 = 튜토리얼 전용** (짧은 제한시간 + UI 잠금 해제 순서). 현행 Stage 1/2/3은 월드 2·3으로 재배치. 월드 2·3 잠금: 출시=W1 클리어 후 해금, 현재 개발=전부 선택 가능(`DEV_UNLOCK_ALL_WORLDS=true`). 5분 강화(`FIVE_MIN_SURGE_MULT`)는 월드 2·3에만 적용 |
| 아트 방향 | **NovelAI 확정** — 이모지 폴백 단계적 제거. T3·T4 스프라이트 생성 후 `CHARACTER_ASSETS` 완전 등록 |
| 고티어 선택권 | 부분 — 레시피 팝업으로 "어떤 조합이 뭐 되나" 공개 |

### 미결정

- [ ] 메타프로그레션 2차 트리 (시너지 해금 / 스타터 유닛 선택)
- [ ] 시너지 카탈로그 5~10개
- [ ] 수익 모델 (F2P 광고 / IAP / 프리미엄)

---

## 🏗️ 기술 스택 / 아키텍처

- **Vite 5** + **TypeScript 5** (strict) + **Phaser 3.80**
- 추후 **Capacitor**로 Android/iOS 패키징
- 개발: Firebase Studio (구 IDX) + 웹 Claude Code

**아키텍처 규칙 (중요):**
**데이터 레이어와 Phaser 레이어 분리.** `src/game/*`는 Phaser 의존 0(순수 TS, 모든 상태/규칙). `src/scenes/*`는 그래픽/입력만.

### 파일 구조

```
breeding-defense/
├── CLAUDE.md                # 코딩 가이드라인 (세션 시작 자동 로드)
├── PROGRESS.md              # 이 문서
├── docs/
│   └── design-prompts.md    # NovelAI 의뢰서 (분리됨 — 토큰 절약)
├── .claude/agents/          # brainstormer, game-designer, designer, refactor-expert
├── public/assets/characters/ # 캐릭터 스프라이트 (unit_<race>_tier<N>.png, 256px 투명 PNG)
├── index.html
└── src/
    ├── main.ts              # Phaser.Game 부트
    ├── game/                # 🧠 순수 데이터 (Phaser 의존 0)
    │   ├── config.ts        # 모든 상수
    │   ├── types.ts         # Race, UnitData 등
    │   ├── GameState.ts     # phase / 타이머 / 경제 / 유닛 / 전투
    │   ├── combat.ts        # 공격 처리
    │   ├── unitHelpers.ts   # 레시피/스탯 헬퍼
    │   └── MetaProgress.ts  # localStorage 메타 + 스테이지 기록
    └── scenes/              # 🎨 Phaser 레이어
        ├── TitleScene / StageSelectScene / GameScene
        ├── SoundManager.ts          # Web Audio API BGM + SFX
        ├── artnouveau.ts            # 아르누보 팔레트/드로잉 헬퍼
        ├── constants.ts             # RACE_COLORS, RACE_EMOJI, SELL_ZONE
        ├── render/
        │   ├── HudRenderer.ts
        │   ├── EnemyRenderer.ts
        │   ├── UnitRenderer.ts
        │   ├── PopupRenderer.ts     # 얇은 파사드 (89줄)
        │   ├── NotificationRenderer.ts
        │   └── popups/              # 팝업 종류별 분리 (2026-05-28)
        │       ├── TutorialPopup.ts
        │       ├── PausePopup.ts
        │       ├── RecipePopup.ts   # showRecipe + showRecipeBook
        │       ├── GameOverPopup.ts
        │       ├── VictoryPopup.ts
        │       ├── RewardPopup.ts
        │       ├── SoulShopPopup.ts
        │       └── shared.ts        # appendDpsMeter
        └── input/DragController.ts
```

---

## 📐 핵심 상수 (src/game/config.ts)

| 상수 | 값 | 설명 |
|---|---|---|
| `GAME_WIDTH` / `GAME_HEIGHT` | 360 / 640 | 캔버스 |
| `MOBILE_SAFE_ZONE_TOP` / `_BOTTOM` | 24 / 16 | 노치/홈바 여백 |
| `MAX_ENEMIES` | 40 | 초과 시 게임오버 (2026-06-12 50→40 하향) |
| `CLEAR_TIME_MS` | 600000 (10분) | 1차 클리어 (오버클록 진입) |
| ~~`ENEMY_SPAWN_INTERVAL_MS`~~ | 삭제 — STAGE_CONFIGS.spawnIntervalBase로 대체됨 | 레거시 상수 제거됨 |
| ~~`VICTORY_TIME_MS`~~ | 스테이지별 `victoryTimeMs`로 대체 (W1 2~4분 / W2·W3 7분) | 승리 조건 — 레거시 상수는 미사용 |
| `ENEMY_BASE_SPEED` / `ENEMY_BASE_HP` | 40 / 1 | 오버클록 기준 |
| `OVERCLOCK_HP_GROWTH` / `_SPEED_GROWTH` / `_SPAWN_DECAY` | 1.08 / 1.05 / 0.97 | 매초 |
| `MINUTE_HP_MULT` / `_SPEED_MULT` | 1.25 / 1.2 | 1분마다 누적 |
| `STARTING_GOLD` | 100 | 시작 골드 |
| `KILL_REWARD` / `BOSS_KILL_REWARD` | 5 / 50 | 처치 보상 |
| `GOLD_AUTO_RECOVERY_PER_SEC` | 2 | 골드 매초 회복 |
| `UNIT_CAP` | 5 | 초기 유닛 한도 (한도+1 업그레이드로 증가) |
| `SUMMON_BASE_COST` / `_INCREMENT` / `MAX_COST` | 10 / 2 / 30 | 첫 소환 / 누적 / 상한 |
| `BOSS_HP_MULT_PHASE_A/B/C` | 15 / 25 / 50 | 보스 3단 페이즈 |
| `BOSS_SPEED_MULT_PHASE_A/B/C` | 0.8 / 0.7 / 0.55 | 페이즈별 속도 |
| `BOSS_PHASE_B_START_MS` / `_C_START_MS` | 150000 / 270000 | 2:30 / 4:30 |
| `CRIT_DAMAGE_MULT` | 1.5 | 치명타 |
| `REWARD_GOLD_AMOUNT` | 150 | 보상 카드 골드 |
| `BREEDING_DURATION_MS` / `_EXHAUST_DURATION_MS` | 3000 / 3000 | 교배 / 탈진 |
| `SELL_GOLD_TIER1/2/3/4` | 10 / 30 / 60 / 150 | 판매 보상 |
| `META_STARS_PER_VICTORY` | — | 삭제 — 승리 시 보석 +1은 GameScene에서 직접 처리 |

> 3티어 dmg: Cyborg_Wizard 6 / Dino_Mecha 30 / Griffin 2 / Thunder_Hawk 5 / Berserk_Shaman 5 / Chaos_Artillery 3.
> 4티어 Astral_God: range260/dmg10/300ms/8타겟/보장크리티컬/체인4.

---

## 🧬 유닛 시스템 요약

### 1티어 6종

| 유닛 | 카테고리 | 이모지 | range | dmg | intervalMs |
|---|---|---|---|---|---|
| Warrior | Human | ⚔️ | 50 | 2 | 1000 |
| Archer | Human | 🏹 | 150 | 1 | 1200 |
| Dog | Beast | 🐶 | 80 | 1 | 600 |
| Squirrel | Beast | 🐿️ | 130 | 1 | 1000 |
| Android | Robot | 🦾 | 60 | 3 | 1500 |
| Cannon | Robot | 🚀 | 180 | 2 | 2000 |

### 교배 규칙

- **같은 카테고리(Human/Beast/Robot)** 이면 가능 (세부 종족 달라도 OK)
- 같은 세부 종족: 85% 동종 복사, 15% 돌연변이(같은 카테고리 내 다른 종)
- 다른 세부 종족: 50:50 확률
- 의사-랜덤: 최근 3개 중복 제외

### 2티어 (12종) — 카테고리 조합 합성

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
| ⚾ Gatling_Dog | Dog + Cannon | 스플래시 폭탄 (반경 40px 50%) |
| ⚡ Electric_Coon | Squirrel + Android | 체인 라이트닝 (최대 2마리) |
| 💔 Menhera_Squirrel | Squirrel + Cannon | 트랙 위 지뢰 매설 |

### 3티어 (6종) — 고정 레시피

| 3티어 | 재료 | 컨셉 |
|---|---|---|
| 🧙 Cyborg_Wizard | Cannon_Shooter + Acorn_Hunter | 기계+마법 마법사 |
| 🌋 Dino_Mecha | Gatling_Dog + Cyborg_Slasher | 메카 공룡 |
| 🦅 Griffin | Falcon_Eye + Bio_Wolf | 하늘+땅 맹수 |
| ⚡ Thunder_Hawk | Laser_Sniper + Electric_Coon | 연쇄 전격 저격수 |
| 🌿 Berserk_Shaman | Acorn_Girl + Blade_Hound | 전장 광란 버프 |
| 💥 Chaos_Artillery | Missile_Gunner + Menhera_Squirrel | 폭발물 포격수 |

### 4티어 — Astral_God 🌟

**레시피:** `Griffin` + `Thunder_Hawk` + `Cyborg_Wizard` (100px 이내 3-way 합성)
비용: 최소 tier-1 12개 → 군대 거의 전부 갈아넣는 궁극의 "Pop" 유닛.

---

## 🔌 GameState API (src/game/GameState.ts)

**상태:** `phase` ('playing'|'clear'|'overclock'|'gameover'|'victory'), `elapsedMs`, `enemyCount`, `gold`, `gems`, `units: UnitData[]`, `summonCost`, `maxUnits`, `populationUpgradeCost`, `pendingBossSpawn`, `criticalProbability`, `isInfiniteMode`, `pendingNotification`, `trackWaypoints`, `unitZone`, `unitDamageMap: Map<number,{race,total}>`, `adReviveUsed`, `pendingCritHaptic`

**메서드:** `tick(deltaMs)`, `enterOverclock()`, `registerSpawn()`, `registerKill(reward)`, `summon()`, `upgradePopulation()`, `moveUnit(id,x,y)`, `sellUnit(id)`, `toggleLock(id)`, `useGemContinue()`, `startBreeding()`, `completeBreeding()`, `synthesize()`, `processCombat(snapshots)`, `generateRewards(count)`, `applyReward(type)`, `useAdRevive()`, `getTopDamageDealers(n)`, `serialize()`, `deserialize(_data)`

**게터:** `currentSpawnIntervalMs`, `currentEnemyHp`, `currentEnemySpeed`, `formatTimer()`

### 타입 (src/game/types.ts)

- `Race`: Human | Beast | Robot
- `HybridRace`: 12종 (2티어)
- `Tier3Race`: 6종
- `Tier4Race`: Astral_God
- `UnitRace`: Tier1Race | HybridRace | Tier3Race | Tier4Race
- `EnemyType`: NORMAL | FAST | TANK
- `RewardType`: enhance | gold | damage | maxUnits | twinProb | doubleAtk | crit
- `UnitData`: id, race, tier(1|2|3|4), x, y, lastAttackedAtMs, isBreeding, breedingEndMs, isExhausted, exhaustEndMs, isLocked
- `AttackEvent`: srcRace?, srcId?

---

## ✅ 완료 이력 (압축 요약)

> 상세 history는 `git log`. 아래는 "이미 구현됨"을 빠르게 확인하기 위한 인벤토리.

- ✅ 스폰 주기 단축 (S1: 6500→5500 / S2: 5200→4400 / S3: 4000→3500ms)
- ✅ ELITE 적 💀 추가 — 45초 고정 타이머, 1:30 해금, HP=보스Phase A×0.3, 처치 +20G, 보라 HP바

### 게임 시스템

- ✅ Phase A~F 4티어 시스템 (1티어 6종 / 2티어 12종 / 3티어 6종 / 4티어 Astral_God) + 메타프로그레션
- ✅ 카테고리 교배(돌연변이 15%) + 합성 + 판매(🗑️) + 잠금(더블탭 🔒)
- ✅ 보스 3단 페이즈 (A:×15/B:×25/C:×50 + 속도 차등 + 보상 차등)
- ✅ 티어 강화 시스템 (보스처치 💀 영혼 +1 / 1티어 5회 / 2티어 3회)
- ✅ 영혼 상점 (HUD Row2 — 강화·유닛 직접 구매 2섹션)
- ✅ 적 종류: NORMAL 👾 / FAST 🐝 / TANK 🐢 / BOSS 👺
- ✅ 스테이지 1/2/3 (스테이지별 적 비율/보스 HP 차등)
- ✅ 무한 모드 (오버클록 매초 기하급수)
- ✅ 메타프로그레션: 영구 강화 4종 + 💎 보석 화폐 + 게임 2배속(💎3) + 잭팟 소환(💎2)
- ✅ 잭팟 소환 (2026-06-12) — 메타 해금 후 소환 4% 2티어 직접 등장, W1 제외 (`JACKPOT_TIER2_PROB`)
- ✅ 유닛 도감 + 마일스톤 (2026-06-12) — 첫 제작 25종 기록(`MetaProgress.discovered`), 레시피북 미제작 회색+❓, 10/18/25종 💎1/2/3

### 경제

- ✅ 시작 100G + 매초 +2G + 처치 +5G(보스 +50G)
- ✅ 소환 비용 10G+2 누적, 상한 30G
- ✅ 한도+1 업그레이드 50G+10G
- ✅ 💎 이어하기 1소모 + 적 전멸
- ✅ 보스 처치 보상 카드 (2~3장, 💎로 3장 확장)
- ✅ 보상 카드 풀 교체 (2026-06-12) — 크리 증분 10%→7%, 쌍둥이/더블어택 증분 2%→5%, 💎 카드 → 💀 강화점+1

### UX/시각

- ✅ T1 캐릭터 스프라이트 6종 인게임 적용 (2026-06-11) — `public/assets/characters/unit_<race>_tier1.png` (raw는 `docs/tier1.zip`, 흰배경 제거+크롭+256px 후처리). `CHARACTER_ASSETS`(constants.ts)에 등록된 유닛만 이미지, 나머지는 이모지 폴백. 표시 크기 `UNIT_SPRITE_SIZE` (T1 40px~T4 62px). 다운스케일 선명도: main.ts `mipmapFilter: LINEAR_MIPMAP_LINEAR`
- ✅ T2 12종 + Archer T1 스프라이트 인게임 적용 (2026-06-12) — `docs/archor_tier2.zip` → 흰배경 BFS 제거+크롭+256px → `unit_<race>_tier2.png`. `CHARACTER_ASSETS`에 T2 12종 추가 등록. raw는 `docs/archor_tier2.zip` 보존.
- ✅ 공격모션 tween — 근접 lunge(slash) / 원거리 반동(line·beam·shell) / 마법·체인 pulse(magic·divine·chain) + 상시 idle bob ±2px. T2+는 더 큰 모션(slash +10px / recoil -6px / pulse ×1.22). T4 attack 2프레임 교차는 attack PNG 생성 후 추가 예정
- ✅ 아르누보 × 도트 UI 스타일 (`artnouveau.ts`)
- ✅ TitleScene → StageSelectScene → GameScene 루프
- ✅ 가변 트랙 (매판 ±10~20px 노이즈)
- ✅ 튜토리얼 오버레이 (시작 시)
- ✅ 레시피 북 버튼 📖 (HUD, 일시정지 + 전체 합성 트리)
- ✅ 유닛 탭 → 레시피 팝업
- ✅ 드래그 시 사거리 원, 합성 가능 유닛 청록 펄싱
- ✅ 데미지 숫자 플로팅, 크리티컬 오렌지 `!`
- ✅ ULTIMATE 연출(3티어) / ASTRAL GOD(4티어) — 0.3초 프리즈 + 플래시 + 셰이크
- ✅ 적 한계 80%↑ 화면 테두리 붉은 맥동 (`MAX_ENEMIES*0.8` 연동)
- ✅ 적 한계 게이지 바 (2026-06-12) — HUD 적 카운트 아래 4px 채움 바, 60% 노랑 / 80% 빨강
- ✅ 보스 5초 예고 (빨간 오라 + ⚠️5→1 카운트다운)
- ✅ Phase C 보스 처치 컷인 (💀 BOSS DOWN! + 셰이크 + 플래시)
- ✅ 보스 거대화 (Phase C 👑 48px + 이중 빨간 오라)
- ✅ 유닛별 공격 이펙트 8종 (slash/beam/shell/chain/magic/divine/arrow/기본)
- ✅ HUD 타이머 색 전환 (3분→노랑 / 1분→빨강)
- ✅ 합성 콤보 보너스 (30초 내 2연속 +15G, 3연속 +30G)
- ✅ 킬 스트릭 (1초 내 5킬 → +10G)
- ✅ 보스 속전속결 보너스 (S1:10s/S2:13s/S3:16s → 카드 +1)

### 사운드

- ✅ BGM (Web Audio API 앰비언트 드론 + Am 코드 루프 + LFO 트레몰로)
- ✅ SFX (처치/합성/교배/보스/오버클록/게임오버/승리)
- ✅ 소리 ON/OFF 토글 (일시정지 팝업 🔊/🔇)

### 모바일 출시 마스터 패치 (2026-05-28)

- ✅ 모바일 안전 영역 (TOP=24 / BOTTOM=16)
- ✅ 백그라운드 자동정지 (blur + visibilitychange)
- ✅ 스테이지 최고기록 저장 (localStorage `stageRecords`)
- ✅ 햅틱 피드백 (3티어/4티어/보스/FULL경고)
- ✅ 스테이지 인트로 + 보스 카메라 (페이드 + shake)
- ✅ DPS 미터 (Top3 🥇🥈🥉 — Pause/GameOver/Victory)
- ✅ 광고 부활 시스템 (GameOver 1회/판, 1.5초 시뮬레이션 후 적 전멸)
- ✅ 첫 적 5초 출현 + 게임 2배속 메타 + 인게임 1×/2× 토글

### 리팩토링 이력

- ✅ GameScene 747→140줄 (오케스트레이터 + 매니저 7개)
- ✅ GameState 456→390줄 + `unitHelpers.ts` + `combat.ts` 분리
- ✅ PopupRenderer 721→89줄 (얇은 파사드) + `popups/` 7파일 분리 (2026-05-28)

---

## 🎨 디자인 의뢰 가이드 (요약)

> 상세 NovelAI 프롬프트/시드/워크플로우는 **`docs/design-prompts.md`** 참조.
> T1·T2 복붙용 완성 프롬프트는 **`docs/novelai-prompt.md`** (2026-06-11 v2: T2 12종 실루엣 차별화 — 슬롯 4종 × 카테고리 + 서브컬러 매트릭스).

**결정:**
- 톤: B안 아르누보-Chibi 하이브리드 (명일방주/림버스 + 알폰스 무하)
- 생성: NovelAI v4 메인 + Midjourney 보조
- 무하 액센트 단계별: T1 절제 → T4 만개

**캐릭터 사양:**
- 1024×1024 PNG 투명 배경, 정면 + 중앙 + 100~150px 여백
- 인게임 64~96px 다운스케일
- 종족별 메인 컬러 통일

**색상 가이드 (요약):**
Human #4488ff / Beast #44cc44 / Robot #aa44cc / Human_Robot #00eeff / Human_Beast #ff44aa / Beast_Robot #ff7700 / Cyborg_Wizard #ffcc00 / Dino_Mecha #ff4400 / Griffin #00ffaa / Thunder_Hawk #aaff00 / Berserk_Shaman #9b30ff / Chaos_Artillery #ff9500+#3a3a3a

**최소 분량:** 유닛 25종 + 적 3종 + 보스. 워크플로우: Warrior anchor 1장 → Vibe Transfer로 양산.

---

## 🗓️ 마일스톤

| 시기 | 목표 |
|---|---|
| **5월 (2026-05-31)** | 친구 클로즈 테스트 — Firebase Hosting 웹 URL |
| **6월** | 폴리시 (시각 / 사운드 보이스 / 밸런싱) |
| **7~8월** | 출시 준비 (메인 메뉴+설정, 메타 트리 확장, 콘텐츠) |
| **이후** | Capacitor 모바일 패키징 (Android → iOS), 스토어 메타, 수익 모델 |

---

## 실행 / 검증

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite, 출시 전 통과 필수
```

UI/게임플레이 검증은 사용자가 IDX 미리보기로 직접 (`CLAUDE.md` §6 — 헤드리스 검증 금지).

## 코딩 규칙

요약: **Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven / PROGRESS.md 동기 갱신 / 검증은 사용자가**. 상세는 `CLAUDE.md`.
