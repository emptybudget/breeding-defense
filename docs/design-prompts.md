# breeding-defense — 디자인/아트 의뢰서

> NovelAI v4 캐릭터·배경·UI·스토어 자산 프롬프트 모음. PROGRESS.md에서 분리(2026-05-28).
> 코드/게임 디자인 컨텍스트는 PROGRESS.md, 톤·스타일 결정 이력은 이 문서.

## 결정 요약 (2026-05-28 designer 의뢰 결과)

- **톤: B안 아르누보-Chibi 하이브리드 확정** (명일방주/림버스 톤 + 알폰스 무하 골드 곡선)
- **분위기: 다크 판타지 + 골드 액센트** (UI `artnouveau.ts`와 동일 톤)
- **생성 도구: NovelAI v4 메인** + Midjourney 보조 (타이틀/Astral_God 도감 일러스트)
- 무하 액센트 단계별: T1 절제 → T2 중간 → T3 강조 → T4 만개 (Pop 서사 시각화)
- **포즈/시점 (2026-06-10 확정): 3/4 좌향(살짝 왼쪽 바라봄) + 자연 idle(팔 내림).** 정면 대칭 T포즈 폐기 — 좌우 반전으로 적 방향(좌/우)을 구분하기 위함.
- **공격 모션 (2026-06-10 확정): NovelAI 추가 생성 없이 처리.** 인게임 표시 20~36px에선 캐릭터 내부 포즈 변화가 거의 안 보이고, **실루엣 전체 변형 + 캐릭터 앞 이펙트**가 공격감의 90%. → (1) Phaser tween 실루엣 모션(근접 lunge / 원거리 반동 / 마법 pulse + 상시 idle bob), (2) 공유 이펙트 오버레이(무하 톤 그려진 이펙트로 기존 도형 이펙트 교체). **T3·T4만 이펙트 강화, T4 Astral_God 1종만 attack 포즈 추가 생성 검토.** idle 원본은 1장 유지. 상세 → §5-1.
- **생성 모델: NovelAI v4.5** (`{{masterpiece}}` 태그 v4.5 전용, `year 2025`로 최신 미감).

## 캐릭터 원본 사양 (공통)

- 1024×1024 PNG, **투명 배경 필수**, 정사각형
- **3/4 좌향(살짝 왼쪽 바라봄)** + 중앙 + 가장자리 100~150px 여백
- 인게임 표시 64~96px 기준 → 다운스케일 (좌향 원본 → 좌우 반전으로 우향 생성)
- 종족별 메인 컬러 통일 (아래 컬러 가이드)
- 파일명 규칙: `unit_<race>_tier<N>.png`, `enemy_<type>.png`

## 스토어/UI 자산 사양

- 앱 아이콘: 1024×1024 (iOS), 512×512 (Play)
- 스플래시/타이틀 일러스트: 2048×2048 이상
- Play 피처 그래픽: 1024×500

---

## 1. 캐릭터 공통 — 베이스 프롬프트 (전 25종)

> 색상 기준: `src/scenes/artnouveau.ts` 실측값 — `AN.BG_DEEP=#1a1a0f` / `AN.BG_DARK=#2c2a14` / `AN.GOLD_DIM=#7a5c1e` / `AN.GOLD_MID=#b8882a` / `AN.GOLD_MAIN=#e8c84a` / `AN.VINE_DARK=#6b7a3a` / `AN.VINE_MAIN=#8aaa4a` / `AN.TEAL=#4ab8b8` / `ANS.CREAM=#f0e8c8` / `ANS.PARCH=#c8b97a` / `BOSS_RED=#a83232`(추가 정의 필요).

NovelAI v4 Tags 영역에 그대로 붙여 넣음. 캐릭터별 토큰만 갈아끼움.

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
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
- `three-quarter view, facing slightly to the left` — **좌우 반전으로 적 방향(좌/우) 구분**. 정면 대칭은 반전해도 동일해 방향 표현 불가. 모든 캐릭터 원본은 **좌향으로 통일** (인게임에서 우측 적 바라볼 땐 반전)
- `arms relaxed down at sides` — T포즈/팔벌림 폐기. 자연스러운 대기 자세 (팔 줄여도 안 어색, 다운스케일 시 실루엣 깔끔)
- `clear silhouette, separable limbs` — 64~96px 다운스케일 가독성
- `weapon held lowered, not swinging` — **idle 원본 1장 생성** (공격감은 코드 tween + 이펙트가 담당, 공격 포즈는 생성 안 함 — 예외: T4 §5-1)

