import { describe, it, expect } from "vitest";
import { runPipeline } from "@knowledgeview/graph-rag";
import type { KnowledgeGraph } from "@knowledgeview/kg-core";

const TEST_GRAPH: KnowledgeGraph = {
  metadata: { name: "테스트", created: "2026-01-01", updated: "2026-01-01" },
  nodes: [
    { id: "brand-a", label: "브랜드A", type: "brand" },
    { id: "color-ff5733", label: "#FF5733", type: "color" },
  ],
  triples: [
    { id: "t1", subject: "brand-a", predicate: "프라이머리컬러", object: "color-ff5733" },
  ],
  rules: [],
};

describe("context endpoint logic", () => {
  it("should produce valid response shape", () => {
    const result = runPipeline(TEST_GRAPH, "브랜드A의 프라이머리컬러는?");

    const response = {
      context: result.context,
      subgraph: {
        nodes: result.subgraph.nodes,
        triples: result.subgraph.triples,
      },
      extraction: result.extraction,
      metadata: {
        depth: result.subgraph.metadata.depth,
        nodeCount: result.subgraph.nodes.length,
        tripleCount: result.subgraph.triples.length,
      },
    };

    expect(response.context).toContain("브랜드A");
    expect(response.subgraph.nodes.length).toBeGreaterThan(0);
    expect(response.metadata.nodeCount).toBeGreaterThan(0);
    expect(response.extraction.mode).toBe("keyword");
  });
});
