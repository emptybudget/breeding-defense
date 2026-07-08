// M2: FTUE 강제 스텝 활성 중에는 2배속 사용자 설정을 무시하고 1배속으로 고정한다.
export function computeEffectiveSpeedMult(userMult: 1 | 2, ftueActive: boolean): 1 | 2 {
  return ftueActive ? 1 : userMult;
}