## 2. 캐릭터 공통 — 네거티브 프롬프트

```
lowres, bad anatomy, bad hands, text, error, missing fingers, extra digits,
fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts,
signature, watermark, username, blurry,
multiple characters, 2girls, 2boys, crowd, group,
dynamic pose, action pose, motion blur, swinging weapon, mid-attack,
running, jumping, sitting, lying down, leaning,
arms crossed, arms behind back, arms raised, arms spread wide, t-pose, hands hidden,
realistic, photorealistic, 3d render, hyperrealistic skin,
dark background, complex background, scenery, landscape, indoor, outdoor,
shadow under feet, ground shadow, gradient background,
front view symmetrical, full side profile, side view, back view, facing right, facing away,
extra limbs, missing limbs, fused limbs,
oversaturated, neon glow overload, cluttered details, busy patterns on face,
cape covering body, full body cloak,
```

## 3. 종족별 색상 태그 (베이스의 `{character race color}` 치환)

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

## 4. 무하 액센트 단계별 강도

| 티어 | 추가 토큰 |
|---|---|
| **T1** | `minimal gold trim, single thin filigree line on collar, no halo` |
| **T2** | `moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders` |
| **T3** | `rich mucha-style halo behind head, ornate golden filigree on armor, vine motifs framing character, prominent decorative arch` |
| **T4** | `full mucha halo, elaborate golden vines wrapping the character, radiant divine background patterns, peacock feather motifs, blooming flower ornaments, baroque gold framework` |

## 5. 캐릭터 25종 개별 토큰

### Tier 1 (6종)

| # | 캐릭터 | 종족 | 추가 토큰 | 무기/소품 |
|---|---|---|---|---|
| 1 | Warrior | Human | `young knight boy, short brown hair, blue tunic, iron pauldron, determined face` | short iron sword held downward at right side |
| 2 | Archer | Human | `young archer girl, blonde long ponytail, blue hood, leather vest, calm expression` | wooden longbow held vertically in left hand, no arrow drawn |
| 3 | Dog | Beast | `chibi shiba inu warrior, anthropomorphic puppy, green scarf, tiny leather harness, cheerful` | small bone club resting on shoulder |
| 4 | Squirrel | Beast | `chibi squirrel girl, fluffy tail, green hooded cape, acorn pendant, curious eyes` | tiny wooden slingshot in right hand |
| 5 | Android | Robot | `chibi android boy, smooth white plating, purple visor, antenna, neutral expression` | compact arm-mounted blaster pointed downward |
| 6 | Cannon | Robot | `chibi cannon mecha, stubby robot body, purple plating, single eye sensor, round feet` | shoulder-mounted small cannon barrel, idle |

### Tier 2 (12종)

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

### Tier 3 (6종)

| # | 캐릭터 | 종족 | 추가 토큰 | 무기/소품 |
|---|---|---|---|---|
| 19 | Cyborg_Wizard | Cyborg_Wizard | `cybernetic mage youth, golden yellow robes, mechanical staff arm, glowing circuit runes, mucha halo with gear motifs` | golden tech staff held vertically |
| 20 | Dino_Mecha | Dino_Mecha | `young pilot girl inside small mecha dinosaur, crimson red armor plating, T-rex head silhouette, mucha halo with flame curves` | mecha tail and clawed arms |
| 21 | Griffin | Griffin | `griffin knight boy, mint green feathered armor, eagle wings spread slightly, lion-tail, mucha halo with feather motifs` | talon gauntlets |
| 22 | Thunder_Hawk | Thunder_Hawk | `electric hawk knight girl, yellow-green armor, lightning patterns, hawk wings folded, mucha halo with lightning bolts` | lightning spear held vertically |
| 23 | **Berserk_Shaman** | Berserk_Shaman | `berserker shaman chibi, glowing purple aura swirling around body, war paint on cheeks, feral grin, frenzied stance, totem mask pushed up, dual hatchet axes, mucha-style swirling aura ornament, art nouveau halo of purple smoke` | 양손 손도끼 2자루, 등에 부족 토템, 발밑 보라색 룬 원 |
| 24 | **Chaos_Artillery** | Chaos_Artillery | `chaos artillery chibi gunner, heavy mortar cannon on shoulder, bandolier of mini-bombs across chest, soot-streaked goggles, cocky grin, explosive shells strapped to belt, mucha-style smoke ornament curling behind, art nouveau ammunition border` | 어깨 박격포, 가슴 탄띠, 고글, 벨트 미사일 셸 |

