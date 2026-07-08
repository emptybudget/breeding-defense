import { PREVIEW_SLOWMO } from './config';

// M2: FTUE 강제 스텝 활성 중에는 2배속 사용자 설정을 무시하고 1배속으로 고정한다.
// M4: 예상 혈통 카드(교배 미리보기) 중엔 절대값 0.3배속이 최우선 (E10 — 2배속·FTUE강제보다 우선).
export function computeEffectiveSpeedMult(userMult: 1 | 2, ftueActive: boolean, previewActive = false): number {
  if (previewActive) return PREVIEW_SLOWMO;
  return ftueActive ? 1 : userMult;
}
