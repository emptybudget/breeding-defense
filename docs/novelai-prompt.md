# breeding-defense — NovelAI 프롬프트 (T1·T2, 복붙용)

> 생성일: 2026-06-11 / T2 추가: 2026-06-11
> **2026-06-11 v2:** T2 12종 실루엣 차별화 재설계(같은 색 4종 외곽선 분리) + T1 Archer 가독성 개선(`#88bbff`) — designer 에이전트 컨설팅 반영
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

Human 계열 / 원거리 활잡이 / 색상: `#88bbff` 라이트 스카이블루 + 크림 (2026-06-11 개정 — Warrior 진청 `#4488ff`과 명도 분리, "같은 파랑 가족·밝은 쪽이 궁수")
**실루엣:** 몸 앞 대각선 크레센트 활 + 어깨 위 화살깃 부채 — **40px 식별:** 몸을 가로지르는 크림색 D자 곡선

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
left arm extended slightly forward holding the bow grip, right arm relaxed at side, legs shoulder-width apart,
natural idle stance, bow held in front, not drawn, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
minimal gold trim, single thin filigree line on collar, no halo,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
light sky blue, pale azure, powder blue accents dominates 50% of character palette,
cream and gold accent lines on costume edges,
androgynous, gender-neutral, soft facial features, round face,
young archer, pointed light sky-blue hood up over the head, cream short cape,
oversized cream-white longbow as tall as the character, held in front of the body diagonally,
large crescent bow arc clearly silhouetted against the body, no arrow nocked,
quiver on the back with three oversized arrows, big cream feather fletchings fanning above the right shoulder
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

# Tier 2 (12종) — 2026-06-11 실루엣 차별화 재설계

> **재설계 이유:** 구판은 전원 "직립 2족 + 팔 내림 + 한 손 무기" 단일 템플릿 → 46px에서 같은 색 4종 구분 불가. 카테고리마다 서로 다른 실루엣 슬롯 4개(가로 덩치 / 세로 극단 / 4족·부유 / 거대 부착물)를 배정하고 서브컬러를 분리.
> **색상 기준:** 메인 종족색 50% 유지(Human_Beast `#ff44aa` / Human_Robot `#00eeff` / Beast_Robot `#ff7700`) + 유닛별 서브컬러 (아래 매트릭스).
> **무하 강도:** `moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders`
> **Vibe Transfer:** anchor_warrior Str 0.4 + T1 베스트 Str 0.3 — 단 포즈 변경 폭이 큰 **Bio_Wolf·Falcon_Eye·Blade_Hound**는 Vibe가 새 포즈를 누르면 **Str 0.3으로 낮춰 재시도**
> **시드:** anchor+100 (Bio_Wolf) ~ anchor+111 (Menhera_Squirrel)
> ⚠️ **유닛별로 베이스의 포즈/자세 라인이 다르게 수정되어 있음** — 반드시 아래 완성 프롬프트를 통째로 사용 (§1 베이스 + 토큰 수동 조립 금지)

## 실루엣 매트릭스 (조감)

| 유닛 | 실루엣 슬롯 | 한 단어 외곽선 | 서브컬러 |
|---|---|---|---|
| Bio_Wolf | 가로 덩치·저자세 | 웅크린 주먹덩어리 | 실버그레이 `#c8c8d0` |
| Acorn_Girl | 세로 대칭+깃대 | 종(bell)+깃발 | 크림 `#f0e8c8`+브라운 `#8a5a2a` |
| Falcon_Eye | 좌우 확장+부유 | 펼친 날개 | 다크브라운 `#5a4632`+화이트 |
| Acorn_Hunter | 슬림+등 부착물 | 거대 배낭 | 올리브 `#6b7a3a` |
| Cyborg_Slasher | 가로 라인 | 어깨 뒤 수평 대검 | 화이트 `#f0f0f5` |
| Cannon_Shooter | 땅딸 가로 | 팔=통짜 포신 | 건메탈 `#3a3a44` |
| Laser_Sniper | 세로 극단 | 수직 장총 지팡이 | 블랙 `#1a1a22`+실버 |
| Missile_Gunner | 상체 비대 | 어깨 쌍둥이 타워 | 카키 `#8a8a66` |
| Blade_Hound | 4족 수평 (유일) | 기계 사냥개 | 다크스틸 `#4a4a50` |
| Gatling_Dog | 원형+등 포탑 | 공+포신 | 크림탄 `#e8d8b0` |
| Electric_Coon | 소형+거대 꼬리 | 물음표 링꼬리 | 블랙·화이트 줄무늬 |
| Menhera_Squirrel | 직립+옆 거치물 | 세운 드릴 원뿔 | 화이트 붕대+다크브라운 |

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

