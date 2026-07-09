# breeding-defense — AI 핸드오프 컨텍스트

> 다른 AI와 협업 시 이 문서를 컨텍스트로 전달.
> 마지막 갱신: 2026-07-08 (✅ **M4 혈통의 무대 구현 완료** — 둥지 채우기→예상 혈통 카드(0.3배속)→교배 버튼 확정 3단계 재구성, 알 부화(Graphics 스텁, 3틱 SFX)→등급 리빌+birthCry, Gen 형태 표기(링/뿔/왕관)+정점 유닛 문장 오버레이(E22), 혈통 일격 플래그 on+이펙트+SFX, W1-2 확정 희귀(forceRare)+일반 변이 +10G, FTUE F5~F7, 금색 전수감사(T2 잭팟→백금). AM1/AM7 아트 미확보로 전부 Graphics 프로시저럴 스텁(사용자 승인, 추후 아트 교체 예정). **다음 = 사용자 M4 플레이테스트 게이트("설명 없이 둥지 발견" + "전투 최고조 스샷에서 Gen 단계 오답 없이 지목") + 상위 모델 /code-review 1회 권장. 결과 카드(GameOver/Victory 원인·별점·계보 체인)는 사용자 확인 하에 이번 범위에서 제외 — 별점 기준 미정, 다음 세션 과제로 이연. M5는 Opus 4.8.** 상세 기획: `docs/redesign/05-design-v3.md`)

### ✅ M4 완료 메모 (2026-07-08, Sonnet 5) — 다음 세션이 참고할 설계 이탈점

- **⚠️ 둥지 흐름 구조 변경(핵심)**: M1b~M3까지는 둥지 2슬롯이 차면 `DragController.tryNestPlace`가 **즉시** `startBreeding`을 호출했음(하트 이모지만 표시). FTUE F6 대본("2슬롯 충족→예상 혈통 카드[0.3배속]→교배 버튼 탭 강제")을 만족하려면 이 자동교배를 막아야 해서, `tryNestPlace`가 이제 `'preview'`를 반환하고 `previewPair` 필드에 페어를 보류 — 플레이어가 새 `BreedingPreviewCard`의 "교배" 버튼(64×48)을 눌러야 `confirmBreeding()`이 실제로 `startBreeding`을 호출한다. **취소는 페어링된 유닛 중 하나를 다시 드래그하면 자동 취소**(비용 없음, 예산·부모 미소모) — `dragstart`·`vacateNestSlot`(판매 등 다른 경로) 양쪽에서 처리.
- **`BREED_BUDGET`/`breedsUsedThisGame` 증가 시점이 "슬롯 채움"에서 "교배 확정"으로 이동**: `startBreeding` 호출이 `confirmBreeding()` 안으로 옮겨져 예산 소모 시점이 실제 확정 순간과 정확히 일치한다(미리보기만 하고 취소하면 예산 안 깎임). W1-2 확정 희귀 판정(`stageConfig.name==='W1-2' && breedsUsedThisGame===1`)이 이 시점 이동에 의존.
- **알 타이머(`EGG_HATCH_MS=3000`)는 Phaser 엔진 레벨 배속 동기화로 2배속·미리보기 0.3배속을 자동으로 반영(E10)**: 기존엔 `GameScene.toggleSpeedMult()`가 사용자 2배속 토글 시에만 `time.timeScale`을 갱신했고 FTUE 강제 1배속은 반영이 안 됐었음(1차원 버그였는데 이번에 같이 고쳐짐) — 이제 `update()`가 매 프레임 `computeEffectiveSpeedMult(speedMult, ftueForced, previewActive)`로 `time.timeScale`/`tweens.timeScale`을 동기화. `computeEffectiveSpeedMult` 3번째 인자(`previewActive`)가 최우선이며 절대값 `PREVIEW_SLOWMO=0.3` 반환(2배속·FTUE강제보다 우선).
- **`resolveBreeding`에 5번째 인자 아님, 4번째 인자 `forceRare=false` 추가**(additive, 기존 3-인자 호출부 전부 무영향) — W1-2 첫 확정 교배만 `mutation='rare'` 고정, 이후 로직(Gen+1·피티 리셋·특성/칭호 롤)은 기존 분기 그대로 재사용. 신규 순수 함수 `previewBreedOutcome(a,b,pity)`도 breeding.ts에 추가(rng 미소비, 예상 카드용 Gen·변이확률% 결정론적 계산).
- **`BLOODLINE_STRIKE_ENABLED` true로 전환** — `combat.ts`는 M3에서 이미 완전 배선돼 있어 플래그만 뒤집으면 끝. 렌더 측은 `EnemyRenderer` 공격 루프에 `atk.isStrike` 분기(금색 스트릭 Graphics + `strike` SFX, 80ms 자체 스로틀) 추가. DPS 귀속(E16)은 `unitDamageMap`이 `srcId` 기준 무조건 합산이라 별도 코드 변경 없이 자동 정확.
- **Gen 형태 표기(`GEN_VISUALS`)는 색상 없이 `{ring,horn,crown,pulse,scaleMult}` 불리언/배율만 config.ts에 정의** — 색은 렌더 레이어(`scenes/ui/tokens.ts UI.gold`)에서 해석(Phaser 무의존 유지 원칙). `UnitRenderer.addUnit()`의 기존 0.35s 카드플립 위에 Gen3(scale 1.10)/Gen4(1.18+pulse)를 얹음 — scaleX 플립은 유지하되 scaleY는 즉시 배율 적용.
- **정점 유닛 문장 오버레이(E22)**: `findApexUnit`(M3, 여태 호출부 0곳)을 `UnitRenderer.syncOverlays()`에서 매 프레임 호출하도록 배선. 계열은 `state.lineages.get(apex.lineageId)?.family`로 조회(레이스 자체가 아니라 혈통의 family) — 단일 재사용 Graphics로 변경 시에만 다시 그림.
- **AM1(알 3종)·AM7(순금 fx 2종) 아트 미확보 확인 — 사용자가 Graphics 스텁으로 진행 결정**(M2 컷인 텍스트 스텁과 동일 선례). 알=타원+게이지 아크, 혈통일격/전설버스트=색 틴트 Graphics. `public/assets/characters/egg_*.png`·`public/assets/fx/fx_bloodline_strike.png`·`fx_hatch_burst.png` 준비되면 `UnitRenderer`/`EnemyRenderer`의 해당 Graphics 블록을 이미지로 교체할 것.
- **`UNIT_LORE`(birthCry 25종) 신규 추가**(`src/game/lore.ts`, `24-lore-units.md` §2~5 표 그대로 전사) — M4는 **부화 배너 대사만** 소비(등급 연출 아래 0.8s), `epithet`/`dex`는 M5(도감·바텀시트)에서 사용 예정으로 데이터만 선점. Astral_God 항목은 `〈가문명〉` 치환 토큰 포함(M4에서는 실제로 트리거 안 됨 — T4는 합성 산출물이라 알 부화 경로를 안 탐, 토큰 치환 배선은 M5/추후 합성 리빌 연출에서 처리 필요).
- **⚠️ 스코프 갭 발견 후 사용자 확인 — 결과 카드(GameOver/Victory, 원인·별점·계보 체인)는 이번 세션 범위에서 제외**: PROGRESS M4 행에 명시된 항목이나 최초 계획 수립 시 누락되었음을 사용자에게 고지 → "birthCry만 지금 추가, 결과 카드는 다음 세션" 확정. **별점(⭐) 산정 기준이 어느 문서에도 없어 다음 착수 전 설계 결정 필요**(클리어시간/Gen 달성도/변이 등급 등 후보 — 사용자 상의 요).
- **`heartTexts`(둥지 하트 이모지) 완전 제거**: 알 연출로 대체돼 유일한 생성부가 사라짐 — 필드·정리 코드 모두 삭제(고아 코드 방지).
- **`npm test` 여전히 이 환경 한정 기동 불가**(Node v20.18.1, M2·M3와 동일한 `@rolldown/binding` 네이티브 바인딩 이슈 — 패키지 버전 불변경). 대신 esbuild 번들 → 순수 Node로 신규 로직 전량 실증(forceRare·previewBreedOutcome·checkHatchOverlaySafeZone·computeEffectiveSpeedMult 3-인자·W1-2 확정 희귀·common 변이 골드 지급) 통과 확인. 신규/수정 vitest 파일(`breeding.test.ts`·`gameStateBreeding.test.ts`·`layoutValidation.test.ts`·`ftue.test.ts`·`lore.test.ts`)은 계약대로 작성 완료 — **Firebase Studio에서 `npm test` 재확인 권장**.
- **기존 `bloodlineStrike` 테스트 1건 수정 필수였음**: "플래그 off(기본)면 항상 false" 테스트가 `BLOODLINE_STRIKE_ENABLED=true` 전환으로 전제가 뒤집혀 실패하게 됨 — "플래그 on(기본)이면 발동" + "명시적 enabled=false면 false" 2건으로 교체.
- 신규 파일: `src/scenes/render/popups/BreedingPreviewCard.ts`. 신규 config 상수: `MUTATION_COMMON_GOLD`, `PREVIEW_SLOWMO`, `HATCH_SAFE_ZONE_Y1/Y2`, `PREVIEW_CARD_X/Y/W/H`, `BREED_BUTTON_W/H/X/Y`, `FOLDED_TAB_SIZE`, `GEN_VISUALS`.

