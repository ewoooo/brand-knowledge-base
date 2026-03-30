import { describe, it, expect } from "vitest";
import { extractEntities } from "../extractor";
import { BRAND_GRAPH } from "./fixtures";

describe("extractEntities (keyword mode)", () => {
  it("should match exact node label", () => {
    const result = extractEntities(BRAND_GRAPH, "브랜드A의 프라이머리 컬러는?");
    expect(result.mode).toBe("keyword");
    expect(result.entities).toContainEqual(
      expect.objectContaining({ nodeId: "brand-a", matchType: "exact" })
    );
  });

  it("should match predicate keywords", () => {
    const result = extractEntities(BRAND_GRAPH, "브랜드A의 프라이머리컬러는?");
    expect(result.predicateHints).toContain("프라이머리컬러");
  });

  it("should match partial node label", () => {
    const result = extractEntities(BRAND_GRAPH, "Pretendard 서체 정보");
    expect(result.entities).toContainEqual(
      expect.objectContaining({ nodeId: "font-pretendard", matchType: "exact" })
    );
  });

  it("should return empty entities for unrelated question", () => {
    const result = extractEntities(BRAND_GRAPH, "날씨가 어때요?");
    expect(result.entities).toHaveLength(0);
    expect(result.mode).toBe("keyword");
  });

  it("should match multiple entities", () => {
    const result = extractEntities(BRAND_GRAPH, "브랜드A와 브랜드B의 차이점");
    expect(result.entities.length).toBeGreaterThanOrEqual(2);
  });

  it("should detect type hints from question", () => {
    const result = extractEntities(BRAND_GRAPH, "어떤 컬러를 쓰나요?");
    expect(result.typeHints).toContain("color");
  });
});
