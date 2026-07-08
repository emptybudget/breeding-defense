import { GameState } from './GameState';

export type DefeatCause = 'noSynthesis' | 'lowUnitCount' | 'tankOverwhelm' | 'general';

export interface DefeatDiagnosis {
  cause: DefeatCause;
  text: string;
  tip: string;
}

// M2: GameOver 패배 원인 판정 — 결정론적 첫 매치 우선. state 스냅샷만 읽는 순수 함수.
export function computeDefeatCause(state: GameState): DefeatDiagnosis {
  const maxTier = state.units.reduce((m, u) => Math.max(m, u.tier), 1);

  if (maxTier < 2) {
    return { cause: 'noSynthesis', text: '조합한 유닛이 없어요', tip: '💡 다른 종족끼리 겹쳐서 합성해보세요' };
  }
  if (state.units.length < state.maxUnits * 0.5) {
    return { cause: 'lowUnitCount', text: '유닛 수가 부족했어요', tip: '💡 골드가 쌓이면 바로 소환하세요' };
  }
  if (state.stageConfig.tankRatio >= 0.25 && maxTier < 3) {
    return { cause: 'tankOverwhelm', text: '탱크 물량에 밀렸어요', tip: '💡 고티어 유닛으로 화력을 높이세요' };
  }
  return { cause: 'general', text: '적이 너무 많이 몰렸어요', tip: '💡 더 강한 조합으로 도전해보세요' };
}
