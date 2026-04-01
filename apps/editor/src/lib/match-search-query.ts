import { getChoseong } from "es-hangul";
import type { Node } from "@knowledgeview/kg-core";

/** 대소문자 무시 포함 + 한글 초성 매칭 */
export function fuzzyMatch(target: string, query: string): boolean {
  if (!query) return true;
  const lower = query.toLowerCase();
  if (target.toLowerCase().includes(lower)) return true;
  if (getChoseong(target).includes(lower)) return true;
  return false;
}

/** Command 컴포넌트용 필터 래퍼 (0 | 1 반환) */
export function commandFilter(target: string, query: string): 0 | 1 {
  return fuzzyMatch(target, query) ? 1 : 0;
}

/**
 * 노드 라벨과 타입에 대해 fuzzy 매칭을 수행한다.
 * 빈 쿼리는 null 반환 (검색 비활성 상태).
 * 매칭 없으면 빈 Set 반환 (전체 dim 시각 피드백).
 */
export function findMatchingNodeIds(
  nodes: Node[],
  query: string,
): Set<string> | null {
  const q = query.trim();
  if (!q) return null;

  const ids = new Set<string>();
  for (const node of nodes) {
    if (
      fuzzyMatch(node.label, q) ||
      (node.type && fuzzyMatch(node.type, q))
    ) {
      ids.add(node.id);
    }
  }
  return ids;
}
