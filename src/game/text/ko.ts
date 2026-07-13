// M5 i18n 골격 (PROGRESS §📌 결정2) — 한국어 문자열 딕셔너리.
// 순수 데이터: Phaser·렌더 의존 0 (데이터/렌더 분리 불가침). 라이브러리 미도입.
// 키 = `도메인.화면.항목` flat string (예: result.title.win, ui.pedigree.tab).
// 규칙: M5 신규 UI 문자열은 반드시 여기 등록 후 t()로 참조 — 신규 하드코딩 한글 금지.
//       로어(lore.ts)·혈통명(naming.ts)은 이미 키화된 데이터라 이중 등록 금지.
// 다국어(en 등)는 Steam 빌드 준비 시 이 파일을 index로 분리 — 지금은 단일 로케일.

export const KO = {
  // 결과 카드 (M5 V1 — 30-steam-volume §2, 별점 확정본). P1이 defeat 원인·계보 체인 키를 이어서 확장.
  'result.title.win': '승리',
  'result.title.lose': '패배',
  'result.star1.desc': '승리',
  'result.star2.desc': '정점 유닛 Gen3+ 로 승리',
  'result.star3.desc': '고유 혈통 도전 달성',
  'result.stars': '별 {earned}/3',
} as const;

export type TextKey = keyof typeof KO;

// {param} 치환 — 동적 값(세대·골드·가문명 등)은 params로 주입. 누락 토큰은 원형 유지(개발 중 가시화).
export function t(key: TextKey, params?: Record<string, string | number>): string {
  const raw = KO[key];
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}
