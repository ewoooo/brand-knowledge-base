import type { KnowledgeGraph, Node, Triple, Rule, PropertyDef } from "./types";
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
        // subject 쪽 제약: 1:1, N:1 — 각 subject당 predicate 하나
        if (
            linkType.cardinality === "1:1" ||
            linkType.cardinality === "N:1"
        ) {
            const existingFromSubject = graph.triples.find(
                (t) =>
                    t.subject === triple.subject &&
                    t.predicate === triple.predicate,
            );
            if (existingFromSubject) {
                throw new Error(
                    `cardinality ${linkType.cardinality} violation: "${triple.subject}" already has predicate "${triple.predicate}"`,
                );
            }
        }
        // object 쪽 제약: 1:1, 1:N — 각 object당 predicate 하나
        if (
            linkType.cardinality === "1:1" ||
            linkType.cardinality === "1:N"
        ) {
            const existingToObject = graph.triples.find(
                (t) =>
                    t.object === triple.object &&
                    t.predicate === triple.predicate,
            );
            if (existingToObject) {
                throw new Error(
                    `cardinality ${linkType.cardinality} violation: "${triple.object}" is already target of predicate "${triple.predicate}"`,
                );
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

export function updateRule(
    graph: KnowledgeGraph,
    ruleId: string,
    updates: Partial<Omit<Rule, "id">>,
): KnowledgeGraph {
    const normalizedUpdates = updates.condition
        ? {
              ...updates,
              condition: {
                  ...updates.condition,
                  nodeType: normalizeType(updates.condition.nodeType) ?? updates.condition.nodeType,
              },
          }
        : updates;
    return {
        ...graph,
        rules: graph.rules.map((r) =>
            r.id === ruleId ? { ...r, ...normalizedUpdates } : r,
        ),
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

// --- Schema CRUD ---

export function addPropertyDef(
    graph: KnowledgeGraph,
    nodeType: string,
    propertyDef: PropertyDef,
): KnowledgeGraph {
    if (!graph.schema) throw new Error("Schema is not defined");
    const nt = graph.schema.nodeTypes.find((t) => t.type === nodeType);
    if (!nt) throw new Error(`NodeType '${nodeType}' not found`);
    if (nt.properties.some((p) => p.key === propertyDef.key)) {
        throw new Error(`Property '${propertyDef.key}' already exists on '${nodeType}'`);
    }
    return {
        ...graph,
        schema: {
            ...graph.schema,
            nodeTypes: graph.schema.nodeTypes.map((t) =>
                t.type === nodeType
                    ? { ...t, properties: [...t.properties, propertyDef] }
                    : t,
            ),
        },
        metadata: { ...graph.metadata, updated: new Date().toISOString().split("T")[0] },
    };
}

export function removePropertyDef(
    graph: KnowledgeGraph,
    nodeType: string,
    propertyKey: string,
): KnowledgeGraph {
    if (!graph.schema) throw new Error("Schema is not defined");
    return {
        ...graph,
        schema: {
            ...graph.schema,
            nodeTypes: graph.schema.nodeTypes.map((t) =>
                t.type === nodeType
                    ? { ...t, properties: t.properties.filter((p) => p.key !== propertyKey) }
                    : t,
            ),
        },
        metadata: { ...graph.metadata, updated: new Date().toISOString().split("T")[0] },
    };
}

export function updatePropertyDef(
    graph: KnowledgeGraph,
    nodeType: string,
    propertyKey: string,
    updates: Partial<Omit<PropertyDef, "key">>,
): KnowledgeGraph {
    if (!graph.schema) throw new Error("Schema is not defined");
    return {
        ...graph,
        schema: {
            ...graph.schema,
            nodeTypes: graph.schema.nodeTypes.map((t) =>
                t.type === nodeType
                    ? {
                          ...t,
                          properties: t.properties.map((p) =>
                              p.key === propertyKey ? { ...p, ...updates } : p,
                          ),
                      }
                    : t,
            ),
        },
        metadata: { ...graph.metadata, updated: new Date().toISOString().split("T")[0] },
    };
}
