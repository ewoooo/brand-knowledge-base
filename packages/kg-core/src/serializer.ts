import type { KnowledgeGraph } from "./types";

export function toJSON(graph: KnowledgeGraph): string {
    return JSON.stringify(graph, null, 2);
}

export function fromJSON(json: string): KnowledgeGraph {
    const parsed = JSON.parse(json);

    if (!parsed.metadata || !parsed.nodes || !parsed.triples) {
        throw new Error("Invalid KnowledgeGraph format");
    }

    return {
        metadata: {
            ...parsed.metadata,
            ...(parsed.metadata.systemPrompt !== undefined && {
                systemPrompt: parsed.metadata.systemPrompt,
            }),
        },
        nodes: parsed.nodes,
        triples: parsed.triples,
        rules: parsed.rules ?? [],
    };
}

export function generateId(): string {
    return crypto.randomUUID();
}

export function serializeGraphForPrompt(graph: KnowledgeGraph): string {
    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

    const nodeLines = graph.nodes.map(
        (n) => `- ${n.label}${n.type ? ` (${n.type})` : ""}`,
    );

    const tripleLines = graph.triples.map((t) => {
        const subj = nodeMap.get(t.subject)?.label ?? t.subject;
        const obj = nodeMap.get(t.object)?.label ?? t.object;
        return `- ${subj} --[${t.predicate}]--> ${obj}`;
    });

    const ruleLines = graph.rules.map(
        (r) => `- ${r.name} (${r.type}): ${r.expression}`,
    );

    return [
        `## 현재 그래프: ${graph.metadata.name}`,
        "",
        `### 노드 (${graph.nodes.length}개)`,
        ...(nodeLines.length > 0 ? nodeLines : ["(없음)"]),
        "",
        `### 관계 (${graph.triples.length}개)`,
        ...(tripleLines.length > 0 ? tripleLines : ["(없음)"]),
        "",
        `### 규칙 (${graph.rules.length}개)`,
        ...(ruleLines.length > 0 ? ruleLines : ["(없음)"]),
    ].join("\n");
}