Human_Beast 계열 / 근접 인파이터 / 색상: `#ff44aa` + 실버그레이 `#c8c8d0` / Seed: anchor+100
**실루엣:** 가로 덩치·저자세 — 무릎 깊이 굽힌 웅크림, 양 주먹 지면 — **46px 식별:** 낮고 넓은 회색 주먹 덩어리

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, crouching low on the ground,
deep sumo-like crouch, knees deeply bent, hunched forward, both oversized fists planted knuckles-down near the ground,
low wide horizontal stance, not swinging, not attacking, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
hot pink, magenta, fuchsia accents dominates 50% of character palette,
silver gray fur and gauntlets as secondary color, gold accent lines on costume edges,
androgynous, gender-neutral, soft facial features, round face,
werewolf brawler, bulky wide compact body, hunched low crouching idle stance,
both oversized silver-gray iron clawed gauntlets resting knuckles-down on the ground,
wolf ears perked alert, bushy silver wolf tail held low, pink-trimmed plate armor on shoulders and back with claw-mark scratches,
fanged grin, silver fur tufts on forearms and collar, no sword
```

### Negative Prompt

```
lowres, bad anatomy, bad hands, text, error, missing fingers, extra digits,
fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts,
signature, watermark, username, blurry,
multiple characters, 2girls, 2boys, crowd, group,
action pose, motion blur, swinging weapon, mid-attack,
running, jumping, sitting, lying down,
standing fully upright, straight knees, tall slim build,
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

Human_Beast 계열 / 주변 아군 공속 오라 / 색상: `#ff44aa` + 크림 `#f0e8c8`·브라운 `#8a5a2a` / Seed: anchor+101
**실루엣:** 세로 대칭+깃대 — 종(bell) 모양 드레스 + 머리 위로 솟은 깃발 — **46px 식별:** 삼각 종 실루엣 + 수직 깃대 선

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
right hand gripping a tall banner pole planted upright on the ground beside her, left arm relaxed down at side,
natural idle stance, not swinging, static portrait,
clear silhouette, head torso arms clearly distinct, legs hidden under the dress,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
hot pink, magenta, fuchsia accents dominates 50% of character palette,
cream dress and warm brown tail as secondary colors, gold accent lines on costume edges,
androgynous, gender-neutral, soft facial features, round face,
squirrel-eared herald, wide bell-shaped cream frilly dress flaring out to the ground in a triangle silhouette,
large fluffy warm-brown squirrel tail behind the dress, golden acorn clip in side-bun hair, warm bright smile, rosy cheeks,
tall wooden banner pole twice her height planted on the ground, pink pennant flag with golden acorn emblem at the top of the pole,
no mace, no weapon
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

Human_Beast 계열 / 딸피 우선 저격 / 색상: `#ff44aa` + 다크브라운 `#5a4632`·화이트 / Seed: anchor+102
**실루엣:** 좌우 확장+부유 — 수평으로 펼친 날개 + 공중 부유 — **46px 식별:** 좌우로 뻗은 갈색 날개 일자선

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, hovering slightly above the ground,
large feathered wings fully spread horizontally to both sides, arms relaxed down at sides, feet dangling,
natural idle hover, bow held lowered at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso wings legs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
hot pink, magenta, fuchsia accents dominates 50% of character palette,
dark brown and white feathers as secondary colors, gold accent lines on costume edges,
androgynous, gender-neutral, soft facial features, round face,
falcon archer, large dark-brown feathered wings with white tips fully spread wide horizontally,
small compact body between the wide wings, sharp golden hawk eyes, pink-tinted leather vest,
brown hair with pink-tipped feather ornaments, serene focused expression, falcon talon anklets,
short recurve bow held lowered in left hand, no arrow drawn, quiver on back
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
wings folded, wings closed, tiny wings, standing on ground,
arrow nocked, arrow drawn, shooting pose, bowstring pulled
```

---

## 10. Acorn_Hunter — `unit_acorn_hunter_tier2.png`

Human_Beast 계열 / 고속 연사 / 색상: `#ff44aa` + 올리브 `#6b7a3a` / Seed: anchor+103
**실루엣:** 슬림+등 부착물 — 몸보다 큰 거대 배낭 — **46px 식별:** 머리 위로 솟은 올리브색 배낭 혹

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
olive green backpack and gear as secondary color, gold accent lines on costume edges,
androgynous, gender-neutral, soft facial features, round face,
squirrel-tailed hunter, very slim nimble lightweight build, gigantic olive-green expedition backpack twice the torso size towering above the head,
oversized acorn ammunition canisters strapped to the backpack, fluffy brown tail peeking from below the pack,
pink-accented leather duster coat, olive headband, cheeky grin, freckles,
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

