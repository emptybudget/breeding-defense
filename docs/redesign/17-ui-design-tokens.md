# UI 디자인 토큰 + JuicyButton 스펙 (M1a/M1b/M4 렌더 원천)

> 2026-07-06 확정. M1a의 "모바일게임답게"를 수치로 고정한다 — **구현 모델은 이 값에서 벗어나지 않는다.** 색은 `artnouveau.ts` 기존 팔레트 재사용(신규 색 4개만 추가).

## 1. 디자인 토큰 (`src/scenes/ui/tokens.ts` 신규)

```ts
export const UI = {
  // 기존 artnouveau 재사용
  gold: 0xe8c84a, goldMid: 0xb8882a, goldDim: 0x7a5c1e,
  cream: 0xf0e8c8, parch: 0xc8b97a, teal: 0x4ab8b8,
  bgDeep: 0x1a1a0f, bgDark: 0x2c2a14,
  // 신규 4색
  panel: 0x241f12,        // 버튼·패널 본체 (bgDark보다 1단 밝게 — 필드와 분리)
  panelHi: 0x3a3220,      // 눌림/호버 본체
  danger: 0x8a2f2f,       // 판매존·경고 (BOSS_RED보다 톤 다운)
  disabled: 0x1c1a10,     // 비활성 본체 (텍스트 ANS.DIM)
  // 수치
  radius: 8, border: 2,          // 라운드·금테 두께
  pressScale: 0.94, pressMs: 80, // 눌림
  minHit: 48,                    // 히트영역 하한 (M1a clamp)
} as const;
```

폰트: WebFont 1종 — **"Gowun Batang"(명조·세리프)은 금지**, 게임 UI엔 **"SUIT" 또는 "Pretendard" 세미볼드 서브셋**(숫자·한글 ~500자). 타이틀 로고만 장식 서체 허용. monospace는 타이머·숫자 카운터에만 잔류 허용.

## 2. JuicyButton 3변형 (Graphics 드로우 규칙)

모든 버튼 = `RoundedRect(w, h, radius 8)` 본체 + **2px 금테** + 상단 1px 하이라이트 라인(cream 0.15 — '볼록' 착시) + 하단 2px 어둠(0x000000 0.25 — 두께 착시). 텍스트 원점 중앙.

| 변형 | 본체/금테 | 용도 |
|---|---|---|
| `primary` | panel / gold | 소환·교배·확인 — 화면당 1~2개만 |
| `ghost` | panel 0.6 / goldDim | 보조(⏸·📖·상점·닫기) |
| `danger` | danger / goldDim | 판매·포기·리셋 |

상태: `pressed` = scale 0.94 (80ms yoyo) + 본체 panelHi + 햅틱(sfx `button`) / `disabled` = 본체 disabled·텍스트 DIM·입력 무시(눌림 연출 없음) / `pulse`(유도용) = 금테 alpha 0.5↔1.0 (800ms 루프, FTUE·소환 가능 시).

**규칙:** `pointerup` + 슬롭 8px 판정(다운 좌표에서 8px 이상 이동 시 취소). 히트영역 48px 미만 요청 시 clamp + 개발 빌드 throw (v3 R1). `backgroundColor` 스타일의 Text 버튼 신규 생성 금지 — grep 판정 대상.

## 3. 독(Dock) 레이아웃 (y536~624, 88px)

```
[한도+1 56×48]  [   소환 96×64   ]  [영혼상점 56×48]
   x=64             x=180               x=296        ← 중심 좌표, y=580
```
- 소환 버튼: primary + 비용 뱃지(우상단 원 20px, gold 본체·bgDeep 텍스트 "12G"). FULL 시 disabled + 뱃지 "FULL", MAX 시 뱃지 "MAX".
- 좌우 버튼: ghost. 라벨 2줄 허용(11px).
- 독 배경: bgDeep 불투명 + 상단 1px goldDim 경계선 — 필드와 물리적 분리감.

**드래그 컨텍스트 모드 변신 (M1b)**: 300ms 크로스페이드로 교체 —
```
[판매존 48px]  [둥지◯ 56×56] [둥지◯ 56×56]  [판매존 48px]
  danger 톤        x=152          x=208          danger 톤
```
둥지 슬롯: 원형 라운드(반지름 28) + goldDim 점선 테두리(비어있음) → 유닛 스냅 시 gold 실선 + 펄스. 판매존: danger 0.5 + 🗑 대체 Graphics(X자 금선) + "판매 10G" 라벨.

## 4. 상단 바 (y24~68, 44px)

배치(좌→우, 간격 8px): 세그먼트 바 60 · "R9/14" 28 · 타이머 40 · 카운트 링 32 · 골드 칩 44 · 젬 칩 44 · ⏸ 44×44 = 348px.
- **칩**: 라운드 필(pill, 높이 28) panel 본체 + 아이콘(Graphics 원: gold=골드, teal=젬) + 숫자. 숫자 증가 시 **카운트 롤링**(200ms 보간) + scale 1.15 팝(120ms) — "주스"의 핵심 1개.
- 카운트 링: 반지름 14 원호(적수/40), 60%↑ 노랑·80%↑ danger + 펄스. 기존 게이지 바 대체.
- 세그먼트 바: 14칸(폭 3px 간격 1px), 클리어 칸 gold·현재 칸 펄스·미래 칸 goldDim 0.4.

## 5. 카드·바텀시트 공통 언어 (M4)

- **카드**(보상·예상 혈통·계보): 폭 96, 라운드 10, panel 본체 + 등급 테두리 — 일반 goldDim / 희귀 **은색 0xc8d4e0** / 전설 gold + 모서리 장식 4점. 뒤집기: scaleX 1→0→1 (175ms×2), 뒷면은 bgDark + 계열 문장 실루엣.
- **바텀시트**: 높이 240, 상단 라운드 16, bgDeep 0.97 + 상단 goldDim 경계 + 그랩 핸들(폭 36 pill). 등장 200ms easeOut(y+240→0). 바깥 탭 닫기. 버튼 3개: [둥지로 primary] [판매 danger] [잠금 ghost 🔒→Graphics 자물쇠] — **잠금 발견 불가 문제(더블탭)를 바텀시트 병행으로 해소** (13-E1 연동).
- 팝업 패널: 기존 `drawPanelAt` 유지하되 딤을 0.72→0.78 + **딤 레이어 `setInteractive()`** (15-B3 수정 겸용).

## 6. M1a 작업 순서 권고 (하위 모델용)

1. `tokens.ts` + `JuicyButton.ts` 작성 → 순수 clamp 테스트
2. 독 3버튼 교체 → 상단 바 재배치 → 칩·링·세그먼트
3. 팝업 버튼 일괄 치환 (popups/ 7파일) → Text버튼 grep 판정
4. 크롬-세이프존-트랙 산술 테스트 → 빌드 → 사용자 게이트

> 검증 팁: 4번 게이트 전에 스크린샷 비교 기준은 "랜덤다이스 옆에 놓고 안 초라한가"가 아니라 **"버튼이 눌리는 물건처럼 보이는가 / 숫자가 살아있는가 / 필드와 UI가 분리돼 보이는가"** 3문항.