### ✅ M3 완료 메모 (2026-07-08, Opus 4.8) — 다음 세션이 참고할 설계 이탈점

- **⚠️ `npm test` 여전히 기동 불가(이 환경 한정)**: Node `v20.18.1` + vitest 4/rolldown이 `>=20.19` 요구 → M2와 동일. 대신 **esbuild 번들 → 순수 Node로 신규 로직 전량 실증**(breeding/naming/migration/GameState 통합/합성 승계/MetaProgress 영속 + 시뮬 2종) 모두 통과. **vitest 파일은 계약대로 작성했으니 Firebase Studio에서 `npm test` 재확인 권장.** 신규 테스트: `tests/game/breeding.test.ts`·`naming.test.ts`·`migration.test.ts`·`gameStateBreeding.test.ts`, 시뮬 `scripts/sim-bloodline.ts`.
- **14번 계약 `BreedOutcome`에 additive 옵셔널 3필드 추가**(시그니처 파괴 아님, 구현 중 필요 판명): ①`secondTrait?`(전설 변이 2슬롯 — 원 계약이 `inheritedTrait` 단일만 정의해 트레이트2 담을 곳 없었음) ②`epithet?`(개체 칭호를 resolveLineage와 공유해 롤 1회로 통일) . 그리고 `bloodlineStrike(unit, enabled=const)` 2번째 인자(테스트에서 플래그 강제용), `inheritOnSynthesis(materials, rng)` 2번째 인자(특성 60% 롤). 전부 기존 호출부 무영향.
- **특성 "제3 무작위 20%"는 부모 풀이 아니라 전 특성 풀(12종)에서 신규 롤**로 확정: 초기 구현(부모 풀)은 A만 특성 보유 시 마진이 60%로 튀어(제3 분기가 A를 재반환) 50/40/20 의도와 어긋남. 신규 무작위로 바꿔 A 단독 보유 시 마진 ≈50.8%(±3σ 내) + 계보 특성 드리프트 확보. "부모 무특성이면 undefined" 게이트는 유지(발원은 여전히 legend 변이).
- **이계열 교배 = 카테고리(=계열) 불일치 시 Gen 유지**. `FamilyKey`(sword/fang/steel)는 기존 `Race`(Human/Beast/Robot)와 1:1 동형 — 검문=Human, 야수문=Beast, 강철문=Robot. M1b까지 둥지는 동계열만 허용했으나 M3에서 `canBreed`로 교체해 **이계열 교배 개방**(F2 도박 루프). 겹치기=합성 경로는 무변경(Warrior+Dog 겹침 = Bio_Wolf 합성 그대로, 둥지 투입 = 교배).
- **부모 소모 정식화**: `completeBreeding`이 부모 2 제거 + 자식 1(순감). 캡 체크 제거(E13, 순감이라 초과 불가). 렌더 접촉 = `UnitRenderer.startBreedingEffect`에 `removeStaleUnits` 1줄(소모된 부모 스프라이트 정리) — 유일한 렌더 변경. `DragController.canPairInNest`→`canBreed` 위임, 예산 소진 시 안내 문구 분기. 피티/변이 영속은 `GameScene.update`가 `pendingPitySave`/`pendingMutationRecord` 드레인(pendingDiscoveries 패턴 재사용).
- **혈통 일격은 combat.ts에 플래그 게이트로 배선(BLOODLINE_STRIKE_ENABLED=false → 완전 무동작)**. Gen2+ 유닛이 주기(STRIKE_PERIOD 2:4/3:3/4:2)마다 원 공격 damage 복제(isStrike). 더블어택 시 카운터 2 증가(E17). M4에서 플래그 on + 이펙트. **DPS 불변 확인**(sim-freeze 정상).
- **`getOffspringRace`(unitHelpers) 고아화**: M3 교배가 `resolveBreeding.childRace`(부모 2종 무작위)로 대체 → 프로덕션 미사용. 단 `unitHelpers.test.ts`가 아직 테스트 중이라 **삭제 보류**(스코프 밖, 사용자 확인 후 정리). `isExhausted/exhaustEndMs` 필드는 타입·makeUnit에서 제거 완료(E18, 스키마 v2). `sim-freeze.ts`의 `!u.isExhausted` 참조도 제거.
- **🔧 유닛 탭 바텀시트에 합성 조합 레시피 추가 (사용자 요청, M3 후속)**: `UnitActionSheet`가 탭한 유닛의 합성 결과를 "+파트너 → 결과" 줄로 표시(T1→T2 4종/T2→T3/T3→Astral, 최종형태는 "합성 조합 없음"). `features.synthesize` 켜진 스테이지 한정, 시트 높이 동적. `UnitActionSheetOptions`에 `showRecipes` 추가. 상위 티어 유닛도 탭 시 시트 열림(레시피 열람용).
- **⚠️ F2 조정 트리거 감시**: 시뮬은 합성 수요 포함 시 ladder 111/hybrid 89로 단일 지배 없음(통과). 단 유닛 풍족(U≥22)이면 hybrid(Gen4 도박)가 항상 유리해지는 경향 — 실플레이에서 "남는 예산은 무조건 도박"이 체감되면 **예비 조정안(교배예산 6→5 또는 이계열 Gen=max−1) 사용자 결정 필요**(12-F2). 상수 1개 변경이라 즉시 적용 가능.

