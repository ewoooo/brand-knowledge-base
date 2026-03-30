import { describe, it, expect } from "vitest";
import { traverse } from "../traverser";
import { BRAND_GRAPH } from "./fixtures";

describe("traverse", () => {
  it("should return direct connections at depth 1", () => {
    const result = traverse(BRAND_GRAPH, ["brand-a"], { depth: 1 });
    expect(result.nodes.map((n) => n.id)).toContain("brand-a");
    expect(result.nodes.map((n) => n.id)).toContain("color-ff5733");
    expect(result.nodes.map((n) => n.id)).toContain("font-pretendard");
    expect(result.nodes.map((n) => n.id)).toContain("tone-warm");
    expect(result.triples).toHaveLength(4); // t1, t2, t3, t4
    expect(result.metadata.depth).toBe(1);
  });

  it("should expand to 2 hops", () => {
    const result = traverse(BRAND_GRAPH, ["brand-a"], { depth: 2 });
    expect(result.nodes.map((n) => n.id)).toContain("brand-b");
    expect(result.metadata.depth).toBe(2);
  });

  it("should traverse bidirectionally", () => {
    const result = traverse(BRAND_GRAPH, ["color-333333"], { depth: 1 });
    expect(result.nodes.map((n) => n.id)).toContain("brand-a");
    expect(result.nodes.map((n) => n.id)).toContain("brand-b");
  });

  it("should respect maxNodes limit", () => {
    const result = traverse(BRAND_GRAPH, ["brand-a"], { depth: 3, maxNodes: 3 });
    expect(result.nodes.length).toBeLessThanOrEqual(3);
  });

  it("should prioritize predicate hint triples", () => {
    const result = traverse(BRAND_GRAPH, ["brand-a"], {
      depth: 1,
      predicateHints: ["프라이머리컬러"],
    });
    expect(result.triples.some((t) => t.predicate === "프라이머리컬러")).toBe(true);
  });

  it("should include start nodes even if no connections", () => {
    const result = traverse(BRAND_GRAPH, ["tone-warm"], { depth: 0 });
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].id).toBe("tone-warm");
  });

  it("should handle non-existent start node gracefully", () => {
    const result = traverse(BRAND_GRAPH, ["nonexistent"], { depth: 1 });
    expect(result.nodes).toHaveLength(0);
    expect(result.triples).toHaveLength(0);
  });
});