### Tier 4 (1종)

| # | 캐릭터 | 종족 | 추가 토큰 | 무기/소품 |
|---|---|---|---|---|
| 25 | Astral_God | (혼합/신성) | `divine astral deity youth, androgynous, prismatic golden robes with rainbow iridescence, six small angelic wings, glowing third eye, ornate crown, serene godly expression, full mucha halo with peacock feathers, blooming lotus, golden vines wrapping entire body, radiant constellation background ring` | crystalline scepter held vertically with both hands, suspended chains of gold |

## 5-1. 공격 표현 방침 (비-NovelAI, 개발자/이펙트 영역)

> 인게임 20~36px에선 캐릭터 그림을 더 그리는 것(2프레임·무기분리)은 가성비 최악 — 36px에서 포즈 차이는 거의 안 보임. 공격감의 정체는 **(1) 실루엣 전체 tween + (2) 캐릭터 앞 이펙트**. NovelAI 추가 생성은 0~1장으로 묶고, 작업은 코드+이펙트로 넘긴다.

### 티어별 차등

| 티어 | 모션 처리 | 비고 |
|---|---|---|
| **T1·T2 (18종)** | tween만 (타입별 프리셋 3종) | 추가 생성 0장. 근접 lunge / 원거리 반동(뒤로 kick) / 마법 pulse + 상시 idle bob(±2px) |
| **T3 (6종)** | tween + 그려진 이펙트 강화판 | "고생 끝 보상" 순간 — 이펙트 키워 존재감 |
| **T4 Astral_God (1종)** | tween + 풀이펙트 + (선택) attack 2프레임 | 클라이맥스 1종뿐 → attack 포즈 1장 추가는 ROI 충분 |

### 공유 이펙트 (캐릭터 무관, 6~10종 공용)

- 기존 코드의 도형 기반 이펙트 8종(slash/beam/shell/chain/magic/divine/arrow/기본)을 **무하 톤 그려진 PNG 이펙트로 교체**. "노란 직선 플래시" → "무하풍 금빛 슬래시 호"가 되면 같은 36px에서 타격감 급상승.
- 우선순위: **슬래시 호 / 머즐 플래시 / 마법진 / 임팩트 스파크** 4종 먼저.
- ⚠️ 이펙트는 **NovelAI 부적합**(투명배경 단발/시트 일관성 안 나옴) → 직접 그리기 / Effekseer / 단순 PNG로 별도 제작.

### T4 Astral_God attack 포즈 토큰 (2프레임 적용 시)

idle과 **동일 시드(+300) + 완성 idle PNG를 Vibe Transfer Info 1.0 / Str 0.6 / CFG 5.0**. 베이스의 idle 자세 라인(`arms relaxed down at sides ... not swinging, static portrait`)만 아래로 교체, 나머지(색·장식·시점·톤) 전부 고정:

```
both arms raised forward channeling power, scepter lifted overhead with both hands,
divine light bursting from the scepter tip, body leaning slightly forward,
mid-cast attack pose, radiant energy gathering, dramatic but balanced stance,
clear silhouette still readable, same character same outfit same colors as idle
```

- 네거티브에서 **이 컷만** `dynamic pose, action pose, swinging weapon, mid-attack` 제거(안 그러면 모델이 공격 포즈 거부). 나머지 네거티브 유지.
- 파일명: `unit_astral_god_tier4_attack.png` (idle은 `_tier4.png` 그대로).
- 검수: idle과 얼굴·왕관·후광·색 동일한가 / 36px에서 idle과 실루엣 구분되는가(앞으로 기움 + 팔 올림).

