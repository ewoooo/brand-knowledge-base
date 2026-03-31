import { describe, it, expect } from "vitest";
import { validate } from "../validator";
import type { KnowledgeGraph, TypeRegistry } from "../types";

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

// --- 스키마 기반 검증 ---

const testSchema: TypeRegistry = {
  nodeTypes: [
    {
      type: "brand",
      displayName: "브랜드",
      description: "",
      properties: [
        { key: "name", displayName: "이름", valueType: "string", required: true },
      ],
    },
    {
      type: "color",
      displayName: "색상",
      description: "",
      properties: [
        { key: "hexCode", displayName: "HEX", valueType: "string", required: true },
        { key: "category", displayName: "분류", valueType: "enum", enumValues: ["primary", "secondary"] },
      ],
    },
  ],
  linkTypes: [
    { predicate: "has-color", displayName: "색상", sourceTypes: ["brand"], targetTypes: ["color"], cardinality: "1:N" },
  ],
};

describe("validate (스키마 기반)", () => {
  it("스키마에 정의되지 않은 노드 타입을 경고", () => {
    const graph = makeGraph({
      schema: testSchema,
      nodes: [{ id: "n1", label: "???", type: "unknown-type" }],
    });
    const results = validate(graph);
    const schemaResult = results.find((r) => r.ruleId === "schema:node-type");
    expect(schemaResult).toBeDefined();
    expect(schemaResult?.status).toBe("fail");
    expect(schemaResult?.violations[0].nodeId).toBe("n1");
  });

  it("필수 속성이 없으면 위반", () => {
    const graph = makeGraph({
      schema: testSchema,
      nodes: [
        { id: "n1", label: "#2E5BFF", type: "color", props: {} },
      ],
    });
    const results = validate(graph);
    const propResult = results.find((r) => r.ruleId === "schema:required-props");
    expect(propResult).toBeDefined();
    expect(propResult?.status).toBe("fail");
    expect(propResult?.violations[0].message).toContain("hexCode");
  });

  it("필수 속성이 있으면 통과", () => {
    const graph = makeGraph({
      schema: testSchema,
      nodes: [
        { id: "n1", label: "#2E5BFF", type: "color", props: { hexCode: "#2E5BFF" } },
      ],
    });
    const results = validate(graph);
    const propResult = results.find((r) => r.ruleId === "schema:required-props");
    expect(propResult?.status).toBe("pass");
  });

  it("스키마에 정의되지 않은 predicate를 경고", () => {
    const graph = makeGraph({
      schema: testSchema,
      nodes: [
        { id: "n1", label: "A", type: "brand" },
        { id: "n2", label: "B", type: "color" },
      ],
      triples: [
        { id: "t1", subject: "n1", predicate: "unknown-rel", object: "n2" },
      ],
    });
    const results = validate(graph);
    const ltResult = results.find((r) => r.ruleId === "schema:link-type");
    expect(ltResult).toBeDefined();
    expect(ltResult?.status).toBe("fail");
  });

  it("스키마 없으면 스키마 검증 결과 없음", () => {
    const graph = makeGraph({
      nodes: [{ id: "n1", label: "A", type: "anything" }],
    });
    const results = validate(graph);
    const schemaResults = results.filter((r) => r.ruleId.startsWith("schema:"));
    expect(schemaResults).toHaveLength(0);
  });
});
