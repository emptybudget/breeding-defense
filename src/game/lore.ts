import { UnitRace } from './types';

// 유닛 25종 도감·부화 대사 — docs/redesign/24-lore-units.md §2~§5 표 그대로.
// M4는 birthCry만 소비(부화 배너, 등급 연출 아래 0.8s) — epithet/dex는 M5(도감·바텀시트) 몫.
// Astral_God은 '〈가문명〉' 토큰을 렌더 시점에 실제 혈통명으로 치환한다.
export const UNIT_LORE: Record<UnitRace, { epithet: string; dex: string; birthCry: string }> = {
  Warrior:  { epithet: '막내 기사',   dex: '검문 도장의 막내. 검 잡는 법보다 넘어지는 법을 먼저 배웠지만, 그래서 제일 앞에 선다.', birthCry: '제가 앞장설게요!' },
  Archer:   { epithet: '새벽 파수꾼', dex: '새벽 교대가 싫어서 활을 배웠다는 소문이 있다. 본인은 부정하지만 화살은 정직하다.', birthCry: '…벌써 아침이에요?' },
  Dog:      { epithet: '뼈다귀 기사', dex: '물고 있는 뼈다귀 곤봉은 장난감이 아니라 가보(家寶)다. 진지한 얼굴을 해도 꼬리는 숨길 수 없다.', birthCry: '멍! (경례)' },
  Squirrel: { epithet: '도토리 회계사', dex: '가문 창고의 도토리를 전부 세어 둔다. 하나라도 비면 새총이 먼저 운다.', birthCry: '재고 확인 완료!' },
  Android:  { epithet: '미소 연습생', dex: '매일 아침 거울 앞에서 웃는 법을 연습한다. 아직 각도가 3도쯤 어긋난다.', birthCry: '안녕하세요. (3도 어긋남)' },
  Cannon:   { epithet: '과묵한 포탑', dex: '말수가 적다. 포성이 곧 인사고, 재장전이 곧 안부다.', birthCry: '…쿵.' },

  Bio_Wolf:         { epithet: '반씩 물려받은 아이', dex: '기사도와 야성을 정확히 반씩 물려받았다. 그래서 예의 바르게 문다.', birthCry: '실례하겠습니다. 콱.' },
  Acorn_Girl:       { epithet: '도토리 철퇴',   dex: '도토리 철퇴는 회계사 어머니의 유산이다. 잘 싸운 아군에겐 도토리를 하나 나눠준다 — 딱 하나, 오늘만이다.', birthCry: '낭비는 죄야!' },
  Falcon_Eye:       { epithet: '하늘의 눈',     dex: '눈은 하늘에, 심장은 들판에 있다. 빈사의 적만 노리는 건 자비라고 본인은 주장한다.', birthCry: '끝을 봐줄게.' },
  Acorn_Hunter:     { epithet: '빠른 사수',     dex: '어릴 적 화살 대신 도토리를 쏘다가 혼났다. 지금은 둘 다 쏜다. 빠르게.', birthCry: '장전 다 됐어!' },
  Cyborg_Slasher:   { epithet: '반반 자란 검',  dex: '도장과 공장에서 반반 자랐다. 베기 직전 0.2초 미소 짓는 것은 학습된 예의다.', birthCry: '잘 부탁드립니다.' },
  Cannon_Shooter:   { epithet: '먼 곳의 배려',  dex: '아버지의 방패술에 어머니의 포신을 얹었다. 넉백은 배려다 — 먼 곳에서 끝나라고.', birthCry: '물러서 주시죠.' },
  Laser_Sniper:     { epithet: '미계산 항목',   dex: '스코프 너머로만 세상을 본다. 관통은 계산의 결과고, 감정은 아직 미계산 항목이다.', birthCry: '…딱히 반갑진 않아.' },
  Missile_Gunner:   { epithet: '셋이면 충분해', dex: '늘 세 발을 쏜다. 하나쯤 빗나가도 슬프지 않기 위해서라고 한다.', birthCry: '셋이면 충분해.' },
  Blade_Hound:      { epithet: '고치지 않은 버그', dex: '물수록 빨라지는 결함이 있다. 강철문의 기술자들은 이 버그를 고치지 않기로 만장일치했다.', birthCry: '더! 더 빨리!' },
  Gatling_Dog:      { epithet: '신나는 꼬리',   dex: '꼬리 대신 개틀링이 돈다. 기분이 좋으면 발사 속도로 티가 난다.', birthCry: '드르륵! (신남)' },
  Electric_Coon:    { epithet: '훔친 전기',     dex: '반짝이는 것은 일단 훔치고 본다. 훔친 전기를 적에게 돌려줄 뿐이라는 게 공식 입장이다.', birthCry: '이거 내 거였어~' },
  Menhera_Squirrel: { epithet: '반창고',       dex: '지뢰를 묻는 건 누군가 밟으면 자기한테 달려와 주기 때문이다. 반창고는 아프지 않은 날에도 붙인다 — 그래야 물어봐 주니까.', birthCry: '안 버릴 거지…? 찰칵.' },

  Cyborg_Wizard:   { epithet: '회로의 시인',   dex: '기계가 마법을 배우면 회로가 시를 쓴다. 스태프의 룬은 매일 밤 스스로를 다시 쓴다.', birthCry: '오늘의 시를 읊지.' },
  Dino_Mecha:      { epithet: '꿈의 6호기',    dex: '조종석 아이의 첫 교과서는 공룡 도감이었다. 꿈을 철판으로 조립해 여기까지 왔다.', birthCry: '출격, 꿈의 6호기!' },
  Griffin:         { epithet: '예열 중인 겸손', dex: '하늘의 긍지와 땅의 심장을 함께 물려받았다. 날개를 접고 있는 건 겸손이 아니라 예열이다.', birthCry: '하늘이 좁군.' },
  Thunder_Hawk:    { epithet: '세 번째 번개',   dex: '번개를 두 번 맞고도 살아남자, 세 번째 번개가 사과하러 왔다. 그 번개가 지금의 창이다.', birthCry: '세 번째는 내 차례.' },
  Berserk_Shaman:  { epithet: '조용한 계약자',  dex: '광란은 저주가 아니라 계약이다. 전장이 끝나면 누구보다 조용히 도끼를 닦는다.', birthCry: '계약대로.' },
  Chaos_Artillery: { epithet: '전시회 큐레이터', dex: '폭발은 예술이고 자신은 큐레이터라고 주장한다. 고글의 그을음은 지우지 않는다 — 서명이니까.', birthCry: '개막이야, 전시회!' },

  Astral_God: { epithet: '정점의 신', dex: '세 갈래 혈통이 한 계보에 포개질 때, 알은 별을 품는다. 신은 태어나는 순간 자신을 낳은 가문의 이름을 첫 언어로 말한다.', birthCry: '〈가문명〉… 좋은 이름이다.' },
};

