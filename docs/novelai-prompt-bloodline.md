# breeding-defense — NovelAI 프롬프트 (명가 패치 신규 어셋, 복붙용)

> 생성일: 2026-07-06. 마일스톤·후처리·코드 등록은 **`docs/redesign/07-art-milestones.md`** 참조.
> 스타일 원천: `docs/design-prompts.md` §1~§7 (베이스·네거티브·색상·무하 강도). T1·T2는 `docs/novelai-prompt.md`(완료).
> 중성화 규칙 유지: `androgynous, gender-neutral` (교배 시스템상 성별 이분법 없음).

## 공통 설정

| 항목 | 값 |
|---|---|
| Model | NAI Diffusion **V4.5 Full** |
| Resolution | 1024×1024 (캐릭터·알·적) / **1216×832 Landscape (컷인)** / **832×1216 Portrait (키비주얼)** |
| Steps 28 / CFG 5.0 / Rescale 0.0 / Euler / Karras | Variety+·SMEA OFF |

**시드 계획** (재현용 — 안 맞으면 미고정 6~10장 후 베스트 시드 메모):

| 어셋 | 시드 |
|---|---|
| T3 6종 | Warrior anchor +200 ~ +205 (Cyborg_Wizard=+200 … Chaos_Artillery=+205) |
| T4 idle / attack | anchor **+300** (두 컷 동일 시드, attack은 idle PNG Vibe Str 0.6) |
| 알 3종 | 84001~84003 |
| 적 6종 | 85001~85006 |
| 컷인 / 키비주얼 | 86001 / 86002 |

**Vibe Transfer:** T3·T4 = 슬롯1 `anchor_warrior.png` (Info 1.0 / Str 0.35) + 슬롯2 T2 베스트 컷 (Str 0.25). 알·적은 첫 장(egg_human / enemy_normal)을 anchor로 나머지에 Str 0.4. 컷인·키비주얼은 T4 idle 완성본을 Str 0.5.

---

## 공통 네거티브 A — 캐릭터·적용 (T3·T4·적)

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
front view symmetrical, full side profile, side view, back view,
extra limbs, missing limbs, fused limbs,
oversaturated, neon glow overload, cluttered details, busy patterns on face,
cape covering body, full body cloak,
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious
```

> ⚠️ 유닛(T3·T4)은 위에 `facing right, facing away` 추가(좌향 통일). **적 6종은 반대로 `facing left, facing away` 추가**(우향 통일 — 유닛과 마주보는 진영 언어). T4 attack 컷만 `dynamic pose, action pose, swinging weapon, mid-attack` 4개를 **제거**.

## 공통 네거티브 B — 오브젝트용 (알)

```
character, person, human, face, eyes, limbs, creature hatching, cracked shell, broken egg,
text, letters, watermark, signature, logo, ui, frame,
dark background, colored background, gradient background, scenery,
realistic, photographic, 3d render, multiple objects, cluttered, busy,
shadow under object, ground shadow
```

---

## AM1. 계열 알 3종 — `egg_human.png` / `egg_beast.png` / `egg_robot.png`

> 흰 배경(누끼용). 등급(일반/희귀/전설)은 코드의 부화 플래시 색으로 표현 — 알 자체는 **계열만** 구분. `{family color}`·`{family motif}`만 치환.

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:alphonse mucha,
single fantasy egg, large ornate egg, smooth oval shell, upright standing egg,
art nouveau golden filigree bands wrapping the shell, mucha-style decorative curves,
delicate vine engravings, small gem inlay at center, soft inner glow,
{family color} shell dominates, gold accent lines, cream highlights,
{family motif} pattern engraved on shell,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
readable at small scale, white background, simple background, no shadow on ground,
centered composition, 100px padding from edge
```

| 파일 | `{family color}` | `{family motif}` | Seed |
|---|---|---|---|
| egg_human | `royal blue, sapphire blue` | `sword and shield crest` | 84001 |
| egg_beast | `emerald green, leaf green` | `claw and leaf crest` | 84002 |
| egg_robot | `royal purple, amethyst metallic` | `gear and circuit crest` | 84003 |

검수: 3종을 48px로 줄여 나란히 놓고 **색만으로 계열 구분 가능한가**.

---

## AM2. T3 완성 프롬프트 6종 — `unit_<race>_tier3.png`

