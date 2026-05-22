# breeding-defense — AI 핸드오프 컨텍스트

> 다른 AI와 협업 시 이 문서를 컨텍스트로 전달하세요. 매 갱신마다 최신화됩니다.
> 마지막 갱신: 2026-05-21 (game-designer 7분 풀플레이 사전 진단 누적)

## 개요
- 모바일 세로 디펜스 게임 (시간 생존형, 360x640).
- 플레이어가 유닛 소환 → **[교배: 같은 종족, a+b → a,b,c 개체수↑]** **[합성: 다른 종족, b+d → e 1티어↑]** 으로 적 방어.
- 패배: 화면 적 50마리 초과. 1차 승리: 10:00 도달. 이후 **오버클록 모드**(능력치 매초 기하급수 증가) 무한 지속, 최종 생존시간이 기록.
- 적 처치 시 골드 획득, 골드로 1티어 기본 유닛 랜덤 소환.

## 기술 스택
- **Vite 5** + **TypeScript 5** (strict) + **Phaser 3.80**
- 추후 **Capacitor**로 Android/iOS 패키징 예정
- 개발 환경: 웹 브라우저 (Google Project IDX 등)

## 아키텍처 규칙 (중요)
**데이터 레이어와 Phaser 레이어 분리.** `src/game/*` 는 Phaser를 import하지 않는 순수 TS. 모든 상태/규칙은 여기. `src/scenes/*` 는 그래픽/입력만 담당.

## 현재 파일 구조
```
breeding-defense/
├── CLAUDE.md                # 코딩 가이드라인 (세션 시작 자동 로드)
├── PROGRESS.md              # 이 문서
├── index.html               # canvas mount (#game)
├── package.json             # phaser, vite, typescript
├── tsconfig.json            # strict + noUnused*
├── vite.config.ts           # host:true, port:5173
├── .gitignore
└── src/
    ├── main.ts              # Phaser.Game 부트 (Scale.FIT, CENTER_BOTH)
    ├── game/                # 🧠 순수 데이터 레이어
    │   ├── config.ts        # 상수 (경제 + 트랙 포함)
    │   ├── types.ts         # Race, UnitData 타입 정의
    │   └── GameState.ts     # phase / 타이머 / 경제 / 유닛 배열 / summon()
    └── scenes/              # 🎨 Phaser 레이어
        └── GameScene.ts     # HUD, 트랙, 적 스폰/이동, 유닛 렌더링, 소환 버튼
```

