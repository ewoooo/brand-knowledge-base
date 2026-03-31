// TODO: Phase 2 완료 후 벡터 검색 도입 필요성 재검토
// 현재 keyword 매칭은 71 노드 규모에서 충분하지만,
// 그래프 300+ 노드 또는 lint API 반복 호출 시 fallback 비율/토큰 비용 측정 후 판단
// → TODOS.md "벡터 검색 기반 entity extraction 도입 검토" 참조
import type { KnowledgeGraph } from "@knowledgeview/kg-core";
import type { ExtractionResult } from "./types";

const TYPE_KEYWORDS: Record<string, string[]> = {
  brand: ["브랜드", "brand"],
  color: ["컬러", "색상", "색", "color"],
  typography: ["서체", "폰트", "글꼴", "font", "typography"],
  concept: ["컨셉", "톤", "매너", "느낌", "concept"],
};

export function extractEntities(
  graph: KnowledgeGraph,
  question: string
): ExtractionResult {
  const entities: ExtractionResult["entities"] = [];
  const predicateHints: string[] = [];
  const typeHints: string[] = [];
  const questionLower = question.toLowerCase();

  // 1. 노드 label 매칭 (긴 label부터 매칭하여 부분 매칭 방지)
  const sortedNodes = [...graph.nodes].sort(
    (a, b) => b.label.length - a.label.length
  );

  for (const node of sortedNodes) {
    const labelLower = node.label.toLowerCase();
    if (questionLower.includes(labelLower)) {
      entities.push({
        nodeId: node.id,
        label: node.label,
        matchType: "exact",
      });
    }
  }

  // 2. predicate 매칭
  const predicates = [...new Set(graph.triples.map((t) => t.predicate))];
  for (const predicate of predicates) {
    const predicateLower = predicate.toLowerCase();
    const questionNoSpace = questionLower.replace(/\s+/g, "");
    if (
      questionLower.includes(predicateLower) ||
      questionNoSpace.includes(predicateLower)
    ) {
      predicateHints.push(predicate);
    }
  }

  // 3. 타입 힌트 추출
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (questionLower.includes(keyword.toLowerCase())) {
        typeHints.push(type);
        break;
      }
    }
  }

  return { entities, predicateHints, typeHints, mode: "keyword" };
}