> 아래 각 블록 = 완성 프롬프트 전문 (베이스+T3 무하 강도+색+개별 토큰+중성화). 네거티브 A(+`facing right, facing away`).

**T3 공통부** (각 블록 맨 앞에 동일):

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
rich mucha-style halo behind head, ornate golden filigree on armor, vine motifs framing character, prominent decorative arch,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
androgynous, gender-neutral, soft facial features, round face,
```

### 19. Cyborg_Wizard (Seed anchor+200)
```
golden yellow, saffron, sunburst yellow dominates 50% of character palette,
cybernetic mage youth, golden yellow robes, mechanical staff arm, glowing circuit runes,
mucha halo with gear motifs, golden tech staff held vertically,
gold accent lines on costume edges, cream highlights
```

### 20. Dino_Mecha (Seed anchor+201)
```
crimson red, scarlet, blood red metallic dominates 50% of character palette,
young pilot inside small mecha dinosaur, crimson red armor plating, T-rex head silhouette,
mucha halo with flame curves, mecha tail and clawed arms held low,
gold accent lines on armor edges, cream highlights
```

### 21. Griffin (Seed anchor+202)
```
mint green, aqua, jade luminous dominates 50% of character palette,
griffin knight youth, mint green feathered armor, eagle wings folded close to back, lion tail,
mucha halo with feather motifs, talon gauntlets resting at sides,
gold accent lines on armor edges, cream highlights
```

### 22. Thunder_Hawk (Seed anchor+203)
```
electric yellow-green, citrine, lightning yellow dominates 50% of character palette,
electric hawk knight youth, yellow-green armor, lightning patterns, hawk wings folded,
mucha halo with lightning bolts, lightning spear held vertically at side,
gold accent lines on armor edges, cream highlights
```

### 23. Berserk_Shaman (Seed anchor+204)
```
deep violet, witch purple, shamanic purple aura dominates 50% of character palette,
berserker shaman chibi, glowing purple aura swirling around body, war paint on cheeks,
totem mask pushed up on head, tribal totem on back, purple rune circle under feet,
dual small hatchet axes held lowered at sides, calm fierce expression,
mucha-style swirling aura ornament, art nouveau halo of purple smoke,
gold accent lines on costume edges, cream highlights
```

### 24. Chaos_Artillery (Seed anchor+205)
```
blaze orange, ember orange, gunmetal steel gray dual-tone dominates 50% of character palette,
chaos artillery chibi gunner, heavy mortar cannon resting on shoulder, idle,
bandolier of mini-bombs across chest, soot-streaked goggles on forehead, cocky grin,
explosive shells strapped to belt, mucha-style smoke ornament curling behind,
art nouveau ammunition border, gold accent lines, cream highlights
```

---

## AM3. T4 Astral_God — `unit_astral_god_tier4.png` / `_tier4_attack.png`

### idle (Seed anchor+300)

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, legs shoulder-width apart, natural idle stance, static portrait,
clear silhouette, separable limbs,
divine astral deity youth, androgynous, prismatic golden robes with rainbow iridescence,
six small angelic wings, glowing third eye, ornate crown, serene godly expression,
crystalline scepter held vertically with both hands lowered, suspended chains of gold,
full mucha halo with peacock feathers, blooming lotus, golden vines wrapping entire body,
radiant constellation background ring,
prismatic gold, iridescent rainbow, divine light dominates 50% of character palette,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
readable at small scale, white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
gender-neutral, soft facial features, round face
```

### attack (동일 시드 +300, idle PNG Vibe Str 0.6 — `docs/design-prompts.md` §5-1 확정 사양)

idle 프롬프트에서 `arms relaxed down at sides ... static portrait` 줄만 아래로 교체, 네거티브 A에서 `dynamic pose, action pose, swinging weapon, mid-attack` 4개 제거:

```
both arms raised forward channeling power, scepter lifted overhead with both hands,
divine light bursting from the scepter tip, body leaning slightly forward,
mid-cast attack pose, radiant energy gathering, dramatic but balanced stance,
clear silhouette still readable, same character same outfit same colors as idle
```

검수: idle과 얼굴·왕관·후광·색 동일 / 36px에서 실루엣 구분(앞 기움+팔 올림).

---

## AM4. T4 컷인 — `cutin_astral_god.png` (1216×832, Seed 86001)

