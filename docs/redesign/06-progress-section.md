# PROGRESS.md 삽입용 섹션 (docs/redesign/05-design-v3.md §6 변환본)

---

## 🎯 리디자인 로드맵 — 명가(Bloodline) 패치 (2026-07-06 확정)

> **"뽑는 게임이 아니라 낳는 게임 — 당신이 교배로 길러낸 혈통이 신(神)을 낳는, 유일한 랜덤 디펜스."** 상세 기획: `docs/redesign/05-design-v3.md` (유일한 기획 원천 — 수치·규칙 충돌 시 그쪽이 정답).
> 공통 원칙: **데이터/렌더 분리 불가침** — 규칙·상태·판정은 `src/game/*`(Phaser 의존 0, 순수 TS 테스트 가능), 연출·입력은 `src/scenes/*`. 트랙 좌표·배치존·사거리(config.ts) 무변경. 각 M 종료 = `npm run build` 통과 + 명시된 순수 TS 테스트 + 사용자 플레이테스트 게이트 통과(헤드리스 검증 금지, CLAUDE.md §6).

### 마일스톤 (투입 순서 고정: M1a→M1b→M2→M3→M4→M5)

| # | 마일스톤 | 난이도 | 주요 대상 파일 | 신규 상수·타입 예시 | 완료 판정 (build + 순수 TS 테스트) |
|---|---|---|---|---|---|
| 🥇 M1a | **제품 쉘** — 게임 로직 무변경. `JuicyButton`(라운드 8px+금테, 눌림 scale 0.94/80ms+햅틱, `pointerup`+슬롭 8px)으로 Text 버튼 45개 치환. HUD 재배치: 상단 바 y24~68(44px, ⏸ 44×44 포함 폭 348px)/필드 y68~536/독 y536~624(88px). 적 한계 32px 카운트 링. 겹치기 교배·기존 드래그 판매는 **그대로 존치** | 소~중 | `src/scenes/ui/JuicyButton.ts`(신규), `render/HudRenderer.ts`, `render/popups/*`, `scenes/constants.ts`, `src/game/config.ts`(레이아웃 상수만 추가) | `HUD_BAR_Y=24/HUD_BAR_H=44`, `DOCK_Y=536/DOCK_H=88`, `MIN_HIT_PX=48`(미만 지정 시 clamp+개발 빌드 throw), `UNIT_MAX_HALF_H=16` | build / Text버튼 grep 0건(범위: popups/·HudRenderer 등 UI 버튼 생성부 한정, 허용: UnitRenderer 유닛 인터랙션·팝업 배경 레이어) / clamp 유닛 테스트 / **크롬-세이프존-트랙 산술 테스트**(config 상수 기반: 크롬이 세이프존 침범 또는 트랙 y90~520+반높이 16px와 교차 시 실패) |
| 🥇 M1b | **드래그 컨텍스트 모드** — 유닛 드래그 시 독 변신(중앙 둥지 슬롯 2개 56×56, 좌우 가장자리 판매존 각 48px, 시각=판정 동일 상수). 드래그 스펙: 스프라이트 -40px 상향, 슬롯 근접 스냅+하이라이트, **존 밖 드롭=원위치 취소**. 유닛 탭 바텀시트 '둥지로'/'판매' 2탭 경로. 슬롯은 기존 `GameState.startBreeding`에 임시 배선(구 85/15, 부모 비소모), **겹치기 교배 코드 이때 제거**. 홀드 확인은 스텁(항상 off, 판정은 M3) | 중 | `input/DragController.ts`, `render/HudRenderer.ts`(독 변신), `render/popups/`(바텀시트 신규), `src/game/GameState.ts`(겹치기 제거만) | `DRAG_LIFT_OFFSET_Y=-40`, `NEST_SLOT_SIZE=56`, `SELL_EDGE_W=48`, `DRAG_SNAP_DIST` | build / 판매존 시각=판정 동일 상수 테스트 / 겹치기 경로 제거 grep 0건 |
| 🥇 M2 | **리듬과 낙차** — 30초 박동을 "ROUND n"(14라운드) 명명: 세그먼트 바+배너 0.6s+클리어 +5G(총 +70G). GameOver 1행 패배 원인+팁. 소환/부화 카드 뒤집기 0.35s(금색은 혈통 전용 예약). FTUE 스포트라이트+고스트(현존 인터랙션분, 진행 중 1배속 강제). 2배속 W1 무료 기본화+**기구매자 3💎 환불 마이그레이션**. W1-5 클리어 T4 컷인. 선결(타임박스 2일): 프리징 계측(워치독+링버퍼→오버레이 덤프)만 — 해결은 소킹(연속 10판 무재현) 병렬 트랙 | 중 | `src/game/GameState.ts`(라운드 판정), `config.ts`, `MetaProgress.ts`(환불), `render/NotificationRenderer.ts`, `popups/GameOverPopup.ts`, `popups/TutorialPopup.ts` | `ROUND_MS=30000`, `TOTAL_ROUNDS=14`, `ROUND_CLEAR_GOLD=5`, `GameState.pendingRoundBanner`, `DefeatCause` 타입 | build / 라운드 경계·+70G·연출 분기 유닛 테스트 / 환불 마이그레이션 테스트 / GameOver 원인 문구 테스트 |
| 🥈 M3 | **혈통 데이터층** — `gen 0~4`, T1 6종→3계열×2종 매핑(계열명 데이터 확정), 교배=부모 2 소모+알 3초+판당 6회. 동계열=Gen max+1·변이 15% / 이계열=Gen 유지·변이 30%(24/5/1). 변이 3등급(희귀=Gen+1, 전설=특성 2슬롯), 소프트 피티 8회/전설 누적 60회 영속. 특성 1슬롯 상속(50/40/20, 합성 60%). 합성=최대 Gen+혈통 ID 승계, 혈통명·계보 체인 기록. 홀드 확인 활성화(M1b 스텁 해제). **혈통 일격 데미지 로직은 테스트 대상이되 런타임 플래그 off**. 세이브 스키마 버전+마이그레이션 함수 | 중~대 | `src/game/types.ts`, `breeding.ts`(신규, 순수), `unitHelpers.ts`, `GameState.ts`, `MetaProgress.ts`, `config.ts` — **전부 `src/game/*`, 렌더 무접촉** | `UnitData.gen: 0|1|2|3|4`, `FamilyKey`(3계열)+`FAMILY_OF_RACE`, `TraitId`, `LineageId`, `PedigreeNode`, `BREED_BUDGET=6`, `MUTATION_TABLE`, `RARE_PITY=8`, `BLOODLINE_STRIKE_ENABLED=false`, `SAVE_SCHEMA_VERSION` | build / 상속·Gen 전파·계열 규칙·피티(발동·리셋 별도) 테스트 / **등급 분포 시뮬 10만회 ±3σ(피티 비활성 모드)** / 7분 행동 예산 시나리오(교배 6회·부모 소모·알 3초 하 Gen3 T4 시퀀스 존재) / **지배 시퀀스 유일성 검사: 시드 100종에서 최적 계열 가변+전략 2개 이상, 유일하면 실패** / 구버전 세이브 로드 테스트 |
| 🥈 M4 | **혈통의 무대** — 둥지 완성(접힘 탭→예상 혈통 카드 0.3배속 슬로모→교배 버튼→알 3초→부화 등급 연출 y100~420). 형태 기반 Gen 표기(Gen1 오라 링→Gen2 뿔+일격→Gen3 왕관+스케일 1.10→Gen4 맥동+1.18, 전부 Graphics). 혈통 일격 플래그 on. 일반 변이 +10G+도감 팡파레. W1-2 최초 교배 확정 희귀(산출 Gen2)+후속 FTUE 스텝. **금색 전수 감사(혈통 전용화, T2 잭팟은 백금)**. 정점 유닛 계열 문장 오버레이. 결과 카드(원인/별점/계보). 교배 FTUE(최초·유일 제작) | 중 | `render/UnitRenderer.ts`, `render/HudRenderer.ts`, `popups/`(부화·결과 카드·바텀시트 확장), `GameScene.ts`, `config.ts`(`BLOODLINE_STRIKE_ENABLED=true`) — 판정 로직 신규 추가 금지, M3 데이터 소비만 | `GEN_VISUALS`(렌더 상수), `EGG_HATCH_MS=3000`, `MUTATION_COMMON_GOLD=10`, `PREVIEW_SLOWMO=0.3` | build / 알 아트 3장 적용 / 오버레이 세이프존 좌표 상수 테스트 / FTUE 중 1배속 강제 테스트 |
| 🥉 M5 | **가문 계보 + 밸런스 + 잔여 리스킨** — 판 종료 시 계보 체인 통째 가문 등록(노드 ≤8, 슬롯 상한), 가문 시드(💀3: 시조 종 Gen0+특성 1, Gen 지름길 아님), 2차 트리 2종(상속률 +5%/희귀 +0.5%). 타이틀 키비주얼+3탭 스테이지 맵+도감/혈통서 2탭. NovelAI 잔여(~12장)+이모지 ≤20. 특성 해금 W2-1 이연. 혈통 일격 +50% 긴장감 재측정(주기 파라미터 1개 튜닝) | 대 | `MetaProgress.ts`(가문, 스키마 v2), `TitleScene.ts`, `StageSelectScene.ts`, `popups/RecipePopup.ts`(혈통서 탭), `scenes/constants.ts`(CHARACTER_ASSETS) | `FamilyRecord`, `FAMILY_SEED_COST=3`, `FAMILY_SLOT_MAX`, `CHAIN_NODES_MAX=8` | build / 저장 왕복 테스트(스키마 v2 마이그레이션 포함) / 이모지 grep ≤20 / 스토어 스샷 5장 촬영 가능 |

