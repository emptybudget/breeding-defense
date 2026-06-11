# breeding-defense — NovelAI 프롬프트 (T1·T2, 복붙용)

> 생성일: 2026-06-11 / T2 추가: 2026-06-11
> 베이스: `docs/design-prompts.md` §1~§7 기준 — 구조·설정·색상·무하 강도 모두 해당 문서를 따름
> 변경점: `boy` / `girl` 젠더 표현 → 중성화 (`androgynous, gender-neutral`) — 교배(breeding) 시스템상 성별 이분법 없음

---

## NovelAI 공통 설정 (§7 기준)

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

**T1 워크플로우:**
1. Warrior 먼저 생성 — 시드 미고정 6~10장 → 만족 컷 `anchor_warrior.png` + 시드 번호 메모
2. 나머지 5종: Vibe Transfer (슬롯1=anchor_warrior, Info 1.0 / Str 0.6)

**T2 워크플로우:**
1. T1 완성 후 진행 — Vibe Transfer 슬롯1=anchor_warrior (Info 1.0 / Str 0.4) + 슬롯2=T1 베스트 컷 (Str 0.3)
2. 같은 종족 계열(Human_Beast / Human_Robot / Beast_Robot) 4종씩 묶어 순서대로 생성
3. 시드: anchor+100 ~ anchor+111 (Bio_Wolf=+100 … Menhera_Squirrel=+111)

**후처리:** `rembg i input.png output.png` → 96px 다운스케일 실루엣 확인

---

## 공통 네거티브 프롬프트 (전 6종 동일, §2 기준 + 중성화 추가)

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious
```

---

## 1. Warrior — `unit_warrior_tier1.png`

Human 계열 / 근접 검사 / 색상: `#4488ff`

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
minimal gold trim, single thin filigree line on collar, no halo,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
royal blue, sapphire blue, cobalt blue accents dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
androgynous, gender-neutral, soft facial features, round face,
young knight, short brown hair, blue tunic, iron pauldron, determined face,
short iron sword held downward at right side, blade pointing toward ground
```

### Negative Prompt

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious
```

---

## 2. Archer — `unit_archer_tier1.png`

Human 계열 / 원거리 활잡이 / 색상: `#4488ff`

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
minimal gold trim, single thin filigree line on collar, no halo,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
royal blue, sapphire blue, cobalt blue accents dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
androgynous, gender-neutral, soft facial features, round face,
young archer, long blonde ponytail, blue hood, leather vest, calm expression,
wooden longbow held vertically in left hand, no arrow drawn
```

### Negative Prompt

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious,
arrow nocked, arrow drawn, shooting pose, bowstring pulled
```

---

## 3. Dog — `unit_dog_tier1.png`

Beast 계열 / 빠른 근접 / 색상: `#44cc44`

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
minimal gold trim, single thin filigree line on collar, no halo,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
emerald green, leaf green, forest green accents dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
androgynous, gender-neutral, soft facial features,
chibi shiba inu warrior, anthropomorphic puppy, animal ears, floppy dog ears, short snout, big round eyes, green scarf, tiny leather harness, cheerful open-mouthed expression,
small bone club resting on right shoulder, held loosely, not swinging
```

### Negative Prompt

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious,
human face, human nose, no animal features, realistic dog, four-legged animal
```

---

## 4. Squirrel — `unit_squirrel_tier1.png`

Beast 계열 / 도토리 원거리 / 색상: `#44cc44`

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
minimal gold trim, single thin filigree line on collar, no halo,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
emerald green, leaf green, forest green accents dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
androgynous, gender-neutral, soft facial features,
chibi squirrel, anthropomorphic squirrel, large fluffy tail, round squirrel ears, big curious eyes, green hooded cape, acorn pendant, curious expression,
tiny wooden slingshot in right hand, held at side, lowered, not aimed
```

### Negative Prompt

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious,
human face, human nose, no animal features, realistic squirrel, four-legged animal,
slingshot aimed, slingshot pulled back, shooting pose
```

---

## 5. Android — `unit_android_tier1.png`