## 상수 (src/game/config.ts)
| 상수 | 값 | 설명 |
|---|---|---|
| `GAME_WIDTH` / `GAME_HEIGHT` | 360 / 640 | 캔버스 크기 |
| `MAX_ENEMIES` | 50 | 초과 시 게임 오버 |
| `CLEAR_TIME_MS` | 600000 (10분) | 1차 클리어 기준 |
| `ENEMY_SPAWN_INTERVAL_MS` | 5000 | 기본 스폰 주기 |
| `ENEMY_BASE_SPEED` | 40 px/sec | 오버클록 기준속도 |
| `ENEMY_BASE_HP` | 1 | 오버클록 기준 HP 배율 |
| `OVERCLOCK_HP_GROWTH` | 1.05 | 매초 +5% |
| `OVERCLOCK_SPEED_GROWTH` | 1.03 | 매초 +3% |
| `OVERCLOCK_SPAWN_DECAY` | 0.97 | 매초 -3% |
| `OVERCLOCK_MIN_SPAWN_MS` | 200 | 스폰 주기 하한 |
| `STARTING_GOLD` | 100 | 시작 골드 |
| `KILL_REWARD` | 5 | 적 처치 골드 |
| `UNIT_CAP` | 5 | 초기 유닛 한도 |
| `SUMMON_BASE_COST` | 10 | 첫 소환 비용 |
| `SUMMON_COST_INCREMENT` | 2 | 소환마다 누적 증가 |
| `TRACK_WAYPOINTS` | 4개 좌표 | ㅁ자 트랙 모서리 (TL→TR→BR→BL) |
| `UNIT_ZONE` | x1:68 y1:124 x2:292 y2:582 | 유닛 배치 가능 영역 (트랙 안쪽) |
| `UNIT_ATTACK_INTERVAL_MS` | 1000 | 유닛 공격 쿨타임 (1초) |
| `UNIT_ATTACK_RANGE` | 120 | 유닛 사거리 (반지름 px) |
| `UNIT_BASE_DAMAGE` | 1 | 1티어 기본 대미지 |
| `BREEDING_DURATION_MS` | 3000 | 교배 대기시간 (3초) |
| `BREEDING_EXHAUST_DURATION_MS` | 3000 | 교배 후 탈진 지속시간 |
| `ENEMY_TYPES.NORMAL` | hp:5, speed:40 | 일반 적 (빨간, 16×16) |
| `ENEMY_TYPES.FAST` | hp:2, speed:75 | 빠른 적 (노란, 10×10) |
| `POPULATION_UPGRADE_BASE_COST` | 50 | 사회성 첫 업그레이드 비용 |
| `POPULATION_UPGRADE_COST_INCREASE` | 10 | 업그레이드마다 누적 증가 |
| `ENEMY_SPAWN_INTERVAL_MS` | 2500 | 기본 스폰 주기 (↑ 난이도) |
| `MINUTE_HP_MULT` | 1.5 | 1분마다 적 HP ×1.5 누적 |
| `MINUTE_SPEED_MULT` | 1.2 | 1분마다 적 속도 ×1.2 누적 |
| `STARTING_GEMS` | 3 | 시작 보석 수 |
| `BOSS_HP_MULT` | 15 | 보스 HP = NORMAL×15 |
| `BOSS_KILL_REWARD` | 50 | 보스 처치 골드 |
| `VICTORY_TIME_MS` | 120000 (2분) | 승리 조건 시간 |
| `CRIT_DAMAGE_MULT` | 1.5 | 치명타 대미지 배율 |
| `RACE_STATS` | Human/Beast/Robot 각 range/damage/attackIntervalMs | 종족별 전투 스탯 |
| `HYBRID_STATS` | Human_Robot/Human_Beast/Beast_Robot | 하이브리드별 전투 스탯 |
| `TIER3_STATS` | Cyborg_Wizard(range180/dmg3/1000ms/타겟3) Dino_Mecha(range150/dmg15/1500ms) Griffin(range220/dmg1/200ms) | 3티어 전투 스탯 |
| `SELL_GOLD_TIER3` | 60 | 3티어 판매 보상 |

## 트랙 구조
- 웨이포인트 (시계 방향): TL(30,86) → TR(330,86) → BR(330,620) → BL(30,620)
- Phaser Graphics로 36px 두께 회색 사각형 선으로 시각화
- 적은 스폰 시 랜덤 웨이포인트에서 시작 → 다음 웨이포인트 순환

## GameState API (src/game/GameState.ts)
- 상태: `phase`, `elapsedMs`, `enemyCount`, `gold`, `gems`, `units: UnitData[]`, `summonCost`, `maxUnits`, `populationUpgradeCost`, `pendingBossSpawn`, `criticalProbability`, `isInfiniteMode`, `pendingNotification`
- 메서드: `tick(deltaMs)`, `enterOverclock()`, `registerSpawn()`, `registerKill(reward)`, `summon()`, `upgradePopulation()`, `moveUnit(id,x,y)`, `useGemContinue(): boolean`, `startBreeding()`, `completeBreeding()`, `synthesize()`, `processCombat(snapshots)`
- 게터: `currentSpawnIntervalMs`, `currentEnemyHp`(전체 배율 = minuteHpMult × overclock), `currentEnemySpeed`(절대값), `formatTimer()`

