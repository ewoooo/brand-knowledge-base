import { describe, test, expect, beforeEach } from "vitest";
import { createEmptyGraph } from "@knowledgeview/kg-core";
import type { KnowledgeGraph } from "@knowledgeview/kg-core";
import { useGraphStore } from "@/store/graph-store";
import {
  selectNodes,
  selectGetNode,
  selectGetNodeLabel,
  selectNodeTypes,
  selectExistingTypes,
  selectGetRelations,
} from "@/store/selectors/node-selectors";
import {
  selectTriples,
  selectGetTriple,
  selectPredicates,
} from "@/store/selectors/triple-selectors";
import {
  selectGetRule,
  selectUserValidationResults,
} from "@/store/selectors/rule-selectors";

function seedGraph(): KnowledgeGraph {
  const g = createEmptyGraph("test");
  return {
    ...g,
    schema: {
      nodeTypes: [
        { type: "concept", displayName: "개념", description: "", properties: [] },
        { type: "person", displayName: "인물", description: "", properties: [] },
      ],
      linkTypes: [],
    },
    nodes: [
      { id: "n1", label: "Node A", type: "concept" },
      { id: "n2", label: "Node B", type: "person" },
      { id: "n3", label: "Node C", type: "concept" },
    ],
    triples: [
      { id: "t1", subject: "n1", predicate: "related-to", object: "n2" },
      { id: "t2", subject: "n2", predicate: "knows", object: "n3" },
    ],
    rules: [
      { id: "r1", name: "Rule 1", expression: "x", type: "constraint", condition: { nodeType: "concept", predicate: "related-to", operator: "must_have" } },
    ],
  };
}

describe("node-selectors", () => {
  beforeEach(() => {
    useGraphStore.setState(useGraphStore.getInitialState(), true);
  });

  test("selectNodes는 graph가 null이면 빈 배열", () => {
    expect(selectNodes(useGraphStore.getState())).toEqual([]);
  });

  test("selectNodes는 노드 배열을 반환", () => {
    useGraphStore.setState({ graph: seedGraph() });
    expect(selectNodes(useGraphStore.getState())).toHaveLength(3);
  });

  test("selectGetNode는 ID로 노드를 조회", () => {
    useGraphStore.setState({ graph: seedGraph() });
    const getNode = selectGetNode(useGraphStore.getState());
    expect(getNode("n1")?.label).toBe("Node A");
    expect(getNode("nonexistent")).toBeNull();
    expect(getNode(null)).toBeNull();
  });

  test("selectGetNodeLabel은 노드 라벨을 반환, 없으면 ID", () => {
    useGraphStore.setState({ graph: seedGraph() });
    const getLabel = selectGetNodeLabel(useGraphStore.getState());
    expect(getLabel("n1")).toBe("Node A");
    expect(getLabel("unknown")).toBe("unknown");
  });

  test("selectNodeTypes는 타입별 집계를 반환", () => {
    useGraphStore.setState({ graph: seedGraph() });
    const types = selectNodeTypes(useGraphStore.getState());
    expect(types).toHaveLength(2);
    const concept = types.find((t) => t.type === "concept");
    expect(concept?.count).toBe(2);
    expect(concept?.displayName).toBe("개념");
    const person = types.find((t) => t.type === "person");
    expect(person?.count).toBe(1);
    expect(person?.displayName).toBe("인물");
  });

  test("selectExistingTypes는 고유 타입 목록을 반환", () => {
    useGraphStore.setState({ graph: seedGraph() });
    const types = selectExistingTypes(useGraphStore.getState());
    expect(types).toContain("concept");
    expect(types).toContain("person");
    expect(types).toHaveLength(2);
  });

  test("selectGetRelations는 outgoing/incoming을 분류", () => {
    useGraphStore.setState({ graph: seedGraph() });
    const getRelations = selectGetRelations(useGraphStore.getState());
    const rel = getRelations("n2");
    expect(rel.outgoing).toHaveLength(1);
    expect(rel.outgoing[0].predicate).toBe("knows");
    expect(rel.incoming).toHaveLength(1);
    expect(rel.incoming[0].predicate).toBe("related-to");
  });
});

describe("triple-selectors", () => {
  beforeEach(() => {
    useGraphStore.setState(useGraphStore.getInitialState(), true);
  });

  test("selectTriples는 graph가 null이면 빈 배열", () => {
    expect(selectTriples(useGraphStore.getState())).toEqual([]);
  });

  test("selectTriples는 트리플 배열을 반환", () => {
    useGraphStore.setState({ graph: seedGraph() });
    expect(selectTriples(useGraphStore.getState())).toHaveLength(2);
  });

  test("selectGetTriple은 ID로 트리플을 조회", () => {
    useGraphStore.setState({ graph: seedGraph() });
    const getTriple = selectGetTriple(useGraphStore.getState());
    expect(getTriple("t1")?.predicate).toBe("related-to");
    expect(getTriple("nonexistent")).toBeNull();
    expect(getTriple(null)).toBeNull();
  });

  test("selectPredicates는 고유 predicate 목록을 반환", () => {
    useGraphStore.setState({ graph: seedGraph() });
    const predicates = selectPredicates(useGraphStore.getState());
    expect(predicates).toContain("related-to");
    expect(predicates).toContain("knows");
    expect(predicates).toHaveLength(2);
  });
});

describe("rule-selectors", () => {
  beforeEach(() => {
    useGraphStore.setState(useGraphStore.getInitialState(), true);
  });

  test("selectGetRule은 ID로 규칙을 조회", () => {
    useGraphStore.setState({ graph: seedGraph() });
    const getRule = selectGetRule(useGraphStore.getState());
    expect(getRule("r1")?.name).toBe("Rule 1");
    expect(getRule("nonexistent")).toBeNull();
    expect(getRule(null)).toBeNull();
  });

  test("selectUserValidationResults는 schema: prefix를 제외", () => {
    const results = [
      { ruleId: "schema:node-type", ruleName: "스키마", status: "pass" as const, violations: [] },
      { ruleId: "r1", ruleName: "Rule 1", status: "fail" as const, violations: [{ nodeId: "n1", message: "err" }] },
    ];
    const filtered = selectUserValidationResults(results);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].ruleId).toBe("r1");
  });
});
