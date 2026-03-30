import { describe, it, expect, beforeEach } from "vitest";
import {
    createEmptyGraph,
    addNode,
    removeNode,
    updateNode,
    addTriple,
    removeTriple,
    updateTriple,
    addRule,
    removeRule,
} from "@/lib/kg-core/operations";
import type { KnowledgeGraph, Node, Triple, Rule } from "@/lib/kg-core/types";

describe("createEmptyGraph", () => {
    it("creates a graph with name and empty arrays", () => {
        const graph = createEmptyGraph("Test");
        expect(graph.metadata.name).toBe("Test");
        expect(graph.nodes).toEqual([]);
        expect(graph.triples).toEqual([]);
        expect(graph.rules).toEqual([]);
        expect(graph.metadata.created).toBeTruthy();
    });
});

describe("node operations", () => {
    let graph: KnowledgeGraph;

    beforeEach(() => {
        graph = createEmptyGraph("Test");
    });

    it("addNode adds a node to the graph", () => {
        const node: Node = { id: "n1", label: "Brand A", type: "brand" };
        const updated = addNode(graph, node);
        expect(updated.nodes).toHaveLength(1);
        expect(updated.nodes[0].id).toBe("n1");
    });

    it("addNode throws on duplicate id", () => {
        const node: Node = { id: "n1", label: "Brand A", type: "brand" };
        const updated = addNode(graph, node);
        expect(() => addNode(updated, node)).toThrow(
            "Node with id n1 already exists",
        );
    });

    it("removeNode removes the node and related triples", () => {
        let g = addNode(graph, { id: "n1", label: "A" });
        g = addNode(g, { id: "n2", label: "B" });
        g = addTriple(g, {
            id: "t1",
            subject: "n1",
            predicate: "rel",
            object: "n2",
        });
        const updated = removeNode(g, "n1");
        expect(updated.nodes).toHaveLength(1);
        expect(updated.triples).toHaveLength(0);
    });

    it("updateNode updates label and type", () => {
        let g = addNode(graph, { id: "n1", label: "Old", type: "brand" });
        const updated = updateNode(g, "n1", { label: "New", type: "color" });
        expect(updated.nodes[0].label).toBe("New");
        expect(updated.nodes[0].type).toBe("color");
    });
});

describe("triple operations", () => {
    let graph: KnowledgeGraph;

    beforeEach(() => {
        graph = createEmptyGraph("Test");
        graph = addNode(graph, { id: "n1", label: "A" });
        graph = addNode(graph, { id: "n2", label: "B" });
    });

    it("addTriple adds a triple", () => {
        const triple: Triple = {
            id: "t1",
            subject: "n1",
            predicate: "관계",
            object: "n2",
        };
        const updated = addTriple(graph, triple);
        expect(updated.triples).toHaveLength(1);
    });

    it("addTriple throws if subject node does not exist", () => {
        const triple: Triple = {
            id: "t1",
            subject: "missing",
            predicate: "관계",
            object: "n2",
        };
        expect(() => addTriple(graph, triple)).toThrow(
            "Subject node missing not found",
        );
    });

    it("addTriple throws if object node does not exist", () => {
        const triple: Triple = {
            id: "t1",
            subject: "n1",
            predicate: "관계",
            object: "missing",
        };
        expect(() => addTriple(graph, triple)).toThrow(
            "Object node missing not found",
        );
    });

    it("removeTriple removes a triple by id", () => {
        let g = addTriple(graph, {
            id: "t1",
            subject: "n1",
            predicate: "관계",
            object: "n2",
        });
        const updated = removeTriple(g, "t1");
        expect(updated.triples).toHaveLength(0);
    });

    it("updateTriple updates predicate", () => {
        let g = addTriple(graph, {
            id: "t1",
            subject: "n1",
            predicate: "old",
            object: "n2",
        });
        const updated = updateTriple(g, "t1", { predicate: "new" });
        expect(updated.triples[0].predicate).toBe("new");
    });
});

describe("rule operations", () => {
    let graph: KnowledgeGraph;

    beforeEach(() => {
        graph = createEmptyGraph("Test");
    });

    it("addRule adds a rule", () => {
        const rule: Rule = {
            id: "r1",
            name: "Test Rule",
            expression: "∀x (brand(x) → ∃y rel(x, y))",
            type: "constraint",
            condition: {
                nodeType: "brand",
                predicate: "rel",
                operator: "must_have",
            },
        };
        const updated = addRule(graph, rule);
        expect(updated.rules).toHaveLength(1);
    });

    it("removeRule removes a rule by id", () => {
        const rule: Rule = {
            id: "r1",
            name: "Test Rule",
            expression: "",
            type: "constraint",
            condition: {
                nodeType: "brand",
                predicate: "rel",
                operator: "must_have",
            },
        };
        let g = addRule(graph, rule);
        const updated = removeRule(g, "r1");
        expect(updated.rules).toHaveLength(0);
    });
});
