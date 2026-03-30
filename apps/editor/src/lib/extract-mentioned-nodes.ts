import type { Node } from "@knowledgeview/kg-core";

/**
 * 텍스트에서 그래프 노드 라벨을 매칭하여 언급된 노드 ID를 등장 순서대로 반환
 */
export function extractMentionedNodeIds(text: string, nodes: Node[]): string[] {
    const candidates = nodes
        .filter((n) => n.label.length >= 2)
        .sort((a, b) => b.label.length - a.label.length);

    if (candidates.length === 0) return [];

    const escaped = candidates.map((n) => ({
        node: n,
        pattern: n.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    }));

    const regex = new RegExp(
        `(${escaped.map((e) => e.pattern).join("|")})`,
        "g",
    );
    const labelToNode = new Map(candidates.map((n) => [n.label, n]));

    const seen = new Set<string>();
    const result: string[] = [];

    let match;
    while ((match = regex.exec(text)) !== null) {
        const node = labelToNode.get(match[1]);
        if (node && !seen.has(node.id)) {
            seen.add(node.id);
            result.push(node.id);
        }
    }

    return result;
}