### ✅ M2 완료 메모 (2026-07-08, Sonnet 5) — 다음 세션이 참고할 설계 이탈점

- **⚠️ 테스트 실행 환경 이슈 (이번 세션 한정)**: 이 세션의 샌드박스 Node가 `v20.18.1`인데 `vitest@^4.1.10`가 내부적으로 `vite@^6~8`을 피어 의존(프로젝트 자체 빌드는 `vite@^5.2.11` 그대로 사용, 별도 중첩 설치됨)하고 그 vite 8/rolldown이 Node `>=20.19`를 요구해서 `npm test`가 네이티브 바인딩 오류로 기동조차 안 됨(`npm ci`로 클린 재설치해도 동일 — Node 버전 문제, 패키지 손상 아님). **패키지 버전은 건드리지 않음**(범위 밖 변경이라 판단, Firebase Studio 등 다른 Node 버전 환경에선 정상 동작할 가능성 높음). 대신 `esbuild`로 신규 로직만 번들링해 순수 Node로 직접 실행 — 5개 테스트 파일에 대응하는 17개 어서션 전부 통과 확인(라운드 경계·+70G·OVERTIME 전환·DefeatCause 4분기·FTUE 1배속·CHRONICLE 15종 매칭). **다음 세션(특히 Firebase Studio)에서 `npm test` 정상 기동 여부 재확인 권장** — 안 되면 `vitest` 버전을 프로젝트 `vite@5`와 호환되는 라인(예: `^1.x`/`^2.x`)으로 낮추는 걸 사용자와 상의할 것.
- **F8 트리거를 위해 `DragController.getValidPartners`의 티어1 분기를 되살림**: M1b 메모에 "tier1 분기 제거(더 이상 아무도 안 씀)"로 기록돼 있었는데, 재확인 결과 `dragstart` 핸들러가 애초에 `tier!==1`일 때만 `setHighlights()`를 호출해서 **티어1 교차 카테고리 합성 페어(예: Warrior+Dog)에는 청록 펄싱 하이라이트가 아예 뜬 적이 없었음**(합성 자체는 겹치기 드롭으로 정상 동작하지만 사전 하이라이트가 없었던 실질적 기능 공백). FTUE F8("합성 가능 청록 펄싱 최초 발생")이 W1-3에서 실제로 트리거되려면 이 하이라이트가 필요해서, `getValidPartners`에 티어1 분기(교차 카테고리 = `getCategory` 불일치 판정, 6종 15쌍 중 12쌍이 정확히 교차 카테고리라 레시피 존재와 100% 대응)를 추가하고 `tier!==1` 가드를 제거함 — **부수효과: 티어1 드래그 시에도 이제 청록 하이라이트가 뜸(기존엔 전혀 없었음), 의도된 개선.**
- **F11(레시피북 스포트라이트) 대상 소실**: `16-ftue-script.md`가 지정한 "레시피북 버튼"이 M1a에서 상단바→일시정지 팝업 내부로 이전되어 게임 화면에 상시 버튼이 없음. 스포트라이트 없이 카피만 3초 토스트로 축소(`FtueController.enqueue('F11', null, ...)`).
- **T4 컷인 카피는 `16-ftue-script.md`(구안 "이 힘이 최종 목표다") 대신 `25-storyline.md`(로어 확정본 "언젠가 너의 계보도 별을 품으리라.")를 채택** — PROGRESS 로어 배정표가 25번 문서를 M2 원천으로 명시했고 시점상 더 최신.
- **DefeatCause 4분기 규칙은 어느 기획 문서에도 없어 이번에 직접 설계**(`src/game/defeatCause.ts`): 최대 티어<2→합성 안 함, 유닛수<한도50%→소환 부족, 탱크비율≥25%+티어<3→탱크 압도, 그 외→기본값. 결정론적 순수 함수라 게이트("죽은 이유를 팝업만 보고 말할 수 있는가") 결과 보고 규칙 튜닝하기 쉬움 — 사용자 피드백 받으면 임계값 조정 예정.
- **배너 우선순위(E14) `BANNER_PRIORITY`**: `config.ts`에 5개 태그 배열(`bossPhaseCutin > hatchGrade > roundClear > waveWarning > mutationStamp`)로 확정했지만, M2 시점에 실제 렌더 로직이 존재하는 건 `bossPhaseCutin`·`roundClear` 둘뿐(`hatchGrade`/`mutationStamp`는 M4 몫, 배열엔 자리만 선점). `GameScene.tryShowBanner()`가 우선순위 비교+강등(토스트) 처리.
- **라운드 시스템은 승리 조건과 독립적으로 무한 누적**: `ROUND_MS=30000` 기준 `Math.floor(elapsedMs/ROUND_MS)`. 정규 스테이지(W1 2~4분, W2·W3 7분=정확히 14라운드)에서는 `tick()`의 victory 조기 return 때문에 라운드 14가 승리와 **같은 프레임에 걸려 실전에선 거의 안 뜸** — OVERTIME(15라운드+)은 사실상 **무한 모드(`isInfiniteMode=true`)에서만** 관측됨. 의도된 설계(E7 스펙 그대로)지만 다음 세션이 "왜 정규 플레이에서 라운드14 배너가 안 보이지?"로 헷갈리지 않도록 기록.
- **카드 뒤집기(0.35s)는 `UnitRenderer.addUnit()` 안에 넣어 소환/부화/영혼소환 3개 호출부 전부 자동 적용** — 개별 호출부 수정 없이 `GameScene.ts`의 `UnitRenderer` 생성자에 `this.sfx`만 추가.
- 신규 파일: `src/game/defeatCause.ts`, `src/game/lore.ts`, `src/game/ftue.ts`, `src/scenes/FtueController.ts`.
- 신규 테스트: `tests/game/round.test.ts`, `tests/game/defeatCause.test.ts`, `tests/game/ftue.test.ts`, `tests/game/lore.test.ts`, `tests/game/MetaProgress.test.ts`(신규 — 기존에 없었음, `localStorage` 테스트파일 내 인메모리 폴리필).

