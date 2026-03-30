import { describe, it, expect } from "vitest";
import { buildContext } from "../context-builder";
import type { SubGraph } from "../types";

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
