# 프리징 버그 분석 — 근본 원인 유력 후보 확정

> 2026-07-06. 코드 정독 기반 가설 분석. 순수 데이터 레이어는 무죄 확인됨(`sim-freeze.ts`) — 본 분석은 렌더/브라우저 레이어.
> **결론: 프리징은 iOS의 `navigator.vibrate` TypeError가 Phaser의 RAF 루프를 죽인 것일 가능성이 매우 높다. 오늘(2026-07-06) 커밋 `911abc9`로 이미 수정됨 — 소킹 검증만 남음.**

## H1 🎯 근본 원인 (신뢰도: 높음)

### 메커니즘

1. 사용자 iPhone(Safari)에서 `'vibrate' in navigator`가 **true인데 `navigator.vibrate`는 함수가 아님** — 오늘 사용자 스크린샷의 에러가 물증: 가드(`if ('vibrate' in navigator)`)가 있었는데도 `navigator.vibrate is not a function`이 던져짐.
2. 구 `onBossKilled()`의 **첫 줄**이 `navigator.vibrate([60,30,80])` — 여기서 TypeError.
3. 호출 경로가 핵심: `onBossKilled`는 `GameScene.update → enemyRenderer.update → onBossKilled` — 즉 **Phaser의 requestAnimationFrame 콜백 내부**다. Phaser 3의 `RequestAnimationFrame.step`은 `callback()` 실행 **후에** 다음 RAF를 예약한다 → 콜백이 throw하면 **다음 프레임이 영원히 예약되지 않는다. 게임 루프 즉사 = 완전한 화면 정지.**
4. 증상 일치 검증:
   - "보스 처치 시점에 프리징" — vibrate가 onBossKilled 첫 줄 ✅
   - T3/T4 합성 vibrate(DragController)도 같은 에러를 던지지만 **포인터 이벤트 핸들러**라 RAF 체인이 안 죽음 → "합성은 되는데 보스에서 죽는다"는 관찰과 정합 ✅
   - 순수 레이어 시뮬 무죄 ✅ (브라우저 API 문제이므로)
   - `#fatal-error` 오버레이가 오늘 스크린샷에서 정확히 이 에러를 잡음 ✅

### 조치 상태

- ✅ **수정 완료** (`911abc9`): 4개 호출부 전부 `typeof navigator.vibrate === 'function'` 체크로 교체. `'in'` 체크는 iOS에서 통과하므로 **반드시 typeof여야 한다** — 이후 코드에서 vibrate 추가 시 이 규칙 유지.
- **M2 계측 트랙 조정 권고**: 워치독+링버퍼는 **소킹(연속 10판 무재현) 확인용으로 축소**. `#fatal-error` 오버레이는 소킹 통과까지 유지 후 제거 (RAF 사망은 콘솔조차 안 보이는 유저 환경에서 이 오버레이가 유일한 물증이었다 — 값진 장치였음).
- 재발 방어(선택, M2): `Phaser.Game` 부트 후 `window.addEventListener('error', …)`로 RAF 사망 감지 시 "재시작" 버튼 노출 — 1시간 작업, 모든 미래 크래시에 대한 안전망.

## 정독 중 발견한 2차 버그 (프리징 아님, M 작업에 편입 권고)

| # | 버그 | 상세 | 수정 | M |
|---|---|---|---|---|
| B1 🔴 | **미니보스+보스 동시 처치 시 보스 보상 증발** | 같은 전투 틱에 둘 다 죽으면: 이번 프레임 `onBossKilled`→보스 카드 표시, 다음 프레임 `pendingMinibossReward` 핸들러(pause 가드보다 위)가 `showReward`를 다시 호출 → `RewardPopup.show()`가 기존 컨테이너를 **destroy하고 교체** → 보스 카드 소멸, 미니보스 카드 1택으로 끝남 | 미니보스 보상을 **큐잉**: `RewardPopup`에 `isShown` 게터 추가, 열려 있으면 `pendingMinibossReward`를 다음 프레임으로 유예 (플래그 유지) | M2 또는 GD3 패치 |
| B2 🟡 | **'clear' 페이즈 배너 스팸** | `update()`가 phase==='clear'인 동안 매 프레임 `showBanner`+`delayedCall(1500)` 생성 — 1.5초간 ~90개 타이머·트윈 누적, `enterOverclock` ~90회 호출 (무한모드 진입 시에만 발생) | `overclockSfxPlayed` 패턴처럼 1회 가드 플래그 | M2 |
| B3 🟡 | **보상 팝업 중 필드 입력 관통** | `RewardPopup.dimOverlay`가 `setInteractive()` 안 됨 → 딤 영역 탭이 아래 유닛/버튼에 전달 — 보상 선택 중 드래그·판매 가능 | `dimOverlay.setInteractive()` 1줄 (탭 흡수) | M1a (JuicyButton 패스에 포함) |
| B4 🟢 | 💎 확장 후 stale 카드 | B1 상황에서 미니보스 팝업이 `allRewards`를 교체한 뒤 보석 확장(`show(3)`)을 누르면 의도와 다른 풀에서 3장 표시 | B1 큐잉으로 자동 해소 | — |
| B5 🟢 | 보스 오라 탐색 매 프레임 스프레드 | `EnemyRenderer` 300행 `[...enemyMap.values()].find(isBoss)` 매 프레임 배열 생성 — 성능 미미하나 M5 리스킨 때 boss 참조 캐시로 정리 가능 | 선택 | M5 |

## 검증 계획 (M2 게이트 대체)

1. **소킹**: 수정 빌드로 연속 10판 (보스 처치 다수 포함, iPhone 실기기) — 프리징 무재현이면 H1 확정.
2. 확정 시: `#fatal-error` 오버레이 + `scripts/sim-freeze.ts` 제거 (PROGRESS §임시 디버그 코드 정리), M2의 "프리징 계측 타임박스 2일" **취소** → M2 기간 단축.
3. 미재현 실패 시(프리징 재발): 그때 워치독+링버퍼 투입 — 단 이번엔 RAF 사망 감지(위 재발 방어)부터.