// 「접경의 명가들」 연대기 15문장 — docs/redesign/25-storyline.md:51-73 확정본.
// 키는 WorldStageConfig.name과 동일 문자열('W1-1' 등). 승리(Victory) 시에만 노출 — 패배 시엔 미표시.
export const CHRONICLE: Record<string, string> = {
  'W1-1': '낡은 문패가 첫 밤을 버텼다.',
  'W1-2': '첫 울음소리가 폐가를 깨웠다.',
  'W1-3': '두 아이가 하나의 이름이 되었다.',
  'W1-4': '균열이 처음으로 이쪽을 보았다.',
  'W1-5': '벽화 속 별이 오래 당신을 보고 있었다.',
  'W2-1': '접경 안쪽 길은 아무도 쓸지 않았다.',
  'W2-2': '밤의 종소리가 조금 낯설게 울렸다.',
  'W2-3': '망령의 로브에서 낡은 문장 조각이 떨어졌다.',
  'W2-4': '그 문장은 세 문(門)의 것이 아니었다.',
  'W2-5': '성문을 진 거북 뒤로 주춧돌이 드러났다.',
  'W3-1': '여기부터는 지워진 이름들의 땅이다.',
  'W3-2': '망령들이 진형을 짜고 있었다 — 지키듯이.',
  'W3-3': '옛 지도의 큰 저택, 당신의 폐가 자리였다.',
  'W3-4': '그들은 침입하지 않았다. 돌아오고 있었다.',
  'W3-5': '왕관 안쪽의 성(姓)은, 이제 아무도 쓰지 않는다.',
};

// W1-5 클리어 T4 컷인 카피 (선대 벽화의 환영) — docs/redesign/25-storyline.md:73
export const W1_5_CUTIN_LINE = '언젠가 너의 계보도 별을 품으리라.';
