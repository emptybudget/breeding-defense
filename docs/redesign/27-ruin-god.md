# Ruin_God (종말수·終末獸) 풀 기획 — L3 「신들의 대립」 정본

> 2026-07-06. v1.1 분기2 대형. 22-S1(슬롯)·23-L3(진영)·25-4막(서사) 통합 구현서.

## 1. 정체성

- **레시피**: **Dino_Mecha + Berserk_Shaman + Chaos_Artillery** (3-way 100px, Astral과 동일 UX). 미사용 T3 3종 정확히 소비 — 합성 트리 완결.
- **대비 축**: Astral = 하늘·질서·다수 청소 / **Ruin = 대지·기억·단일 격멸**. "쓸어담는 신 vs 뚫어버리는 신".
- 외형 키워드: 재를 두른 짐승형 신, 부서진 왕관을 이마에, 잿빛+잔불 주황, 무하 장식은 **그을린 금**.

## 2. 전투 스탯 (12번 방법론으로 설계 — 구현 시 시뮬 재검증 필수)

| 항목 | Astral (현행) | **Ruin (신규)** |
|---|---|---|
| range / interval | 260 / 300ms | **200 / 900ms** |
| dmg / 타겟 | 10 / 8타겟·체인4 | **85 / 단일** (진행도 최고 적 우선 = 보스 킬러) |
| 고유 기믹 | 보장 크리 | **분노 방출**: 6초마다 주변 120px 아군 공속 +30% 3초 (Berserk_Shaman 유산) |
| DPS 프로필 | 광역 ~200 | 단일 ~94 + 팀 버프 (물량전 열세, 보스전 우위) |

- 검증 목표: Phase C(HP 685×1.3 보정 후) 단독 처치 시간 Astral과 ±20% 이내, MAX_ENEMIES 방어력은 Astral 우위 유지 — **어느 쪽도 지배 금지** (M3 유일성 검사 확장 재사용).
- 혈통 일격·Gen 형태 표기 규칙 동일 적용 (왕관 대신 **부서진 왕관** Graphics 변주).

## 3. 서사·연출

- 부화: 알이 **재를 뿜으며 금이 감** (전설 버스트의 재색 변주, fx_hatch_burst tint 0x8a6a4a). 대사 1: **"누가 우리를 잊었지?"** → 0.8s 후 대사 2: **"…아니. 여기, 전부 적혀 있군."** (혈통서 보유 시에만 2번 출력 — 신규 유저는 1번만: 떡밥 유지)
- 도감: *"실패가 아니었다. 기다림이었다. 재 속에서 수백 년, 자신을 마저 낳아줄 가문을."*
- 진영 선택(L3): 판 시작 전 신앙 선택 — 별(사다리 변이 +2%p) / 재(이계열 변이 +4%p). 주간 진영 점수 = 소속 진영 유저들의 신 완성 수 합산.

## 4. 아트 (AM10 — 프롬프트는 AM3 치환식, 토큰 절약)

AM3 Astral idle 프롬프트에서 아래만 교체 (시드 anchor+400, attack은 동일 시드+Vibe 0.6):
```
교체: divine astral deity youth → ashen beast god, feral quadrupedal-leaning silhouette standing upright
교체: prismatic golden robes... → cracked obsidian hide with ember veins, ash-grey mane, broken crown embedded in forehead
교체: six small angelic wings → mantle of drifting ash and embers
교체: crystalline scepter... → massive charred claws resting at sides
교체: full mucha halo with peacock feathers... → scorched-gold mucha halo of thorns and smoke rings
교체: prismatic gold, iridescent rainbow → ash grey, ember orange, scorched antique gold
```
attack 교체부: `rearing up, claws raised, ember shockwave gathering, roaring silently` (+네거티브 포즈 4개 제거, AM3 규칙 동일). 컷인·스킨은 시즌 때.

## 5. 구현 배정 (v1.1-L3 마일스톤, 착수 시 18번 스타일 킥오프 블록을 이 문서 기반으로 작성)

1. 데이터: `TIER4_STATS`에 Ruin 추가, `Tier4Race` 유니온 확장, 레시피(`resolveRuinGodThird` — 기존 Astral 함수 패턴 복제), 분노 방출은 combat.ts 순수 판정 + 시뮬
2. 진영: `MetaProgress.faith: 'star'|'ash'|null` + 변이 보정 1곳 + 주간 점수(G1 리더보드 인프라)
3. 렌더: 부화 변주·대사 2단·부서진 왕관 Graphics·문장 오버레이 재색
4. 테스트: 상호 비지배 시뮬 / 레시피 전수 / 대사 조건 분기
- 밸런스 노브(20번 스타일): Ruin 과강 → dmg 85→75 / 과약 → 분노 방출 3s→4s. **상수 1개씩.**