## 타입 (src/game/types.ts)
- `Phase`: 'playing' | 'clear' | 'overclock' | 'gameover' | 'victory'
- `Race`: 'Human' | 'Beast' | 'Robot'
- `HybridRace`: 'Human_Robot' | 'Human_Beast' | 'Beast_Robot'
- `Tier3Race`: 'Cyborg_Wizard' | 'Dino_Mecha' | 'Griffin'
- `UnitRace`: Race | HybridRace | Tier3Race
- `EnemyType`: 'NORMAL' | 'FAST'
- `RewardType`: 'gem' | 'gold' | 'damage' | 'maxUnits' | 'twinProb' | 'doubleAtk' | 'crit'
- `UnitData`: id, race(UnitRace), tier(1|2|3), x, y, lastAttackedAtMs, isBreeding, breedingEndMs, isExhausted, exhaustEndMs
- `EnemySnapshot`: id, x, y, hp, progressScore, killReward
- `AttackEvent`: unitX, unitY, enemyX, enemyY
- `CombatResult`: attacks[], killedIds[], hpUpdates[]

## 구현 완료
- [x] 실시간 타이머 + 적 카운터 `N / 50` UI + 보석(Gem) HUD
- [x] 2.5초 간격 적 스폰 (ㅁ자 트랙 웨이포인트 랜덤 시작 → 순환 이동)
- [x] 50마리 초과 → 게임오버 팝업 (다시하기 / 보석 이어하기)
- [x] 보석(Gem) 3개 시작: 이어하기 시 1개 차감 + 모든 적 전멸 + 게임 재개
- [x] 10:00 도달 → `Game Clear! 오버클록 모드 진입!` 배너 1.5초 → 오버클록 페이즈
- [x] 오버클록: 매초 적 HP/속도/스폰주기 스케일링
- [x] **1분 주기 영구 버프:** HP×1.5, 속도×1.2 누적; 경고 문구 2.5초 표시
- [x] **1분 주기 보스 스폰:** 파란 32×32, HP=NORMAL×15, 처치 골드 50
- [x] 시작 골드 100 / 적 처치 골드 5 (보스 50) 경제 시스템
- [x] 소환 비용 가중치: 10G → 12G → 14G... (+2씩 누적)
- [x] 유닛 소환 버튼 (하단 좌측) — 골드/한도 조건 체크
- [x] HUD: 타이머/Gem/적수 + Gold/Units (maxUnits 동적 표시)
- [x] **종족별 사거리 차별화:** Human=60px, Beast=120px, Robot=200px
- [x] **하이브리드 3종 세분화:** Human_Robot(250px/dmg2), Human_Beast(100px/dmg2/500ms), Beast_Robot(160px/dmg5)
- [x] 유닛 종족별 색상: Human=파랑, Beast=초록, Robot=보라, H+R=청록, H+B=핑크, B+R=주황
- [x] 사거리 원 시각화 (종족별 크기, 색상, 불투명도 0.2) — 이동 시 원도 같이 이동
- [x] 타겟팅: progressScore 기반 전진 우선
- [x] 공격 플래시 선 (노란색, 100ms)
- [x] **드래그 이동:** 모든 티어(1·2) 빈 공간 드롭 시 이동, 사거리 원도 동기화 (UNIT_ZONE 외부/UI 위는 원위치 복귀)
- [x] 드래그 교배/합성: 35px 이내 타 유닛 드롭 시 종족 판정 (1티어·비탈진 상태만 허용)
- [x] **종족별 이모티콘:** Human👦 Beast🐶 Robot🤖 / Human_Robot🦾 Human_Beast🐺 Beast_Robot🦖 (반투명 사거리 원 위에 중앙 배치)
- [x] 교배(Breeding): 같은 종족 → 3초 쿨 → 자식 추가 (❤ 연출)
- [x] 교배 후 탈진(Exhaustion): 부모 유닛 3초 zzz 상태
- [x] 합성(Synthesis): 다른 종족 → 두 유닛 제거 → Hybrid 2티어 즉시 생성
- [x] 유닛 한도 검증: 교배/소환 시 maxUnits 초과면 실패
- [x] 사회성 업그레이드 버튼 (하단 우측): 100G → maxUnits+1, +50G씩 누적
- [x] 적 종류 다양화: NORMAL(빨강 16×16, HP5) / FAST(노랑 10×10, HP2 속도75)
- [x] 적 HP 바: 각 적 상단에 너비 바 (녹/황/적 색상 전환), 보스는 더 넓게