## 6. Vibe Transfer 운용법 (캐릭터 25종 일관성 핵심)

**Step 1 — Anchor 제작 (Warrior 1종)**
- 베이스 + 색상 + 토큰만으로 시드 여러 개 → 만족스러운 1장 확보
- 검수: chibi 1:1.5 / **3/4 좌향(살짝 왼쪽)** / 팔 내림(벌림 X) / 골드 라인 절제 / 파랑 50%+
- 저장: `anchor_warrior.png`

**Step 2~5 — 강도 단계별**

| 단계 | 슬롯1 (anchor_warrior) | 슬롯2 (보조) |
|---|---|---|
| T1 나머지 5종 | Info 1.0 / Str 0.6 | — |
| T2 12종 | Info 1.0 / Str 0.4 | T1 베스트, Str 0.3 |
| T3 6종 | Info 1.0 / Str 0.35 | T2 베스트, Str 0.3 |
| T4 Astral_God | Info 1.0 / Str 0.25 | T3 베스트, Str 0.4 |

## 7. 캐릭터 NovelAI 설정 (전 25종 공통)

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

## 8. 배경/UI/버튼 (8종)

> **공통:** NovelAI v4 / `Sampler: k_euler_ancestral` / `Steps: 28` / `CFG: 5.0~6.0` / 시드 자산별 고정. `artnouveau.ts` 톤(딥포레스트+골드)와 톤 일치.

### 8-1. 메인 배경 (인게임)

- **해상도:** 720×1280 (모바일 2배) / **Seed `81001`** / CFG `5.0`

```
art nouveau mucha-style vertical game background, deep dark forest at night, distant moonlit silhouettes of birch and oak trees, ornate golden vine borders framing the left and right edges, mucha-style swirling botanical filigree in the top and bottom corners, intricate gold leaf pattern, parchment-cream highlights, faint glowing fireflies, soft volumetric mist near the ground, very dark muted center area with subtle low-poly pixel texture, color palette dominated by deep forest #1a1a0f, dark olive #2c2a14, antique gold #b8882a, bright gold #e8c84a, fern green #8aaa4a, mobile portrait composition, no characters, atmospheric depth
```

**네거티브:**
```
character, person, figure, human, animal, creature, monster, knight, warrior, mascot, face, eyes, text, letters, ui, hud, button, frame inside center, bright center, overexposed, watermark, signature, logo, modern, sci-fi, neon, cyberpunk, photographic, photorealistic
```

### 8-2. 타이틀 화면 배경

- **해상도:** 1024×1820 / **Seed `81002`** / CFG `5.5` / 중앙 1/3 로고 자리 비움

```
art nouveau mucha title screen background, grand ornamental golden frame, central oval reserved empty space for a logo, swirling acanthus leaves, intertwined vines, two large symmetrical mucha-style decorative panels on left and right, art nouveau botanical filigree, golden parchment highlights, deep forest backdrop, soft warm candlelight glow from below, mythical aura, mucha alphonse poster style, mobile portrait, low-poly pixel-art finish on edges, color palette of deep forest #1a1a0f, antique gold #b8882a, bright gold #e8c84a, cream #f0e8c8, fern #8aaa4a, dramatic but elegant
```

**네거티브:**
```
character, person, figure, human face, eyes, animal, creature, text, letters, words, title, logo content, watermark, signature, ui buttons, hud, modern, sci-fi, neon, photographic, photorealistic, cluttered center, busy center
```

### 8-3. 스테이지 선택 배경

- **해상도:** 720×1280 / **Seed `81003`** / CFG `5.0` / 중앙 세로 띠 비움

```
art nouveau mucha stage select screen background, ornate vertical golden frame on left and right edges, three faint horizontal divider gold lines across the middle, mucha-style botanical corner ornaments at all four corners, intricate filigree, deep forest backdrop, vine motifs, golden parchment highlights, central vertical strip kept dark and minimal for ui slots, mobile portrait composition, low-poly pixel-art texture, color palette of deep forest #1a1a0f, dark olive #2c2a14, antique gold #b8882a, bright gold #e8c84a, fern #8aaa4a, parchment cream #c8b97a
```

