import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { createEmptyGraph } from "@knowledgeview/kg-core";
import type { KnowledgeGraph } from "@knowledgeview/kg-core";
import { useGraphStore } from "@/store/graph-store";
import {
  useValidationStore,
  setupValidationSubscription,
} from "@/store/validation-store";

function graphWithRule(): KnowledgeGraph {
  const g = createEmptyGraph("test");
  return {
    ...g,
    nodes: [
      { id: "n1", label: "A", type: "concept" },
      { id: "n2", label: "B", type: "concept" },
    ],
    triples: [],
    rules: [
      {
        id: "r1",
        name: "must have relation",
        expression: "concept must have related-to",
        type: "constraint",
        condition: {
          nodeType: "concept",
          predicate: "related-to",
          operator: "must_have",
        },
      },
    ],
  };
}

describe("validation-store", () => {
  let unsub: () => void;

  beforeEach(() => {
    useGraphStore.setState(useGraphStore.getInitialState(), true);
    useValidationStore.setState(useValidationStore.getInitialState(), true);
    unsub = setupValidationSubscription();
  });

  afterEach(() => {
    unsub();
  });

  test("초기 상태는 빈 결과", () => {
    const state = useValidationStore.getState();
    expect(state.results).toEqual([]);
    expect(state.violatedNodeIds).toEqual(new Set());
    expect(state.violatedTripleIds).toEqual(new Set());
    expect(state.failCount).toBe(0);
  });

  test("graph 설정 시 자동 검증이 실행됨", () => {
    useGraphStore.setState({ graph: graphWithRule() });

    const { results, violatedNodeIds, failCount } =
      useValidationStore.getState();
    expect(results.length).toBeGreaterThan(0);
    expect(violatedNodeIds.size).toBeGreaterThan(0);
    expect(failCount).toBeGreaterThan(0);
  });

  test("규칙을 만족하면 violation이 없음", () => {
    const g = graphWithRule();
    g.triples = [
      { id: "t1", subject: "n1", predicate: "related-to", object: "n2" },
      { id: "t2", subject: "n2", predicate: "related-to", object: "n1" },
    ];
    useGraphStore.setState({ graph: g });

    const { violatedNodeIds, failCount } = useValidationStore.getState();
    expect(violatedNodeIds.size).toBe(0);
    expect(failCount).toBe(0);
  });

  test("graph가 null로 변경되면 결과를 초기화", () => {
    useGraphStore.setState({ graph: graphWithRule() });
    expect(useValidationStore.getState().results.length).toBeGreaterThan(0);

    useGraphStore.setState({ graph: null });
    const state = useValidationStore.getState();
    expect(state.results).toEqual([]);
    expect(state.violatedNodeIds).toEqual(new Set());
    expect(state.failCount).toBe(0);
  });

  test("violatedTripleIds에 relatedTripleId가 포함됨", () => {
    // schema:link-type 검증 — 스키마에 정의되지 않은 predicate 사용 시 relatedTripleId 설정됨
    const g = createEmptyGraph("test");
    g.schema = {
      nodeTypes: [
        { type: "concept", displayName: "Concept", description: "", properties: [] },
      ],
      linkTypes: [],  // predicate 정의 없음
    };
    g.nodes = [
      { id: "n1", label: "A", type: "concept" },
      { id: "n2", label: "B", type: "concept" },
    ];
    g.triples = [
      { id: "t1", subject: "n1", predicate: "undefined-predicate", object: "n2" },
    ];
    useGraphStore.setState({ graph: g });

    const { violatedTripleIds } = useValidationStore.getState();
    expect(violatedTripleIds.has("t1")).toBe(true);
  });
});
