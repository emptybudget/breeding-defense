// M3: 혈통·가문 네이밍 (docs/redesign/08-naming-system.md) — 순수 TS, Phaser 의존 0.
import { FamilyKey, MutationGrade, Tier1Race } from './types';

export const FAMILY_OF_RACE: Record<Tier1Race, FamilyKey> = {
  Warrior: 'sword', Archer: 'sword',
  Dog: 'fang', Squirrel: 'fang',
  Android: 'steel', Cannon: 'steel',
};

export const FAMILY_LABEL: Record<FamilyKey, string> = {
  sword: '검문', fang: '야수문', steel: '강철문',
};

// 접두 풀 (전 계열 공용, 36종)
export const NAME_PREFIX: string[] = [
  // 빛·시간 (12)
  '은빛', '금빛', '새벽', '황혼', '달빛', '별빛', '여명', '노을', '한낮', '그믐', '섬광', '잿빛',
  // 자연·기상 (12)
  '서리', '폭풍', '벼락', '천둥', '안개', '바람', '파도', '불꽃', '눈보라', '이슬', '모래', '해일',
  // 기질·서사 (12)
  '침묵', '맹세', '긍지', '복수', '방랑', '불굴', '고요', '광란', '수호', '개척', '각성', '영원',
];

// 접미 풀 (계열별 12종)
export const NAME_SUFFIX: Record<FamilyKey, string[]> = {
  sword: ['칼날', '방패', '창끝', '갑주', '깃발', '왕관', '성벽', '기사', '맹약', '파수', '심판', '군기'],
  fang:  ['송곳니', '발톱', '갈기', '꼬리', '사냥', '울음', '질주', '포효', '숲', '뿔', '둥지', '야성'],
  steel: ['톱니', '회로', '태엽', '용광로', '피스톤', '포신', '코어', '기관', '강선', '나사', '발전', '철심'],
};

// 변이 칭호 (이름 앞 수식, 렌더 전용 — 개체 필드에 저장)
export const EPITHET_RARE: string[]   = ['벼락맞은', '축복받은', '각성한', '달을삼킨', '두번태어난', '운명의'];
export const EPITHET_LEGEND: string[] = ['신탁의', '태초의', '왕을낳은', '별의계승자', '신을엿본', '문을연'];

const ROMAN = ['', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/**
 * 혈통명 생성 — 접두+접미(계열별) 붙여쓰기. used 충돌 시 재롤 최대 8회,
 * 그래도 충돌이면 로마숫자 접미(이름II…)로 유일성 보장.
 * 순수 함수 (rng 주입, Math.random 금지 — 시뮬 재현성).
 */
export function generateBloodlineName(
  family: FamilyKey,
  rng: () => number,
  used: Set<string>,
): string {
  const suffixPool = NAME_SUFFIX[family];
  let name = '';
  for (let attempt = 0; attempt < 8; attempt++) {
    name = NAME_PREFIX[Math.floor(rng() * NAME_PREFIX.length)] +
           suffixPool[Math.floor(rng() * suffixPool.length)];
    if (!used.has(name)) return name;
  }
  // 8회 초과 충돌 → 로마숫자 접미로 대가문 서사 수용
  for (let i = 1; i < ROMAN.length; i++) {
    const variant = name + ROMAN[i];
    if (!used.has(variant)) return variant;
  }
  return name + ROMAN[ROMAN.length - 1];
}

/** 변이 등급 → 칭호 롤 (일반 변이는 칭호 없음). */
export function rollEpithet(grade: MutationGrade, rng: () => number): string | undefined {
  if (grade === 'rare') return EPITHET_RARE[Math.floor(rng() * EPITHET_RARE.length)];
  if (grade === 'legend') return EPITHET_LEGEND[Math.floor(rng() * EPITHET_LEGEND.length)];
  return undefined;
}
