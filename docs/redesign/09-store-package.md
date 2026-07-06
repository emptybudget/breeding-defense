# 스토어 패키지 (아이콘·스크린샷·소개문·ASO)

> 2026-07-06 확정. M5 완료 후 출시 준비 단계에서 사용. 아이콘·피처 그래픽 생성은 사용자(NovelAI), 캡처·문안 적용은 AI.
> NovelAI 공통 설정: `docs/novelai-prompt-bloodline.md` 상단 표와 동일 (V4.5 / Steps 28 / CFG 5.0).

## 1. 게임명 후보 (스토어 표기)

| 후보 | 영문 | 비고 |
|---|---|---|
| **브리딩 디펜스: 명가** (1안) | Bloodline Defense | 리디자인 비전 직결, "명가" = 혈통 판타지 |
| 명가: 신을 낳는 디펜스 (2안) | Bloodline: Birth of God | 피치 문장 그대로 — ASO상 "디펜스" 포함 필수 |
| 브리딩 디펜스 (보수안) | Breeding Defense | 현 프로젝트명 유지 |

권장: 1안. 부제 슬롯("명가")이 업데이트 시즌명으로 확장 가능 (예: "명가: 야생의 인자").

## 2. 앱 아이콘 — `store_icon.png` (1024×1024, Seed 87001)

**콘셉트: 금빛 균열이 이는 알.** 디펜스 장르 아이콘은 캐릭터 얼굴이 표준 — **알 단독**이 카테고리 안에서 즉시 이질적(=차별화)이고, "낳는 게임" 약속을 아이콘부터 시작한다. 48px 축소에서도 실루엣 1개라 뭉개지지 않음.

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:alphonse mucha,
app icon composition, single giant ornate golden egg filling 80% of frame,
art nouveau filigree bands wrapping the shell, mucha decorative curves,
glowing golden crack running down the shell, divine light bursting from the crack,
tiny crown silhouette visible inside the light,
deep dark background #1a1a0f, radial golden glow behind egg,
prismatic gold dominant palette, crisp thick ink outline, cel-shading,
centered, symmetric weight, no text, no letters, no border frame
```

- 네거티브: `docs/novelai-prompt-bloodline.md` 네거티브 B + `character, person, face`.
- 대안 컷 (같은 시드, A/B용): `tiny crown silhouette` → `chibi divine deity silhouette` (신 실루엣 버전).
- 검수: 48px 축소 후 경쟁 아이콘(랜덤다이스·러시로얄) 옆에 놓고 식별되는가.

## 3. 피처 그래픽 — `store_feature.png` (Google Play 1024×500, Seed 87002)

NovelAI Landscape 1216×832 생성 → 1024×500 중앙 크롭. 키비주얼(AM6)의 가로 재구성:

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
wide banner composition, divine astral deity youth on the right side, prismatic golden robes, ornate crown, six angelic wings,
a glowing ornate golden egg at center, art nouveau filigree shell, divine light,
three small chibi units (knight, beast, robot) on the left gazing at the egg,
horizontal flow from left to right, golden vines and mucha arch framing top and bottom edges,
deep dark background #1a1a0f, god rays, floating light particles,
royal blue, emerald green, royal purple accents, prismatic gold dominant,
crisp ink outline, cel-shading, no text, no logo, left third kept simple for logo overlay
```

- 로고 텍스트는 좌측 1/3에 코드/편집으로 오버레이 (이미지에 글자 금지).

## 4. 스크린샷 5장 시나리오 (세로 1080×1920, 인게임 캡처 + 상단 카피 오버레이)

> 캡처는 M4·M5 완료 후 실기기에서 사용자가 수행. 각 장 = 촬영 조건 + 오버레이 카피 1줄. 카피는 상단 20% 영역, WebFont + 금색.