Human_Robot 계열 / 전방 광역 베기 / 색상: `#00eeff` + 화이트 `#f0f0f5` / Seed: anchor+104
**실루엣:** 가로 라인 — 어깨 뒤를 가로지르는 수평 대검 — **46px 식별:** 어깨 높이의 흰 일자 대검 선

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
right arm draped casually over a massive greatsword resting horizontally across the back of the shoulders, left arm relaxed down at side,
natural idle stance, weapon resting, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
cyan, turquoise, electric teal accents dominates 50% of character palette,
pearl white greatsword blade as secondary color, gold accent lines on costume edges,
androgynous, gender-neutral, soft facial features,
cybernetic swordsman, oversized pearl-white energy greatsword wider than the body resting horizontally across the back of the shoulders behind the neck,
half-organic half-machine body, cyan glowing visor slit, mechanical left arm with teal circuit line engravings,
sleek dark bodysuit with cyan trim panels, calm confident expression, visible seam between organic right side and mech left side
```

### Negative Prompt

```
lowres, bad anatomy, bad hands, text, error, missing fingers, extra digits,
fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts,
signature, watermark, username, blurry,
multiple characters, 2girls, 2boys, crowd, group,
dynamic pose, action pose, motion blur, swinging weapon, mid-attack,
running, jumping, sitting, lying down, leaning,
arms crossed, arms behind back, arms spread wide, t-pose, hands hidden,
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
sword sheathed, sword pointed forward, swinging, slashing pose
```

---

## 12. Cannon_Shooter — `unit_cannon_shooter_tier2.png`

Human_Robot 계열 / 적 넉백 / 색상: `#00eeff` + 건메탈 `#3a3a44` / Seed: anchor+105
**실루엣:** 땅딸 가로 — 팔 전체가 통짜 포신 — **46px 식별:** 몸통만큼 두꺼운 한쪽 팔 포신 기둥

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
short stocky squat proportions, right hand resting on hip, legs shoulder-width apart,
natural idle stance, cannon lowered, not firing, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
cyan, turquoise, electric teal accents dominates 50% of character palette,
gunmetal dark gray cannon as secondary color, gold accent lines on costume edges,
androgynous, gender-neutral, soft facial features,
stocky cyborg gunner, short wide squat body, entire left arm replaced by one enormous gunmetal one-piece cannon barrel as thick as the torso,
cannon muzzle end resting on the ground, mechanical monocle eye glowing cyan, reinforced half-plate torso armor,
confident smirk, knuckle reinforcement armor on right hand
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
normal human left arm, two human hands, small handheld gun, shoulder cannon,
cannon firing, muzzle flash, smoke, explosion, recoil pose
```

---

## 13. Laser_Sniper — `unit_laser_sniper_tier2.png`

Human_Robot 계열 / 관통 레이저 / 색상: `#00eeff` + 블랙 `#1a1a22`·실버 / Seed: anchor+106
**실루엣:** 세로 극단 — 수직으로 세운 장총 지팡이 — **46px 식별:** 캐릭터보다 긴 검은 세로 일자 라이플

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
right hand holding an extremely long rifle vertically like a walking staff planted on the ground, left arm relaxed down at side,
tall narrow vertical silhouette, natural idle stance, not aiming, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
cyan, turquoise, electric teal accents dominates 50% of character palette,
glossy black rifle with silver details as secondary color, gold accent lines on costume edges,
androgynous, gender-neutral, soft facial features,
slender cyborg sniper, extremely long sleek glossy-black laser rifle taller than the character held vertically like a staff, muzzle pointing straight up,
sleek black bodysuit with cyan hexagonal panels, scope visor over left eye glowing cyan,
long silver braid tied with teal ribbon, precision mechanical left arm, elegant composed expression, slender agile build
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
rifle slung over shoulder, compact gun, short gun, horizontal rifle,
gun aimed, sniping pose, shooting, laser beam active
```

---

## 14. Missile_Gunner — `unit_missile_gunner_tier2.png`

Human_Robot 계열 / 3타겟 멀티샷 / 색상: `#00eeff` + 카키 `#8a8a66` / Seed: anchor+107
**실루엣:** 상체 비대 — 어깨 위 쌍둥이 미사일 타워 — **46px 식별:** 머리 양옆 두 개의 수직 기둥

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
khaki military green launchers as secondary color, gold accent lines on costume edges,
androgynous, gender-neutral, soft facial features,
cyborg heavy gunner, twin tall khaki missile pod towers mounted on both shoulders rising high above the head like twin chimneys,
top-heavy inverted triangle build, bulky cyan plate torso with reinforced shoulder pauldrons, short thin legs,
full-visor tactical helmet with cyan HUD strip, serious determined expression, ammo counter display on chest plate,
both missile pod towers in closed idle position, arms resting at sides
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

