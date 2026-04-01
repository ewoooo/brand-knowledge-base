import type { KnowledgeGraph } from "./types";
import { normalizeType } from "./normalize-type";

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
            name: parsed.metadata.name,
            created: parsed.metadata.created,
            updated: parsed.metadata.updated,
            ...(parsed.metadata.schemaVersion !== undefined && {
                schemaVersion: parsed.metadata.schemaVersion,
            }),
            ...(parsed.metadata.systemPrompt !== undefined && {
                systemPrompt: parsed.metadata.systemPrompt,
            }),
        },
        ...(parsed.schema && { schema: parsed.schema }),
        nodes: parsed.nodes.map((n: { type: string }) => ({
            ...n,
            type: normalizeType(n.type),
        })),
        triples: parsed.triples,
        rules: (parsed.rules ?? []).map((r: { condition?: { nodeType?: string } }) => (
            r.condition?.nodeType
                ? { ...r, condition: { ...r.condition, nodeType: normalizeType(r.condition.nodeType) } }
                : r
        )),
    };
}

export function generateId(): string {
    return crypto.randomUUID();
}

export function serializeGraphForPrompt(graph: KnowledgeGraph): string {
    const sections: string[] = [
        `## 현재 그래프: ${graph.metadata.name}`,
    ];

    if (graph.schema) {
        const ntLines = graph.schema.nodeTypes.map((nt) => {
            const propsStr = nt.properties.length > 0
                ? ` [속성: ${nt.properties.map((p) => p.key).join(", ")}]`
                : "";
            return `- ${nt.type} (${nt.displayName}): ${nt.description}${propsStr}`;
        });
        const ltLines = graph.schema.linkTypes.map((lt) => {
            const src = lt.sourceTypes.length > 0 ? lt.sourceTypes.join(", ") : "*";
            const tgt = lt.targetTypes.length > 0 ? lt.targetTypes.join(", ") : "*";
            return `- ${lt.predicate} (${lt.displayName}): ${src} → ${tgt} (${lt.cardinality})`;
        });
        sections.push(
            "",
            `### 노드 타입 (${graph.schema.nodeTypes.length}개)`,
            ...(ntLines.length > 0 ? ntLines : ["(없음)"]),
            "",
            `### 관계 타입 (${graph.schema.linkTypes.length}개)`,
            ...(ltLines.length > 0 ? ltLines : ["(없음)"]),
        );
    }

    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

    const nodeLines = graph.nodes.map((n) => {
        const parts = [`- ${n.label} (${n.type})`];
        if (n.description) parts.push(`: ${n.description}`);
        if (n.props && Object.keys(n.props).length > 0) {
            const propsStr = Object.entries(n.props)
                .map(([k, v]) => `${k}=${v}`)
                .join(", ");
            parts.push(` [${propsStr}]`);
        }
        return parts.join("");
    });

    const tripleLines = graph.triples.map((t) => {
        const subj = nodeMap.get(t.subject)?.label ?? t.subject;
        const obj = nodeMap.get(t.object)?.label ?? t.object;
        return `- ${subj} --[${t.predicate}]--> ${obj}`;
    });

    const ruleLines = graph.rules.map(
        (r) => `- ${r.name} (${r.type}): ${r.expression}`,
    );

    sections.push(
        "",
        `### 노드 (${graph.nodes.length}개)`,
        ...(nodeLines.length > 0 ? nodeLines : ["(없음)"]),
        "",
        `### 관계 (${graph.triples.length}개)`,
        ...(tripleLines.length > 0 ? tripleLines : ["(없음)"]),
        "",
        `### 규칙 (${graph.rules.length}개)`,
        ...(ruleLines.length > 0 ? ruleLines : ["(없음)"]),
    );

    return sections.join("\n");
}
