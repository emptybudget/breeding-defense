# breeding-defense — AI 핸드오프 컨텍스트

> 다른 AI와 협업 시 이 문서를 컨텍스트로 전달하세요. 매 갱신마다 최신화됩니다.
> 마지막 갱신: 2026-05-28 (NovelAI 아트 의뢰서 추가 — B안 아르누보-Chibi 확정)

## ⚠️ 미완료 조치

| 항목 | 내용 |
|---|---|
| 🔑 Firebase 서비스 계정 키 폐기 필요 | `firebase-key.json`이 커밋 `5344fdc`에 실수로 포함됨. git 히스토리는 재작성 완료(원격 미전파), `.gitignore`에도 추가. **단, Firebase Console에서 해당 키를 수동 폐기해야 함** → [서비스 계정 페이지](https://console.firebase.google.com/project/breeding-defense/settings/serviceaccounts/adminsdk) |

---

## ✅ 최근 완료 작업

### 2026-05-27 — 첫 적 5초 출현 + 게임 2배속 메타

| 항목 | 구현 내용 | 파일 |
|---|---|---|
| 첫 적 5초 출현 | `firstSpawnDone` 플래그로 stage interval과 무관하게 elapsedMs=5000ms에 첫 스폰 (이후는 stage interval) | `EnemyRenderer.ts` |
| ⏩ 게임 2배속 메타 업그레이드 | StageSelectScene "🛒 영구 강화" 5번째 항목 — 💎3 / max1 / 인게임 1×/2× 토글 해금 | `config.ts`, `MetaProgress.ts`, `StageSelectScene.ts` |
| 인게임 2배속 토글 | HUD 상단 📖 옆 `1×`/`2×` 버튼 (해금 시에만 표시), `speedMult`로 deltaMs + `time.timeScale` + `tweens.timeScale` 동시 스케일 | `HudRenderer.ts`, `GameScene.ts` |

> 📝 **유닛별 공격 이펙트** — 미구현, 보류. 아래 "🚨 다음 작업"에 등재.

### 2026-05-26 — 보스의 영혼 시스템 + 영혼 상점

| 항목 | 구현 내용 | 파일 |
|---|---|---|
| 보스의 영혼 (강화점 리브랜딩) | 보스 처치 시 `💀 영혼 +1` 알림 (기존 🔥 강화점→💀 영혼으로 UI 전환) | `GameScene.ts`, `HudRenderer.ts` |
| HUD Row 2 교체 | `💀 영혼: N` 카운터 + `🔮 영혼 상점` 버튼 (기존 T1/T2 버튼 제거) | `HudRenderer.ts` |
| 영혼 상점 팝업 | 게임 일시정지 후 팝업 — 강화·유닛 구매 2개 섹션 | `PopupRenderer.ts`, `GameScene.ts` |
| 강화 섹션 | 1티어 강화 +1dmg (1pt, max5) / 2티어 강화 +1dmg (2pt, max3) | `PopupRenderer.ts` |
| 유닛 직접 구매 섹션 | 6종 1티어 유닛 중 원하는 것 선택 구매. 첫 구매 1pt, 이후 +1pt씩 누적 | `PopupRenderer.ts`, `GameState.ts` |

### 2026-05-26 — U1/U3/U5/U6/U8/U9 묶음 패치

| 항목 | 구현 내용 | 파일 |
|---|---|---|
| U1: 한도 풀 교배 차단 알림 | `startBreeding` 실패 시 알림 추가. `unitText` atCap → 주황 펄싱 tween | `DragController.ts`, `HudRenderer.ts` |
| U2: "사회성"→"한도+1" | 이미 구현됨 (`한도+1 (Ng)` 라벨) — 추가 작업 없음 | — |
| U3: 드롭 트랙 충돌 나선 보정 | 드롭 위치가 트랙 위면 8방향×4단계(30px) 나선으로 빈 공간 탐색 | `GameState.ts`, `DragController.ts` |
| U5: Phase C 보스 처치 컷인 | Phase C 보스 처치 시 💀 BOSS DOWN! 텍스트 + 셰이크 + 빨간 플래시 | `GameScene.ts` |
| U6: 보스 5초 예고 강화 | 빨간 오라 플래시 + ⚠️5→1 카운트다운 텍스트 (기존 알림 유지) | `GameScene.ts` |
| U8: 무한모드 스케일링 강화 | `OVERCLOCK_HP_GROWTH` 1.05→1.08, `OVERCLOCK_SPEED_GROWTH` 1.03→1.05 | `config.ts` |
| U9: Phase C 보스 거대화 | Phase C: 👑 48px + 빨간 오라 (이중 원, 매 프레임 boss 위치에 갱신) | `EnemyRenderer.ts` |

### 2026-05-26 — U13 보스 3단 페이즈화 + U14 티어 강화 시스템

| 기능 | 구현 내용 | 파일 |
|---|---|---|
| U13: 보스 3단 페이즈 | Phase A(0~2:30, ×15, 속도×0.8, +50G) / B(2:30~4:30, ×25, 속도×0.7, +80G) / C(4:30+, ×50, 속도×0.55, +150G, 카드3장) | `config.ts`, `EnemyRenderer.ts`, `GameScene.ts` |
| U14: 티어 강화 시스템 | 보스처치 시 강화점+1 / 1티어 강화(1pt/+1dmg/max5) / 2티어 강화(2pt/+1dmg/max3) / HUD Row2 추가 | `config.ts`, `GameState.ts`, `combat.ts`, `HudRenderer.ts`, `GameScene.ts` |


### 2026-05-25 — 소리 ON/OFF + 스폰 버그 + 별→보석 통합

| 기능 | 구현 내용 | 파일 |
|---|---|---|
| 소리 ON/OFF | `SoundManager.toggleMute()` + 일시정지 팝업 🔊/🔇 버튼 추가 | `SoundManager.ts`, `PopupRenderer.ts`, `GameScene.ts` |
| 유닛 트랙 스폰 버그 | 소환 시 트랙 세그먼트 22px 이내면 최대 20회 재시도 (`_distToSeg` + `_onTrack`) | `GameState.ts` |
| 별→보석 통합 | 승리 시 💎+1 (별 폐지), 스테이지3 해금 💎3 소비, 영구강화 💎1/Lv | `MetaProgress.ts`, `config.ts`, `StageSelectScene.ts`, `GameScene.ts`, `PopupRenderer.ts` |
| 메타 마이그레이션 | `localStorage`의 `stars` 필드를 `gems`로 자동 변환 | `MetaProgress.ts` |

### 2026-05-25 — 아르누보 × 도트게임 UI 스타일

| 영역 | 변경 내용 | 파일 |
|---|---|---|
| 팔레트 + 헬퍼 | `AN` (hex 숫자) / `ANS` (hex 문자열) 상수, `drawHudBar` / `drawPanelAt` / `drawDivider` 함수 | `artnouveau.ts` (신규) |
| HUD 바 | 검정→다크올리브, 3px 황금 상하 테두리, 덩굴(줄기+잎 원+금 버드) 양끝 장식 | `HudRenderer.ts` |
| 팝업 전체 | 검정→딥포레스트, 3px 황금 외곽+1px 내부 보더, L자 코너 브라켓 장식 | `PopupRenderer.ts` |
| 텍스트 | 흰색→크림 `#f0e8c8`, 회색→파치먼트 `#c8b97a`, 청록 보석, 바인 그린 유닛 수 | 전 씬 |
| 타이틀 | 배경 딥포레스트, 타이틀 AN 패널 프레임, 바인 도트 장식 | `TitleScene.ts` |
| 스테이지 선택 | 배경 딥포레스트, 금색 구분선, 버튼/카드 AN 배색 | `StageSelectScene.ts` |
| 트랙 | `0x333333`→`0x2a2818` (다크 올리브 그레이) | `GameScene.ts` |
| 배경 | `#060612`→`#0d0c08` (약간 따뜻한 다크) | `main.ts` |

### 2026-05-25 — 재미요소 4개 추가

| 기능 | 구현 내용 | 파일 |
|---|---|---|
| 데미지 숫자 표기 | 적 피격 시 데미지 숫자 플로팅 (흰색/오렌지 크리티컬 `!`), 지터 오프셋으로 중첩 방지 | `types.ts`, `combat.ts`, `EnemyRenderer.ts` |
| 보스 속전속결 보너스 | 2번째 보스부터 스테이지별 제한시간(S1:10s/S2:13s/S3:16s) 내 처치 → 카드+1장 + HUD 카운트다운 | `config.ts`, `GameState.ts`, `GameScene.ts` |
| HUD 타이머 색 전환 | 남은 시간 3분 이하→노랑, 1분 이하→빨강 (playing 페이즈만) | `HudRenderer.ts` |
| 합성 콤보 보너스 | 30초 내 2연속 합성 → +15G, 3연속 → +30G 알림 | `GameState.ts` |

### 2026-05-25 — 배경음/효과음/적 이모지/스테이지 2,3

| 기능 | 구현 내용 | 파일 |
|---|---|---|
| 배경음 (BGM) | Web Audio API 앰비언트 드론+코드 루프 (Am), LFO 트레몰로 | `SoundManager.ts` (신규) |
| 효과음 (SFX) | 처치(pop), 합성(arpeggio), 교배(화음), 보스(경고음), 오버클록(surge), 게임오버(하강), 승리(팡파레) | `SoundManager.ts`, `EnemyRenderer.ts`, `DragController.ts`, `GameScene.ts` |
| 적 이모지 다양화 | NORMAL 👾 / FAST 🐝 / TANK 🐢 / BOSS 👺 (사각형 → 이모지 Text 오브젝트) | `EnemyRenderer.ts` |
| 스테이지 2 | 🏜️ FAST 65% / TANK 2분부터 / 보스HP×18 / 스폰주기 5.2초 — 별 3개 잠금해제 | `config.ts`, `StageSelectScene.ts` |
| 스테이지 3 | 🌋 FAST 55% / TANK 1분부터 / 보스HP×22 / 스폰주기 4초 — 별 9개 잠금해제 | `config.ts`, `StageSelectScene.ts` |

### 재미 증대 1순위 3개

| 기능 | 구현 내용 | 파일 |
|---|---|---|
| G: ULTIMATE 연출 | 3티어 "✨ ULTIMATE! ✨" + 4티어 "🌟 ASTRAL GOD!! 🌟" 텍스트, 0.3초 프리즈, 화면 플래시, 4티어 카메라 셰이크 500ms | `DragController.ts` |
| A: 화면 테두리 붉은 맥동 | 적 40마리↑ → 10px 붉은 테두리 500ms 주기 맥동 | `GameScene.ts` |
| B: 합성 가능 테두리 강조 | 드래그 시 유효 파트너에 청록 원 350ms 주기 펄싱 | `UnitRenderer.ts`, `DragController.ts` |

### P0 UX 기본 3개 (game-designer 신규 진단 2026-05-23)

| 기능 | 구현 내용 | 파일 |
|---|---|---|
| P0-1: 게임오버 생존 시간 | GameOver 팝업에 `생존 시간: MM:SS` 표시 | `PopupRenderer.ts` |
| P0-2: 승리 결과 요약 | Victory 팝업에 ⭐⭐⭐ +3 별 강조 + 생존 시간 표시 | `PopupRenderer.ts` |
| P0-3: 소환 비용 MAX 표시 | 30G 상한 도달 시 소환 버튼 `소환 (MAX)` 표시 | `HudRenderer.ts` |

## ✅ 완료 — P1 UX 기본 3개 (2026-05-25)

| # | 기능 | 구현 내용 | 파일 |
|---|---|---|---|
| P1-1 | 레시피 북 버튼 (= U-L) | 상단 HUD 📖 버튼 → 일시정지 + 전체 합성 트리 팝업 (1→2→3→4티어) | `HudRenderer.ts`, `PopupRenderer.ts`, `unitHelpers.ts` |
| P1-2 | 합성 조건 튜토리얼 보완 | 튜토리얼에 2티어→3티어, 3티어→4티어, 유닛탭/더블탭 안내 추가 | `PopupRenderer.ts` |
| P1-3 | 소환 FULL 비활성화 | units >= maxUnits 시 소환 버튼 회색 + '소환 (FULL)' 표시 | `HudRenderer.ts` |

> 참고: 위 P1-1은 통합 우선순위 표의 `L` 항목과 동일. P1-3은 `U1`의 소환 버튼 부분과 겹침(교배 차단 알림은 U1에 남음).

---

### 2026-05-28 — 모바일 상용 출시 마스터 패치 (8개 기능)

| 항목 | 구현 내용 | 파일 |
|---|---|---|
| 📱 모바일 안전 영역 | `MOBILE_SAFE_ZONE_TOP=24` / `MOBILE_SAFE_ZONE_BOTTOM=16` 추가. HUD Top: +TOP 오프셋, Bottom: -BOT 오프셋. DragController 셀존/유효위치 판정 동기화 | `config.ts`, `HudRenderer.ts`, `DragController.ts`, `constants.ts` |
| ⏸ 백그라운드 자동정지 | `blur` + `visibilitychange` 리스너 → playing/overclock 페이즈 시 자동 일시정지 | `GameScene.ts` |
| 🏆 스테이지 기록 저장 | `MetaProgress.stageRecords` (localStorage 영속). `getStageRecord()` / `setStageRecord()` / `formatRecord()` 추가. `GameState` 셸 메서드 `serialize()` / `deserialize()` 추가 | `MetaProgress.ts`, `GameState.ts` |
| 🏆 스테이지 선택 최고기록 표시 | 언락 스테이지 버튼 아래에 `최고 기록: MM:SS` 또는 `무한 MM:SS` 표시 | `StageSelectScene.ts` |
| 📳 햅틱 피드백 | 3티어 합성 `[80,40,120]` / 4티어 `[100,50,150,50,200]` / 보스처치 `[60,30,80]` / FULL경고 `30ms` | `DragController.ts`, `GameScene.ts` |
| 🎬 스테이지 인트로 + 보스 카메라 | 튜토리얼 후 스테이지명 400ms 페이드인+800ms 유지+500ms 아웃. 보스 스폰 시 흑색 플래시(alpha0.6→0) + `shake(200, 0.012)` | `GameScene.ts` |
| ⚔️ DPS 미터 | `AttackEvent.srcId` 추가 → `GameState.unitDamageMap` 누적 → `getTopDamageDealers(n)`. Pause/GameOver/Victory 팝업에 Top3 🥇🥈🥉 딜 순위 표시 | `types.ts`, `combat.ts`, `GameState.ts`, `PopupRenderer.ts` |
| 📺 광고 부활 시스템 | GameOver 팝업에 "광고 보고 부활하기" 버튼 (최대 1회/판). 1.5초 시뮬레이션 후 `state.useAdRevive()` → 적 전멸+페이즈 복귀. 패널 높이 동적 조정 (ad: 400, no-ad: 360) | `GameState.ts`, `GameScene.ts`, `PopupRenderer.ts` |

---

### 2026-05-28 — 유닛별 공격 이펙트

| 항목 | 구현 내용 | 파일 |
|---|---|---|
| `AttackEvent.srcRace` 추가 | `types.ts` `AttackEvent`에 `srcRace?: UnitRace` 필드 추가 | `types.ts` |
| combat.ts srcRace 전파 | 모든 `attacks.push`에 `srcRace: unit.race` 추가. `applyChainLightning`에 `srcRace` 인자 추가(3곳 호출부 갱신). 지뢰 폭발/Menhera는 미설정 → 기본 스타일 | `combat.ts` |
| EnemyRenderer 스타일 테이블 | 8종 스타일 분기: slash(적주황+X), beam(청록굵은선), shell(주황+원), chain(노랑지그재그), magic(보라+별4개), divine(흰색+별6개), arrow(초록얇은선), 기본(노란선) | `EnemyRenderer.ts` |

---

## 🚨 다음 작업 — 통합 우선순위 (game-designer 디벨롭 2026-05-25)

> **트리거:** 친구 1차 옆-관찰 피드백 ("4티어 1개 조합 후 쉬워짐, 보스 깨는 느낌 없음") + 사용자 12개 아이디어.
> **정량 진단:** 4분 보스 HP 183 → Astral_God 0.9초컷. 4~7분 3분 구간이 디자인의 죽은 살.
> **결론:** U13/U14/U15 묶어 1차 패치 필수. 분리 적용 시 게이트 미작동.

### 📊 통합 우선순위 표 (U1~U15)

| # | 그룹 | 항목 | 박자 | 우선순위 |
|---|---|---|---|---|
| ~~U13~~ | ~~보스 차별화~~ | ~~보스 3단 페이즈화~~ | — | **✅ 완료** (Phase A×15/B×25/C×50, 속도차등, 보상차등) |
| ~~U14~~ | ~~인게임 결정~~ | ~~티어 강화 시스템~~ | — | **✅ 완료** (보스처치 강화점+1, 1티어5회/2티어3회, HUD Row2) |
| ~~U1~~ | ~~UX 명확성~~ | ~~유닛 한도 풀 시 교배 차단 알림 + HUD 펄싱~~ | — | **✅ 완료** (알림 + 주황 펄싱 tween) |
| ~~U2~~ | ~~UX 명확성~~ | ~~"사회성" → "한도+1" 라벨 변경~~ | — | **✅ 완료** (기확인, 이미 구현됨) |
| ~~U10~~ | ~~UX 명확성~~ | ~~소환 위치 트랙 충돌 회피~~ | — | **✅ 완료** (스폰 버그 수정 — 22px 이내 20회 재시도, `GameState.ts`) |
| U7 | 페이싱 | 분당 곱 1.25 → 1.35 (Phase C 너무 쉬우면) | Grind | 🟢 P1 — 풀플레이 후 |
| ~~U5~~ | ~~페이싱~~ | ~~Phase C 보스 처치 컷인 연출~~ | — | **✅ 완료** (💀 BOSS DOWN! 텍스트+셰이크+플래시) |
| ~~U3~~ | ~~UX 명확성~~ | ~~드롭 위치 트랙 충돌 시 빈 공간 보정 (8방향 30px 나선)~~ | — | **✅ 완료** (8방향×4단계 나선 탐색, `GameState.isOnTrack` + `DragController.findClearPos`) |
| ~~U6~~ | ~~보스 능동성~~ | ~~보스 등장 5초 예고 (빨간 오라+카운트다운)~~ | — | **✅ 완료** (빨간 플래시 + ⚠️ 5→1 카운트다운 텍스트) |
| ~~U8~~ | ~~무한모드~~ | ~~OVERCLOCK_HP_GROWTH 1.05→1.08, _SPEED_GROWTH 1.03→1.05~~ | — | **✅ 완료** |
| ~~U9~~ | ~~페이싱~~ | ~~최종보스 거대화 (64×64, 빨간 오라, "👑 GREAT BOSS")~~ | — | **✅ 완료** (👑 48px + 이중 빨간 오라, Phase C 전용) |
| ~~L~~ | ~~Plan~~ | ~~합성 레시피 북 버튼~~ | — | **✅ 완료** (P1-1, HUD 📖 버튼) |
| D | Grind | 티어별 킬 카운터 + 보너스 골드 | Grind | ⚪ P2 |
| U4 | 폴리시 | Menhera 지뢰 시각 강화 (8→12px, 폭발 30→50px+셰이크) | Pop | ⚪ P2 |
| ~~E~~ | ~~Grind+Pop~~ | ~~보스 10초 내 처치 → 보상 카드 +1장~~ | — | **✅ 완료** (보스 속전속결 보너스, S1:10s/S2:13s/S3:16s) |
| U11 | 사운드 | Astral_God 보이스 SFX (BGM/SFX는 이미 구현됨, 보이스만 남음) | Pop | ⚪ P3 (6월 사운드 폴리시) |
| ~~U12~~ | ~~인게임 결정~~ | ~~티어별 공격력 1종 영구 강화~~ | — | **❌ 폐기 (U14로 흡수)** |

### 🎯 권장 작업 순서

1. **1차 패치 (한 커밋):** U13 + U14 — 페이싱 핵심
2. **본인 7분 풀플레이** → 아래 검증 게이트 4개 확인
3. **2차 패치 (한 커밋):** U1 + U2 + U10 — UX 명확성 P0
4. **3차 패치:** U7 + U5 + U3 + U6 + U8 + U9 + L — 페이싱 미세조정 + P1
5. **친구 본격 테스트** → 4차: U4, F, D
6. **6월 폴리시:** U11 사운드 세트 (BGM + SFX + 보이스 한 번에)

### 🔬 풀플레이 검증 게이트 (1차 패치 후 즉시 측정)

| 지표 | 목표값 | 실패 시 |
|---|---|---|
| 4티어 완성 평균 시점 | **4:00~5:00** | 너무 빠르면 U7 적용, 너무 늦으면 U15 자동지급 +2 |
| Phase C 보스 처치 시간 | **3~5초** | 0.5초컷이면 BOSS_HP_MULT_PHASE_C 50→70, 10초+면 50→35 |
| 강화 점 사용 패턴 | 1티어 평균 3/5, 2티어 2/3 | 1티어 풀강(5/5) 디폴트면 1티어 천장 5→3 |
| 7분 도달률 | **50~70%** | 90%+ 너무 쉬움, 30%- 너무 어려움 |

### 🔧 1차 패치 구체 수치 (U13 + U14 + U15)

**U13: 보스 3단 페이즈화**

| Phase | 시점 | HP 배율 | 속도 배율 | 처치 보상 |
|---|---|---|---|---|
| A: 워밍업 | 0:00 ~ 2:30 | ×15 | ×0.8 | +50G |
| B: 시험 | 2:30 ~ 4:30 | ×25 | ×0.7 | +80G + 보상 카드 |
| **C: 진검** | **4:30 ~ 7:00** | **×50** | **×0.55** | +150G + 보상 카드 +1장 |

신규 상수: `BOSS_HP_MULT_PHASE_A/B/C`, `BOSS_SPEED_MULT_PHASE_A/B/C`, `BOSS_PHASE_B_START_MS = 150000`, `BOSS_PHASE_C_START_MS = 270000`

**U14: 티어 강화 시스템 (안 1 — 회당 한정, 별도 자원)**
- 자원: `enhancePoints` (별도 자원, 골드 X)
- 획득: 보스 처치당 +1점 (`BOSS_KILL_ENHANCE_POINT = 1`)
- 1티어 강화: 1점 / +1 dmg / 최대 5회 → `tier1AtkBonus` 상태
- 2티어 강화: 2점 / +1 dmg / 최대 3회 → `tier2AtkBonus` 상태
- **3·4티어 강화 없음** (코어 판타지 보호 — Astral_God는 여전히 한 방의 정점)
- 회당 리셋 (영구 X)
- HUD: 우측에 `[⚔️1 +N/5]` `[⚔️2 +N/3]` 버튼 2개 + `🔥 강화점 N` 카운터
- 데미지 적용: `combat.ts`에서 unit.tier===1 ? +tier1AtkBonus 합산



### 🧠 코어 판타지 영향 분석 (디자이너 검증)

| 질문 | 답 |
|---|---|
| 코어 판타지 훼손? | **보완**. 1티어 강화로 "버티기" 시간 확보 → 3·4티어 합성 여유 → Pop 박자 도달 확률 ↑ |
| 합성 시스템 약화? | 방어됨. 3·4티어 강화 없음 + Phase C 685 HP 게이트가 합성 강제 |
| 역할 분리 | 명확. **1티어=버티기 다리 / 2티어=중간 가속 / 3·4티어=돌파의 정점** — 2단 빌드 사이클 명시화 |

### 📝 그룹 D/E 추가 메모 (시각 폴리시 / 사운드)

- **U4 지뢰**: 매설 순간 점선 원 0.5초 마킹 + 폭발 셰이크 80ms 추가 고려
- **U11 보이스**: BGM/SFX는 이미 `SoundManager.ts`로 구현됨. Astral_God 보이스만 추가하면 됨. iOS 자동재생 정책(첫 터치 후만 재생) 주의.

---


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
        ├── SoundManager.ts          # Web Audio API BGM + SFX (신규 2026-05-25)
        └── input/
            └── DragController.ts
```

## 주요 상수 (src/game/config.ts)
| 상수 | 값 | 설명 |
|---|---|---|
| `GAME_WIDTH` / `GAME_HEIGHT` | 360 / 640 | 캔버스 크기 |
| `MOBILE_SAFE_ZONE_TOP` / `_BOTTOM` | 24 / 16 | 노치/홈바 안전 여백 |
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
- **상태:** `phase` ('playing'|'clear'|'overclock'|'gameover'|'victory'), `elapsedMs`, `enemyCount`, `gold`, `gems`, `units: UnitData[]`, `summonCost`, `maxUnits`, `populationUpgradeCost`, `pendingBossSpawn`, `criticalProbability`, `isInfiniteMode`, `pendingNotification`, `trackWaypoints`, `unitZone`, `unitDamageMap: Map<number,{race,total}>`, `adReviveUsed`, `pendingCritHaptic`
- **메서드:** `tick(deltaMs)`, `enterOverclock()`, `registerSpawn()`, `registerKill(reward)`, `summon()`, `upgradePopulation()`, `moveUnit(id,x,y)`, `sellUnit(id)`, `toggleLock(id)`, `useGemContinue()`, `startBreeding()`, `completeBreeding()`, `synthesize()`, `processCombat(snapshots)`, `generateRewards(count)`, `applyReward(type)`, `useAdRevive()`, `getTopDamageDealers(n)`, `serialize()`, `deserialize(_data)`
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
- `EnemySnapshot`, `AttackEvent` (srcRace?, srcId?), `CombatResult` (combat I/O)

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
| 스테이지 | Stage 1/2/3 구현 (2026-05-25). Stage2: FAST↑ TANK2분, Stage3: TANK1분/보스HP22× |
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
| C | ~~웨이브 예고창 (다음 BOSS 예고 1줄)~~ **✅ 완료** — 보스 5초 전 하단 알림 | 히랜디 | Plan | `GameState.ts`, `GameScene.ts` |
| H | ~~킬 스트릭: 1초 내 5킬 → +10G~~ **✅ 완료** — 🔥 킬 스트릭! +10G 알림 | VS | Pop | `GameState.ts`, `GameScene.ts` |
| D | 티어별 킬 카운터 + 보너스 골드 (2티어 50킬 → +30G) | 히랜디 | Grind | 단순 HUD 1줄 |
| E | 보스 10초 이내 처치 → 보상 카드 +1장 | 운빨존많겜 | Grind+Pop | 첫 보스는 타임 보너스 없이 |

### 🟡 2순위 신규 후보 (game-designer 2026-05-25 진단)

| # | 기능 | 박자 | 구현 비용 | 비고 |
|---|---|---|---|---|
| F-1 | 판 종료 후 "다음 판 기록 예고" 텍스트 | Loop 당김 | 매우 낮음 | 팝업 하단 1줄. localStorage 최고기록과 연동하면 시너지 |

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
| N | ~~오버클록 진입 시 BGM 전환~~ **✅ 완료** — BGM+SFX 전체 시스템 구현 (Web Audio API) | VS | Loop | `SoundManager.ts` |
| O | 유닛 공격 누적 → 레벨업 (dmg +20%) | Merge Mansion | Grind | UnitData 구조 변경 필요 |

---

## 🗓️ 마일스톤

### 🎯 5월 마일스톤 (2026-05-31): 친구 클로즈 테스트
**"폴리시보다 피드백. 일단 친구들 손에 쥐여주기."** Firebase Hosting 웹 URL 배포.

**작업 순서:** GameState 분리 → 리팩토링 → 게임 내실 다지기 → 튜토리얼 → 풀플레이 → 배포 → 사전 → 본격

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

**결정 사항 (2026-05-28 designer 의뢰 결과):**
- **톤: B안 아르누보-Chibi 하이브리드 확정** (명일방주/림버스 톤 + 알폰스 무하 골드 곡선)
- **분위기: 다크 판타지 + 골드 액센트** (UI `artnouveau.ts`와 동일 톤)
- **생성 도구: NovelAI v4 메인** + Midjourney 보조 (타이틀/Astral_God 도감 일러스트)
- 무하 액센트 단계별: T1 절제 → T2 중간 → T3 강조 → T4 만개 (Pop 서사 시각화)

상세 의뢰서는 아래 "🎨 NovelAI 프롬프트 의뢰서" 섹션 참조.

---

## 🎨 NovelAI 프롬프트 의뢰서 (2026-05-28 designer 작성)

> **컨텍스트:** B안 아르누보-Chibi / NovelAI v4 / 총 39건 (캐릭터 25 + T3 보완 2는 25 내 / 배경·UI 8 + 스토어 4 + 적 별도 추후).
> **색상 기준:** `src/scenes/artnouveau.ts` 실측값 — `AN.BG_DEEP=#1a1a0f` / `AN.BG_DARK=#2c2a14` / `AN.GOLD_DIM=#7a5c1e` / `AN.GOLD_MID=#b8882a` / `AN.GOLD_MAIN=#e8c84a` / `AN.VINE_DARK=#6b7a3a` / `AN.VINE_MAIN=#8aaa4a` / `AN.TEAL=#4ab8b8` / `ANS.CREAM=#f0e8c8` / `ANS.PARCH=#c8b97a` / `BOSS_RED=#a83232`(추가 정의 필요).

### 1. 캐릭터 공통 — 베이스 프롬프트 (전 25종)

NovelAI v4 Tags 영역에 그대로 붙여 넣음. 캐릭터별 토큰만 갈아끼움.

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2024,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
front view, facing viewer, symmetrical pose, full body, standing on ground,
arms slightly away from torso, legs shoulder-width apart, relaxed T-pose variant,
neutral idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
art nouveau accents, ornate golden filigree, mucha-style decorative curves,
flowing vine motifs, subtle halo of botanical patterns behind character,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
{character race color} dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
```

**핵심 의도:**
- `relaxed T-pose variant` + `arms slightly away from torso` — 후속 Phaser tween 적용 위한 핵심
- `clear silhouette, separable limbs` — 64~96px 다운스케일 가독성
- `weapon held lowered, not swinging` — 정지 컷 (모션 적용 시 어색함 방지)

### 2. 캐릭터 공통 — 네거티브 프롬프트

```
lowres, bad anatomy, bad hands, text, error, missing fingers, extra digits,
fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts,
signature, watermark, username, blurry,
multiple characters, 2girls, 2boys, crowd, group,
dynamic pose, action pose, motion blur, swinging weapon, mid-attack,
running, jumping, sitting, lying down, leaning,
arms crossed, arms behind back, arms touching torso, hands hidden,
realistic, photorealistic, 3d render, hyperrealistic skin,
dark background, complex background, scenery, landscape, indoor, outdoor,
shadow under feet, ground shadow, gradient background,
asymmetric stance, side view, back view, three-quarter view,
extra limbs, missing limbs, fused limbs,
oversaturated, neon glow overload, cluttered details, busy patterns on face,
cape covering body, full body cloak,
```

### 3. 종족별 색상 태그 (베이스의 `{character race color}` 치환)

| 종족 | HEX | NovelAI 컬러 태그 |
|---|---|---|
| Human | `#4488ff` | `royal blue, sapphire blue, cobalt blue accents` |
| Beast | `#44cc44` | `emerald green, leaf green, forest green accents` |
| Robot | `#aa44cc` | `royal purple, amethyst, magenta-violet metallic` |
| Human_Robot | `#00eeff` | `cyan, turquoise, electric teal accents` |
| Human_Beast | `#ff44aa` | `hot pink, magenta, fuchsia accents` |
| Beast_Robot | `#ff7700` | `bright orange, amber, tangerine accents` |
| Cyborg_Wizard | `#ffcc00` | `golden yellow, saffron, sunburst yellow` |
| Dino_Mecha | `#ff4400` | `crimson red, scarlet, blood red metallic` |
| Griffin | `#00ffaa` | `mint green, aqua, jade luminous` |
| Thunder_Hawk | `#aaff00` | `electric yellow-green, citrine, lightning yellow` |
| **Berserk_Shaman** | **`#9b30ff`** | `deep violet, witch purple, shamanic purple aura` |
| **Chaos_Artillery** | **`#ff9500` + `#3a3a3a`** | `blaze orange, ember orange + gunmetal steel gray dual-tone` |
| Astral_God (T4) | 혼합 | `prismatic gold, iridescent rainbow, divine light` |

### 4. 무하 액센트 단계별 강도

| 티어 | 추가 토큰 |
|---|---|
| **T1** | `minimal gold trim, single thin filigree line on collar, no halo` |
| **T2** | `moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders` |
| **T3** | `rich mucha-style halo behind head, ornate golden filigree on armor, vine motifs framing character, prominent decorative arch` |
| **T4** | `full mucha halo, elaborate golden vines wrapping the character, radiant divine background patterns, peacock feather motifs, blooming flower ornaments, baroque gold framework` |

### 5. 캐릭터 25종 개별 토큰

#### Tier 1 (6종)

| # | 캐릭터 | 종족 | 추가 토큰 | 무기/소품 |
|---|---|---|---|---|
| 1 | Warrior | Human | `young knight boy, short brown hair, blue tunic, iron pauldron, determined face` | short iron sword held downward at right side |
| 2 | Archer | Human | `young archer girl, blonde long ponytail, blue hood, leather vest, calm expression` | wooden longbow held vertically in left hand, no arrow drawn |
| 3 | Dog | Beast | `chibi shiba inu warrior, anthropomorphic puppy, green scarf, tiny leather harness, cheerful` | small bone club resting on shoulder |
| 4 | Squirrel | Beast | `chibi squirrel girl, fluffy tail, green hooded cape, acorn pendant, curious eyes` | tiny wooden slingshot in right hand |
| 5 | Android | Robot | `chibi android boy, smooth white plating, purple visor, antenna, neutral expression` | compact arm-mounted blaster pointed downward |
| 6 | Cannon | Robot | `chibi cannon mecha, stubby robot body, purple plating, single eye sensor, round feet` | shoulder-mounted small cannon barrel, idle |

#### Tier 2 (12종)

| # | 캐릭터 | 종족 | 추가 토큰 | 무기/소품 |
|---|---|---|---|---|
| 7 | Bio_Wolf | Human_Beast | `werewolf knight youth, wolf ears tail, pink-trimmed armor, fanged smile, muscular chibi` | clawed gauntlet, no sword |
| 8 | Acorn_Girl | Human_Beast | `squirrel-eared girl knight, pink dress armor, acorn hair clip, bushy tail` | acorn-headed mace held low |
| 9 | Falcon_Eye | Human_Beast | `falcon-winged archer girl, pink feather cloak, sharp eyes, small wings on back` | composite bow held vertically |
| 10 | Acorn_Hunter | Human_Beast | `squirrel-tailed hunter boy, pink leather coat, headband, three small arrows on belt` | compact crossbow held downward |
| 11 | Cyborg_Slasher | Human_Robot | `cybernetic swordsman youth, cyan glowing visor, half-mech arm, sleek armor` | energy katana sheathed at hip, hand on hilt |
| 12 | Cannon_Shooter | Human_Robot | `cyborg gunner boy, cyan-plated shoulder cannon, mechanical eye, confident smirk` | large arm cannon held low at side |
| 13 | Laser_Sniper | Human_Robot | `cyborg sniper girl, cyan visor scope, sleek bodysuit, long braid` | laser rifle slung over shoulder, barrel down |
| 14 | Missile_Gunner | Human_Robot | `cyborg heavy gunner boy, cyan-armored, missile pods on back, helmet` | dual missile launchers on shoulders, idle |
| 15 | Blade_Hound | Beast_Robot | `mecha-dog warrior, orange-plated canine, robotic legs, glowing optics` | wrist blades retracted, paws down |
| 16 | Gatling_Dog | Beast_Robot | `cyber shiba mecha, orange armor, gatling barrel on back, tongue out` | multi-barrel gatling mounted on back, idle |
| 17 | Electric_Coon | Beast_Robot | `raccoon mecha boy, orange-striped armor, sparking antenna, mischievous` | taser baton held downward |
| 18 | Menhera_Squirrel | Beast_Robot | `squirrel mecha girl, orange jumpsuit, twin tails, bandages on cheeks, dazed cute expression` | small drill weapon at side |

#### Tier 3 (6종)

| # | 캐릭터 | 종족 | 추가 토큰 | 무기/소품 |
|---|---|---|---|---|
| 19 | Cyborg_Wizard | Cyborg_Wizard | `cybernetic mage youth, golden yellow robes, mechanical staff arm, glowing circuit runes, mucha halo with gear motifs` | golden tech staff held vertically |
| 20 | Dino_Mecha | Dino_Mecha | `young pilot girl inside small mecha dinosaur, crimson red armor plating, T-rex head silhouette, mucha halo with flame curves` | mecha tail and clawed arms |
| 21 | Griffin | Griffin | `griffin knight boy, mint green feathered armor, eagle wings spread slightly, lion-tail, mucha halo with feather motifs` | talon gauntlets |
| 22 | Thunder_Hawk | Thunder_Hawk | `electric hawk knight girl, yellow-green armor, lightning patterns, hawk wings folded, mucha halo with lightning bolts` | lightning spear held vertically |
| 23 | **Berserk_Shaman** | Berserk_Shaman | `berserker shaman chibi, glowing purple aura swirling around body, war paint on cheeks, feral grin, frenzied stance, totem mask pushed up, dual hatchet axes, mucha-style swirling aura ornament, art nouveau halo of purple smoke` | 양손 손도끼 2자루, 등에 부족 토템, 발밑 보라색 룬 원 |
| 24 | **Chaos_Artillery** | Chaos_Artillery | `chaos artillery chibi gunner, heavy mortar cannon on shoulder, bandolier of mini-bombs across chest, soot-streaked goggles, cocky grin, explosive shells strapped to belt, mucha-style smoke ornament curling behind, art nouveau ammunition border` | 어깨 박격포, 가슴 탄띠, 고글, 벨트 미사일 셸 |

#### Tier 4 (1종)

| # | 캐릭터 | 종족 | 추가 토큰 | 무기/소품 |
|---|---|---|---|---|
| 25 | Astral_God | (혼합/신성) | `divine astral deity youth, androgynous, prismatic golden robes with rainbow iridescence, six small angelic wings, glowing third eye, ornate crown, serene godly expression, full mucha halo with peacock feathers, blooming lotus, golden vines wrapping entire body, radiant constellation background ring` | crystalline scepter held vertically with both hands, suspended chains of gold |

### 6. Vibe Transfer 운용법 (캐릭터 25종 일관성 핵심)

**Step 1 — Anchor 제작 (Warrior 1종)**
- 베이스 + 색상 + 토큰만으로 시드 여러 개 → 만족스러운 1장 확보
- 검수: chibi 1:1.5 / 정면 / 팔 분리 / 골드 라인 절제 / 파랑 50%+
- 저장: `anchor_warrior.png`

**Step 2~5 — 강도 단계별**

| 단계 | 슬롯1 (anchor_warrior) | 슬롯2 (보조) |
|---|---|---|
| T1 나머지 5종 | Info 1.0 / Str 0.6 | — |
| T2 12종 | Info 1.0 / Str 0.4 | T1 베스트, Str 0.3 |
| T3 6종 | Info 1.0 / Str 0.35 | T2 베스트, Str 0.3 |
| T4 Astral_God | Info 1.0 / Str 0.25 | T3 베스트, Str 0.4 |

### 7. 캐릭터 NovelAI 설정 (전 25종 공통)

| 항목 | 값 |
|---|---|
| Model | NAI Diffusion V4 Full |
| Resolution | 1024 × 1024 (Square Large) |
| Steps | 28 |
| Guidance (CFG) | 5.0 |
| Prompt Guidance Rescale | 0.0 |
| Sampler | Euler |
| Noise Schedule | Karras |
| Variety+ / SMEA / DYN | OFF |

**시드 운영:** Warrior anchor 시드 메모 → T1 ±10 / T2 +100 / T3 +200 / T4 +300 식으로 그룹화. 신규 T3는 `Berserk_Shaman=99031` / `Chaos_Artillery=99032`.

---

### 8. 배경/UI/버튼 (8종)

> **공통:** NovelAI v4 / `Sampler: k_euler_ancestral` / `Steps: 28` / `CFG: 5.0~6.0` / 시드 자산별 고정. `artnouveau.ts` 톤(딥포레스트+골드)와 톤 일치.

#### 8-1. 메인 배경 (인게임)

- **해상도:** 720×1280 (모바일 2배) / **Seed `81001`** / CFG `5.0`

```
art nouveau mucha-style vertical game background, deep dark forest at night, distant moonlit silhouettes of birch and oak trees, ornate golden vine borders framing the left and right edges, mucha-style swirling botanical filigree in the top and bottom corners, intricate gold leaf pattern, parchment-cream highlights, faint glowing fireflies, soft volumetric mist near the ground, very dark muted center area with subtle low-poly pixel texture, color palette dominated by deep forest #1a1a0f, dark olive #2c2a14, antique gold #b8882a, bright gold #e8c84a, fern green #8aaa4a, mobile portrait composition, no characters, atmospheric depth
```

**네거티브:**
```
character, person, figure, human, animal, creature, monster, knight, warrior, mascot, face, eyes, text, letters, ui, hud, button, frame inside center, bright center, overexposed, watermark, signature, logo, modern, sci-fi, neon, cyberpunk, photographic, photorealistic
```

#### 8-2. 타이틀 화면 배경

- **해상도:** 1024×1820 / **Seed `81002`** / CFG `5.5` / 중앙 1/3 로고 자리 비움

```
art nouveau mucha title screen background, grand ornamental golden frame, central oval reserved empty space for a logo, swirling acanthus leaves, intertwined vines, two large symmetrical mucha-style decorative panels on left and right, art nouveau botanical filigree, golden parchment highlights, deep forest backdrop, soft warm candlelight glow from below, mythical aura, mucha alphonse poster style, mobile portrait, low-poly pixel-art finish on edges, color palette of deep forest #1a1a0f, antique gold #b8882a, bright gold #e8c84a, cream #f0e8c8, fern #8aaa4a, dramatic but elegant
```

**네거티브:**
```
character, person, figure, human face, eyes, animal, creature, text, letters, words, title, logo content, watermark, signature, ui buttons, hud, modern, sci-fi, neon, photographic, photorealistic, cluttered center, busy center
```

#### 8-3. 스테이지 선택 배경

- **해상도:** 720×1280 / **Seed `81003`** / CFG `5.0` / 중앙 세로 띠 비움

```
art nouveau mucha stage select screen background, ornate vertical golden frame on left and right edges, three faint horizontal divider gold lines across the middle, mucha-style botanical corner ornaments at all four corners, intricate filigree, deep forest backdrop, vine motifs, golden parchment highlights, central vertical strip kept dark and minimal for ui slots, mobile portrait composition, low-poly pixel-art texture, color palette of deep forest #1a1a0f, dark olive #2c2a14, antique gold #b8882a, bright gold #e8c84a, fern #8aaa4a, parchment cream #c8b97a
```

**네거티브:**
```
character, person, figure, human, animal, creature, face, text, letters, numbers, button labels, ui content, watermark, signature, busy center, cluttered middle, modern, sci-fi, neon
```

#### 8-4. 팝업 프레임 (가운데 투명 PNG)

- **해상도:** 1024×1024 / **Seed `81004`** / CFG `6.0` / **중앙 알파 컷 후처리 필수**

```
art nouveau mucha decorative frame, ornate golden rectangle border occupying the outer 20 percent of the canvas, intricate filigree, acanthus leaves at all four corners, mucha-style swirling vine motifs, jeweled inlay with small teal accents, antique gold border with bright gold highlights, central rectangular area completely transparent and empty, symmetric composition, low-poly pixel-art finish, color palette antique gold #b8882a, bright gold #e8c84a, fern #8aaa4a, teal #4ab8b8 accents, no background fill in center
```

**네거티브:**
```
character, person, figure, human, animal, creature, face, text, letters, numbers, button, filled center, opaque center, solid center background, watermark, signature, modern, sci-fi, neon, photographic
```

#### 8-5. 일반 버튼 (아이들)

- **해상도:** 512×128 가로 / **Seed `81005`** / CFG `6.0`

```
art nouveau mucha-style horizontal button background, elongated rounded rectangle, antique gold ornate border with thin inner gold line, deep dark olive fill #2c2a14, small mucha-style vine flourish on left and right ends, subtle parchment highlight at top edge, embossed feel, low-poly pixel-art finish, idle state, soft warm tone, color palette deep olive #2c2a14, antique gold #b8882a, bright gold #e8c84a, fern #8aaa4a, no glow
```

**네거티브:**
```
character, person, figure, face, text, letters, words, label, icon, symbol, glow, bright light, neon, watermark, signature, modern, sci-fi, photographic, vertical orientation
```

#### 8-6. 일반 버튼 (호버/프레스)

- **해상도:** 512×128 / **Seed `81005` (아이들과 동일)** / CFG `6.0`

```
art nouveau mucha-style horizontal button background, elongated rounded rectangle, antique gold ornate border with bright gold inner line, deep dark olive fill #2c2a14 with subtle inner glow, small mucha-style vine flourish on left and right ends glowing softly, embossed feel, low-poly pixel-art finish, hover state, warm golden glow emanating from edges, color palette deep olive #2c2a14, antique gold #b8882a, bright gold #e8c84a, cream highlight #f0e8c8, fern #8aaa4a, soft glow halo
```

**네거티브:**
```
character, person, figure, face, text, letters, words, label, icon, symbol, neon, blue glow, red glow, watermark, signature, modern, sci-fi, photographic, vertical orientation, oversaturated
```

#### 8-7. 보스 등장 이펙트 (배경 오버레이, 알파)

- **해상도:** 720×1280 / **Seed `81007`** / CFG `5.5` / 중앙 50% 알파 컷

```
art nouveau mucha-style boss warning overlay, vertical mobile composition, blood red ornate frame on all four edges, mucha-style thorny vines crawling inward from the borders, jagged decorative spikes, central area kept fully transparent and empty, ominous red and dark crimson palette, alarm motif, distressed gold accents, low-poly pixel-art finish, dramatic vignette dark in the center, color palette boss red #a83232, deep crimson #5a1010, dark forest #1a1a0f, antique gold #b8882a, transparent center
```

**네거티브:**
```
character, person, figure, monster, creature, face, eyes, boss silhouette, text, letters, warning sign, exclamation mark, ui, hud, button, opaque center, filled center, bright center, watermark, signature, modern, neon, photographic
```

#### 8-8. 승리/패배 팝업 배경

- **해상도:** 1024×1024 / **Seed `81008`** / CFG `6.0` / 톤 변형은 후처리 또는 프롬프트에 `triumphant warm tone` vs `mournful cold tone` 추가

```
art nouveau mucha victory or gameover popup background, central radiating golden halo with mucha-style decorative sunburst rays, ornate symmetric vine and laurel wreath framing the halo, large empty central oval area reserved for text, deep dark forest backdrop fading to black at the edges, golden parchment highlights, mucha alphonse poster composition, jeweled accents in teal and gold, low-poly pixel-art finish, color palette deep forest #1a1a0f, antique gold #b8882a, bright gold #e8c84a, cream #f0e8c8, teal #4ab8b8 accents, fern #8aaa4a
```

**네거티브:**
```
character, person, figure, human, animal, creature, face, eyes, text, letters, words, victory text, defeat text, score, numbers, button, ui content, watermark, signature, modern, sci-fi, neon, photographic, filled center, busy center
```

---

### 9. 스토어 메타 (4종)

> **공통:** Vibe Transfer (강도 0.5~0.6) — 인게임 캐릭터 PNG 중 Astral_God 또는 Griffin 참조로 톤 통일.

#### 9-1. 앱 아이콘

- **해상도:** 1024×1024 (iOS), 512×512 (Play 다운스케일) / **Seed `82001`** / CFG `6.5` / Vibe: Astral_God, Str 0.5

```
mobile game app icon, square composition, art nouveau mucha style, single iconic chibi astral god deity centered, glowing halo with mucha-style golden sunburst rays radiating outward, ornate art nouveau border just inside the square edges, deep forest background fading to gold at the corners, mucha alphonse poster aesthetic, low-poly pixel-art finish, bold readable silhouette even at small size, eye-catching, color palette deep forest #1a1a0f, bright gold #e8c84a, antique gold #b8882a, cream #f0e8c8, teal #4ab8b8 accents, mobile app icon design, no text
```

**네거티브:**
```
text, letters, words, title, logo content, ui, hud, button, multiple characters, group of characters, busy composition, cluttered, watermark, signature, photorealistic, photographic, modern, sci-fi, neon, blurry, low contrast, weak silhouette, rounded corners drawn in, drop shadow outside
```

#### 9-2. 스플래시

- **해상도:** 2048×2048 / **Seed `82002`** / CFG `6.0` / 중앙 1/3 로고 자리 비움

```
mobile game splash screen, square 2048 composition, art nouveau mucha style, grand golden halo radiating from center, mucha-style sunburst rays, ornate symmetric vine and laurel framing, central rectangular area reserved empty for a logo placement (about one-third of the canvas height), deep forest backdrop, mucha alphonse poster aesthetic, dramatic warm cinematic lighting, golden parchment highlights, low-poly pixel-art finish on the ornamental details, jeweled teal and gold accents, color palette deep forest #1a1a0f, bright gold #e8c84a, antique gold #b8882a, cream #f0e8c8, fern #8aaa4a, teal #4ab8b8, no text
```

**네거티브:**
```
character, person, figure, multiple characters, face, eyes, text, letters, words, logo content, title text, ui, hud, button, watermark, signature, photorealistic, photographic, modern, sci-fi, neon, busy center, filled center
```

#### 9-3. Play 피처 그래픽

- **해상도:** 1024×500 / **Seed `82003`** / CFG `6.5` / Vibe: Astral_God + Griffin + Cyborg_Wizard, Str 0.55 / 좌측 1/3 텍스트 자리

```
horizontal landscape mobile game feature graphic, art nouveau mucha style, three chibi heroes posed dynamically on the right third of the canvas (a chibi griffin warrior, a chibi cyborg wizard, and a chibi astral god deity in the center back glowing with a golden halo), epic battle pose, mucha-style decorative vines and golden filigree framing the edges, deep dark forest battlefield background with soft golden mist, dramatic warm cinematic lighting, left third kept relatively empty and darker for title text overlay, low-poly pixel-art finish, mucha alphonse poster aesthetic, color palette deep forest #1a1a0f, bright gold #e8c84a, antique gold #b8882a, cream #f0e8c8, fern #8aaa4a, teal #4ab8b8, mint #00ffaa, violet #9b30ff accents
```

**네거티브:**
```
text, letters, words, title, logo, game name, button, ui, hud, score, number, watermark, signature, photorealistic, photographic, modern, sci-fi, neon, full screen character on left, cluttered left side, vertical composition, portrait orientation
```

#### 9-4. 스크린샷 키비주얼

- **해상도:** 1080×1920 / **Seed `82004`** / CFG `6.5` / Vibe: T3+T4 멀티 참조, Str 0.6

```
vertical mobile game key visual, art nouveau mucha style, epic hero lineup composition, chibi astral god deity in the center top glowing with massive golden halo and sunburst rays, six chibi tier-3 heroes arranged in a symmetric arc around and below (chibi cyborg wizard with arcane orb, chibi dino mecha with rocket fist, chibi griffin with feathered wings, chibi thunder hawk archer with lightning bow, chibi berserk shaman with dual axes and purple aura, chibi chaos artillery gunner with shoulder mortar), all heroes posed heroically, mucha-style ornate vine and laurel borders framing the canvas, dramatic warm cinematic lighting, deep dark forest battlefield background, golden mist, jeweled accents, low-poly pixel-art finish, mucha alphonse poster aesthetic, mobile portrait 9:16, color palette deep forest #1a1a0f, bright gold #e8c84a, antique gold #b8882a, cream #f0e8c8, fern #8aaa4a, teal #4ab8b8, full hero ensemble bloom shot
```

**네거티브:**
```
text, letters, words, title, logo, game name, ui, hud, button, score, number, hp bar, watermark, signature, photorealistic, photographic, modern, sci-fi, neon, single character, empty composition, horizontal landscape orientation, missing limbs, fused characters, extra characters, more than seven characters, fewer than five characters
```

---

### 10. 시드 일람 (재생성 일관성)

| 시드 | 자산 |
|---|---|
| `(anchor)` | Warrior — 사용자가 만족스러운 시드 메모 |
| `+10~50` | T1 나머지 5종 |
| `+100~111` | T2 12종 |
| `+200~205` | T3 6종 (Berserk_Shaman `99031` / Chaos_Artillery `99032` 예외) |
| `+300` | T4 Astral_God |
| `81001` | 메인 배경 (인게임) |
| `81002` | 타이틀 배경 |
| `81003` | 스테이지 선택 배경 |
| `81004` | 팝업 프레임 |
| `81005` | 버튼 (아이들/호버 공용) |
| `81007` | 보스 등장 오버레이 |
| `81008` | 승리/패배 팝업 배경 |
| `82001` | 앱 아이콘 |
| `82002` | 스플래시 |
| `82003` | Play 피처 그래픽 |
| `82004` | 스크린샷 키비주얼 |

### 11. 파일명/디렉토리 규칙

```
public/assets/
├── characters/
│   ├── unit_warrior_tier1.png
│   ├── unit_berserk_shaman_tier3.png
│   ├── unit_chaos_artillery_tier3.png
│   └── unit_astral_god_tier4.png
├── backgrounds/
│   ├── bg_ingame_main.png
│   ├── bg_title.png
│   └── bg_stage_select.png
├── ui/
│   ├── popup_frame.png            (알파)
│   ├── button_idle.png            (9-slice)
│   ├── button_hover.png           (9-slice)
│   ├── overlay_boss_warning.png   (알파)
│   └── popup_result_bg.png
└── store/
    ├── icon_1024.png
    ├── icon_512.png
    ├── splash_2048.png
    ├── feature_graphic_1024x500.png
    └── keyvisual_1080x1920.png
```

### 12. 워크플로우 체크리스트

```
[Phase 0 — 준비]
□ NovelAI 구독 Opus 티어 (Vibe Transfer 슬롯 5개 사용)
□ rembg 설치 (pip install rembg) — 누끼 자동화
□ 출력 폴더 구조 생성 (위 트리)

[Phase 1 — Warrior Anchor 제작]
□ 베이스+네거티브+Warrior+Human 색상 입력
□ 시드 미고정 6~10장 → 만족 컷 선별
□ 검수: chibi 1:1.5 / 정면 / 팔 분리 / 파랑 50%+ / 골드 절제
□ anchor_warrior.png 저장 + 시드 번호 메모

[Phase 2~5 — T1~T4 양산 (Vibe Transfer 강도 조절)]
□ T1 나머지 5종 (Str 0.6)
□ T2 12종 (Str 0.4 + T1 베스트 Str 0.3)
□ T3 6종 (Str 0.35 + T2 베스트 Str 0.3)
□ T4 Astral_God (Str 0.25 + T3 베스트 Str 0.4, 20장 이상 선별)

[Phase 6 — 후처리 (rembg)]
□ raw → rembg → cutout (rembg i input.png output.png)
□ 가장자리 fringe 클린업 (GIMP/Photoshop)

[Phase 7 — 인게임 검증]
□ 96px 다운스케일 미리보기 → 종족색·실루엣 식별 확인
□ final/로 이동, unit_<race>_tier<N>.png 규칙 적용

[Phase 8 — 배경/UI/스토어 자산]
□ 8종 배경/UI (시드 81001~81008)
□ 4종 스토어 (시드 82001~82004)
□ 각 자산 알파 처리 필요한 것만 후처리

[Phase 9 — Phaser 통합 (개발자 작업)]
□ public/assets/ 배치
□ idle bob / 공격 텔레그래프 / 피격 셰이크 tween 적용
□ 64~96px 인게임 확인
```

### 13. 사용자 결정 대기 항목

- [ ] Warrior anchor 시드 메모 → 시드 일람표 갱신
- [ ] Berserk_Shaman `#9b30ff` / Chaos_Artillery `#ff9500+#3a3a3a` 색상 OK 여부
- [ ] `artnouveau.ts`에 `AN.BOSS_RED = 0xa83232` 추가 정의 (별도 코드 작업 요청 시)
- [ ] 승리/패배 팝업: 한 장 + 톤 후처리 vs 두 장 별도 생성
- [ ] 스크린샷 키비주얼: 6+1 합본 vs Astral_God 단독 (Vibe 강도 0.7)

---

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
