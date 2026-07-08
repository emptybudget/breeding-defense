// M1a UI design tokens — source of truth: docs/redesign/17-ui-design-tokens.md
export const UI = {
  // 기존 artnouveau 재사용
  gold: 0xe8c84a, goldMid: 0xb8882a, goldDim: 0x7a5c1e,
  cream: 0xf0e8c8, parch: 0xc8b97a, teal: 0x4ab8b8,
  bgDeep: 0x1a1a0f, bgDark: 0x2c2a14,
  // 신규 4색
  panel: 0x241f12,
  panelHi: 0x3a3220,
  danger: 0x8a2f2f,
  disabled: 0x1c1a10,
  // M4: 카드·바텀시트 언어 (17-ui-design-tokens.md §5) — 금색=혈통 전용(헌법 제4조), T2 잭팟은 백금
  silver: 0xc8d4e0,
  platinum: 0xd8dde3,
  // 수치
  radius: 8,
  border: 2,
  pressScale: 0.94,
  pressMs: 80,
  minHit: 48,
  pulseMs: 800,
  slopPx: 8,
} as const;

/**
 * 히트영역이 UI.minHit 미만이면: dev 빌드는 즉시 throw(설계 실수 조기 발견),
 * prod 빌드는 조용히 확대 클램프(사용자 경험은 절대 깨지지 않아야 함).
 */
export function clampHitArea(w: number, h: number, isDev: boolean): { w: number; h: number } {
  const tooSmall = w < UI.minHit || h < UI.minHit;
  if (tooSmall && isDev) {
    throw new Error(`JuicyButton hit area ${w}x${h} is below MIN_HIT_PX=${UI.minHit}`);
  }
  return { w: Math.max(w, UI.minHit), h: Math.max(h, UI.minHit) };
}