**네거티브:**
```
character, person, figure, human, animal, creature, face, text, letters, numbers, button labels, ui content, watermark, signature, busy center, cluttered middle, modern, sci-fi, neon
```

### 8-4. 팝업 프레임 (가운데 투명 PNG)

- **해상도:** 1024×1024 / **Seed `81004`** / CFG `6.0` / **중앙 알파 컷 후처리 필수**

```
art nouveau mucha decorative frame, ornate golden rectangle border occupying the outer 20 percent of the canvas, intricate filigree, acanthus leaves at all four corners, mucha-style swirling vine motifs, jeweled inlay with small teal accents, antique gold border with bright gold highlights, central rectangular area completely transparent and empty, symmetric composition, low-poly pixel-art finish, color palette antique gold #b8882a, bright gold #e8c84a, fern #8aaa4a, teal #4ab8b8 accents, no background fill in center
```

**네거티브:**
```
character, person, figure, human, animal, creature, face, text, letters, numbers, button, filled center, opaque center, solid center background, watermark, signature, modern, sci-fi, neon, photographic
```

### 8-5. 일반 버튼 (아이들)

- **해상도:** 512×128 가로 / **Seed `81005`** / CFG `6.0`

```
art nouveau mucha-style horizontal button background, elongated rounded rectangle, antique gold ornate border with thin inner gold line, deep dark olive fill #2c2a14, small mucha-style vine flourish on left and right ends, subtle parchment highlight at top edge, embossed feel, low-poly pixel-art finish, idle state, soft warm tone, color palette deep olive #2c2a14, antique gold #b8882a, bright gold #e8c84a, fern #8aaa4a, no glow
```

**네거티브:**
```
character, person, figure, face, text, letters, words, label, icon, symbol, glow, bright light, neon, watermark, signature, modern, sci-fi, photographic, vertical orientation
```

### 8-6. 일반 버튼 (호버/프레스)

- **해상도:** 512×128 / **Seed `81005` (아이들과 동일)** / CFG `6.0`

```
art nouveau mucha-style horizontal button background, elongated rounded rectangle, antique gold ornate border with bright gold inner line, deep dark olive fill #2c2a14 with subtle inner glow, small mucha-style vine flourish on left and right ends glowing softly, embossed feel, low-poly pixel-art finish, hover state, warm golden glow emanating from edges, color palette deep olive #2c2a14, antique gold #b8882a, bright gold #e8c84a, cream highlight #f0e8c8, fern #8aaa4a, soft glow halo
```

**네거티브:**
```
character, person, figure, face, text, letters, words, label, icon, symbol, neon, blue glow, red glow, watermark, signature, modern, sci-fi, photographic, vertical orientation, oversaturated
```

### 8-7. 보스 등장 이펙트 (배경 오버레이, 알파)

- **해상도:** 720×1280 / **Seed `81007`** / CFG `5.5` / 중앙 50% 알파 컷

```
art nouveau mucha-style boss warning overlay, vertical mobile composition, blood red ornate frame on all four edges, mucha-style thorny vines crawling inward from the borders, jagged decorative spikes, central area kept fully transparent and empty, ominous red and dark crimson palette, alarm motif, distressed gold accents, low-poly pixel-art finish, dramatic vignette dark in the center, color palette boss red #a83232, deep crimson #5a1010, dark forest #1a1a0f, antique gold #b8882a, transparent center
```

**네거티브:**
```
character, person, figure, monster, creature, face, eyes, boss silhouette, text, letters, warning sign, exclamation mark, ui, hud, button, opaque center, filled center, bright center, watermark, signature, modern, neon, photographic
```

### 8-8. 승리/패배 팝업 배경

- **해상도:** 1024×1024 / **Seed `81008`** / CFG `6.0` / 톤 변형은 후처리 또는 프롬프트에 `triumphant warm tone` vs `mournful cold tone` 추가

