import type { KnowledgeGraph, Node, Triple, Rule } from "./types";
import { normalizeType } from "./normalize-type";

export function createEmptyGraph(name: string): KnowledgeGraph {
    const now = new Date().toISOString().split("T")[0];
    return {
        metadata: { name, created: now, updated: now },
        nodes: [],
        triples: [],
        rules: [],
    };
}

export function addNode(graph: KnowledgeGraph, node: Node): KnowledgeGraph {
    if (graph.nodes.some((n) => n.id === node.id)) {
        throw new Error(`Node with id ${node.id} already exists`);
    }
    const normalized = node.type ? { ...node, type: normalizeType(node.type) } : node;
    return {
        ...graph,
        nodes: [...graph.nodes, normalized],
        metadata: {
            ...graph.metadata,
            updated: new Date().toISOString().split("T")[0],
        },
    };
}

export function removeNode(
    graph: KnowledgeGraph,
    nodeId: string,
): KnowledgeGraph {
    return {
        ...graph,
        nodes: graph.nodes.filter((n) => n.id !== nodeId),
        triples: graph.triples.filter(
            (t) => t.subject !== nodeId && t.object !== nodeId,
        ),
        metadata: {
            ...graph.metadata,
            updated: new Date().toISOString().split("T")[0],
        },
    };
}

export function updateNode(
    graph: KnowledgeGraph,
    nodeId: string,
    updates: Partial<Omit<Node, "id">>,
): KnowledgeGraph {
    const normalized = updates.type !== undefined
        ? { ...updates, type: normalizeType(updates.type) }
        : updates;
    return {
        ...graph,
        nodes: graph.nodes.map((n) =>
            n.id === nodeId ? { ...n, ...normalized } : n,
        ),
        metadata: {
            ...graph.metadata,
            updated: new Date().toISOString().split("T")[0],
        },
    };
}

export function addTriple(
    graph: KnowledgeGraph,
    triple: Triple,
): KnowledgeGraph {
    if (!graph.nodes.some((n) => n.id === triple.subject)) {
        throw new Error(`Subject node ${triple.subject} not found`);
    }
    if (!graph.nodes.some((n) => n.id === triple.object)) {
        throw new Error(`Object node ${triple.object} not found`);
    }
    return {
        ...graph,
        triples: [...graph.triples, triple],
        metadata: {
            ...graph.metadata,
            updated: new Date().toISOString().split("T")[0],
        },
    };
}

export function removeTriple(
    graph: KnowledgeGraph,
    tripleId: string,
): KnowledgeGraph {
    return {
        ...graph,
        triples: graph.triples.filter((t) => t.id !== tripleId),
        metadata: {
            ...graph.metadata,
            updated: new Date().toISOString().split("T")[0],
        },
    };
}

export function updateTriple(
    graph: KnowledgeGraph,
    tripleId: string,
    updates: Partial<Omit<Triple, "id">>,
): KnowledgeGraph {
    return {
        ...graph,
        triples: graph.triples.map((t) =>
            t.id === tripleId ? { ...t, ...updates } : t,
        ),
        metadata: {
            ...graph.metadata,
            updated: new Date().toISOString().split("T")[0],
        },
    };
}

export function addRule(graph: KnowledgeGraph, rule: Rule): KnowledgeGraph {
    const normalized = {
        ...rule,
        condition: {
            ...rule.condition,
            nodeType: normalizeType(rule.condition.nodeType) ?? rule.condition.nodeType,
        },
    };
    return {
        ...graph,
        rules: [...graph.rules, normalized],
        metadata: {
            ...graph.metadata,
            updated: new Date().toISOString().split("T")[0],
        },
    };
}

export function removeRule(
    graph: KnowledgeGraph,
    ruleId: string,
): KnowledgeGraph {
    return {
        ...graph,
        rules: graph.rules.filter((r) => r.id !== ruleId),
        metadata: {
            ...graph.metadata,
            updated: new Date().toISOString().split("T")[0],
        },
    };
}
