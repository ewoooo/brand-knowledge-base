import { describe, it, expect } from "vitest";
import { validate } from "@/lib/kg-core/validator";
import {
  createEmptyGraph,
  addNode,
  addTriple,
  addRule,
} from "@/lib/kg-core/operations";
import type { Rule } from "@/lib/kg-core/types";

describe("validate", () => {
  const mustHaveRule: Rule = {
    id: "r1",
    name: "브랜드는 프라이머리컬러 필수",
    expression: "∀x (brand(x) → ∃y 프라이머리컬러(x, y))",
    type: "constraint",
    condition: { nodeType: "brand", predicate: "프라이머리컬러", operator: "must_have" },
  };

  const mustNotHaveRule: Rule = {
    id: "r2",
    name: "컨셉 노드는 금지색상 불가",
    expression: "∀x (concept(x) → ¬∃y 금지색상(x, y))",
    type: "validation",
    condition: { nodeType: "concept", predicate: "금지색상", operator: "must_not_have" },
  };

  const conflictsWithRule: Rule = {
    id: "r3",
    name: "프라이머리컬러와 금지색상 충돌 방지",
    expression: "∀x ∀y (프라이머리컬러(x, y) → ¬금지색상(x, y))",
    type: "validation",
    condition: {
      nodeType: "brand",
      predicate: "프라이머리컬러",
      operator: "conflicts_with",
      conflictPredicate: "금지색상",
    },
  };

  it("must_have: passes when node has the required predicate", () => {
    let g = createEmptyGraph("Test");
    g = addNode(g, { id: "b1", label: "Brand", type: "brand" });
    g = addNode(g, { id: "c1", label: "#FF0000", type: "color" });
    g = addTriple(g, { id: "t1", subject: "b1", predicate: "프라이머리컬러", object: "c1" });
    g = addRule(g, mustHaveRule);

    const results = validate(g);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("pass");
  });

  it("must_have: fails when node is missing the required predicate", () => {
    let g = createEmptyGraph("Test");
    g = addNode(g, { id: "b1", label: "Brand", type: "brand" });
    g = addRule(g, mustHaveRule);

    const results = validate(g);
    expect(results).toHaveLength(1);
    expect(results[0].status).toBe("fail");
    expect(results[0].violations).toHaveLength(1);
    expect(results[0].violations[0].nodeId).toBe("b1");
  });

  it("must_not_have: passes when node does not have the forbidden predicate", () => {
    let g = createEmptyGraph("Test");
    g = addNode(g, { id: "c1", label: "Warm", type: "concept" });
    g = addRule(g, mustNotHaveRule);

    const results = validate(g);
    expect(results[0].status).toBe("pass");
  });

  it("must_not_have: fails when node has the forbidden predicate", () => {
    let g = createEmptyGraph("Test");
    g = addNode(g, { id: "c1", label: "Warm", type: "concept" });
    g = addNode(g, { id: "x1", label: "#000", type: "color" });
    g = addTriple(g, { id: "t1", subject: "c1", predicate: "금지색상", object: "x1" });
    g = addRule(g, mustNotHaveRule);

    const results = validate(g);
    expect(results[0].status).toBe("fail");
    expect(results[0].violations[0].nodeId).toBe("c1");
  });

  it("conflicts_with: passes when no conflict exists", () => {
    let g = createEmptyGraph("Test");
    g = addNode(g, { id: "b1", label: "Brand", type: "brand" });
    g = addNode(g, { id: "c1", label: "#FF0000", type: "color" });
    g = addNode(g, { id: "c2", label: "#00FF00", type: "color" });
    g = addTriple(g, { id: "t1", subject: "b1", predicate: "프라이머리컬러", object: "c1" });
    g = addTriple(g, { id: "t2", subject: "b1", predicate: "금지색상", object: "c2" });
    g = addRule(g, conflictsWithRule);

    const results = validate(g);
    expect(results[0].status).toBe("pass");
  });

  it("conflicts_with: fails when same object appears in both predicates", () => {
    let g = createEmptyGraph("Test");
    g = addNode(g, { id: "b1", label: "Brand", type: "brand" });
    g = addNode(g, { id: "c1", label: "#FF0000", type: "color" });
    g = addTriple(g, { id: "t1", subject: "b1", predicate: "프라이머리컬러", object: "c1" });
    g = addTriple(g, { id: "t2", subject: "b1", predicate: "금지색상", object: "c1" });
    g = addRule(g, conflictsWithRule);

    const results = validate(g);
    expect(results[0].status).toBe("fail");
    expect(results[0].violations[0].nodeId).toBe("b1");
    expect(results[0].violations[0].relatedTripleId).toBe("t2");
  });

  it("returns empty results for graph with no rules", () => {
    let g = createEmptyGraph("Test");
    g = addNode(g, { id: "b1", label: "Brand", type: "brand" });
    const results = validate(g);
    expect(results).toEqual([]);
  });
});