### 사용자 플레이테스트 게이트 (각 M 종료 직후, 통과 전 다음 M 착수 금지)

| 뒤 | 확인할 것 |
|---|---|
| M1a | 한손 조작감 / 오발 소멸 / 홈 인디케이터 영역 오터치 없음 |
| M1b | 필드 최상단 유닛을 한손으로 둥지 투입 / **존 밖 오드롭 시 아무 일도 안 일어남** / 오판매 소멸 |
| M2 | "죽은 이유를 팝업만 보고 말할 수 있는가" |
| M3 | W2-5 풀플레이 회귀 없음(일격 off라 DPS 불변 — 눈 판별 가능해야) |
| M4 | 설명 없이 둥지 발견 / 첫 세션 잭팟 체감 / **전투 최고조 스샷 1장에서 Gen 단계 오답 없이 지목** |
| M5 | W2-5 풀플레이 — T4 4~5분+Gen3 T4 실달성+"살짝 부족" 긴장감(가문 시드 출전 포함) |

### 기존 로드맵 항목과의 관계

| 기존 항목 | 처리 | 한 줄 사유 |
|---|---|---|
| GD6 빌드 결과 카드 | **M4에 흡수** | 결과 카드(원인/별점/계보 체인)가 상위 호환 — 별도 구현 안 함 |
| ART 이모지 폴백 제거 | **M5에 흡수** | "이모지 grep ≤20"이 완료 판정으로 승격 |
| U4 T2 기믹 가시성 | **M5 이후로 연기** | T2 기믹이 R5에서 특성으로 승격 — 특성 시각화와 함께 재설계 |
| U7 분당 곱 1.35 | **M5 게이트 뒤 재판단** | 혈통 일격 DPS(+25~50%)가 밸런스를 먼저 흔듦 |
| GD4 일일 도전 / GD5 도전 과제 / GD7 골드 갬블 | **패치 이후(v1.1급) 연기** | Loop 보강은 코어 판타지 교체 후에 의미 있음 |
| G5 라스트 스탠드 | 보류 유지 | 기존 결론 그대로 (7분 도달률 미측정) |
| 프리징 디버그 코드 (`#fatal-error`·sim-freeze) | **M2 계측 트랙에 흡수** | 워치독+링버퍼로 대체, 소킹 통과 시 함께 제거 |
| D·I·J·U11·M·O | 뒤로 밀림 | 우선순위 재배치 — 패치 완료 후 재평가 |