| # | 장면 | 촬영 조건 | 카피 |
|---|---|---|---|
| 1 | **전설 부화 순간** | 둥지 부화에서 전설 변이(금색 플래시+칭호 배너) 프레임. 개발 치트로 전설 확정 롤 허용 | "낳아라, 신이 나올 때까지" |
| 2 | **전투 최고조** | W2-5 라운드 12+, Gen3 왕관 유닛의 금색 혈통 일격 + 적 15마리 이상 + 데미지 숫자 | "길러낸 혈통이 전장을 쓸어버린다" |
| 3 | **예상 혈통 카드** | 둥지 2슬롯 + 슬로모 중 예상 카드(Gen↑·변이 30% 표시) 노출 | "조합을 읽어라 — 안정이냐, 도박이냐" |
| 4 | **혈통서 (계보 체인)** | 가문 카드 3개 이상, 칭호 포함 체인 노출 | "판마다 다른 가문의 이야기가 남는다" |
| 5 | **T4 강림 컷인** | W1-5 클리어 컷인(AM4) 프레임 | "7분, 신을 낳는 시간" |

- 순서 고정: 1→2가 스토어 목록에서 먼저 보이는 2장 (잭팟+전투 = 장르 유저 후킹), 3~5는 깊이 어필.
- 5장 전부 리디자인 후 화면 — 기존 UI가 1픽셀도 찍히면 안 됨 (v3 필러 2 "스샷 5장 전부 교체 가능" 판정 기준과 동일).

## 5. 스토어 소개문

**짧은 설명 (80자 이내):**
> 뽑지 말고 낳아라! 교배로 혈통을 기르고 신을 낳는 유일한 랜덤 디펜스. 7분이면 한 판.

**전체 설명 구조 (한국어):**
```
■ 뽑는 게임이 아니라, 낳는 게임
소환은 시작일 뿐. 유닛 둘을 둥지에 넣으면 세대가 오른다.
같은 문(門)이면 안정 사다리, 다른 문이면 변이 도박 — 선택은 당신 몫.

■ 판마다 다른 가문의 이야기
벼락맞은 서리송곳니 2세, 신탁의 침묵방패 4세…
길러낸 계보는 혈통서에 영원히 남고, 다음 판에 후손이 출전한다.

■ 7분의 완성된 한 판
14라운드, 보스 3페이즈, 마지막엔 신(神) 강림.
출퇴근 한 사이클에 기승전결이 끝난다.

■ 특징
- 25종 유닛 합성 트리 + 혈통 세대 시스템
- 희귀·전설 변이 잭팟과 소프트 피티
- 아르누보 × 치비 아트
- 세로 한손 조작, 오프라인 플레이
```

**English short (80 chars):**
> Don't summon. BREED! Raise a bloodline & birth a god. 7-min random defense runs.

## 6. ASO 키워드

| 언어 | 키워드 |
|---|---|
| 한국어 | 랜덤디펜스, 디펜스게임, 교배, 혈통, 합성 디펜스, 방치형 아님(제외어), 유닛 수집, 로그라이트 디펜스, 타워디펜스, 가문 |
| English | random defense, breeding game, bloodline, tower defense, merge defense, unit collector, roguelite defense, 7 minute runs |

- 핵심 차별 토큰 = **"교배/breeding"** — 경쟁작 미사용 키워드라 저경쟁 선점 가능.
- 제외 포지셔닝: "방치형"으로 오인되지 않게 소개문에 조작 재미 명시 (스샷 2·3이 보조).

## 7. 체크리스트 (M5 이후)

- [ ] 아이콘 A/B 2컷 생성 → 48px 비교 → 확정 → Capacitor 아이콘 세트 변환 (AI: `npx capacitor-assets` 절차)
- [ ] 피처 그래픽 생성 + 로고 오버레이
- [ ] 실기기 스샷 5장 (조건 표대로) → 카피 오버레이 (AI: 간단 스크립트)
- [ ] 소개문 스토어 콘솔 입력 (한/영)
- [ ] 게임명 최종 확정 — 상표·중복 검색 선행
