import { GAME_HEIGHT, GAME_WIDTH } from '../game/config';
import { UnitRace } from '../game/types';

export const CENTER_X = GAME_WIDTH / 2;
export const CENTER_Y = GAME_HEIGHT / 2;

export const SELL_ZONE_X = GAME_WIDTH - 38;

// 캐릭터 스프라이트 (public/assets/characters/) — 아트 드랍 완료된 유닛만 등록.
// 등록된 유닛은 이미지로, 미등록 유닛은 이모지로 렌더링된다.
export const CHARACTER_ASSETS: Array<{ race: UnitRace; tier: 1 | 2 | 3 | 4 }> = [
  // Tier 1
  { race: 'Warrior',          tier: 1 },
  { race: 'Archer',           tier: 1 },
  { race: 'Dog',              tier: 1 },
  { race: 'Squirrel',         tier: 1 },
  { race: 'Android',          tier: 1 },
  { race: 'Cannon',           tier: 1 },
  // Tier 2
  { race: 'Bio_Wolf',         tier: 2 },
  { race: 'Acorn_Girl',       tier: 2 },
  { race: 'Falcon_Eye',       tier: 2 },
  { race: 'Acorn_Hunter',     tier: 2 },
  { race: 'Cyborg_Slasher',   tier: 2 },
  { race: 'Cannon_Shooter',   tier: 2 },
  { race: 'Laser_Sniper',     tier: 2 },
  { race: 'Missile_Gunner',   tier: 2 },
  { race: 'Blade_Hound',      tier: 2 },
  { race: 'Gatling_Dog',      tier: 2 },
  { race: 'Electric_Coon',    tier: 2 },
  { race: 'Menhera_Squirrel', tier: 2 },
  // Tier 3
  { race: 'Cyborg_Wizard',    tier: 3 },
  { race: 'Dino_Mecha',       tier: 3 },
  { race: 'Griffin',          tier: 3 },
  { race: 'Thunder_Hawk',     tier: 3 },
  { race: 'Berserk_Shaman',   tier: 3 },
  { race: 'Chaos_Artillery',  tier: 3 },
  // Tier 4
  { race: 'Astral_God',       tier: 4 },
];

export function unitTextureKey(race: UnitRace, tier: number): string {
  return `unit_${race.toLowerCase()}_tier${tier}`;
}

// 인게임 스프라이트 표시 크기 (px, 정사각)
export const UNIT_SPRITE_SIZE: Record<1 | 2 | 3 | 4, number> = { 1: 40, 2: 46, 3: 52, 4: 62 };

export const RACE_COLORS: Record<UnitRace, number> = {
  // Tier 1 — Human (blues)
  Warrior:          0x4488ff,
  Archer:           0x88aaff,
  // Tier 1 — Beast (greens)
  Dog:              0x44cc44,
  Squirrel:         0x88dd88,
  // Tier 1 — Robot (purples)
  Android:          0xaa44cc,
  Cannon:           0xcc88ee,
  // Tier 2 — Human+Beast (pinks)
  Bio_Wolf:         0xff44aa,
  Acorn_Girl:       0xff88cc,
  Falcon_Eye:       0xee2288,
  Acorn_Hunter:     0xffaadd,
  // Tier 2 — Human+Robot (cyans)
  Cyborg_Slasher:   0x00eeff,
  Cannon_Shooter:   0x44bbdd,
  Laser_Sniper:     0x0088ff,
  Missile_Gunner:   0x66ddff,
  // Tier 2 — Beast+Robot (oranges)
  Blade_Hound:      0xff7700,
  Gatling_Dog:      0xff9933,
  Electric_Coon:    0xffaa00,
  Menhera_Squirrel: 0xee5500,
  // Tier 3
  Cyborg_Wizard:    0xffcc00,
  Dino_Mecha:       0xff4400,
  Griffin:          0x00ffaa,
  Thunder_Hawk:     0x9900ff,
  Berserk_Shaman:   0x00ff88,
  Chaos_Artillery:  0xff2200,
  // Tier 4
  Astral_God:       0xffd700,
};

export const RACE_EMOJI: Record<UnitRace, string> = {
  // Tier 1
  Warrior:          '⚔️',
  Archer:           '🏹',
  Dog:              '🐶',
  Squirrel:         '🐿️',
  Android:          '🦾',
  Cannon:           '🚀',
  // Tier 2 — Human+Beast
  Bio_Wolf:         '🐺',
  Acorn_Girl:       '🌰',
  Falcon_Eye:       '👁️',
  Acorn_Hunter:     '🎯',
  // Tier 2 — Human+Robot
  Cyborg_Slasher:   '🧬',
  Cannon_Shooter:   '🛡️',
  Laser_Sniper:     '⚡',
  Missile_Gunner:   '💣',
  // Tier 2 — Beast+Robot
  Blade_Hound:      '🐕',
  Gatling_Dog:      '⚾',
  Electric_Coon:    '🦝',
  Menhera_Squirrel: '💔',
  // Tier 3
  Cyborg_Wizard:    '🧙',
  Dino_Mecha:       '🌋',
  Griffin:          '🦅',
  Thunder_Hawk:     '🌩️',
  Berserk_Shaman:   '🌿',
  Chaos_Artillery:  '💥',
  // Tier 4
  Astral_God:       '🌟',
};
