# 마일스톤 킥오프 프롬프트 팩 (복붙용)

> 2026-07-06 작성. 사용법: 새 세션에서 `/model`로 추천 모델 전환 → 해당 블록을 **통째로 붙여넣기**. 각 블록은 자기완결적 — 필독 문서 경로·스코프·함정·완료 판정이 다 들어 있다.
> 공통 전제: CLAUDE.md·PROGRESS.md는 세션이 자동 로드함. 프롬프트는 "무엇을 하지 말지"가 절반이다 — 하위 모델의 사고는 스코프 방어가 좌우한다.

---

## M1a — 제품 쉘 (모델: Sonnet 5)

```
M1a(제품 쉘)를 구현해줘.

필독(순서대로): PROGRESS.md의 리디자인 로드맵 M1a 행 → docs/redesign/17-ui-design-tokens.md(모든 수치의 원천, 이 값에서 벗어나지 마) → docs/redesign/05-design-v3.md §3 R1.

스코프: src/scenes/ui/tokens.ts + JuicyButton.ts 신규, HudRenderer 재배치(상단 바 y24~68 / 독 y536~624), popups/ 버튼 치환, 카운트 링·세그먼트 바·재화 칩(숫자 롤링 200ms). config.ts엔 레이아웃 상수만 추가.

금지: 게임 로직(GameState/combat) 변경 금지. 겹치기 교배·기존 드래그 판매 그대로 존치. 트랙 좌표·배치존·사거리 무변경. 17번 문서에 없는 색·수치 발명 금지.

함정 경고: ① Text버튼 grep 판정에는 허용 목록이 있다(UnitRenderer 유닛 인터랙션·팝업 배경 레이어) — 로드맵 M1a 행 참조. ② 크롬-세이프존-트랙 산술 테스트는 config 상수 기반으로 tests/game/에 작성(기존 vitest 인프라 사용). ③ 폰트는 Pretendard 서브셋 — 로드 실패 시 monospace 폴백 유지.

작업 순서: 17번 문서 §6 그대로. 각 단계 후 npm run build && npm test.

완료 판정: build·test 전부 통과 + Text버튼 grep 0건(허용 목록 제외) + 신규 산술 테스트 통과. 완료 시 PROGRESS.md M1a 행에 완료 표시 + 마지막 갱신일 수정, 같은 커밋으로 푸시. 이후 사용자 플레이테스트 게이트(한손 조작감) 대기 — M1b 착수 금지.
```

---

## M1b — 드래그 컨텍스트 모드 (모델: Sonnet 5)

```
M1b(드래그 컨텍스트 모드)를 구현해줘.

필독: PROGRESS.md 로드맵 M1b 행 → docs/redesign/17-ui-design-tokens.md §3(독 변신 레이아웃) → docs/redesign/13-edge-case-matrix.md의 E1·E8·E11·E13·E18 → 05-design-v3.md §3 R1 드래그 스펙.

스코프: DragController 드래그 모드(스프라이트 -40px, 슬롯 스냅, 존 밖 드롭=원위치 취소), HudRenderer 독 변신(둥지 슬롯 2 + 가장자리 판매존), 바텀시트(둥지로/판매/잠금 3버튼 — 17번 §5). 둥지 슬롯은 기존 GameState.startBreeding에 임시 배선(부모 비소모, 구 85/15 유지). 겹치기 교배 경로는 이때 제거 + 탈진(exhaust) 데드코드도 함께 제거(E18 — 단 UnitData 필드 제거는 M3 스키마 버전업으로 미룸).

금지: 교배 확률·결과 로직 변경 금지(M3 영역). 홀드 확인은 스텁(항상 off).

함정 경고: ① 기존 "유닛 위 드롭 = 합성" 경로는 유지된다 — 제거 대상은 '유닛 겹침 = 교배'뿐. 구분 조건을 신중히. ② features.breed=false 스테이지(W1-1)는 둥지 슬롯 미표시(E8). ③ 잠금 유닛은 둥지 투입 불가 + 흔들림 피드백(E1). ④ 판매존 시각 상수 = 판정 상수 동일해야 함(테스트 대상).

완료 판정: build·test + 겹치기 경로 grep 0건 + 판매존 상수 동일성 테스트. PROGRESS 갱신+푸시 후 게이트 대기.
```

