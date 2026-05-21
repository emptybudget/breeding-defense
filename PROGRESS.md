# breeding-defense — AI 핸드오프 컨텍스트

> 다른 AI와 협업 시 이 문서를 컨텍스트로 전달하세요. 매 갱신마다 최신화됩니다.
> 마지막 갱신: 2026-05-21 (미션 6-2)

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
| `POPULATION_UPGRADE_BASE_COST` | 100 | 사회성 첫 업그레이드 비용 |
| `POPULATION_UPGRADE_COST_INCREASE` | 50 | 업그레이드마다 누적 증가 |
| `ENEMY_SPAWN_INTERVAL_MS` | 2500 | 기본 스폰 주기 (↑ 난이도) |
| `MINUTE_HP_MULT` | 1.5 | 1분마다 적 HP ×1.5 누적 |
| `MINUTE_SPEED_MULT` | 1.2 | 1분마다 적 속도 ×1.2 누적 |
| `STARTING_GEMS` | 3 | 시작 보석 수 |
| `BOSS_HP_MULT` | 15 | 보스 HP = NORMAL×15 |
| `BOSS_KILL_REWARD` | 50 | 보스 처치 골드 |
| `RACE_STATS` | Human/Beast/Robot 각 range/damage/attackIntervalMs | 종족별 전투 스탯 |
| `HYBRID_STATS` | Human_Robot/Human_Beast/Beast_Robot | 하이브리드별 전투 스탯 |

## 트랙 구조
- 웨이포인트 (시계 방향): TL(30,86) → TR(330,86) → BR(330,620) → BL(30,620)
- Phaser Graphics로 36px 두께 회색 사각형 선으로 시각화
- 적은 스폰 시 랜덤 웨이포인트에서 시작 → 다음 웨이포인트 순환

## GameState API (src/game/GameState.ts)
- 상태: `phase`, `elapsedMs`, `enemyCount`, `gold`, `gems`, `units: UnitData[]`, `summonCost`, `maxUnits`, `populationUpgradeCost`, `pendingBossSpawn`
- 메서드: `tick(deltaMs)`, `enterOverclock()`, `registerSpawn()`, `registerKill(reward)`, `summon()`, `upgradePopulation()`, `moveUnit(id,x,y)`, `useGemContinue(): boolean`, `startBreeding()`, `completeBreeding()`, `synthesize()`, `processCombat(snapshots)`
- 게터: `currentSpawnIntervalMs`, `currentEnemyHp`(전체 배율 = minuteHpMult × overclock), `currentEnemySpeed`(절대값), `formatTimer()`

## 타입 (src/game/types.ts)
- `Race`: 'Human' | 'Beast' | 'Robot'
- `HybridRace`: 'Human_Robot' | 'Human_Beast' | 'Beast_Robot'
- `UnitRace`: Race | HybridRace
- `EnemyType`: 'NORMAL' | 'FAST'
- `UnitData`: id, race(UnitRace), tier(1|2), x, y, lastAttackedAtMs, isBreeding, breedingEndMs, isExhausted, exhaustEndMs
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

## 미구현 (다음 단계 후보)
- [ ] Capacitor 패키징 설정

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
