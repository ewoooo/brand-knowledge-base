import { describe, it, expect } from "vitest";
import {
  createEmptyGraph,
  addNode,
  removeNode,
  updateNode,
  addTriple,
  removeTriple,
  addRule,
} from "../operations";
import type { Node, Triple, Rule, TypeRegistry } from "../types";

const makeNode = (id: string, label: string, type: string = "unknown"): Node => ({
  id,
  label,
  type,
});

const makeTriple = (
  id: string,
  subject: string,
  predicate: string,
  object: string
): Triple => ({ id, subject, predicate, object });

describe("createEmptyGraph", () => {
  it("should create a graph with name and empty collections", () => {
    const graph = createEmptyGraph("테스트");
    expect(graph.metadata.name).toBe("테스트");
    expect(graph.nodes).toEqual([]);
    expect(graph.triples).toEqual([]);
    expect(graph.rules).toEqual([]);
  });

  it("should not include systemPrompt by default", () => {
    const graph = createEmptyGraph("테스트");
    expect(graph.metadata.systemPrompt).toBeUndefined();
  });
});

describe("addNode", () => {
  it("should add a node to the graph", () => {
    const graph = createEmptyGraph("테스트");
    const node = makeNode("n1", "브랜드A", "brand");
    const result = addNode(graph, node);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].label).toBe("브랜드A");
  });

  it("should throw on duplicate node id", () => {
    const graph = createEmptyGraph("테스트");
    const node = makeNode("n1", "브랜드A", "brand");
    const withNode = addNode(graph, node);
    expect(() => addNode(withNode, node)).toThrow("already exists");
  });
});

describe("removeNode", () => {
  it("should remove node and its connected triples", () => {
    let graph = createEmptyGraph("테스트");
    graph = addNode(graph, makeNode("n1", "브랜드A", "brand"));
    graph = addNode(graph, makeNode("n2", "#FF5733", "color"));
    graph = addTriple(graph, makeTriple("t1", "n1", "프라이머리컬러", "n2"));

    const result = removeNode(graph, "n1");
    expect(result.nodes).toHaveLength(1);
    expect(result.triples).toHaveLength(0);
  });
});

describe("addTriple", () => {
  it("should throw if subject node does not exist", () => {
    const graph = createEmptyGraph("테스트");
    expect(() =>
      addTriple(graph, makeTriple("t1", "missing", "관계", "n2"))
    ).toThrow("Subject node");
  });

  it("should throw if object node does not exist", () => {
    let graph = createEmptyGraph("테스트");
    graph = addNode(graph, makeNode("n1", "브랜드A"));
    expect(() =>
      addTriple(graph, makeTriple("t1", "n1", "관계", "missing"))
    ).toThrow("Object node");
  });
});

describe("type normalization", () => {
  it("addNode는 PascalCase type을 kebab-case로 정규화", () => {
    const graph = createEmptyGraph("테스트");
    const result = addNode(graph, makeNode("n1", "브랜드", "BrandName"));
    expect(result.nodes[0].type).toBe("brand-name");
  });

  it("updateNode는 type 변경 시 정규화", () => {
    let graph = createEmptyGraph("테스트");
    graph = addNode(graph, makeNode("n1", "일러스트", "brand"));
    const result = updateNode(graph, "n1", { type: "AIIllustration" });
    expect(result.nodes[0].type).toBe("ai-illustration");
  });

  it("addRule은 condition.nodeType을 정규화", () => {
    const graph = createEmptyGraph("테스트");
    const rule: Rule = {
      id: "r1",
      name: "테스트 규칙",
      expression: "∀x (Brand(x) → ∃y has(x,y))",
      type: "constraint",
      condition: { nodeType: "CoreValue", predicate: "설명", operator: "must_have" },
    };
    const result = addRule(graph, rule);
    expect(result.rules[0].condition.nodeType).toBe("core-value");
  });
});

// --- 스키마 기반 검증 테스트 ---

const testSchema: TypeRegistry = {
  nodeTypes: [
    { type: "brand", displayName: "브랜드", description: "", properties: [] },
    { type: "color", displayName: "색상", description: "", properties: [] },
  ],
  linkTypes: [
    {
      predicate: "has-color",
      displayName: "색상을 가진다",
      sourceTypes: ["brand"],
      targetTypes: ["color"],
      cardinality: "1:N",
    },
    {
      predicate: "primary-font",
      displayName: "주 서체",
      sourceTypes: ["brand"],
      targetTypes: ["typography"],
      cardinality: "1:1",
    },
  ],
};