- [x] **보스 처치 보상 팝업:** 딤 처리 + 일시정지, 기본 2개 카드, 💎 보석으로 3개 확장, 선택 시 보상 적용 및 재개
- [x] **보상 6종:** gem+1 / gold+150 / 공격력+1 / 유닛한도+1 / 쌍둥이확률업 / 더블어택확률업
- [x] **쌍둥이(Twin):** 교배 완료 시 확률 체크(최초 10%, +2%/선택) — 자식 최대 2개
- [x] **더블어택:** 공격 시 확률(최초 10%, +2%/선택) — 최종 대미지 ×2
- [x] **전체 공격력 보너스(globalDamageBonus):** 보상으로 누적, processCombat에 반영
- [x] **유닛 판매:** 하단 🗑️ 드롭존 — 1티어 10G, 2티어 30G 지급 후 제거
- [x] **유닛 잠금:** 더블클릭(300ms 내 재클릭) → 🔒 토글, 잠금 유닛 교배/합성 차단
- [x] **교배 밀착 연출:** 교배 성립 시 드래그 유닛이 대상 오른쪽 18px으로 즉시 이동
- [x] **30초 스폰 가속:** 매 30초마다 스폰 주기 ×0.85 영구 누적 (최저 200ms)
- [x] **일시정지 시스템:** 보상 팝업 중 tick/스폰/이동/전투 전부 중단
- [x] **사회성 업그레이드 비용 조정:** 50G 시작, +10G씩 누적 (구: 100G/+50G)
- [x] **보스 스폰 주기 30초로 단축:** (구: 60초 주기)
- [x] **치명타(Critical) 시스템:** 전역 criticalProbability (기본 0%), 보스 보상 [🎯 치명타 50%], 최초 보스 보상에 치명타 확정 포함; ×1.5 대미지(ceil) → doubleAtk와 중첩; CRIT! 붉은 텍스트 상승 연출
- [x] **2분 승리:** phase='victory', gems+1, isPaused=true → 🏆 VICTORY 🏆 팝업 (다시하기 버튼)
- [x] **3티어 유닛:** Cyborg_Wizard🧙(멀티3타겟/dmg3) Dino_Mecha🌋(단일/dmg15) Griffin🦅(초고속200ms/dmg1); 합성 레시피: Human_Beast+Human_Robot=Cyborg_Wizard, Human_Robot+Beast_Robot=Dino_Mecha, Human_Beast+Beast_Robot=Griffin; 레시피 없는 조합 → 알림 차단
- [x] **통합 알림 시스템:** `addNotification(msg, color)` — 하단 좌측 최대 4줄, 위로 밀려올라감, 3초 후 fade out; 보스 스폰·판매·잘못된 조합 연동
- [x] **승리 팝업 3버튼 분기:** [다시하기] / [무한 모드](isInfiniteMode=true, 게임 재개) / [메인메뉴](비활성화)
- [x] **무한 모드 플래그:** isInfiniteMode=true 시 2분 승리 조건 패스, 무한 난이도 가속 지속

## 🎮 게임 디자인 결정 (코어 합의)

> 출퇴근 시간 디벨롭으로 누적되는 결정 사항. 출시 게임의 정체성을 정의함.
> 모든 기능 결정은 "이게 코어 판타지 4박자를 강화하나?" 한 줄로 판정.

### 🧬 코어 판타지 (게임의 DNA)
**"스테이지를 보고 빌드를 짜고, 고생해서 고티어를 완성하면, 한 방에 쓸어버리는 쾌감"**

