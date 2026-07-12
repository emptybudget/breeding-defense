import { describe, expect, it } from 'vitest';
import { CHAIN_NODES_MAX } from '../../src/game/config';
import { buildFamilyRecord } from '../../src/game/family';
import { Gen, Lineage, PedigreeNode, UnitRace } from '../../src/game/types';

// 헬퍼: 간이 pedigree 노드
function node(childId: number, childGen: Gen, lineageId?: number, race: UnitRace = 'Warrior', extra: Partial<PedigreeNode> = {}): PedigreeNode {
  return { parentIds: [0, 0], childId, childRace: race, childGen, cross: false, lineageId, ...extra };
}
function lineagesOf(...ls: Lineage[]): Map<number, Lineage> {
  return new Map(ls.map(l => [l.id, l]));
}

describe('buildFamilyRecord — 가문 계보 빌더', () => {
  it('혈통 노드가 없으면 null', () => {
    expect(buildFamilyRecord([], lineagesOf())).toBeNull();
    expect(buildFamilyRecord([node(1, 1, undefined)], lineagesOf())).toBeNull();
  });

  it('단일 혈통 체인을 gen 오름차순으로 만든다', () => {
    const L: Lineage = { id: 7, name: '은빛칼날', family: 'sword' };
    const ped = [node(3, 3, 7), node(1, 1, 7), node(2, 2, 7)];
    const rec = buildFamilyRecord(ped, lineagesOf(L), 1000)!;
    expect(rec).not.toBeNull();
    expect(rec.name).toBe('은빛칼날');
    expect(rec.family).toBe('sword');
    expect(rec.apexGen).toBe(3);
    expect(rec.chain.map(n => n.gen)).toEqual([1, 2, 3]);
    expect(rec.registeredAt).toBe(1000);
  });

  it('apex = 최대 childGen 노드의 혈통만 등록 (다른 혈통 배제)', () => {
    const A: Lineage = { id: 1, name: '검문가', family: 'sword' };
    const B: Lineage = { id: 2, name: '야수가', family: 'fang' };
    const ped = [
      node(1, 1, 1), node(2, 2, 1),          // 혈통 A: 최대 Gen2
      node(3, 1, 2), node(4, 3, 2, 'Dog'),   // 혈통 B: 최대 Gen3 → apex
    ];
    const rec = buildFamilyRecord(ped, lineagesOf(A, B))!;
    expect(rec.name).toBe('야수가');
    expect(rec.family).toBe('fang');
    expect(rec.chain.length).toBe(2); // 혈통 B 노드만 (혈통 A 배제)
    expect(rec.apexRace).toBe('Dog');
  });

  it('gen 동률이면 최신(childId 큰) 노드가 apex', () => {
    const A: Lineage = { id: 1, name: '가문A', family: 'sword' };
    const B: Lineage = { id: 2, name: '가문B', family: 'steel' };
    const ped = [node(10, 3, 1), node(20, 3, 2)]; // 둘 다 Gen3, childId 20이 최신
    const rec = buildFamilyRecord(ped, lineagesOf(A, B))!;
    expect(rec.name).toBe('가문B');
  });

  it('노드 >8이면 시조 + 상위 Gen 7개로 캡', () => {
    const L: Lineage = { id: 1, name: '긴가문', family: 'sword' };
    const ped: PedigreeNode[] = [];
    for (let i = 1; i <= 12; i++) ped.push(node(i, Math.min(i, 4) as Gen, 1));
    const rec = buildFamilyRecord(ped, lineagesOf(L))!;
    expect(rec.chain.length).toBe(CHAIN_NODES_MAX);
    expect(rec.chain[0].gen).toBe(1);                          // 시조 유지
    expect(rec.chain[rec.chain.length - 1].gen).toBe(4);       // 마지막 = 최고 Gen(apex)
    expect(rec.apexGen).toBe(4);
  });

  it('노드 name 부재 시 lineage.name으로 폴백', () => {
    const L: Lineage = { id: 5, name: '폴백가문', family: 'steel' };
    const ped = [node(1, 1, 5, 'Android', { name: undefined })];
    const rec = buildFamilyRecord(ped, lineagesOf(L))!;
    expect(rec.chain[0].name).toBe('폴백가문');
  });
});