> 스프라이트 아님 — 연출용 일러스트. 누끼 없음, 크롭만. 네거티브 A에서 포즈 금지줄 전부 제거하고 `text, watermark, multiple characters`만 유지.

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
dramatic cut-in illustration, upper body close-up, dynamic diagonal composition,
divine astral deity youth, androgynous, prismatic golden robes, ornate crown, glowing third eye,
six angelic wings spread wide, crystalline scepter raised, divine light bursting,
full mucha halo with peacock feathers, golden vines, radiant constellation ring,
deep navy night background #1a1a0f with golden art nouveau frame edges,
god rays, floating light particles, awe-inspiring, majestic,
prismatic gold, iridescent rainbow palette, crisp ink outline, cel-shading
```

---

## AM5. 적 6종 — `enemy_<type>.png`

> 유닛과 반대로 **우향** (네거티브 A + `facing left, facing away`). 무하 금장식 배제 — 적 진영은 **어두운 청동+검보라** 언어. 흰 배경(누끼용).

**적 공통부** (각 블록 맨 앞):

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey,
1character, solo, chibi monster, super deformed, small menacing creature,
three-quarter view, facing slightly to the right, body angled 30 degrees to the right, full body,
natural idle stance, static portrait, clear silhouette, separable limbs,
dark bronze trim, tarnished metal accents, no gold filigree,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
readable at very small scale, white background, simple background, no shadow on ground,
centered composition, 120px padding from edge,
```

| 파일 | Seed | 개별 블록 |
|---|---|---|
| enemy_normal | 85001 | `small dark purple imp, round blob body, stubby horns, glowing violet eyes, mischievous fangs, dark violet #4a2a5a palette` |
| enemy_fast | 85002 | `swift wasp imp, yellow-black striped body, translucent buzzing wings folded, needle stinger, sharp eager eyes, amber and black palette` |
| enemy_tank | 85003 | `heavy tortoise beast, massive cracked stone shell, stubby armored legs, sleepy stubborn face, moss on shell, dark green and slate gray palette` |
| enemy_elite | 85004 | `skeletal wraith, small hooded bone spirit, floating tattered dark robe, glowing purple skull face, wisp flames, black and violet palette` |
| enemy_boss | 85005 | `oni demon brute, crimson red skin, two thick horns, tusked scowl, spiked iron club resting on shoulder, muscular chibi, dark red #a83232 and black palette` |
| enemy_greatboss | 85006 | `crowned oni overlord, crimson red skin, golden jagged crown, four horns, royal tattered cape, huge spiked club, radiating dark red aura, imposing chibi, blood red and obsidian palette` |

검수: 24px 축소 시 6종 실루엣·색 구분 / 유닛과 나란히 놓았을 때 "적 진영" 즉시 판독(금장식 없음+우향).

---

## AM6. 타이틀 키비주얼 — `title_keyvisual.png` (832×1216, Seed 86002)

> 세로 타이틀 배경. 로고 텍스트는 코드(WebFont) — **이미지에 글자 금지**. 크롭만.

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
vertical key visual, majestic composition, divine astral deity youth at top center,
prismatic golden robes, ornate crown, six angelic wings, full mucha halo with peacock feathers,
below the deity a large ornate fantasy egg glowing with golden light, art nouveau filigree shell,
three small chibi units (knight, beast, robot) gazing up at the egg from the bottom,
flowing golden vines and blooming flowers framing the edges, alphonse mucha decorative arch border,
deep dark background #1a1a0f, god rays from above, floating light particles,
royal blue, emerald green, royal purple accents on the three units,
prismatic gold dominant palette, crisp ink outline, cel-shading, no text, no logo
```

검수: 상단 1/3에 하늘(신), 중단 알, 하단 유닛 — 360×640 크롭 시 삼단 구도 유지 / "낳는 게임" 서사가 한 장에 읽히는가.

---

## 생성 순서 체크리스트 (사용자)

- [ ] AM1 알 3장 (M4 착수 전 필요)
- [ ] AM3 T4 idle → attack (idle 먼저, Vibe 재료)
- [ ] AM4 컷인 (M2에 필요 — T4 idle 완성 직후 권장)
- [ ] AM2 T3 6장
- [ ] AM5 적 6장 (M5 전)
- [ ] AM6 키비주얼 (M5 전)
- 완료분은 zip으로 `docs/`에 업로드 → AI가 `docs/redesign/07-art-milestones.md` 절차로 후처리·등록