---

## M2 — 리듬과 낙차 (모델: Sonnet 5)

```
M2(리듬과 낙차)를 구현해줘.

필독: PROGRESS.md 로드맵 M2 행 → docs/redesign/16-ftue-script.md(F1~F4·F8~F11·F13 + FtueController 사양) → 13-edge-case-matrix.md E7(OVERTIME)·E14(배너 우선순위) → 10-sound-spec.md(roundClear·cardFlip·button) → 15-freeze-analysis.md(소킹 상태 확인 — 이미 무재현이면 계측 트랙 생략).

스코프: 라운드 언어(ROUND_MS=30000, 14라운드, 세그먼트 바·배너·+5G), GameOver 패배 원인 1행+팁(DefeatCause), 소환 카드 뒤집기 0.35s(금색 금지 — 혈통 전용 예약), FTUE 인프라+해당 스텝, 2배속 W1 무료화 + 기구매자 3💎 환불 마이그레이션(MetaProgress), W1-5 클리어 T4 컷인(컷인 이미지 없으면 텍스트 배너로 스텁하고 사용자에게 AM4 생성 요청).

함정 경고: ① 라운드 판정은 GameState(순수)·연출은 scene — 레이어 분리. ② 환불은 1회만 실행되게 마이그레이션 플래그 필수, 테스트 작성. ③ 무한모드는 OVERTIME 라벨(E7). ④ 배너 동시 발생 시 우선순위 상수(E14, BANNER_PRIORITY). ⑤ FTUE 중 1배속 강제는 순수 테스트 대상.

완료 판정: build·test + 라운드 경계/+70G/환불/원인 문구 테스트. PROGRESS 갱신+푸시 후 게이트("죽은 이유를 팝업만 보고 말할 수 있는가") 대기.
```

---

## M3 — 혈통 데이터층 (모델: **Opus 4.8** — 반드시 전환)

```
M3(혈통 데이터층)를 구현해줘. 이 마일스톤이 패치의 심장이다.

필독(전부, 순서대로): PROGRESS.md 로드맵 M3 행 → docs/redesign/14-breeding-api.md(**구현 계약서 — 시그니처 그대로, 바꿀 이유를 발견하면 구현 전에 나에게 보고**) → 08-naming-system.md(상수 복붙 원천) → 12-balance-verification.md(F2·F3 반영 필수) → 13-edge-case-matrix.md(E2~E6·E9·E13·E15·E17·E19).

스코프: src/game/breeding.ts + naming.ts 신규(순수 TS, Phaser 의존 0), types.ts 확장, GameState 통합(14번 §4 표 그대로), MetaProgress 피티 영속+스키마 v2 마이그레이션. 렌더 레이어 무접촉 — 혈통 일격은 로직만 구현하고 BLOODLINE_STRIKE_ENABLED=false.

함정 경고: ① 모든 랜덤은 rng 주입 — Math.random 직접 호출 금지(시뮬 재현성). ② 희귀 피티는 영속 저장(12-F3) — 판 내 카운터로 만들면 영원히 안 터진다. ③ 지배 시퀀스 유일성 시뮬에 합성 유닛 수요를 반드시 포함(12-F2). ④ 구버전 세이브 픽스처를 먼저 캡처해 tests/ 에 보존. ⑤ 시뮬 10만회는 피티 비활성 모드로.

완료 판정: 14번 §5 테스트 계약 9종 전부 + build. 시뮬 결과 수치를 PROGRESS에 기록. 게이트: W2-5 풀플레이 회귀 없음(일격 off라 DPS 불변이어야 정상).
완료 후: 상위 모델로 /code-review 1회 권장.
```

---

## M4 — 혈통의 무대 (모델: Sonnet 5)