Beast_Robot 계열 / 공속 중첩 광전사 / 색상: `#ff7700` + 다크스틸 `#4a4a50` / Seed: anchor+108
**실루엣:** 4족 수평 (12종 중 유일) — 기계 사냥개 — **46px 식별:** 가로로 긴 4족 짐승 실루엣

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on all four legs,
quadruped robot hound, horizontal body silhouette, head raised alert, antenna tail raised,
natural idle stance, not lunging, not attacking, static portrait,
clear silhouette, head body four legs tail clearly distinct,
moderate art nouveau trim, golden curves on armor edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
bright orange, amber, tangerine accents dominates 50% of character palette,
dark steel armor plating as secondary color, gold accent lines on armor edges,
quadruped mechanical hound, four-legged robot dog, dark steel armor plating with bright orange trim panels,
glowing orange optical sensors, exposed hydraulic joints on all four legs, blade fins along the spine,
whipping antenna tail, retractable blade housings on both front legs in closed idle position, loyal determined expression
```

### Negative Prompt

```
lowres, bad anatomy, bad hands, text, error, missing fingers, extra digits,
fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts,
signature, watermark, username, blurry,
multiple characters, 2girls, 2boys, crowd, group,
dynamic pose, action pose, motion blur, swinging weapon, mid-attack,
running, jumping, sitting, lying down, leaning,
bipedal, standing upright on two legs, humanoid body, anthropomorphic standing pose, human arms, human hands,
realistic, photorealistic, 3d render, hyperrealistic skin,
dark background, complex background, scenery, landscape, indoor, outdoor,
shadow under feet, ground shadow, gradient background,
front view symmetrical, full side profile, side view, back view, facing right, facing away,
extra limbs, missing limbs, fused limbs,
oversaturated, neon glow overload, cluttered details, busy patterns on face,
cape covering body, full body cloak,
male focus, female focus, clearly male, clearly female, masculine jaw, masculine build,
feminine eyelashes, bishonen, bishoujo, gender obvious,
human face, fully organic animal no mechanical augmentation, purely biological creature, realistic dog,
blades extended, attack pose, slashing
```

---

## 16. Gatling_Dog — `unit_gatling_dog_tier2.png`

Beast_Robot 계열 / 스플래시 폭탄 / 색상: `#ff7700` + 크림탄 `#e8d8b0` / Seed: anchor+109
**실루엣:** 원형+등 포탑 — 공 모양 몸 + 등 위 포신 — **46px 식별:** 동그라미 + 위로 비스듬한 포신 막대

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
chubby round proportions, almost perfectly spherical ball-shaped body, stubby legs, both tiny arms relaxed at sides,
natural idle stance, weapon mounted not firing, static portrait,
clear silhouette, head round body stubby limbs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
bright orange, amber, tangerine accents dominates 50% of character palette,
cream tan round body as secondary color, gold accent lines on costume edges,
androgynous, gender-neutral, soft facial features,
cyber shiba inu mecha, almost perfectly round ball-shaped cream-tan plated body like a sphere, shiba inu face with orange armored cheeks,
tongue happily sticking out, carefree goofy energy, stubby mechanical feet, wagging mech tail,
oversized multi-barrel rotary gatling cannon turret mounted on the back pointing diagonally upward, clearly visible above the round body
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

