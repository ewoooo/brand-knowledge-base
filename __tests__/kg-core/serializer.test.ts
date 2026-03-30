import { describe, it, expect } from "vitest";
import { toJSON, fromJSON, generateId } from "@/lib/kg-core/serializer";
import type { KnowledgeGraph } from "@/lib/kg-core/types";

describe("serializer", () => {
  const sampleGraph: KnowledgeGraph = {
    metadata: { name: "브랜드A", created: "2026-03-30", updated: "2026-03-30" },
    nodes: [
      { id: "brand-a", label: "브랜드A", type: "brand" },
      { id: "color-ff5733", label: "#FF5733", type: "color" },
    ],
    triples: [
      { id: "t1", subject: "brand-a", predicate: "프라이머리컬러", object: "color-ff5733" },
    ],
    rules: [],
  };

  it("toJSON serializes a KnowledgeGraph to a JSON string", () => {
    const json = toJSON(sampleGraph);
    const parsed = JSON.parse(json);
    expect(parsed.metadata.name).toBe("브랜드A");
    expect(parsed.nodes).toHaveLength(2);
    expect(parsed.triples).toHaveLength(1);
    expect(parsed.rules).toHaveLength(0);
  });

  it("fromJSON deserializes a JSON string to a KnowledgeGraph", () => {
    const json = toJSON(sampleGraph);
    const graph = fromJSON(json);
    expect(graph.metadata.name).toBe("브랜드A");
    expect(graph.nodes[0].id).toBe("brand-a");
    expect(graph.triples[0].predicate).toBe("프라이머리컬러");
  });

  it("fromJSON throws on invalid JSON", () => {
    expect(() => fromJSON("not json")).toThrow();
  });

  it("generateId returns a unique string", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe("string");
    expect(id1.length).toBeGreaterThan(0);
  });
});
