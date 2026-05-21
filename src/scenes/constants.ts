import { GAME_HEIGHT, GAME_WIDTH } from '../game/config';
import { UnitRace } from '../game/types';

export const CENTER_X = GAME_WIDTH / 2;
export const CENTER_Y = GAME_HEIGHT / 2;

// Sell zone: right-most section of the bottom bar
export const SELL_ZONE_X = GAME_WIDTH - 38;
export const SELL_ZONE_Y = GAME_HEIGHT - 52;

export const RACE_COLORS: Record<UnitRace, number> = {
  Human:         0x4488ff,
  Beast:         0x44cc44,
  Robot:         0xaa44cc,
  Human_Robot:   0x00eeff,
  Human_Beast:   0xff44aa,
  Beast_Robot:   0xff7700,
  Cyborg_Wizard: 0xffcc00,
  Dino_Mecha:    0xff4400,
  Griffin:       0x00ffaa,
};

export const RACE_EMOJI: Record<UnitRace, string> = {
  Human:         '👦',
  Beast:         '🐶',
  Robot:         '🤖',
  Human_Robot:   '🦾',
  Human_Beast:   '🐺',
  Beast_Robot:   '🦖',
  Cyborg_Wizard: '🧙',
  Dino_Mecha:    '🌋',
  Griffin:       '🦅',
};