### ✅ M1b 완료 메모 (2026-07-07, Sonnet 5) — 다음 세션이 참고할 설계 이탈점

- **탭 = 레시피 팝업 → 바텀시트로 완전 교체**: M1b 스코프에 "유닛 탭 바텀시트 '둥지로'/'판매' 2탭 경로"가 명시돼 있었는데 기존 "탭=개별 레시피 팝업" 동작과 같은 제스처를 두고 충돌 — 사용자 확인 후 완전 교체로 결정. `RecipePopup.showRecipe()`(개별 유닛 레시피 표시) 삭제, 레시피 정보는 📖 레시피북(전체 목록)으로만 확인 가능. 신규 `UnitActionSheet.ts`(둥지로=primary/판매=danger, 잠금 버튼은 M1b 스코프상 제외 — 기존 더블탭 잠금 토글 유지).
- **둥지 슬롯 좌표 x=152/208은 M1a 계산 소환 버튼(x=180, 96폭이라 132~228)과 물리적으로 겹친다.** ~~그래서 슬롯 점유 시 드래그 독을 유지~~ → **철회 (2026-07-07, 사용자 리포트 "둥지가 사라지지 않는 버그")**: 이 설계는 소환 버튼을 계속 가려서 교배 파트너를 소환할 수 없게 만들었음. 이제 `exitDragMode()`는 **드래그 종료 시 항상 계산 독으로 복귀**. 대기 중인 유닛은 필드(슬롯 바로 위 y≈464)에 `🪺` 마커와 함께 눈에 보이게 앉고, 슬롯 점유 상태(`nestOccupiedState`)는 내부적으로만 유지돼 다음 드래그 때 빈 슬롯만 하이라이트된다.
- **🐛 발견·수정: 둥지에 넣은 유닛·교배 산출 유닛이 화면에서 사라지는 버그** (2026-07-07, 사용자 리포트) — 원인: 둥지 슬롯 y좌표(`DOCK_CENTER_Y=580`)가 독 배경(`dockGfx`, depth5, **완전 불투명**) 영역(y536~624) 안이라 유닛 스프라이트(depth1)가 그 뒤에 완전히 가려짐. 파생 유닛(자식)도 부모 좌표의 중점에서 태어나므로 같은 좌표에 숨어버림. **수정**: 둥지 슬롯의 시각(원 아이콘, HudRenderer)은 그대로 y=580에 두되, 실제 유닛의 `state.moveUnit` 착지 좌표는 `state.unitZone.y2 - UNIT_MAX_HALF_H`(≈464, 필드 안쪽 최하단)로 분리(`DragController.tryNestPlace`의 `place()`). 근접 판정(`distToNestSlot`)은 여전히 진짜 슬롯 좌표(580) 기준이라 스냅 조작감은 변화 없음.
- **교배 트리거는 여전히 `GameState.startBreeding`/`completeBreeding` — 부모 비소모, 구 85/15 유지** (M3 전까지). 페어링 판정은 카테고리 일치(`canPairInNest`)로 DragController가 직접 체크 — `getValidPartners`는 tier1 분기를 제거(더 이상 아무도 안 씀, 카테고리 불문 전체 tier1 반환이라 나이스트 판정에 못 씀).
- **T1+T1 "겹치기=교배" 제거 후 남는 유일한 오버랩 경로는 합성**: 다른 카테고리 T1+T1(예: Warrior+Dog)은 여전히 유닛 위 드롭으로 `synthesize()`가 T2를 만든다(기존 기능, 안 건드림). 같은 카테고리 T1+T1을 겹쳐도 이제 `synthesize()`가 "조합법 없음" 알림만 띄우고 조용히 실패 — 별도 분기 불필요.
- **탈진(exhaust) 완전 데드코드화(E18)**: `BREEDING_EXHAUST_DURATION_MS` 상수 삭제, `completeBreeding`의 isExhausted 설정·`tick()`의 자동 해제 루프·UnitRenderer의 zzz 오버레이 전부 제거. `isExhausted`/`exhaustEndMs` **필드 자체는 타입에 남아있음**(M3 세이브 스키마 버전업 때 제거 예정 — 지금 건드리면 스코프 밖).
- **판매존이 독 좌우 가장자리 2곳으로 확장**(기존 우측 1곳→`SELL_EDGE_W=48` 양쪽). 시각(HudRenderer)과 판정(DragController) 모두 `src/game/dockGeometry.ts`의 순수 함수(`isInSellZone`/`getNestSlotRect`) 하나를 공유해서 드리프트 자체가 구조적으로 불가능하게 만듦 — "시각=판정 동일 상수 테스트"는 이 계약을 검증.
- 신규 파일: `src/game/dockGeometry.ts`, `src/scenes/render/popups/UnitActionSheet.ts`.
- 신규 테스트: `tests/game/dockGeometry.test.ts`(판매존·둥지 슬롯 기하, 6케이스). 전체 55개 테스트 통과.

### ✅ M1a 완료 메모 (2026-07-07, Sonnet 5) — 다음 세션이 참고할 설계 이탈점