```
art nouveau mucha victory or gameover popup background, central radiating golden halo with mucha-style decorative sunburst rays, ornate symmetric vine and laurel wreath framing the halo, large empty central oval area reserved for text, deep dark forest backdrop fading to black at the edges, golden parchment highlights, mucha alphonse poster composition, jeweled accents in teal and gold, low-poly pixel-art finish, color palette deep forest #1a1a0f, antique gold #b8882a, bright gold #e8c84a, cream #f0e8c8, teal #4ab8b8 accents, fern #8aaa4a
```

**네거티브:**
```
character, person, figure, human, animal, creature, face, eyes, text, letters, words, victory text, defeat text, score, numbers, button, ui content, watermark, signature, modern, sci-fi, neon, photographic, filled center, busy center
```

---

## 9. 스토어 메타 (4종)

> **공통:** Vibe Transfer (강도 0.5~0.6) — 인게임 캐릭터 PNG 중 Astral_God 또는 Griffin 참조로 톤 통일.

### 9-1. 앱 아이콘

- **해상도:** 1024×1024 (iOS), 512×512 (Play 다운스케일) / **Seed `82001`** / CFG `6.5` / Vibe: Astral_God, Str 0.5

```
mobile game app icon, square composition, art nouveau mucha style, single iconic chibi astral god deity centered, glowing halo with mucha-style golden sunburst rays radiating outward, ornate art nouveau border just inside the square edges, deep forest background fading to gold at the corners, mucha alphonse poster aesthetic, low-poly pixel-art finish, bold readable silhouette even at small size, eye-catching, color palette deep forest #1a1a0f, bright gold #e8c84a, antique gold #b8882a, cream #f0e8c8, teal #4ab8b8 accents, mobile app icon design, no text
```

**네거티브:**
```
text, letters, words, title, logo content, ui, hud, button, multiple characters, group of characters, busy composition, cluttered, watermark, signature, photorealistic, photographic, modern, sci-fi, neon, blurry, low contrast, weak silhouette, rounded corners drawn in, drop shadow outside
```

### 9-2. 스플래시

- **해상도:** 2048×2048 / **Seed `82002`** / CFG `6.0` / 중앙 1/3 로고 자리 비움

```
mobile game splash screen, square 2048 composition, art nouveau mucha style, grand golden halo radiating from center, mucha-style sunburst rays, ornate symmetric vine and laurel framing, central rectangular area reserved empty for a logo placement (about one-third of the canvas height), deep forest backdrop, mucha alphonse poster aesthetic, dramatic warm cinematic lighting, golden parchment highlights, low-poly pixel-art finish on the ornamental details, jeweled teal and gold accents, color palette deep forest #1a1a0f, bright gold #e8c84a, antique gold #b8882a, cream #f0e8c8, fern #8aaa4a, teal #4ab8b8, no text
```

**네거티브:**
```
character, person, figure, multiple characters, face, eyes, text, letters, words, logo content, title text, ui, hud, button, watermark, signature, photorealistic, photographic, modern, sci-fi, neon, busy center, filled center
```

### 9-3. Play 피처 그래픽

- **해상도:** 1024×500 / **Seed `82003`** / CFG `6.5` / Vibe: Astral_God + Griffin + Cyborg_Wizard, Str 0.55 / 좌측 1/3 텍스트 자리

```
horizontal landscape mobile game feature graphic, art nouveau mucha style, three chibi heroes posed dynamically on the right third of the canvas (a chibi griffin warrior, a chibi cyborg wizard, and a chibi astral god deity in the center back glowing with a golden halo), epic battle pose, mucha-style decorative vines and golden filigree framing the edges, deep dark forest battlefield background with soft golden mist, dramatic warm cinematic lighting, left third kept relatively empty and darker for title text overlay, low-poly pixel-art finish, mucha alphonse poster aesthetic, color palette deep forest #1a1a0f, bright gold #e8c84a, antique gold #b8882a, cream #f0e8c8, fern #8aaa4a, teal #4ab8b8, mint #00ffaa, violet #9b30ff accents
```

**네거티브:**
```
text, letters, words, title, logo, game name, button, ui, hud, score, number, watermark, signature, photorealistic, photographic, modern, sci-fi, neon, full screen character on left, cluttered left side, vertical composition, portrait orientation
```