function makeGraphWithSchema() {
  let graph = createEmptyGraph("스키마 테스트");
  graph = { ...graph, schema: testSchema };
  graph = addNode(graph, makeNode("n1", "Worxphere", "brand"));
  graph = addNode(graph, makeNode("n2", "#2E5BFF", "color"));
  return graph;
}

describe("addTriple (스키마 검증)", () => {
  it("스키마에 정의된 predicate는 허용", () => {
    const graph = makeGraphWithSchema();
    const result = addTriple(graph, makeTriple("t1", "n1", "has-color", "n2"));
    expect(result.triples).toHaveLength(1);
  });

  it("스키마에 없는 predicate는 거부", () => {
    const graph = makeGraphWithSchema();
    expect(() =>
      addTriple(graph, makeTriple("t1", "n1", "unknown-rel", "n2"))
    ).toThrow("unknown-rel");
  });

  it("sourceType이 맞지 않으면 거부", () => {
    const graph = makeGraphWithSchema();
    // color → color는 has-color의 sourceTypes에 없음
    expect(() =>
      addTriple(graph, makeTriple("t1", "n2", "has-color", "n2"))
    ).toThrow("sourceTypes");
  });

  it("targetType이 맞지 않으면 거부", () => {
    const graph = makeGraphWithSchema();
    // brand → brand는 has-color의 targetTypes에 없음
    expect(() =>
      addTriple(graph, makeTriple("t1", "n1", "has-color", "n1"))
    ).toThrow("targetTypes");
  });

  it("1:1 카디널리티 — subject 중복 거부", () => {
    let graph = makeGraphWithSchema();
    graph = addNode(graph, makeNode("n3", "Pretendard", "typography"));
    graph = addNode(graph, makeNode("n4", "Inter", "typography"));
    graph = addTriple(graph, makeTriple("t1", "n1", "primary-font", "n3"));
    // 같은 subject가 두 번째 primary-font → 1:1 위반
    expect(() =>
      addTriple(graph, makeTriple("t2", "n1", "primary-font", "n4"))
    ).toThrow("cardinality");
  });

  it("1:1 카디널리티 — object 중복 거부", () => {
    let graph = makeGraphWithSchema();
    graph = addNode(graph, makeNode("n3", "Pretendard", "typography"));
    graph = addNode(graph, makeNode("n5", "BrandB", "brand"));
    graph = addTriple(graph, makeTriple("t1", "n1", "primary-font", "n3"));
    // 다른 subject가 같은 object로 primary-font → 1:1 object 쪽 위반
    expect(() =>
      addTriple(graph, makeTriple("t2", "n5", "primary-font", "n3"))
    ).toThrow("cardinality");
  });

  it("N:1 카디널리티 — subject 중복 거부", () => {
    let graph = createEmptyGraph("테스트");
    graph = {
      ...graph,
      schema: {
        nodeTypes: testSchema.nodeTypes,
        linkTypes: [
          {
            predicate: "belongs-to",
            displayName: "소속",
            sourceTypes: ["color"],
            targetTypes: ["brand"],
            cardinality: "N:1",
          },
        ],
      },
    };
    graph = addNode(graph, makeNode("n1", "#2E5BFF", "color"));
    graph = addNode(graph, makeNode("n2", "BrandA", "brand"));
    graph = addNode(graph, makeNode("n3", "BrandB", "brand"));
    graph = addTriple(graph, makeTriple("t1", "n1", "belongs-to", "n2"));
    // 같은 subject가 두 번째 belongs-to → N:1 위반 (subject당 하나)
    expect(() =>
      addTriple(graph, makeTriple("t2", "n1", "belongs-to", "n3"))
    ).toThrow("cardinality");
  });

  it("N:1 카디널리티 — 다른 subject는 같은 object 허용", () => {
    let graph = createEmptyGraph("테스트");
    graph = {
      ...graph,
      schema: {
        nodeTypes: testSchema.nodeTypes,
        linkTypes: [
          {
            predicate: "belongs-to",
            displayName: "소속",
            sourceTypes: ["color"],
            targetTypes: ["brand"],
            cardinality: "N:1",
          },
        ],
      },
    };
    graph = addNode(graph, makeNode("n1", "#2E5BFF", "color"));
    graph = addNode(graph, makeNode("n2", "#FF0000", "color"));
    graph = addNode(graph, makeNode("n3", "BrandA", "brand"));
    graph = addTriple(graph, makeTriple("t1", "n1", "belongs-to", "n3"));
    // 다른 subject가 같은 object → N:1 허용 (N개 subject가 1개 object 가리킴)
    const result = addTriple(graph, makeTriple("t2", "n2", "belongs-to", "n3"));
    expect(result.triples).toHaveLength(2);
  });

  it("1:N 카디널리티 — object 중복 거부", () => {
    // 1:N = subject는 여러 object 가능, 각 object는 하나의 subject에만
    let graph = makeGraphWithSchema();
    graph = addNode(graph, makeNode("n5", "BrandB", "brand"));
    graph = addTriple(graph, makeTriple("t1", "n1", "has-color", "n2"));
    // 다른 subject가 같은 object → 1:N object 쪽 위반
    expect(() =>
      addTriple(graph, makeTriple("t2", "n5", "has-color", "n2"))
    ).toThrow("cardinality");
  });

  it("1:N 카디널리티 — 같은 subject 다른 object 허용", () => {
    let graph = makeGraphWithSchema();
    graph = addNode(graph, makeNode("n3", "#FF0000", "color"));
    graph = addTriple(graph, makeTriple("t1", "n1", "has-color", "n2"));
    // 같은 subject가 다른 object → 1:N 허용
    const result = addTriple(graph, makeTriple("t2", "n1", "has-color", "n3"));
    expect(result.triples).toHaveLength(2);
  });

  it("빈 sourceTypes는 모든 타입 허용", () => {
    let graph = createEmptyGraph("테스트");
    graph = {
      ...graph,
      schema: {
        nodeTypes: testSchema.nodeTypes,
        linkTypes: [
          {
            predicate: "related-to",
            displayName: "관련",
            sourceTypes: [],
            targetTypes: [],
            cardinality: "N:N",
          },
        ],
      },
    };
    graph = addNode(graph, makeNode("n1", "A", "brand"));
    graph = addNode(graph, makeNode("n2", "B", "color"));
    const result = addTriple(graph, makeTriple("t1", "n1", "related-to", "n2"));
    expect(result.triples).toHaveLength(1);
  });

  it("스키마 없으면 기존 동작 (자유 모드)", () => {
    let graph = createEmptyGraph("테스트");
    graph = addNode(graph, makeNode("n1", "A", "brand"));
    graph = addNode(graph, makeNode("n2", "B", "color"));
    // 스키마 없으면 아무 predicate나 허용
    const result = addTriple(graph, makeTriple("t1", "n1", "anything", "n2"));
    expect(result.triples).toHaveLength(1);
  });
});