```
M4(혈통의 무대)를 구현해줘.

필독: PROGRESS.md 로드맵 M4 행 → 05-design-v3.md §3 R7·R6 연출부 → 17-ui-design-tokens.md §5(카드·바텀시트) → 16-ftue-script.md F5~F7 → 13-edge-case-matrix.md E10·E12·E14·E16·E22 → 10-sound-spec.md(nest·eggTick·hatch 3종·strike).

선행 확인: AM1 알 3장이 public/assets/characters/에 있는지 — 없으면 나에게 생성 요청부터(docs/novelai-prompt-bloodline.md AM1, 후처리는 07-art-milestones.md 절차).

스코프: 둥지 완성(접힘 탭→예상 혈통 카드 0.3배속→교배→알 3초→부화 등급 연출), 형태 기반 Gen 표기(전부 Graphics — GEN_VISUALS), 혈통 일격 플래그 on + 이펙트, 일반 변이 +10G 팡파레, W1-2 확정 희귀 + F5~F7, 금색 전수 감사(혈통 전용화, T2 잭팟은 백금), 정점 유닛 문장 오버레이(findApexUnit 소비), 결과 카드.

금지: 판정 로직 신규 추가 금지 — M3 데이터를 소비만 한다. breeding.ts 수정 금지.

함정 경고: ① 슬로모 0.3은 절대값(2배속 중에도 0.3, E10). ② 부화 3종 사운드는 앞 0.15s 동일 — 등급은 뒤에서 갈림(10번 원칙). ③ 부화 연출은 인게임 최고 낙차 — 하지만 y100~420 세이프존 상수 테스트 필수. ④ 광고 부활 시 알 유지(E12).

완료 판정: build·test + 알 3장 적용 + 좌표 상수 테스트 + FTUE 1배속 테스트. 게이트: "설명 없이 둥지 발견"(FTUE 끈 상태 측정) + Gen 단계 스샷 지목.
```

---

## M5 — 가문 계보 + 밸런스 + 리스킨 (모델: Opus 4.8 → 마무리 리스킨은 Sonnet 5 교대 가능)

```
M5(가문 계보+밸런스+잔여 리스킨)를 구현해줘.

필독: PROGRESS.md 로드맵 M5 행 → 05-design-v3.md R8 → 13-edge-case-matrix.md E6·E20 → 12-balance-verification.md F1(BOSS_HP_MULT 관련: EnemyRenderer의 Phase C 스칼라를 50/15→65/15 상당으로) → 08-naming-system.md §5(혈통서 표기) → 17-ui-design-tokens.md.

선행 확인: AM2(T3 6장)·AM5(적 6장)·AM6(키비주얼) 어셋 — 없으면 생성 요청부터.

스코프: 계보 체인 가문 등록(노드 ≤8, 슬롯 상한, 스키마 v2), 가문 시드(💀3, 가문명 승계 E6), 2차 트리 2종, 타이틀 키비주얼+3탭 스테이지 맵+도감/혈통서 2탭, 잔여 리스킨+이모지 grep ≤20, 특성 W2-1 해금, Phase C 보스 HP 상향(F1)+혈통 일격 긴장감 재측정.

함정 경고: ① 가문 시드는 Gen 지름길이 아니다 — Gen0 고정. ② 스키마 v2 마이그레이션은 v1 픽스처 왕복 테스트 필수. ③ 밸런스 변경은 F1의 65 값에서 시작하되 게이트 실측으로 조정 — 임의 값 발명 금지.

완료 판정: build·test + 저장 왕복 + 이모지 grep ≤20 + 스토어 스샷 5장 촬영 가능(09-store-package.md §4 조건). 게이트: W2-5 풀플레이(Gen3 T4 실달성 + "살짝 부족" 긴장감).
완료 후: 상위 모델 /code-review + 09번 스토어 패키지 착수 가능.
```

---

## 공통 트러블슈팅 (모든 세션에 해당)

- 하위 모델이 스코프 밖 리팩토링을 시작하면: "스코프 밖. 되돌리고 M 행 작업만 해" 라고 지시 — CLAUDE.md §3(Surgical Changes)이 근거.
- 문서 간 수치 충돌 발견 시: **05-design-v3.md가 원천**, 단 12번(밸런스 검증)이 v3를 명시적으로 수정한 값(F1 등)은 12번이 우선.
- 게이트 실패 시: 즉흥 수정 금지 → docs/redesign/20-gate-playbook.md(작성 예정) 참조, 없으면 증상을 기록하고 조정은 상수 1개씩.
- 어느 세션이든 시작 직후: `npm test`로 회귀 38+케이스가 통과하는지 먼저 확인 — 깨져 있으면 이전 세션 산출물부터 의심.