- **⏸ 아이콘 히트영역 44×44 → 48×48로 변경**: `17-ui-design-tokens.md`의 "⏸ 44×44"와 같은 문서의 `MIN_HIT_PX=48(미만 지정 시 clamp+개발 빌드 throw)"가 서로 모순(44<48). `JuicyButton`에 `visualWidth/visualHeight`를 추가해 **시각적 본체는 44×44 그대로**(바 높이와 동일, 삐져나옴 없음), **히트영역만 48×48**(안 보이는 터치 여백)로 분리 해결. `MIN_HIT_PX` 미만은 dev 빌드 throw + prod 클램프로 구현(`src/scenes/ui/tokens.ts#clampHitArea`).
- **📖 레시피북 / ⏩ 2배속 토글을 상단 바에서 일시정지 팝업으로 이전**: 새 44px 상단 바는 348px 예산(세그먼트바·R표기·타이머·링·골드칩·젬칩·⏸)으로 이미 꽉 차 두 아이콘이 들어갈 자리가 없음(문서 어디에도 신규 배치 지정 없음) — 사용자 확인 후 `PausePopup`에 버튼 2개로 통합(`PopupRenderer.showPause` 시그니처에 `onRecipeBook?`/`speed2x?` 추가).
- **라운드 세그먼트 바·"R n/14"는 시각 스캐폴드**: M2가 아직 `ROUND_MS`/`TOTAL_ROUNDS`/실제 라운드 판정을 구현하지 않았으므로, `elapsedMs / victoryTimeMs` 비율로만 14칸을 채우는 순수 렌더 계산(HudRenderer 내부, GameState 변경 없음). **M2 착수 시 이 스캐폴드를 실제 라운드 이벤트로 교체할 것.**
- **드래그 판매존 좌표 갱신**: 독이 `GAME_HEIGHT-76-BOT`(구 좌표)에서 `DOCK_Y=536`으로 이동함에 따라 `DragController.isOnSellZone`/`isValidUnitPosition`도 `DOCK_Y` 기준으로 갱신(기존 판매 매커니즘 자체는 무변경).
- **`button` SFX 추가**: `10-sound-spec.md`에 M1a 배정으로 명시돼 있었음(처음엔 놓쳤다가 재검토 중 발견) — `SoundManager.playSFX('button')` 추가, `JuicyButton`이 클릭 시 재생 + `navigator.vibrate(10)` 햅틱(뮤트와 무관하게 항상 진동).
- 신규 파일: `src/scenes/ui/tokens.ts`, `src/scenes/ui/JuicyButton.ts`, `src/game/layoutValidation.ts`(크롬-세이프존-트랙 산술 검증, 순수 TS), `src/vite-env.d.ts`(`import.meta.env.DEV` 타입).
- 신규 테스트: `tests/ui/tokens.test.ts`(clamp), `tests/game/layoutValidation.test.ts`(세이프존·트랙 산술, 49개 전체 테스트 통과).

## ⚠️ 임시 디버그 코드 (프리징 원인 확정 후 제거)

- **🎯 근본 원인 유력 확정 (2026-07-06)**: iOS `navigator.vibrate` TypeError가 RAF 콜백 내부(`onBossKilled` 첫 줄)에서 발생 → Phaser RAF 체인 사망 = 완전 정지. `911abc9`에서 수정 완료(`typeof` 체크). **상세 분석·2차 버그 B1~B5·소킹 계획: `docs/redesign/15-freeze-analysis.md`**. iPhone 실기기 연속 10판 무재현 확인 후 아래 제거:
- `main.ts`에 런타임 에러 화면 표시 오버레이(`#fatal-error`) 삽입됨 — 인게임 프리징(보스 처치 시점 의심) 원인 추적용. 프리징 재발 없으면 제거.
- `scripts/sim-freeze.ts` — 순수 데이터 레이어 3분 시뮬레이션 (프리징 진단용, 순수 레이어 무죄 확인 완료). 함께 제거 가능.

## 🚨 다음 작업

### 🎯 리디자인 로드맵 — 명가(Bloodline) 패치 (2026-07-06 확정)

