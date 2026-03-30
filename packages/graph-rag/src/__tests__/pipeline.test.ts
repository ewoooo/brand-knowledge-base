import { describe, it, expect } from "vitest";
import { runPipeline } from "../index";
import { BRAND_GRAPH } from "./fixtures";

describe("runPipeline", () => {
  it("should extract context for a direct question", () => {
    const result = runPipeline(BRAND_GRAPH, "브랜드A의 프라이머리컬러는?");
    expect(result.extraction.entities.length).toBeGreaterThan(0);
    expect(result.subgraph.nodes.length).toBeGreaterThan(0);
    expect(result.context).toContain("브랜드A");
    expect(result.context).toContain("#FF5733");
  });

  it("should include rule validation in context", () => {
    const result = runPipeline(BRAND_GRAPH, "브랜드A의 정보를 알려줘");
    expect(result.context).toContain("규칙 검증");
  });

  it("should respect depth option", () => {
    const shallow = runPipeline(BRAND_GRAPH, "브랜드A", { depth: 1 });
    const deep = runPipeline(BRAND_GRAPH, "브랜드A", { depth: 3 });
    expect(deep.subgraph.nodes.length).toBeGreaterThanOrEqual(
      shallow.subgraph.nodes.length
    );
  });

  it("should return empty context for unrelated question", () => {
    const result = runPipeline(BRAND_GRAPH, "날씨가 어때요?");
    expect(result.extraction.entities).toHaveLength(0);
    expect(result.context).toContain("관련 정보를 찾을 수 없습니다");
  });
});