describe("addNode (props 전달)", () => {
  it("props가 보존된다", () => {
    const graph = createEmptyGraph("테스트");
    const node: Node = {
      id: "n1",
      label: "#2E5BFF",
      type: "color",
      props: { hexCode: "#2E5BFF", category: "primary" },
    };
    const result = addNode(graph, node);
    expect(result.nodes[0].props).toEqual({ hexCode: "#2E5BFF", category: "primary" });
  });
});

describe("updateNode (props 머지)", () => {
  it("props는 전체 교체된다", () => {
    let graph = createEmptyGraph("테스트");
    graph = addNode(graph, {
      id: "n1",
      label: "#2E5BFF",
      type: "color",
      props: { hexCode: "#2E5BFF", category: "primary" },
    });
    const result = updateNode(graph, "n1", {
      props: { hexCode: "#FF0000", usage: "danger" },
    });
    // props 전체 교체: 기존 category는 유실됨
    expect(result.nodes[0].props).toEqual({ hexCode: "#FF0000", usage: "danger" });
  });
});

describe("removeTriple", () => {
  it("should remove only the specified triple", () => {
    let graph = createEmptyGraph("테스트");
    graph = addNode(graph, makeNode("n1", "A"));
    graph = addNode(graph, makeNode("n2", "B"));
    graph = addTriple(graph, makeTriple("t1", "n1", "관계1", "n2"));
    graph = addTriple(graph, makeTriple("t2", "n1", "관계2", "n2"));

    const result = removeTriple(graph, "t1");
    expect(result.triples).toHaveLength(1);
    expect(result.triples[0].id).toBe("t2");
  });
});