> **"뽑는 게임이 아니라 낳는 게임 — 당신이 교배로 길러낸 혈통이 신(神)을 낳는, 유일한 랜덤 디펜스."** 상세 기획: `docs/redesign/05-design-v3.md` (유일한 기획 원천 — 수치·규칙 충돌 시 그쪽이 정답).
> 🗺️ **문서 27개 길찾기: `docs/redesign/00-INDEX.md`** — 세션 유형별 필독 목록. 아래 개별 포인터를 훑기 전에 이것부터.
> 공통 원칙: **데이터/렌더 분리 불가침** — 규칙·상태·판정은 `src/game/*`(Phaser 의존 0, 순수 TS 테스트 가능), 연출·입력은 `src/scenes/*`. 트랙 좌표·배치존·사거리(config.ts) 무변경. 각 M 종료 = `npm run build` 통과 + 명시된 순수 TS 테스트 + 사용자 플레이테스트 게이트 통과(헤드리스 검증 금지, CLAUDE.md §6).
> 아트 어셋: `docs/redesign/07-art-milestones.md` (AM1~AM6, 후처리·코드 등록 절차) + 프롬프트 `docs/novelai-prompt-bloodline.md` — **각 M 착수 전 필요한 AM 생성분을 사용자에게 요청할 것** (AM1 알→M4, AM4 컷인→M2, AM5 적→M5).
> 혈통 네이밍: `docs/redesign/08-naming-system.md` — M3 데이터 원천 (계열 3문 확정: 검문/야수문/강철문, 혈통명 풀 1296조합, 변이 칭호, `naming.ts` 사양).
> 스토어 패키지: `docs/redesign/09-store-package.md` (아이콘·스샷 5장 시나리오·소개문·ASO, M5 후) / 신규 SFX 11종: `docs/redesign/10-sound-spec.md` (tone() 시퀀스, 각 M에 배정).
> 비즈니스 모델: `docs/redesign/11-business-model.md` (v1.1, BM1~BM3) — 확률형="옛 가문의 부화당"(유물 알, 코스메틱 온리, 천장 40회, 확률 공시), 보상형 광고 5슬롯, IAP 5종. **미결정이던 수익 모델 확정** — 코어 판타지 §미결정 항목 해소.
> ⚠️ 밸런스 사전 검증: `docs/redesign/12-balance-verification.md` (몬테카를로 10만회) — **M3 구현 시 필독**: F1 Phase C 보스 HP 배율 50→65 (`BOSS_HP_PHASE_C_SCALAR` 50/15→65/15, M5), F2 지배시퀀스 검사에 합성 수요 포함, F3 희귀 피티 영속 저장 필수, F4 계열 운빨 리스크 기우 판명.
> ⚠️ 엣지케이스 판정: `docs/redesign/13-edge-case-matrix.md` (E1~E22) — **M1b~M5 구현 시 필독**: 잠금×둥지, 잭팟/시드×혈통, 탈진 폐기, 연출 우선순위, 세이브 마이그레이션 등 크로스 시스템 판정 전부 확정.
> 🧬 breeding.ts API 계약: `docs/redesign/14-breeding-api.md` — **M3는 이 시그니처 그대로 구현** (공개 함수 7개, 타입 확장, config 상수, GameState 통합 지점, 테스트 계약 9종).
> 🐛 프리징 분석: `docs/redesign/15-freeze-analysis.md` — 근본 원인(iOS vibrate→RAF 사망) 기수정, 소킹 10판 게이트. **2차 버그 B1(보상 증발)·B2(clear 배너 스팸)·B3(딤 관통) 수정 완료 (2026-07-06)** — B4는 B1로 자동 해소, B5(성능 미미)만 M5 잔존.
> ✅ 테스트 인프라: **vitest 도입** (`npm test`) — `tests/game/` 순수 레이어 회귀 38케이스 (레시피 18종·판매가·소환 곡선·경제 tick·게임오버·스트릭). **M1a부터 완료 판정의 순수 TS 테스트는 여기에 추가**.
> 🎓 FTUE 대본: `docs/redesign/16-ftue-script.md` — 스텝 F1~F13 트리거·카피·강제행동 확정, FtueController 사양, M2/M4/M5 배정.
> 📜 디자인 헌법: `docs/redesign/19-design-constitution.md` — **신규 아이디어·밸런스 변경·피드백은 이 심사 기준을 통과해야 채택** (코어 판타지 3문항, 더하기 전에 빼기, 상수 1개씩, 금색=혈통 독점). AI는 헌법 충돌 시 고지 의무.
> 🚑 게이트 플레이북: `docs/redesign/20-gate-playbook.md` — 플레이테스트 게이트 실패 시 즉흥 수정 금지, 증상→원인→노브 표대로.
> 🌱 확장성 분석: `docs/redesign/22-content-extensibility.md` — 제2 T4 「Ruin_God」 슬롯(남은 T3 3종이 정확히 공석) + 변이종 무한 라인 + 시즌 템플릿. **T1~T3 층 추가는 조합폭발로 봉인**.
> ⚔️ 유파 카탈로그: `docs/redesign/28-schools.md` — L1 특성 세트 6유파(일격문·포화문·뇌전문·질풍문·함정문·수문문), 12특성 전부 소속·필드 조합 성립·2유파 상한. v1.1 분기1 원천.
> 🌋 Ruin_God 정본: `docs/redesign/27-ruin-god.md` — 제2의 신 풀 기획 (스탯·분노 방출·2단 대사·진영·AM10 치환 프롬프트·상호 비지배 검증 조건). v1.1-L3 착수 시 이것부터.
> 🔄 라이브 로드맵: `docs/redesign/23-live-ops-roadmap.md` — 대형 시스템 축 L1~L6(유파·가문 전당·신들의 대립·침공·월드4·시즌틀) + 이탈 구간별(D1/D7/D30/D90/복귀) 방어 매핑 + 12개월 캘린더.
> 📖 세계관·유닛 스토리: `docs/redesign/24-lore-units.md` — 「접경의 명가들」 세계관 + 25종 도감 플레이버·부화 대사(T4는 가문명 치환 "〈가문명〉… 좋은 이름이다") + 적 로어. `lore.ts` 사양, 부화 대사=M4·도감=M5.
> 📚 설정집: `docs/redesign/26-lore-bible.md` — 2차창작 연료 (고유명사 사전·몰락 3가문·유닛 관계도 15선·일상 설정·**영원히 확정 안 하는 떡밥 8개**·2차창작 가이드라인 초안). SNS 주간 낙수 계획 포함.
> 📜 메인 스토리라인: `docs/redesign/25-storyline.md` — 「접경 연대기」 4막(문패→수복→탄생→잊힌 이들의 신), 중심 반전(심연=몰락 명가의 실패한 신), 전달 장치 전부 텍스트 온리 ~25문장. 24번에 모에 코드 매핑(§7-1) 추가됨.
> 📊 채점표+9점 로드맵: `docs/redesign/21-scorecard-roadmap.md` — 14요소 냉철 채점(현재 3.7 → 패치 후 7.2 → G1~G5로 8.3), **M5 이후 다음 목표 = G4(일일)→G2(적 3종)→G3(BGM)→G1(주간 시드+리더보드)**.
> 🎨 UI 토큰: `docs/redesign/17-ui-design-tokens.md` — **M1a는 이 값 그대로** (tokens.ts, JuicyButton 3변형, 독/상단바 px 배치, 카드·바텀시트 언어, 숫자 롤링).

#### 마일스톤 (투입 순서 고정: M1a→M1b→M2→M3→M4→M5)

