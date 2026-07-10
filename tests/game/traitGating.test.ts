import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameState } from '../../src/game/GameState';
import { makeUnit } from '../../src/game/unitHelpers';
import { WORLD_CONFIGS } from '../../src/game/config';

// 특성(T2 기믹)은 W2-1 해금 — W1에선 부모가 특성을 갖고 있어도 자식에게 상속·표기되지 않는다.
// 칭호(epithet)는 M3 변이 표기라 게이팅 대상이 아님 (별개 유지).
describe('특성 W2-1 게이팅 (28-schools, 표기만)', () => {
  afterEach(() => vi.restoreAllMocks());

  function breedTwoTraitedWarriors(config: (typeof WORLD_CONFIGS)[1][2]) {
    vi.spyOn(Math, 'random').mockReturnValue(0.3); // 상속 롤 0.3 < 0.5 → 부모A 특성 상속 확정 (0은 네이밍 재롤 루프 edge라 회피)
    const st = new GameState(undefined, config);
    const a = makeUnit(1, 'Warrior', 1, 50, 50); a.trait = 'Bio_Wolf';
    const b = makeUnit(2, 'Warrior', 1, 60, 60); b.trait = 'Falcon_Eye';
    st.units.push(a, b);
    st.startBreeding(1, 2);
    return st.completeBreeding(1, 2)[0];
  }

  it('W2-1(해금됨): 자식이 특성을 상속한다', () => {
    const child = breedTwoTraitedWarriors(WORLD_CONFIGS[2][1]);
    expect(child.trait).toBeDefined();
  });

  it('W1-2(미해금): 부모가 특성을 가져도 자식은 특성 없음', () => {
    const child = breedTwoTraitedWarriors(WORLD_CONFIGS[1][2]);
    expect(child.trait).toBeUndefined();
    expect(child.trait2).toBeUndefined();
  });
});
