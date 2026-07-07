# 아트 어셋 마일스톤 (명가 패치용) — 하위 모델 이어하기 가이드

> 2026-07-06 확정. 프롬프트 전문: **`docs/novelai-prompt-bloodline.md`** (복붙용).
> 역할 분담: **이미지 생성 = 사용자**(NovelAI, 프롬프트 문서 복붙) / **후처리·코드 등록·검증 = AI**(이 문서대로).
> 기존 파이프라인 문서: `docs/design-prompts.md`(스타일 원천) / `docs/novelai-prompt.md`(T1·T2 프롬프트, 완료됨).

## 어셋 총람

| AM | 어셋 | 장수 | 필요한 M | 파일명 (public/assets/) | 상태 |
|---|---|---|---|---|---|
| AM1 | 계열 알 | 3 | **M4** (부화 연출) | `characters/egg_human.png` `egg_beast.png` `egg_robot.png` | ⬜ |
| AM2 | T3 유닛 | 6 | M4~M5 (이모지 탈피) | `characters/unit_<race>_tier3.png` ×6 | ⬜ |
| AM3 | T4 idle+attack | 2 | M4 (2프레임 공격) | `characters/unit_astral_god_tier4.png` / `_tier4_attack.png` | ⬜ |
| AM4 | T4 컷인 | 1 | M2 (W1-5 클리어 컷인) | `ui/cutin_astral_god.png` | ⬜ |
| AM5 | 적 | 6 | M5 (이모지 grep ≤20) | `enemies/enemy_<type>.png` ×6 | ⬜ |
| AM6 | 타이틀 키비주얼 | 1 | M5 (타이틀 리스킨) | `ui/title_keyvisual.png` | ⬜ |
| AM7 | 혈통 전용 fx 2종 (순금) | 2 | **M4** (일격·전설 부화) | `fx/fx_bloodline_strike.png` `fx_hatch_burst.png` | ⬜ |
| AM8 | G2 신규 적 3종 | 3 | v1.1 G2 (실드/분열/힐러) | `enemies/enemy_shield·splitter·healer.png` | ⬜ |
| AM9 | 유물 알 | 1 | v1.1 BM1 (부화당) | `characters/egg_relic.png` | ⬜ |

> 참고: 기존 `design-prompts.md` §5-2 이펙트 4종(83001~4)은 프롬프트만 있고 **미생성** — AM7과 함께 M4 전에 일괄 생성 권장(전부 검정배경+가산, 후처리=크롭만). §8 중 8-2(타이틀 배경)·8-4(팝업 프레임)·8-5/6(버튼 이미지)은 **폐기** (AM6·17번 UI 토큰이 대체). 폐기·추가 상세: `docs/novelai-prompt-bloodline.md` 하단.

투입 순서 권장: **AM1 → AM3 → AM4 → AM2 → AM5 → AM6** (M 의존 순서). 코드 마일스톤을 막지 않게 각 M 착수 전에 해당 AM 생성분을 사용자에게 요청할 것.

## 공통 후처리 절차 (AI 작업)

사용자가 zip 또는 개별 PNG(1024×1024, 흰 배경)를 `docs/`에 올려주면:

1. **흰배경 제거**: T1·T2 때 쓴 BFS 플러드필 방식 재사용 (구석 4점 시드, 흰색 톨러런스 ~30) — 스크립트가 없으면 새로 작성해 `scripts/`에 저장. `rembg`는 폴백.
2. **크롭**: 불투명 픽셀 바운딩박스 + 여백 6%.
3. **리사이즈**: 256×256 (LANCZOS). **예외**: 컷인·키비주얼(AM4/AM6)은 누끼·리사이즈 없이 크롭만 (원본 1024 유지, 인게임에서 축소).
4. 저장 후 `CLAUDE.md` §6 준수 — 스크린샷 검증 금지, `npm run build`만. 시각 확인은 사용자.
5. 원본 zip은 `docs/`에 보존 (기존 관례: `docs/tier1.zip`).

## 코드 등록 (AI 작업)

### AM2·AM3 (유닛) — 기존 경로 재사용, 신규 코드 불필요
`src/scenes/constants.ts`의 `CHARACTER_ASSETS` 배열에 추가하면 GameScene이 자동 로드:
```ts
// Tier 3
{ race: 'Cyborg_Wizard', tier: 3 }, { race: 'Dino_Mecha', tier: 3 }, { race: 'Griffin', tier: 3 },
{ race: 'Thunder_Hawk', tier: 3 }, { race: 'Berserk_Shaman', tier: 3 }, { race: 'Chaos_Artillery', tier: 3 },
// Tier 4
{ race: 'Astral_God', tier: 4 },
```
- attack 프레임은 별도 키(`unit_astral_god_tier4_attack`)로 GameScene preload에 1줄 추가, UnitRenderer의 공격 tween에서 0.15s 교차 표시 (M4 작업 항목).
- 표시 크기는 `UNIT_SPRITE_SIZE` (T3 52 / T4 62px) — 변경 불필요.

### AM1 (알) — M4 둥지 연출에서 신규 로드
- `GameScene` preload에 `egg_human/beast/robot` 3키 추가. 둥지 슬롯·부화 연출(HudRenderer/팝업)에서 사용. 크기 48~64px.
- **키 매핑 주의**: 파일명은 Race 기반(`egg_human/beast/robot`), 코드의 계열 키는 `FamilyKey`(`sword/fang/steel`) — 1:1 대응(Human=sword, Beast=fang, Robot=steel)이므로 로드 시 매핑 상수 1개로 연결 (`EGG_TEXTURE_OF_FAMILY: Record<FamilyKey, string>`). 파일명 변경 금지(프롬프트 문서와 일치 유지).

### AM5 (적) — EnemyRenderer 이모지 → 스프라이트
- `enemy_normal/fast/tank/elite/boss/greatboss` 6키. `EnemyRenderer`의 이모지 텍스트 생성부를 이미지로 교체 (M5 "이모지 grep ≤20" 판정 대상).
- 크기: NORMAL/FAST 24px, TANK/ELITE 28px, BOSS 40px, greatboss(Phase C 👑) 48px — 기존 수치 유지.

### AM4·AM6 (컷인/키비주얼)
- 컷인: M2의 W1-5 클리어 T4 컷인 — 중앙 배너(폭 320px, y100~420 세이프존), 0.4s 프리즈+플래시와 결합.
- 키비주얼: M5 TitleScene 배경. 360×640 중앙 크롭 표시, 로고 타이포는 WebFont(코드) — 이미지에 텍스트 넣지 않음.

## 완료 판정 (AM 공통)

- `npm run build` 통과 + 신규 파일이 `public/assets/` 규격 경로·파일명과 일치.
- AM2·AM3 완료 시: `CHARACTER_ASSETS` 25종 전부 등록 → 유닛 이모지 폴백 경로 제거 가능 (기존 ART 항목, M5).
- 각 AM 후 사용자 게이트: "인게임에서 깨져 보이는 어셋 없음" 육안 확인.