4박자 사이클:
1. **🧭 계획 (Plan)** — 스테이지의 적 보고 빌드 결정
2. **😤 고생 (Grind)** — 운 + 합성 + 자원 압박 사이 분투
3. **💥 폭발 (Pop)** — 고티어 완성 → 적 싹쓸이 카타르시스
4. **🔄 반복 (Loop)** — 다음 스테이지 → 새 적 → 새 빌드

### 정체성
- **머지 디펜스(B) 베이스 + 시간 생존형(A) "버티는 쾌감" 가미**
- 참고 게임: Random Dice / 매지킷 (메인) + Vampire Survivors (페이스/카타르시스 일부)
- 한 판 길이: **7분** (출퇴근 한 사이클)
- 콘텐츠 모델: PvE 메인 / 엔드콘텐츠 = 점수 경쟁 (추후)

### 시스템 결정
| 시스템 | 결정 |
|---|---|
| 골드 공급 | 적 처치 + **매초 자동 회복** (소량) — 손가락 안 쉬게 |
| SP / 스킬 | 추후 (사용 가능한 스킬 도입 시점에 같이) |
| 시너지 | 도입 — **메뉴 영구 업그레이드로 해금되는 형태** |
| 메타프로그레션 | 메뉴 영구 업그레이드 트리 (시너지 / 패시브 / 유닛 해금) |
| 스테이지 | 도입 필수 — 스테이지마다 다른 적/필드 (척추 시스템) |
| 고티어 선택권 | 도입 필수 — 덱빌딩 / 레시피 공개 / 지정 소환 중 택 (미결정) |

### 미결정 (다음 출퇴근 토픽 후보)
- [ ] 스테이지 구조: 개수 / 선형·맵·챕터 / 클리어 조건
- [ ] "고티어 노리기" 시스템: 덱빌딩 vs 레시피 공개 vs 지정 소환
- [ ] 메타프로그레션 트리: 영구 업그레이드 목록 / 화폐 / 비용 곡선
- [ ] 시너지 카탈로그: 종족간/티어간 시너지 5~10개
- [ ] 아트 방향: 이모지 유지 / 픽셀 / 일러스트
- [ ] 수익 모델: F2P 광고 / IAP / 프리미엄

### 로드맵 우선순위 영향
이 결정으로 인해 기존 로드맵 우선순위 재검토 필요:
- **콘텐츠(스테이지 시스템)이 9번 → 3번 수준으로 상승** (코어 판타지 의존성)
- **세이브/메타프로그레션은 메뉴 영구 업그레이드와 분리 불가** → 같이 진행

---

## 🗓️ 마일스톤

### 🎯 5월 마일스톤 (2026-05-31): 친구 클로즈 테스트 — 시나리오 1
**"폴리시보다 피드백. 일단 친구들 손에 쥐여주기."** 웹 URL (Firebase Hosting) 배포.

**작업 순서 (사용자 확정):**
> 리팩토링 → 게임 내실 다지기(7분 견딜 만한 재미) → 튜토리얼 1페이지 → DEV값 원복 → 배포

이유: DEV값(2분) 상태에선 풀플레이 검증해도 7분 페이스 추론이 안 됨. 7분 견딜 내실부터 만들고 DEV값 원복 후 한 번에 출범.

체크리스트:
- [x] 리팩토링 1/8 (constants.ts)
- [ ] **[1] 리팩토링 2~8/8** (백그라운드, 회귀 0)
- [ ] **[2] 게임 내실 다지기** — 아래 🔍 진단의 B/C/A 우선 적용 (총 ~3.5h)
  - [ ] **B (Grind 회복)** — `tick()`에 매초 골드 +2 자동회복 추가 (`KILL_REWARD`와 별개), 30min
  - [ ] **C (Pop 회복)** — `MINUTE_HP_MULT` 1.5→1.25, `TIER3_STATS` damage ×2 (Dino 15→30, Wizard 3→6, Griffin 1→2), 10min
  - [ ] **A (Plan 도입)** — 소환 버튼 3개 분리(Human/Beast/Robot), Robot만 비용 15G로 차별, 2~3h