### 9-4. 스크린샷 키비주얼

- **해상도:** 1080×1920 / **Seed `82004`** / CFG `6.5` / Vibe: T3+T4 멀티 참조, Str 0.6

```
vertical mobile game key visual, art nouveau mucha style, epic hero lineup composition, chibi astral god deity in the center top glowing with massive golden halo and sunburst rays, six chibi tier-3 heroes arranged in a symmetric arc around and below (chibi cyborg wizard with arcane orb, chibi dino mecha with rocket fist, chibi griffin with feathered wings, chibi thunder hawk archer with lightning bow, chibi berserk shaman with dual axes and purple aura, chibi chaos artillery gunner with shoulder mortar), all heroes posed heroically, mucha-style ornate vine and laurel borders framing the canvas, dramatic warm cinematic lighting, deep dark forest battlefield background, golden mist, jeweled accents, low-poly pixel-art finish, mucha alphonse poster aesthetic, mobile portrait 9:16, color palette deep forest #1a1a0f, bright gold #e8c84a, antique gold #b8882a, cream #f0e8c8, fern #8aaa4a, teal #4ab8b8, full hero ensemble bloom shot
```

**네거티브:**
```
text, letters, words, title, logo, game name, ui, hud, button, score, number, hp bar, watermark, signature, photorealistic, photographic, modern, sci-fi, neon, single character, empty composition, horizontal landscape orientation, missing limbs, fused characters, extra characters, more than seven characters, fewer than five characters
```

---

## 10. 시드 일람 (재생성 일관성)

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

## 11. 파일명/디렉토리 규칙

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

## 12. 워크플로우 체크리스트

```
[Phase 0 — 준비]
□ NovelAI 구독 Opus 티어 (Vibe Transfer 슬롯 5개 사용)
□ rembg 설치 (pip install rembg) — 누끼 자동화
□ 출력 폴더 구조 생성 (위 트리)

[Phase 1 — Warrior Anchor 제작]
□ 베이스+네거티브+Warrior+Human 색상 입력
□ 시드 미고정 6~10장 → 만족 컷 선별
□ 검수: chibi 1:1.5 / 3/4 좌향(살짝 왼쪽) / 팔 내림(벌림 X) / 파랑 50%+ / 골드 절제
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
□ 좌우 반전 미리보기 → 우향(반전) 시 무기/장식이 어색하지 않은지 확인
□ final/로 이동, unit_<race>_tier<N>.png 규칙 적용

[Phase 8 — 배경/UI/스토어 자산]
□ 8종 배경/UI (시드 81001~81008)
□ 4종 스토어 (시드 82001~82004)
□ 각 자산 알파 처리 필요한 것만 후처리

[Phase 9 — Phaser 통합 (개발자 작업)]
□ public/assets/ 배치
□ idle bob / 공격 텔레그래프 / 피격 셰이크 tween 적용
□ 타입별 공격 tween 프리셋 3종 (근접 lunge / 원거리 반동 / 마법 pulse)
□ 이펙트 텍스처 교체 (슬래시 호 / 머즐 플래시 / 마법진 / 임팩트 스파크) — T3·T4 강화판
□ 64~96px 인게임 확인
```

## 13. 사용자 결정 대기 항목

- [ ] Warrior anchor 시드 메모 → 시드 일람표 갱신
- [ ] Berserk_Shaman `#9b30ff` / Chaos_Artillery `#ff9500+#3a3a3a` 색상 OK 여부
- [ ] `artnouveau.ts`에 `AN.BOSS_RED = 0xa83232` 추가 정의 (별도 코드 작업 요청 시)
- [ ] 승리/패배 팝업: 한 장 + 톤 후처리 vs 두 장 별도 생성
- [ ] 스크린샷 키비주얼: 6+1 합본 vs Astral_God 단독 (Vibe 강도 0.7)
- [ ] T4 Astral_God attack 포즈 1장 추가 생성 여부 (2프레임 적용 — §5-1)
- [ ] 이펙트 제작 도구 결정 (직접 그리기 / Effekseer / 단순 PNG)
