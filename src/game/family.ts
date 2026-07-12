// M5: 가문 계보 빌더 (docs/redesign M5 착수 메모) — 순수 TS, Phaser 의존 0.
// 판 종료 시 pedigree(이벤트 로그)에서 apex 혈통의 체인을 뽑아 FamilyRecord로 만든다.
import { CHAIN_NODES_MAX } from './config';
import { FamilyChainNode, FamilyRecord, Lineage, PedigreeNode } from './types';

/**
 * apex = childGen 최대(동률 시 childId 큰=최신) 노드. 그 노드의 혈통만 필터해
 * gen 오름차순 체인을 만든다. 노드 >8이면 시조(Gen1) + 상위 Gen 7개만 남긴다.
 * 혈통 노드가 하나도 없으면(무혈통 = 순수 소환/합성만) null.
 */
export function buildFamilyRecord(
  pedigree: readonly PedigreeNode[],
  lineages: ReadonlyMap<number, Lineage>,
  now: number = Date.now(),
): FamilyRecord | null {
  let apex: PedigreeNode | undefined;
  for (const n of pedigree) {
    if (n.lineageId === undefined) continue;
    if (!apex || n.childGen > apex.childGen ||
        (n.childGen === apex.childGen && n.childId > apex.childId)) {
      apex = n;
    }
  }
  if (!apex || apex.lineageId === undefined) return null;
  const lineage = lineages.get(apex.lineageId);
  if (!lineage) return null;

  const apexLineageId = apex.lineageId;
  const nodes = pedigree
    .filter(n => n.lineageId === apexLineageId)
    .sort((a, b) => a.childGen - b.childGen || a.childId - b.childId);

  let chain: FamilyChainNode[] = nodes.map(n => ({
    race: n.childRace,
    gen: n.childGen,
    name: n.name ?? lineage.name,
    epithet: n.epithet,
    mutation: n.mutation,
  }));

  // 8캡: 시조(첫 노드) + 상위 Gen 7개(마지막 7)
  if (chain.length > CHAIN_NODES_MAX) {
    chain = [chain[0], ...chain.slice(chain.length - (CHAIN_NODES_MAX - 1))];
  }

  return {
    name: lineage.name,
    family: lineage.family,
    chain,
    apexRace: apex.childRace,
    apexGen: apex.childGen,
    registeredAt: now,
  };
}