Robot 계열 / 강타 로봇 팔 / 색상: `#aa44cc`

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
minimal gold trim, single thin filigree line on collar, no halo,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
royal purple, amethyst, magenta-violet metallic dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
androgynous, gender-neutral, smooth robot face, no visible gender features,
chibi android, smooth white body plating with purple trim, purple visor lens, small antenna on head, neutral calm expression,
compact arm-mounted blaster on right forearm, pointing downward, idle, not firing
```

### Negative Prompt

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious,
organic skin, human skin texture, biological features, no robot elements, gun raised, firing pose, muzzle flash
```

---

## 6. Cannon — `unit_cannon_tier1.png`

Robot 계열 / 포격 로봇 / 색상: `#aa44cc`

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
minimal gold trim, single thin filigree line on collar, no halo,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
royal purple, amethyst, magenta-violet metallic dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
androgynous, gender-neutral, smooth robot face, no visible gender features,
chibi cannon mecha robot, short and round stubby body, purple body plating, single large eye sensor lens, round compact feet, barrel-shaped torso,
shoulder-mounted small cannon barrel angled upward-left, idle resting position, not firing, no smoke
```

### Negative Prompt

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious,
organic skin, human face, biological features, no robot elements, cannon firing, muzzle flash, smoke, explosion
```

---

## T1 검수 체크리스트

- [ ] chibi 1:1.5 비율 (머리 높이 약 40%)
- [ ] 3/4 좌향 (살짝 왼쪽, 정면 대칭 아님)
- [ ] 팔 내려짐 (T포즈·팔벌림 아님)
- [ ] 종족색 50%+ (Human=파랑 / Beast=초록 / Robot=보라)
- [ ] 무하 액센트 T1 수준 (칼라 가는 선 1개, 후광 없음)
- [ ] 중성적 외형 (남녀 불분명)
- [ ] 96px 다운스케일 실루엣 식별 가능
- [ ] 흰색 단순 배경 (rembg 후처리용)
- [ ] 무기 idle 상태 (공격 포즈 아님)
- [ ] 좌우 반전 시 무기/장식 어색하지 않음 (인게임 우향 시 반전 사용)

---

---

# Tier 2 (12종)

> **색상 기준:** Human_Beast `#ff44aa` / Human_Robot `#00eeff` / Beast_Robot `#ff7700`
> **무하 강도:** `moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders`
> **Vibe Transfer:** anchor_warrior Str 0.4 + T1 베스트 Str 0.3 (슬롯 2개)
> **시드:** anchor+100 (Bio_Wolf) ~ anchor+111 (Menhera_Squirrel)

## 공통 네거티브 프롬프트 — T2 (전 12종 기본, 아래 카테고리별 추가 참고)

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious
```

> **카테고리별 추가 네거티브:**
> - Human_Beast: `+ purely human appearance no animal features, realistic animal, quadruped, four-legged`
> - Human_Robot: `+ fully organic no mechanical parts, purely biological, full robot no human parts`
> - Beast_Robot: `+ human face, fully organic animal no mechanical augmentation, purely biological creature`

---

## 7. Bio_Wolf — `unit_bio_wolf_tier2.png`

Human_Beast 계열 / 근접 인파이터 / 색상: `#ff44aa` / Seed: anchor+100

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
hot pink, magenta, fuchsia accents dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
androgynous, gender-neutral, soft facial features, round face,
werewolf knight, wolf ears perked alert, bushy silver wolf tail, pink-trimmed plate armor with claw-mark scratches on chest,
fanged grin, compact muscular chibi build, silver fur tufts on forearms and collar,
right iron clawed gauntlet resting at side, no sword, left hand near waist
```

### Negative Prompt

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious,
purely human appearance no animal features, realistic wolf, quadruped, four-legged animal
```

---

## 8. Acorn_Girl — `unit_acorn_girl_tier2.png`

Human_Beast 계열 / 주변 아군 공속 오라 / 색상: `#ff44aa` / Seed: anchor+101

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
hot pink, magenta, fuchsia accents dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
androgynous, gender-neutral, soft facial features, round face,
squirrel-eared knight, large fluffy squirrel tail wrapped behind body, pink frilly dress under light chest armor breastplate,
golden acorn clip in side-bun hair, warm bright smile, tiny leather boots, rosy cheeks,
acorn-capped short mace held low in right hand, resting against leg
```

### Negative Prompt

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious,
purely human appearance no animal features, realistic squirrel, quadruped, four-legged animal
```

---

