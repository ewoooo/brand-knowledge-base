import { describe, it, expect } from "vitest";
import { buildContext } from "../context-builder";
import type { SubGraph } from "../types";
import type { TypeRegistry } from "@knowledgeview/kg-core";

const subgraph: SubGraph = {
  nodes: [
    { id: "brand-a", label: "브랜드A", type: "brand" },
    { id: "color-ff5733", label: "#FF5733", type: "color" },
    { id: "font-pretendard", label: "Pretendard", type: "typography" },
  ],
  triples: [
    { id: "t1", subject: "brand-a", predicate: "프라이머리컬러", object: "color-ff5733" },
    { id: "t2", subject: "brand-a", predicate: "주서체", object: "font-pretendard" },
  ],
  metadata: { startNodes: ["brand-a"], depth: 1, totalHops: 1 },
};

describe("buildContext", () => {
  it("should produce a markdown context string", () => {
    const result = buildContext(subgraph);
    expect(result).toContain("## 지식 그래프 컨텍스트");
    expect(result).toContain("브랜드A");
  });

  it("should list entities with their types", () => {
    const result = buildContext(subgraph);
    expect(result).toContain("브랜드A (brand)");
    expect(result).toContain("#FF5733 (color)");
    expect(result).toContain("Pretendard (typography)");
  });

  it("should convert triples to natural language sentences", () => {
    const result = buildContext(subgraph);
    expect(result).toContain("브랜드A");
    expect(result).toContain("프라이머리컬러");
    expect(result).toContain("#FF5733");
  });

  it("should handle empty subgraph", () => {
    const empty: SubGraph = {
      nodes: [],
      triples: [],
      metadata: { startNodes: [], depth: 0, totalHops: 0 },
    };
    const result = buildContext(empty);
    expect(result).toContain("관련 정보를 찾을 수 없습니다");
  });

  it("should include validation results when graph is provided", () => {
    const result = buildContext(subgraph, {
      rules: [
        {
          id: "r1",
          name: "브랜드는 프라이머리컬러 필요",
          expression: "∀x",
          type: "constraint",
          condition: {
            nodeType: "brand",
            predicate: "프라이머리컬러",
            operator: "must_have" as const,
          },
        },
      ],
    });
    expect(result).toContain("규칙 검증");
  });
});

describe("buildContext (스키마 주입)", () => {
  const schema: TypeRegistry = {
    nodeTypes: [
      { type: "brand", displayName: "브랜드", description: "기업/제품 브랜드 엔티티", properties: [] },
      {
        type: "color",
        displayName: "색상",
        description: "브랜드 색상 팔레트의 개별 색상",
        properties: [
          { key: "hexCode", displayName: "HEX 코드", valueType: "string", required: true },
        ],
      },
      { type: "typography", displayName: "서체", description: "브랜드 서체", properties: [] },
    ],
    linkTypes: [
      { predicate: "프라이머리컬러", displayName: "주 색상", sourceTypes: ["brand"], targetTypes: ["color"], cardinality: "1:N" },
    ],
  };

  it("스키마가 있으면 엔티티에 타입 설명을 포함한다", () => {
    const result = buildContext(subgraph, { schema });
    expect(result).toContain("기업/제품 브랜드 엔티티");
    expect(result).toContain("브랜드 색상 팔레트의 개별 색상");
  });

  it("노드에 props가 있으면 속성 값을 표시한다", () => {
    const subgraphWithProps: SubGraph = {
      nodes: [
        { id: "n1", label: "Primary Blue", type: "color", props: { hexCode: "#2E5BFF", category: "primary" } },
      ],
      triples: [],
      metadata: { startNodes: ["n1"], depth: 0, totalHops: 0 },
    };
    const result = buildContext(subgraphWithProps, { schema });
    expect(result).toContain("hexCode");
    expect(result).toContain("#2E5BFF");
  });

  it("스키마가 없으면 기존 동작과 동일하다", () => {
    const result = buildContext(subgraph);
    expect(result).not.toContain("기업/제품 브랜드 엔티티");
    expect(result).toContain("브랜드A (brand)");
  });
});