| # | 마일스톤 | 난이도 | 주요 대상 파일 | 신규 상수·타입 예시 | 완료 판정 (build + 순수 TS 테스트) |
|---|---|---|---|---|---|
| 🥇 M1a | ✅ **완료 (2026-07-07)** — **제품 쉘** — 게임 로직 무변경. `JuicyButton`(라운드 8px+금테, 눌림 scale 0.94/80ms+햅틱, `pointerup`+슬롭 8px)으로 Text 버튼 45개 치환. HUD 재배치: 상단 바 y24~68(44px, ⏸ 44×44 포함 폭 348px)/필드 y68~536/독 y536~624(88px). 적 한계 32px 카운트 링. 겹치기 교배·기존 드래그 판매는 **그대로 존치** | 소~중 | `src/scenes/ui/JuicyButton.ts`(신규), `render/HudRenderer.ts`, `render/popups/*`, `scenes/constants.ts`, `src/game/config.ts`(레이아웃 상수만 추가) | `HUD_BAR_Y=24/HUD_BAR_H=44`, `DOCK_Y=536/DOCK_H=88`, `MIN_HIT_PX=48`(미만 지정 시 clamp+개발 빌드 throw), `UNIT_MAX_HALF_H=16` | build / Text버튼 grep 0건(범위: popups/·HudRenderer 등 UI 버튼 생성부 한정, 허용: UnitRenderer 유닛 인터랙션·팝업 배경 레이어) / clamp 유닛 테스트 / **크롬-세이프존-트랙 산술 테스트**(config 상수 기반: 크롬이 세이프존 침범 또는 트랙 y90~520+반높이 16px와 교차 시 실패) |
| 🥇 M1b | ✅ **완료 (2026-07-07)** — **드래그 컨텍스트 모드** — 유닛 드래그 시 독 변신(중앙 둥지 슬롯 2개 56×56, 좌우 가장자리 판매존 각 48px, 시각=판정 동일 상수). 드래그 스펙: 스프라이트 -40px 상향, 슬롯 근접 스냅+하이라이트, **존 밖 드롭=원위치 취소**. 유닛 탭 바텀시트 '둥지로'/'판매' 2탭 경로. 슬롯은 기존 `GameState.startBreeding`에 임시 배선(구 85/15, 부모 비소모), **겹치기 교배 코드 이때 제거**. 홀드 확인은 스텁(항상 off, 판정은 M3) | 중 | `input/DragController.ts`, `render/HudRenderer.ts`(독 변신), `render/popups/`(바텀시트 신규), `src/game/GameState.ts`(겹치기 제거만) | `DRAG_LIFT_OFFSET_Y=-40`, `NEST_SLOT_SIZE=56`, `SELL_EDGE_W=48`, `DRAG_SNAP_DIST` | build / 판매존 시각=판정 동일 상수 테스트 / 겹치기 경로 제거 grep 0건 |
| 🥇 M2 | ✅ **완료 (2026-07-08)** — **리듬과 낙차** — 30초 박동을 "ROUND n"(14라운드) 명명: 세그먼트 바+배너 0.6s+클리어 +5G(총 +70G, OVERTIME은 무한모드 한정 관측 — 완료 메모 참고). GameOver 1행 패배 원인+팁(DefeatCause 4분기, 신규 설계). 소환/부화 카드 뒤집기 0.35s(금색 미사용). FTUE 인프라+F1~F4·F8~F11·F13(F11은 스포트라이트 없이 토스트만 — 완료 메모 참고), 활성 중 1배속 강제. 2배속 W1 무료 기본화+**기구매자 3💎 환불 마이그레이션**(1회 보장). W1-5 클리어 T4 컷인(텍스트 스텁)+CHRONICLE 15문장. 프리징 계측(워치독+링버퍼+재시작 버튼, `main.ts` 자기완결) | 중 | `src/game/GameState.ts`(라운드 판정), `config.ts`, `MetaProgress.ts`(환불), `render/NotificationRenderer.ts`, `popups/GameOverPopup.ts`, `popups/TutorialPopup.ts` | `ROUND_MS=30000`, `TOTAL_ROUNDS=14`, `ROUND_CLEAR_GOLD=5`, `GameState.pendingRoundBanner`, `DefeatCause` 타입 | build / 라운드 경계·+70G·연출 분기 유닛 테스트 / 환불 마이그레이션 테스트 / GameOver 원인 문구 테스트 |
| 🥈 M3 | ✅ **완료 (2026-07-08)** — **혈통 데이터층** — `gen 0~4`, T1 6종→3계열×2종 매핑(계열명 데이터 확정), 교배=부모 2 소모+알 3초+판당 6회. 동계열=Gen max+1·변이 15% / 이계열=Gen 유지·변이 30%(24/5/1). 변이 3등급(희귀=Gen+1, 전설=특성 2슬롯), 소프트 피티 8회/전설 누적 60회 영속. 특성 1슬롯 상속(50/40/20, 합성 60%). 합성=최대 Gen+혈통 ID 승계, 혈통명·계보 체인 기록. 홀드 확인 활성화(M1b 스텁 해제). **혈통 일격 데미지 로직은 테스트 대상이되 런타임 플래그 off**. 세이브 스키마 버전+마이그레이션 함수 | 중~대 | `src/game/types.ts`, `breeding.ts`(신규, 순수), `unitHelpers.ts`, `GameState.ts`, `MetaProgress.ts`, `config.ts` — **전부 `src/game/*`, 렌더 무접촉** | `UnitData.gen: 0|1|2|3|4`, `FamilyKey`(3계열)+`FAMILY_OF_RACE`, `TraitId`, `LineageId`, `PedigreeNode`, `BREED_BUDGET=6`, `MUTATION_TABLE`, `RARE_PITY=8`, `BLOODLINE_STRIKE_ENABLED=false`, `SAVE_SCHEMA_VERSION` | build / 상속·Gen 전파·계열 규칙·피티(발동·리셋 별도) 테스트 / **등급 분포 시뮬 10만회 ±3σ(피티 비활성 모드)** / 7분 행동 예산 시나리오(교배 6회·부모 소모·알 3초 하 Gen3 T4 시퀀스 존재) / **지배 시퀀스 유일성 검사: 시드 100종에서 최적 계열 가변+전략 2개 이상, 유일하면 실패** / 구버전 세이브 로드 테스트 |
| 🥈 M4 | ✅ **완료 (2026-07-08)** — **혈통의 무대** — 둥지 완성(채우기→예상 혈통 카드 0.3배속→교배 버튼→알 3초(Graphics 스텁)→부화 등급 연출). 형태 기반 Gen 표기(Gen1 오라 링→Gen2 뿔→Gen3 왕관+스케일 1.10→Gen4 맥동+1.18, 전부 Graphics). 혈통 일격 플래그 on+이펙트. 일반 변이 +10G+배너+birthCry. W1-2 최초 교배 확정 희귀(산출 Gen2)+F5~F7. **금색 전수 감사(T2 잭팟→백금)**. 정점 유닛 계열 문장 오버레이(E22). 교배 FTUE(F5~F7). **AM1/AM7 아트 미확보 → Graphics 스텁으로 진행(사용자 승인). 결과 카드(원인/별점/계보)는 별점 기준 미정으로 다음 세션 이연(완료 메모 참고)** | 중 | `render/UnitRenderer.ts`, `render/HudRenderer.ts`, `input/DragController.ts`, `popups/BreedingPreviewCard.ts`(신규), `GameScene.ts`, `config.ts`(`BLOODLINE_STRIKE_ENABLED=true`) | `GEN_VISUALS`(렌더 상수), `EGG_HATCH_MS=3000`, `MUTATION_COMMON_GOLD=10`, `PREVIEW_SLOWMO=0.3` | build / 세이프존 좌표 테스트(`checkHatchOverlaySafeZone`) / FTUE 3-인자 배속 우선순위 테스트 / forceRare·common골드 테스트 |
| 🥉 M5 | **가문 계보 + 밸런스 + 잔여 리스킨** — 판 종료 시 계보 체인 통째 가문 등록(노드 ≤8, 슬롯 상한), 가문 시드(💀3: 시조 종 Gen0+특성 1, Gen 지름길 아님), 2차 트리 2종(상속률 +5%/희귀 +0.5%). 타이틀 키비주얼+3탭 스테이지 맵+도감/혈통서 2탭. NovelAI 잔여(~12장)+이모지 ≤20. 특성 해금 W2-1 이연. 혈통 일격 +50% 긴장감 재측정(주기 파라미터 1개 튜닝) | 대 | `MetaProgress.ts`(가문, 스키마 v2), `TitleScene.ts`, `StageSelectScene.ts`, `popups/RecipePopup.ts`(혈통서 탭), `scenes/constants.ts`(CHARACTER_ASSETS) | `FamilyRecord`, `FAMILY_SEED_COST=3`, `FAMILY_SLOT_MAX`, `CHAIN_NODES_MAX=8` | build / 저장 왕복 테스트(스키마 v2 마이그레이션 포함) / 이모지 grep ≤20 / 스토어 스샷 5장 촬영 가능 |