## 9. Falcon_Eye — `unit_falcon_eye_tier2.png`

Human_Beast 계열 / 딸피 우선 저격 / 색상: `#ff44aa` / Seed: anchor+102

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
hot pink, magenta, fuchsia accents dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
androgynous, gender-neutral, soft facial features, round face,
falcon-winged archer, small feathered wings on upper back, sharp golden hawk eyes, pink-tinted feather cloak over leather vest,
brown hair with pink-tipped feather ornaments, serene focused expression, falcon talon anklets,
composite recurve bow held vertically in left hand, no arrow drawn, quiver on back
```

### Negative Prompt

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious,
purely human appearance no animal features, realistic bird, fully feathered body, four-legged animal,
arrow nocked, arrow drawn, shooting pose, bowstring pulled
```

---

## 10. Acorn_Hunter — `unit_acorn_hunter_tier2.png`

Human_Beast 계열 / 고속 연사 / 색상: `#ff44aa` / Seed: anchor+103

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
hot pink, magenta, fuchsia accents dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
androgynous, gender-neutral, soft facial features, round face,
squirrel-tailed hunter, fluffy brown tail, pink-accented leather duster coat, olive headband,
cheeky grin, three mini arrows peeking from belt pouch, nimble lightweight build, freckles,
compact crossbow with pink trim held downward in right hand, bolt loaded
```

### Negative Prompt

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious,
purely human appearance no animal features, realistic squirrel, quadruped, four-legged animal,
crossbow aimed, shooting pose, bolt flying
```

---

## 11. Cyborg_Slasher — `unit_cyborg_slasher_tier2.png`

Human_Robot 계열 / 전방 광역 베기 / 색상: `#00eeff` / Seed: anchor+104

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
cyan, turquoise, electric teal accents dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
androgynous, gender-neutral, soft facial features,
cybernetic swordsman, half-organic half-machine body, cyan glowing visor slit,
mechanical left arm with teal circuit line engravings, sleek dark bodysuit with cyan trim panels,
calm confident expression, visible seam between organic right side and mech left side,
energy katana sheathed at left hip, right organic hand resting on hilt
```

### Negative Prompt

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious,
fully organic no mechanical parts, purely biological, full robot no human parts,
sword drawn, swinging, slashing pose
```

---

## 12. Cannon_Shooter — `unit_cannon_shooter_tier2.png`

Human_Robot 계열 / 적 넉백 / 색상: `#00eeff` / Seed: anchor+105

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
cyan, turquoise, electric teal accents dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
androgynous, gender-neutral, soft facial features,
cyborg gunner, large cyan-plated shoulder cannon mounted on right shoulder, mechanical monocle eye glowing cyan,
reinforced half-plate torso armor, confident smirk, knuckle reinforcement armor on both hands,
left arm cannon held low at hip level, barrel angled diagonally downward, not firing
```

### Negative Prompt

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious,
fully organic no mechanical parts, purely biological, full robot no human parts,
cannon firing, muzzle flash, smoke, explosion, recoil pose
```

---

## 13. Laser_Sniper — `unit_laser_sniper_tier2.png`

Human_Robot 계열 / 관통 레이저 / 색상: `#00eeff` / Seed: anchor+106

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
cyan, turquoise, electric teal accents dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
androgynous, gender-neutral, soft facial features,
cyborg sniper, sleek black bodysuit with cyan hexagonal panels, scope visor over left eye glowing cyan,
long silver braid tied with teal ribbon, precision mechanical left arm, elegant composed expression, slender agile build,
sleek laser rifle slung over right shoulder, barrel angled downward, not aimed
```

### Negative Prompt

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious,
fully organic no mechanical parts, purely biological, full robot no human parts,
gun aimed, sniping pose, shooting, laser beam active
```

---

## 14. Missile_Gunner — `unit_missile_gunner_tier2.png`

Human_Robot 계열 / 3타겟 멀티샷 / 색상: `#00eeff` / Seed: anchor+107

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
cyan, turquoise, electric teal accents dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
androgynous, gender-neutral, soft facial features,
cyborg heavy gunner, bulky cyan plate torso with reinforced shoulder pauldrons,
dual compact missile pod launchers mounted on both shoulders, full-visor tactical helmet with cyan HUD strip,
serious determined expression, ammo counter display on chest plate, power-stance legs,
both missile pod launchers in closed idle position, arms resting at sides
```

### Negative Prompt

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious,
fully organic no mechanical parts, purely biological, full robot no human parts,
missiles launched, explosion, firing pose
```