- [ ] **[3] 튜토리얼 1페이지** — 시작 시 한 화면. **"같은 종족 끌면 교배, 다른 종족 끌면 합성" 필수** (없으면 50% 친구 머지 시도조차 안 함)
- [ ] **[4] DEV값 → 출시값 적용** (`VICTORY_TIME_MS` 420000=7분 / `ENEMY_SPAWN_INTERVAL_MS` 5000)
- [ ] **[5] 풀 7분 플레이 1~2회** → 미친 수치 1~2개만 즉시 조정
- [ ] **[6] Firebase Hosting 배포** + 공유 URL 확보
- [ ] **[7] 본인 폰 + 친구 1명 사전 테스트** → 치명 버그만 픽스
- [ ] **[8] 친구 2~5명 본격 테스트** + 피드백 수집

제안 일정 (참고용, 작업 강도에 따라 변동):
| 일자 | 작업 |
|---|---|
| 5/21~23 | [1] 리팩토링 2~8 |
| 5/24~27 | [2] 게임 내실 다지기 (디자이너 에이전트 진단 + 적용) |
| 5/28 | [3] 튜토리얼 1페이지 |
| 5/29 | [4][5] DEV값 원복 + 풀플레이 밸런싱 |
| 5/30 | [6][7] Firebase 배포 + 본인/친구1명 검증 |
| 5/31 | [8] 친구 본격 공유 시작 |

### 🎯 6월 마일스톤 (2026-06): 폴리시 — 시나리오 2
**"민망하지 않은 수준"** — 친구 피드백 반영 후 진행.

후보:
- [ ] 간단 튜토리얼 팝업 (3장 슬라이드: 소환/교배/합성)
- [ ] 최소 시각 폴리시 (처치 시 작은 폭발 파티클, 데미지 숫자 팝업)
- [ ] 실제 폰 2~3종 호환 테스트 (SafeArea, 다양한 비율)
- [ ] 최고기록 localStorage 저장
- [ ] 5월 피드백 기반 밸런싱 패스

### 🎯 7~8월 마일스톤: 출시 준비 — 시나리오 3
**"실제 출시 퀄리티"** — 친구 피드백으로 게임이 재밌다는 게 검증된 후.

후보:
- [ ] 사운드 / 음악 (BGM + SFX 풀세트, 음량 설정)
- [ ] 메인 메뉴 + 설정 화면
- [ ] 메타프로그레션 트리 (메뉴 영구 업그레이드 → 시너지/패시브 해금)
- [ ] 스테이지 시스템 (코어 판타지 "스테이지에 맞는 빌드" 살리기)
- [ ] 콘텐츠 확장 (적/유닛/보스 추가)

### 🎯 이후: 모바일 패키징
- [ ] Capacitor 빌드 (Android 먼저 → iOS)
- [ ] 스토어 메타 (아이콘, 스플래시, 권한, 스크린샷)
- [ ] IAP / 광고 (수익 모델 결정 후)

---

## 🔍 game-designer 사전 진단 (2026-05-21, 출시값 7분/5000ms 기준 추산)

**핵심 수치 (7분 시점):**
- 분당 HP 배율: `1.5^7 = 17.09x` ← 카타르시스 잡아먹는 주범
- 분당 속도: `1.2^7 = 3.58x` → 143px/s (트랙 한 변 2초만에 통과)
- 보스 14회 (30초마다), 보상 카드 14번 선택 (Plan 과부하)
- 처음 30초: 골드 100 → 5~10마리 뽑고 손가락 멈춤

