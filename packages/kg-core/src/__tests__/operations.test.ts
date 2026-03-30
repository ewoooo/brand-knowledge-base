import { describe, it, expect } from "vitest";
import {
  createEmptyGraph,
  addNode,
  removeNode,
  addTriple,
  removeTriple,
} from "../operations";
import type { Node, Triple } from "../types";

const makeNode = (id: string, label: string, type?: string): Node => ({
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