#### 📖 로어 구현 배정 — `src/game/lore.ts` (순수 데이터, 아트 0장)

> 원천: 24(유닛·세계관)·25(연대기)·26(설정집). 각 M 작업에 아래 로어 항목을 **함께** 구현할 것 (별도 마일스톤 아님 — 해당 M의 표면에 얹는 텍스트 데이터).

| M | 구현 항목 | 원천 |
|---|---|---|
| M2 | `CHRONICLE` 스테이지 클리어 연대기 15문장(결과 카드 하단 1줄, ≤28자) + W1-5 컷인 벽화 문구 1줄 | 25-§2막·전달장치 |
| M4 | `UNIT_LORE.birthCry` 25종 부화 배너 대사 (T4는 `〈가문명〉` 치환) + Astral 두 번째 대사 "…이 땅, 낯익다." | 24-§2~5, 25-3막 |
| M5 | `UNIT_LORE.dex/epithet` 도감 카드 + `ENEMY_LORE` + `WORLD_INTRO` 5문단 + 도감 장 해금(stageRecords 재사용) | 24-§1·6, 25 |
| v1.1+ | Ruin 대사 2종·부화당 "복원된 기억" 문구·SNS 낙수 카드(주 1회) | 24-§5, 25-4막, 26-§7 |

- 테스트: UNIT_LORE 키 = UnitRace 전수 / 대사 12자·연대기 28자 상한 / 부모 언급=레시피 정합 (24-§7 검수 기준)
- 신규 로어 작성 규칙: 24-§7-1 모에 코드 + 26-§5 침묵 목록(떡밥 8개는 어떤 업데이트에서도 확정 금지) 준수

#### 사용자 플레이테스트 게이트 (각 M 종료 직후, 통과 전 다음 M 착수 금지)

| 뒤 | 확인할 것 |
|---|---|
| M1a | 한손 조작감 / 오발 소멸 / 홈 인디케이터 영역 오터치 없음 |
| M1b | 필드 최상단 유닛을 한손으로 둥지 투입 / **존 밖 오드롭 시 아무 일도 안 일어남** / 오판매 소멸 |
| M2 | "죽은 이유를 팝업만 보고 말할 수 있는가" |
| M3 | W2-5 풀플레이 회귀 없음(일격 off라 DPS 불변 — 눈 판별 가능해야) |
| M4 | 설명 없이 둥지 발견 / 첫 세션 잭팟 체감 / **전투 최고조 스샷 1장에서 Gen 단계 오답 없이 지목** |
| M5 | W2-5 풀플레이 — T4 4~5분+Gen3 T4 실달성+"살짝 부족" 긴장감(가문 시드 출전 포함) |

#### 기존 로드맵 항목과의 관계

| 기존 항목 | 처리 | 한 줄 사유 |
|---|---|---|
| GD6 빌드 결과 카드 | **M4에 흡수 예정, 미구현** | 결과 카드(원인/별점/계보 체인)가 상위 호환 설계였으나 M4 세션에서 별점 기준 미정으로 보류 — 다음 세션 과제(M4 완료 메모 참고) |
| ART 이모지 폴백 제거 | **M5에 흡수** | "이모지 grep ≤20"이 완료 판정으로 승격 |
| U4 T2 기믹 가시성 | **M5 이후로 연기** | T2 기믹이 R5에서 특성으로 승격 — 특성 시각화와 함께 재설계 |
| U7 분당 곱 1.35 | **M5 게이트 뒤 재판단** | 혈통 일격 DPS(+25~50%)가 밸런스를 먼저 흔듦 |
| GD4 일일 도전 / GD5 도전 과제 / GD7 골드 갬블 | **패치 이후(v1.1급) 연기** | Loop 보강은 코어 판타지 교체 후에 의미 있음 |
| G5 라스트 스탠드 | 보류 유지 | 기존 결론 그대로 (7분 도달률 미측정) |
| 프리징 디버그 코드 (`#fatal-error`·sim-freeze) | **M2 계측 트랙에 흡수** | 워치독+링버퍼로 대체, 소킹 통과 시 함께 제거 |
| D·I·J·U11·M·O | 뒤로 밀림 | 우선순위 재배치 — 패치 완료 후 재평가 |

#### 🤖 마일스톤별 추천 코딩 모델 (착수 전 고지 필수)

> **각 M 착수 = `docs/redesign/18-kickoff-prompts.md`의 해당 블록을 그대로 붙여넣기** — 필독 문서·스코프·함정·완료 판정 포함 자기완결.

> **규칙: AI는 각 마일스톤 착수 전에 아래 추천 모델을 사용자에게 고지하고, 사용자가 `/model` 전환을 결정한 뒤 진행한다.** 완료 후 코드 리뷰는 상위 모델(Opus급 이상)로 1회.

| M | 구현 모델 | 사유 |
|---|---|---|
| M1a·M1b·M2·M4 | **Sonnet 5** | 스펙이 기계적(버튼 치환·연출·렌더 소비), grep/순수 TS 테스트로 검증 가능 |
| M3 | **Opus 4.8** | 심장부 — 확률 테이블·상속 규칙·10만회 시뮬·세이브 마이그레이션, 엣지케이스 추론 필수 |
| M5 | **Opus 4.8** (스키마 v2·밸런스) → **Sonnet 5** (타이틀/도감 UI) | 설계·튜닝만 상위 모델 |

---

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
- [x] 수익 모델 — **확정 (2026-07-06)**: F2P + 보상형 광고 + 코스메틱 확률형(유물 알) + IAP 5종. 상세 `docs/redesign/11-business-model.md`

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