**박자별 진단:**
| 박자 | 강도 | 현재 | 7분 시 문제 |
|---|---|---|---|
| Plan | 망가짐 | 적 2종, 트랙 고정, 종족 랜덤 소환 | "뭐 보고 짤" 게 0. 첫 30초 멍 |
| Grind | 중간 | 골드 100시작/5G킬, 교배 3+3초 | 1분 전 골드 가뭄(60G/분), 5분+ 인플레 |
| Pop | 약함 | 3티어 Dino 15dmg/Wizard 3타3dmg/Griffin 200ms | 7분차 적 HP 17x → 한 방에 못 쓸어버림 |
| Loop | 약함 | 승리 팝업 + 무한모드 | "한 판 더" 후크 없음 |

**우선순위 (5/31 필수):**
1. **B (Grind 회복)** — 골드 매초 +2 자동회복. 30min. 실패모드: +3이상이면 소환 스팸 → +2 고정
2. **C (Pop 회복)** — HP 1.5→1.25, 3티어 dmg ×2. 10min. 실패모드: 2티어 무의미해질 수 있음 → 2티어는 보스 처치 가능선 유지
3. **A (Plan 도입)** — 소환 3종 선택 UI. 2~3h. 실패모드: Beast 도배 → Robot 비용 15G

**나중 (6월+):**
- D: TANK 적 추가 (1~2h, 시각 작업 필요)
- E: 3티어 완성 시 화면 플래시 + ULTIMATE 텍스트 (1~2h)
- F: 최고기록 localStorage (30min)

**위험 신호:**
- 첫 30~60초 손가락 멈춤 → B로 해결
- 3티어 카타르시스 없음 → C로 해결
- 튜토리얼 1줄 없으면 50% 친구가 머지 시도조차 안 함

---

## ⚠️ DEV 단축값 (출시 전 원복 필요)
빠른 반복 플레이 테스트를 위해 임시로 당겨놓은 값들. **출시 전 반드시 원복.**

| 상수 | 현재 (DEV) | 출시 목표 | 비고 |
|---|---|---|---|
| `VICTORY_TIME_MS` | 120000 (2분) | **420000 (7분)** | 디자인 결정 (10분→7분) |
| `ENEMY_SPAWN_INTERVAL_MS` | 2500 | **5000** | 원본 스펙 |

원본 게임플레이 의도: **10분 생존 시 1차 클리어 → 무한 오버클록 모드 무제한 지속.** 현재 2분 승리는 다음 해금/기능 검증 속도를 위한 디버그값.

## 🏗️ 리팩토링 계획 (다음 작업 최우선)

**현황:** `GameScene.ts` 747줄, 단일 파일에서 HUD/스폰/이동/유닛렌더/드래그/팝업/알림 전부 처리 → 다음 큰 기능 들어가기 전 분리 필요.

**목표:** GameScene을 ~150줄 오케스트레이터로 축소, 책임별 매니저 파일 분리.

**원칙:**
- 각 단계 후 게임 동작 동일 (회귀 0). 단계별 커밋으로 롤백 가능.
- 매니저는 `Phaser.Scene` + `GameState` 참조 받음. **GameState 직접 변이 금지** (GameState 메서드만 호출).
- `src/game/*` 의 Phaser 의존 0 원칙 유지.

**제안 구조:**
```
src/scenes/
├── GameScene.ts                  # ~150줄: lifecycle + update 오케스트레이션
├── constants.ts                  # RACE_COLORS, RACE_EMOJI, SELL_ZONE 좌표
├── render/
│   ├── HudRenderer.ts            # 상하단 바, 타이머/골드/유닛/보석/소환·사회성 버튼
│   ├── EnemyRenderer.ts          # 스폰, 이동, HP바
│   ├── UnitRenderer.ts           # 이모지, 사거리원, ❤/zzz/🔒 오버레이
│   ├── PopupRenderer.ts          # gameOver / victory / reward shop / dim
│   └── NotificationRenderer.ts   # 하단 좌측 4줄 로그 스택
└── input/
    └── DragController.ts         # dragstart/drag/dragend + handleDrop 분기
```

