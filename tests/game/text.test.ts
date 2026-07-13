import { describe, expect, it } from 'vitest';
import { KO, t } from '../../src/game/text/ko';

describe('i18n 골격 (PROGRESS §📌 결정2)', () => {
  it('모든 키는 `도메인.화면.항목` 점 구분 형식 (≥2 세그먼트, 소문자·숫자)', () => {
    for (const key of Object.keys(KO)) {
      expect(key).toMatch(/^[a-z][a-z0-9]*(\.[a-z0-9]+)+$/);
    }
  });
  it('t()는 등록된 키의 문자열을 반환', () => {
    expect(t('result.title.win')).toBe('승리');
    expect(t('result.star2.desc')).toBe('정점 유닛 Gen3+ 로 승리');
  });
  it('t()는 {param}을 치환', () => {
    expect(t('result.stars', { earned: 2 })).toBe('별 2/3');
  });
  it('params 누락 시 {param} 토큰 원형 유지 (개발 중 누락 가시화)', () => {
    expect(t('result.stars')).toContain('{earned}');
  });
});