Beast_Robot 계열 / 체인 라이트닝 / 색상: `#ff7700` + 블랙·화이트 줄무늬 / Seed: anchor+110
**실루엣:** 소형+거대 꼬리 — 머리 위로 말려 올라간 링꼬리 — **46px 식별:** 작은 몸 + 물음표 모양 줄무늬 꼬리

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
arms relaxed down at sides, hands near hips, legs shoulder-width apart,
natural idle stance, weapon held lowered or at side, not swinging, static portrait,
clear silhouette, separable limbs, head torso arms legs tail clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
bright orange, amber, tangerine accents dominates 50% of character palette,
black and white striped tail as secondary color, gold accent lines on costume edges,
androgynous, gender-neutral, soft facial features,
raccoon mecha, small tiny compact body, enormous black-and-white ringed striped mechanical tail twice the body size,
tail curling up high over the head in a question mark shape, masked raccoon face with tech overlay visor,
orange-and-black striped body armor, sparking antenna on head emitting tiny electric sparks, mischievous wide grin,
circuit engravings along arms, taser baton in right hand held downward, electrode tip faintly crackling
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

Beast_Robot 계열 / 트랙 위 지뢰 매설 / 색상: `#ff7700` + 화이트 붕대·다크브라운 / Seed: anchor+111
**실루엣:** 직립+옆 거치물 — 옆에 세워 둔 거대 드릴 원뿔 — **46px 식별:** 캐릭터 옆 큰 원뿔 삼각형

### Prompt

```
{{masterpiece}}, {{best quality}}, very aesthetic, absurdres, year 2025,
artist:ke-ta, artist:fkey, artist:wlop, artist:alphonse mucha,
1character, solo, chibi, super deformed, head-body ratio 1:1.5, large expressive eyes,
three-quarter view, facing slightly to the left, body angled 30 degrees to the left, full body, standing on ground,
right hand resting on top of a giant cone-shaped drill standing upright on the ground beside her, left arm relaxed down at side,
natural idle stance, drill not spinning, static portrait,
clear silhouette, separable limbs, head torso arms legs clearly distinct,
moderate art nouveau trim, golden curves on costume edges, small decorative motif behind shoulders,
flat color shading with soft cel-shading, crisp ink outline, thick 3px black contour,
high contrast against background, readable at small scale,
white background, simple background, no shadow on ground,
centered composition, 100px padding from edge,
bright orange, amber, tangerine accents dominates 50% of character palette,
white bandages and dark brown hair as secondary colors, gold accent lines on costume edges,
androgynous, gender-neutral, soft facial features,
squirrel mecha, fluffy dark-brown twin ponytails with mechanical orange ribbons, white bandages wrapped around both forearms,
small plasters on both cheeks, vacant dreamy expression with faint heart pupils, mechanical squirrel tail with side hatch panels,
orange utility jumpsuit with black patch repairs, tool pouches on belt, tiny bolts and screws decorating hair,
giant cone-shaped ground drill as tall as her shoulders standing upright beside her, right hand resting on top of the drill,
round mine canisters clipped to belt
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
tiny handheld drill, drill held in hand raised,
drill active spinning, mine exploding, action pose
```

---

## T2 검수 체크리스트

- [ ] chibi 비율 (1:1.5 — Blade_Hound 4족·Gatling_Dog 구체는 예외)
- [ ] 3/4 좌향
- [ ] **실루엣 매트릭스 일치** — 외곽선만 보고 슬롯 한 단어가 떠오르는가 (예: Bio_Wolf=웅크린 덩어리, Laser_Sniper=세로 막대)
- [ ] **46px 식별 테스트** — 같은 색 4종끼리 나란히 놓고 축소 시 구분 가능한가
- [ ] 혼합 종족색 50%+ (Human_Beast=핑크 / Human_Robot=청록 / Beast_Robot=오렌지) + 유닛별 서브컬러 보임
- [ ] 무하 액센트 T2 수준 (의상 가장자리 골드 곡선 + 어깨 뒤 작은 장식 모티프)
- [ ] 부모 종족 특징 둘 다 보임 (예: Beast_Robot = 동물 얼굴 + 기계 장갑)
- [ ] 중성적 외형
- [ ] 흰색 단순 배경
- [ ] 무기/기믹 idle 상태 (발사·회전·전개 금지)
- [ ] 좌우 반전 시 무기/장식 어색하지 않음
