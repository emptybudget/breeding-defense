import Phaser from 'phaser';

// Art Nouveau × Pixel Game — color palette
export const AN = {
  BG_DEEP:   0x1a1a0f,   // deep forest — panel backgrounds
  BG_DARK:   0x2c2a14,   // dark olive — HUD bars
  GOLD_DIM:  0x7a5c1e,   // bronze shadow
  GOLD_MID:  0xb8882a,   // antique gold — inner lines
  GOLD_MAIN: 0xe8c84a,   // bright gold — borders
  VINE_DARK: 0x6b7a3a,   // sage green
  VINE_MAIN: 0x8aaa4a,   // fern — vines / leaves
  TEAL:      0x4ab8b8,   // jade — gem accents
} as const;

// String palette for Phaser text styles
export const ANS = {
  CREAM:     '#f0e8c8',  // main body text
  GOLD:      '#e8c84a',  // UI labels (borders match)
  GOLD_TEXT: '#ffd700',  // gold emphasis text
  VINE:      '#8aaa4a',  // green-tone text (units, health)
  TEAL:      '#4ab8b8',  // gem / teal accents
  RED_SOFT:  '#ff8866',  // enemy count (softer than raw red)
  PARCH:     '#c8b97a',  // subdued / secondary text
  DIM:       '#7a7060',  // disabled state text
} as const;

/**
 * HUD bar frame — fills with dark olive, adds gold top+bottom borders
 * and vine corner flourishes. Graphics object must be at (0, barY).
 */
export function drawHudBar(gfx: Phaser.GameObjects.Graphics, w: number, h: number): void {
  gfx.fillStyle(AN.BG_DARK);
  gfx.fillRect(0, 0, w, h);

  // Outer gold border lines (3px)
  gfx.lineStyle(3, AN.GOLD_MAIN, 1);
  gfx.lineBetween(0, 2, w, 2);
  gfx.lineBetween(0, h - 2, w, h - 2);

  // Inner soft accent lines (1px)
  gfx.lineStyle(1, AN.GOLD_MID, 0.45);
  gfx.lineBetween(8, 6, w - 8, 6);
  gfx.lineBetween(8, h - 6, w - 8, h - 6);

  // Vine corner flourishes
  _vine(gfx, 14, Math.floor(h / 2), Math.floor(h * 0.28), 1);
  _vine(gfx, w - 14, Math.floor(h / 2), Math.floor(h * 0.28), -1);
}

/**
 * Popup panel frame — centered at Graphics origin (0, 0).
 * Use inside a Phaser Container so the container handles world position.
 */
export function drawPanelAt(gfx: Phaser.GameObjects.Graphics, w: number, h: number): void {
  const x = -Math.floor(w / 2);
  const y = -Math.floor(h / 2);

  gfx.fillStyle(AN.BG_DEEP);
  gfx.fillRect(x, y, w, h);

  // Outer gold border (3px)
  gfx.lineStyle(3, AN.GOLD_MAIN, 1);
  gfx.strokeRect(x, y, w, h);

  // Inner border (1px, inset 6px)
  gfx.lineStyle(1, AN.GOLD_MID, 0.55);
  gfx.strokeRect(x + 6, y + 6, w - 12, h - 12);

  // Corner L-bracket ornaments
  _corner(gfx, x + 4, y + 4, 1, 1);
  _corner(gfx, x + w - 4, y + 4, -1, 1);
  _corner(gfx, x + 4, y + h - 4, 1, -1);
  _corner(gfx, x + w - 4, y + h - 4, -1, -1);
}

/**
 * Horizontal gold divider with center ornament dot.
 * x, y are left-edge start in Graphics local space.
 */
export function drawDivider(gfx: Phaser.GameObjects.Graphics, x: number, y: number, w: number): void {
  gfx.lineStyle(1, AN.GOLD_MID, 0.75);
  gfx.lineBetween(x, y, x + w, y);
  const mid = x + Math.floor(w / 2);
  gfx.fillStyle(AN.GOLD_MAIN, 1);
  gfx.fillCircle(mid, y, 3);
  gfx.fillCircle(mid - 18, y, 1.5);
  gfx.fillCircle(mid + 18, y, 1.5);
}

// ── Private helpers ───────────────────────────────────────────────────────────

// Vertical vine: stem + 2 alternating leaf circles + 2 gold bud tips.
// dx: 1 = leaves alternate right/left (left-side vine), -1 = mirrored.
function _vine(gfx: Phaser.GameObjects.Graphics, cx: number, cy: number, stemH: number, dx: number): void {
  // Stem
  gfx.lineStyle(2, AN.VINE_MAIN, 0.85);
  gfx.lineBetween(cx, cy - stemH, cx, cy + stemH);

  const ly1 = cy - Math.floor(stemH * 0.42);
  const ly2 = cy + Math.floor(stemH * 0.42);

  // Dark leaf base circles (S-pattern alternating sides)
  gfx.fillStyle(AN.VINE_DARK, 0.85);
  gfx.fillCircle(cx - dx * 5, ly1, 5);
  gfx.fillCircle(cx + dx * 5, ly2, 5);

  // Lighter highlight
  gfx.fillStyle(AN.VINE_MAIN, 0.9);
  gfx.fillCircle(cx - dx * 5, ly1, 2.5);
  gfx.fillCircle(cx + dx * 5, ly2, 2.5);

  // Gold bud dots at stem tips
  gfx.fillStyle(AN.GOLD_MAIN, 1);
  gfx.fillCircle(cx, cy - stemH - 3, 2.5);
  gfx.fillCircle(cx, cy + stemH + 3, 2.5);
}

// L-bracket corner ornament. x,y = corner point. dx,dy = direction into panel (±1).
function _corner(gfx: Phaser.GameObjects.Graphics, x: number, y: number, dx: number, dy: number): void {
  const arm = 14;
  gfx.lineStyle(2, AN.GOLD_MID, 0.85);
  gfx.lineBetween(x, y + dy * 4, x + dx * arm, y + dy * 4);   // horizontal arm
  gfx.lineBetween(x + dx * 4, y, x + dx * 4, y + dy * arm);   // vertical arm
  gfx.fillStyle(AN.VINE_MAIN, 1);
  gfx.fillCircle(x + dx * arm, y + dy * 4, 2);                 // arm tip dots
  gfx.fillCircle(x + dx * 4, y + dy * arm, 2);
}
