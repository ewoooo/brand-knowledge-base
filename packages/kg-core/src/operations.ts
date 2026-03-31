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
    const normalized = { ...node, type: normalizeType(node.type) };
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
    const subjectNode = graph.nodes.find((n) => n.id === triple.subject);
    if (!subjectNode) {
        throw new Error(`Subject node ${triple.subject} not found`);
    }
    const objectNode = graph.nodes.find((n) => n.id === triple.object);
    if (!objectNode) {
        throw new Error(`Object node ${triple.object} not found`);
    }

    if (graph.schema) {
        const linkType = graph.schema.linkTypes.find(
            (lt) => lt.predicate === triple.predicate,
        );
        if (!linkType) {
            throw new Error(
                `Predicate "${triple.predicate}" is not defined in schema linkTypes`,
            );
        }
        if (
            linkType.sourceTypes.length > 0 &&
            !linkType.sourceTypes.includes(subjectNode.type)
        ) {
            throw new Error(
                `Node type "${subjectNode.type}" is not in sourceTypes [${linkType.sourceTypes.join(", ")}] for predicate "${triple.predicate}"`,
            );
        }
        if (
            linkType.targetTypes.length > 0 &&
            !linkType.targetTypes.includes(objectNode.type)
        ) {
            throw new Error(
                `Node type "${objectNode.type}" is not in targetTypes [${linkType.targetTypes.join(", ")}] for predicate "${triple.predicate}"`,
            );
        }
        if (
            linkType.cardinality === "1:1" ||
            linkType.cardinality === "1:N"
        ) {
            // 1:1 — subject당 하나의 predicate만 허용
            if (linkType.cardinality === "1:1") {
                const existing = graph.triples.find(
                    (t) =>
                        t.subject === triple.subject &&
                        t.predicate === triple.predicate,
                );
                if (existing) {
                    throw new Error(
                        `cardinality 1:1 violation: "${triple.subject}" already has predicate "${triple.predicate}"`,
                    );
                }
            }
        }
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
