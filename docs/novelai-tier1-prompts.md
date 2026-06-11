# breeding-defense — NovelAI T1 유닛 프롬프트 (복붙용)

> 생성일: 2026-06-11
> 베이스: `docs/design-prompts.md` §1~§7 기준 — 구조·설정·색상·무하 강도 모두 해당 문서를 따름
> 변경점: T1 개별 토큰의 `boy` / `girl` 젠더 표현 → 중성화 (`androgynous, gender-neutral`)
> 이유: 교배(breeding) 시스템 — 성별 이분법 없음

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

**워크플로우:**
1. Warrior 먼저 생성 — 시드 미고정 6~10장 → 만족 컷 `anchor_warrior.png` + 시드 번호 메모
2. 나머지 5종: Vibe Transfer (슬롯1=anchor_warrior, Info 1.0 / Str 0.6)

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

## 검수 체크리스트 (§6 Warrior anchor 기준)

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
