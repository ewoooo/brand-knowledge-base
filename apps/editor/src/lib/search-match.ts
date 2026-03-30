import type { Node } from "@knowledgeview/kg-core";

/**
 * 노드 라벨과 타입에 대해 대소문자 무시 포함 매칭을 수행한다.
 * 빈 쿼리는 null 반환 (검색 비활성 상태).
 * 매칭 없으면 빈 Set 반환 (전체 dim 시각 피드백).
 */
export function findMatchingNodeIds(
  nodes: Node[],
  query: string,
): Set<string> | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const ids = new Set<string>();
  for (const node of nodes) {
    if (
      node.label.toLowerCase().includes(q) ||
      (node.type && node.type.toLowerCase().includes(q))
    ) {
      ids.add(node.id);
    }
  }
  return ids;
}