**단계 (각 단계 = 1 커밋, 사용자 IDX 확인 후 다음 진행):**
1. ✅ `scenes/constants.ts` 분리 (CENTER_X/Y, SELL_ZONE_X/Y, RACE_COLORS, RACE_EMOJI)
2. `NotificationRenderer` 추출 (가장 독립적)
3. `HudRenderer` 추출
4. `PopupRenderer` 추출 (gameOver/victory/reward — pause 협조 필요)
5. `EnemyRenderer` 추출
6. `UnitRenderer` 추출 (가장 복잡 — 오버레이 다수)
7. `DragController` 추출
8. `GameScene.ts` 슬림화 마무리

## 🎯 출시 로드맵 (10항목, 우선순위 순)

> 게임 자체가 "출시 퀄리티"가 되어야 Capacitor 연결. 기술적 의존성 + 임팩트 순.

| # | 항목 | 의도 |
|---|---|---|
| 1 | 🔧 **리팩토링** (위 계획) | 확장 기반 마련. 다음 기능 추가 비용 절감 |
| 2 | 🎯 **밸런싱 패스** | DEV 값 원복 + 실제 10분 풀 플레이 곡선 검증, 골드/스폰/보스 빈도/스탯 튜닝 |
| 3 | 💾 **세이브 / 메타프로그레션** | localStorage 기반 최고기록, 누적 보석, 영구 업그레이드 (모바일 리텐션 핵심) |
| 4 | 🔊 **사운드 / 음악** | BGM + SFX (소환·공격·처치·보스·승리·UI 클릭), 음량 설정 |
| 5 | 🏠 **메인 메뉴 + 설정 화면** | 시작/설정/기록/크레딧, 음량·언어·햅틱 토글 |
| 6 | 🎓 **튜토리얼 / 온보딩** | 첫 플레이어 가이드 (교배/합성/소환/보스 보상 메커니즘) |
| 7 | ✨ **시각 폴리시** | 파티클(공격/처치/소환), 데미지 숫자 팝업, 카메라 셰이크, 트랜지션 |
| 8 | 📱 **반응형 + SafeArea** | 19.5:9, 20:9 등 다양한 모바일 비율, iOS notch / 안드로이드 navbar 대응 |
| 9 | ⚡ **퍼포먼스 최적화** | 오브젝트 풀링 (Enemy/Unit/Particle), 컬링, 저사양 안드로이드도 60fps |
| 10 | 📦 **Capacitor 패키징 + 스토어 메타** | Android/iOS 빌드, 아이콘/스플래시, 권한, IAP/광고 통합 |

**규칙:** 한 항목 끝나면 사용자가 플레이 후 다음 항목 결정. 항목 내 작업은 한 AI가 끝까지 책임지고 PROGRESS.md 갱신.

## 실행 / 검증
```bash
npm install
npm run dev      # http://localhost:5173
node_modules/.bin/tsc --noEmit  # 타입 검사
```

## Git
- 브랜치: **main only**
- 원격에 `claude/add-coding-guidelines-RKwty` 잔존 (GitHub default branch 권한 이슈, 사용자가 Settings에서 default를 main으로 변경 후 삭제 가능)

## 코딩 규칙 (CLAUDE.md 요약)
1. **Think Before Coding** — 가정 명시, 모호하면 질문, 트레이드오프 표면화
2. **Simplicity First** — 요청 이상의 추상화/유연성/에러처리 금지
3. **Surgical Changes** — 요청 외 코드 손대지 않기, 본인이 만든 orphan만 정리
4. **Goal-Driven** — 검증 가능한 성공 기준 정의 후 루프
5. **PROGRESS.md 동기 갱신** — 의미있는 변경은 같은 커밋에서 이 문서도 업데이트
6. **검증은 사용자가** — Playwright/Puppeteer/Chromium 설치 및 헤드리스 스크린샷 검증 금지. AI는 `npm run build` + 서버 부팅 확인까지만, UI 검증은 사용자가 IDX 미리보기로 직접 함
