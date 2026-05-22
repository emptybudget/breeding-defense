import { GAME_HEIGHT, GAME_WIDTH } from '../game/config';
import { UnitRace } from '../game/types';

export const CENTER_X = GAME_WIDTH / 2;
export const CENTER_Y = GAME_HEIGHT / 2;

export const SELL_ZONE_X = GAME_WIDTH - 38;
export const SELL_ZONE_Y = GAME_HEIGHT - 52;

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
  // Tier 3 (Phase E에서 재설계)
  Cyborg_Wizard:    0xffcc00,
  Dino_Mecha:       0xff4400,
  Griffin:          0x00ffaa,
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
};
