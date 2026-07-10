import { describe, expect, it, vi } from 'vitest';
import { GameState } from '../../src/game/GameState';

describe('트랙 판정 반폭 (31-track-drag-fix.md F2)', () => {
  it('경계 17.9px는 트랙 위(true), 18.1px는 트랙 밖(false)', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5); // 지터 0, 육각형 레이아웃 고정
    const state = new GameState();
    randomSpy.mockRestore();

    const [a, b] = state.trackWaypoints;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len; // 세그먼트에 수직인 단위 벡터
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;

    const inside = { x: mx + nx * 17.9, y: my + ny * 17.9 };
    const outside = { x: mx + nx * 18.1, y: my + ny * 18.1 };

    expect(state.isOnTrack(inside.x, inside.y)).toBe(true);
    expect(state.isOnTrack(outside.x, outside.y)).toBe(false);
  });
});