---

## 15. Blade_Hound — `unit_blade_hound_tier2.png`

Beast_Robot 계열 / 공속 중첩 광전사 / 색상: `#ff7700` / Seed: anchor+108

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
bright orange, amber, tangerine accents dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
androgynous, gender-neutral, soft facial features,
mecha-dog warrior, anthropomorphic dog face with orange armored plating, exposed hydraulic joints on elbows and knees,
glowing orange optical sensors, robotic reinforced legs, loyal determined expression, compact powerful build,
short whipping antenna tail, retractable wrist blade housings on both forearms in closed idle position, paws at sides
```

### Negative Prompt

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious,
human face, fully organic animal no mechanical augmentation, purely biological creature,
blades extended, attack pose, slashing
```

---

## 16. Gatling_Dog — `unit_gatling_dog_tier2.png`

Beast_Robot 계열 / 스플래시 폭탄 / 색상: `#ff7700` / Seed: anchor+109

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
bright orange, amber, tangerine accents dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
androgynous, gender-neutral, soft facial features,
cyber shiba inu mecha, shiba inu face with orange armored cheeks, tongue happily sticking out,
chunky orange-plated round body, carefree goofy energy, stubby mechanical feet, wagging mech tail,
oversized multi-barrel rotary gatling cannon mounted on back visible over shoulder, both small mech arms relaxed at sides
```

### Negative Prompt

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious,
human face, fully organic animal no mechanical augmentation, purely biological creature,
gatling spinning, firing, bullet, muzzle flash, explosion
```

---

## 17. Electric_Coon — `unit_electric_coon_tier2.png`

Beast_Robot 계열 / 체인 라이트닝 / 색상: `#ff7700` / Seed: anchor+110

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
bright orange, amber, tangerine accents dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
androgynous, gender-neutral, soft facial features,
raccoon mecha, masked raccoon face with tech overlay visor, orange-and-black striped body armor,
sparking antenna on head emitting tiny electric sparks, ringed mechanical tail, mischievous wide grin,
circuit engravings along arms, coiled spring-loaded legs,
taser baton in right hand held downward, electrode tip faintly crackling
```

### Negative Prompt

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious,
human face, fully organic animal no mechanical augmentation, purely biological creature,
baton swinging, lightning bolt active, electric attack
```

---

## 18. Menhera_Squirrel — `unit_menhera_squirrel_tier2.png`

Beast_Robot 계열 / 트랙 위 지뢰 매설 / 색상: `#ff7700` / Seed: anchor+111

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
bright orange, amber, tangerine accents dominates 50% of character palette,
gold accent lines on costume edges, cream highlights,
androgynous, gender-neutral, soft facial features,
squirrel mecha, fluffy twin ponytails with mechanical orange ribbons, orange utility jumpsuit with black patch repairs,
small plasters on both cheeks, vacant dreamy expression with faint heart pupils, mechanical squirrel tail with side hatch panels,
tool pouches on belt, tiny bolts and screws decorating hair,
compact ground-drill tool with spinning bit held at right side, round mine canisters clipped to belt
```

### Negative Prompt

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
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious,
human face, fully organic animal no mechanical augmentation, purely biological creature,
drill active spinning, mine exploding, action pose
```

---

## T2 검수 체크리스트

- [ ] chibi 1:1.5 비율
- [ ] 3/4 좌향
- [ ] 팔 내려짐
- [ ] 혼합 종족색 50%+ (Human_Beast=핑크 / Human_Robot=청록 / Beast_Robot=오렌지)
- [ ] 무하 액센트 T2 수준 (의상 가장자리 골드 곡선 + 어깨 뒤 작은 장식 모티프)
- [ ] 부모 종족 특징 둘 다 보임 (예: Beast_Robot = 동물 얼굴 + 기계 장갑)
- [ ] 중성적 외형
- [ ] 96px 다운스케일 실루엣 식별 가능
- [ ] 흰색 단순 배경
- [ ] 무기 idle 상태
- [ ] 좌우 반전 시 무기/장식 어색하지 않음
