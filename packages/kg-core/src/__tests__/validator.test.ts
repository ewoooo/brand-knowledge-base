import { describe, it, expect } from "vitest";
import { validate } from "../validator";
import type { KnowledgeGraph } from "../types";

function makeGraph(overrides: Partial<KnowledgeGraph> = {}): KnowledgeGraph {
  return {
    metadata: { name: "테스트", created: "2026-01-01", updated: "2026-01-01" },
    nodes: [],
    triples: [],
    rules: [],
    ...overrides,
  };
}

describe("validate", () => {
  it("should return empty array when no rules exist", () => {
    const graph = makeGraph();
    expect(validate(graph)).toEqual([]);
  });

  it("should pass must_have when relation exists", () => {
    const graph = makeGraph({
      nodes: [
        { id: "n1", label: "브랜드A", type: "brand" },
        { id: "n2", label: "#FF5733", type: "color" },
      ],
      triples: [
        { id: "t1", subject: "n1", predicate: "프라이머리컬러", object: "n2" },
      ],
      rules: [
        {
          id: "r1",
          name: "브랜드는 프라이머리컬러 필요",
          expression: "∀x (brand(x) → ∃y 프라이머리컬러(x, y))",
          type: "constraint",
          condition: {
            nodeType: "brand",
            predicate: "프라이머리컬러",
            operator: "must_have",
          },
        },
      ],
    });

    const results = validate(graph);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("pass");
  });

  it("should fail must_have when relation is missing", () => {
    const graph = makeGraph({
      nodes: [{ id: "n1", label: "브랜드A", type: "brand" }],
      triples: [],
      rules: [
        {
          id: "r1",
          name: "브랜드는 프라이머리컬러 필요",
          expression: "∀x (brand(x) → ∃y 프라이머리컬러(x, y))",
          type: "constraint",
          condition: {
            nodeType: "brand",
            predicate: "프라이머리컬러",
            operator: "must_have",
          },
        },
      ],
    });

    const results = validate(graph);
    expect(results[0].status).toBe("fail");
    expect(results[0].violations).toHaveLength(1);
    expect(results[0].violations[0].nodeId).toBe("n1");
  });

  it("should fail must_not_have when forbidden relation exists", () => {
    const graph = makeGraph({
      nodes: [
        { id: "n1", label: "브랜드A", type: "brand" },
        { id: "n2", label: "Comic Sans", type: "typography" },
      ],
      triples: [
        { id: "t1", subject: "n1", predicate: "금지서체", object: "n2" },
      ],
      rules: [
        {
          id: "r1",
          name: "금지서체 사용 불가",
          expression: "∀x (brand(x) → ¬∃y 금지서체(x, y))",
          type: "constraint",
          condition: {
            nodeType: "brand",
            predicate: "금지서체",
            operator: "must_not_have",
          },
        },
      ],
    });

    const results = validate(graph);
    expect(results[0].status).toBe("fail");
    expect(results[0].violations[0].relatedTripleId).toBe("t1");
  });
});
