# breeding-defense — AI 핸드오프 컨텍스트

> 다른 AI와 협업 시 이 문서를 컨텍스트로 전달하세요. 매 갱신마다 최신화됩니다.
> 마지막 갱신: 2026-05-21 (미션 3 + CLAUDE.md 섹션 6 추가)

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
| `ENEMY_BASE_SPEED` | 40 px/sec | |
| `ENEMY_BASE_HP` | 1 | |
| `OVERCLOCK_HP_GROWTH` | 1.05 | 매초 +5% |
| `OVERCLOCK_SPEED_GROWTH` | 1.03 | 매초 +3% |
| `OVERCLOCK_SPAWN_DECAY` | 0.97 | 매초 -3% |
| `OVERCLOCK_MIN_SPAWN_MS` | 200 | 스폰 주기 하한 |
| `STARTING_GOLD` | 100 | 시작 골드 |
| `KILL_REWARD` | 5 | 적 처치 골드 |
| `UNIT_CAP` | 5 | 최대 배치 유닛 수 |
| `SUMMON_BASE_COST` | 10 | 첫 소환 비용 |
| `SUMMON_COST_INCREMENT` | 2 | 소환마다 누적 증가 |
| `TRACK_WAYPOINTS` | 4개 좌표 | ㅁ자 트랙 모서리 (TL→TR→BR→BL) |
| `UNIT_ZONE` | x1:68 y1:124 x2:292 y2:582 | 유닛 배치 가능 영역 (트랙 안쪽) |
| `UNIT_ATTACK_INTERVAL_MS` | 1000 | 유닛 공격 쿨타임 (1초) |
| `UNIT_ATTACK_RANGE` | 120 | 유닛 사거리 (반지름 px) |
| `UNIT_BASE_DAMAGE` | 1 | 1티어 기본 대미지 |

## 트랙 구조
- 웨이포인트 (시계 방향): TL(30,86) → TR(330,86) → BR(330,620) → BL(30,620)
- Phaser Graphics로 36px 두께 회색 사각형 선으로 시각화
- 적은 스폰 시 랜덤 웨이포인트에서 시작 → 다음 웨이포인트 순환

## GameState API (src/game/GameState.ts)
- 상태: `phase`, `elapsedMs`, `enemyCount`, `gold`, `units: UnitData[]`, `summonCost`
- 메서드: `tick(deltaMs)`, `enterOverclock()`, `registerSpawn()`, `registerKill(reward=5)`, `summon(): UnitData | null`, `processCombat(snapshots): CombatResult`
- 게터: `currentSpawnIntervalMs`, `currentEnemyHp`, `currentEnemySpeed`, `formatTimer()`

## 타입 (src/game/types.ts)
- `UnitData`: id, race, tier, x, y, `lastAttackedAtMs`
- `EnemySnapshot`: id, x, y, hp, progressScore (GameScene → GameState 전달용)
- `AttackEvent`: unitX, unitY, enemyX, enemyY (플래시 선 렌더링용)
- `CombatResult`: attacks[], killedIds[], hpUpdates[] (processCombat 반환값)

## 구현 완료
- [x] 실시간 타이머 + 적 카운터 `N / 50` UI
- [x] 5초 간격 적 스폰 (ㅁ자 트랙 웨이포인트 랜덤 시작 → 순환 이동)
- [x] 50마리 초과 → `GAME OVER` 배너, 게임 정지
- [x] 10:00 도달 → `Game Clear! 오버클록 모드 진입!` 배너 1.5초 → 오버클록 페이즈
- [x] 오버클록: 매초 적 HP/속도/스폰주기 스케일링
- [x] 시작 골드 100 / 적 처치 골드 5 경제 시스템
- [x] 소환 비용 가중치: 10G → 12G → 14G... (+2씩 누적)
- [x] 유닛 소환 버튼 (하단 중앙) — 골드/한도 조건 체크
- [x] 최대 유닛 5개 제한
- [x] HUD 2행: 타이머/적수 + Gold/Units
- [x] 유닛 종족별 동그라미 렌더: Human=파랑, Beast=초록, Robot=보라
- [x] 전투/즉시 타격: 사거리 120px, 쿨타임 1초, 데미지 1
- [x] 타겟팅: progressScore 기반 전진 우선 (waypointIndex * 1000 - 거리)
- [x] 적 처치 시 Phaser 오브젝트 제거 + Gold +5
- [x] 사거리 원 시각화 (종족 색, 불투명도 0.2)
- [x] 공격 플래시 선 (노란색, 100ms)

## 미구현 (다음 단계 후보)
- [ ] **교배** (같은 종족 드래그 → 동종 +1)
- [ ] **합성** (다른 종족 드래그 → 상위 티어 융합)
- [ ] 적 종류 다양화
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
