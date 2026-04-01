import type { Node, Triple, KnowledgeGraph } from "@knowledgeview/kg-core";
import { getNodeTypeDisplayName } from "@/lib/resolve-schema-display";

interface UseNodeOptions {
    graph: KnowledgeGraph | null;
    addNode: (data: Omit<Node, "id">) => void;
    updateNode: (id: string, updates: Partial<Omit<Node, "id">>) => void;
    removeNode: (id: string) => void;
}

export interface NodeTypeInfo {
    type: string;
    displayName: string;
    count: number;
}

export function useNode({
    graph,
    addNode,
    updateNode,
    removeNode,
}: UseNodeOptions) {
    const nodes = graph?.nodes ?? [];
    const schema = graph?.schema;

    const getNode = (id: string | null) =>
        id ? (nodes.find((n) => n.id === id) ?? null) : null;

    const getNodeLabel = (id: string) =>
        nodes.find((n) => n.id === id)?.label ?? id;

    const nodeTypes: NodeTypeInfo[] = (() => {
        const typeSet = new Set(nodes.map((n) => n.type).filter(Boolean));
        return Array.from(typeSet).map((type) => ({
            type,
            displayName: getNodeTypeDisplayName(schema, type),
            count: nodes.filter((n) => n.type === type).length,
        }));
    })();

    const existingTypes = [...new Set(nodes.map((n) => n.type))];

    const getRelations = (nodeId: string, triples: Triple[]) => ({
        outgoing: triples.filter((t) => t.subject === nodeId),
        incoming: triples.filter((t) => t.object === nodeId),
    });

    const handleSubmit = (editingId: string | null, data: Omit<Node, "id">) => {
        if (editingId) {
            updateNode(editingId, data);
        } else {
            addNode(data);
        }
    };

    return {
        nodes,
        schema,
        getNode,
        getNodeLabel,
        nodeTypes,
        existingTypes,
        getRelations,
        handleSubmit,
        remove: removeNode,
    };
}
