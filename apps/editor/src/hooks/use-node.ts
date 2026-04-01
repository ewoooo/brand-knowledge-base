import { useCallback } from "react";
import type { Node, KnowledgeGraph } from "@knowledgeview/kg-core";

interface UseNodeOptions {
    graph: KnowledgeGraph | null;
    addNode: (data: Omit<Node, "id">) => void;
    updateNode: (id: string, updates: Partial<Omit<Node, "id">>) => void;
    removeNode: (id: string) => void;
}

export function useNode({
    graph,
    addNode,
    updateNode,
    removeNode,
}: UseNodeOptions) {
    const getNode = useCallback(
        (id: string | null) =>
            id ? (graph?.nodes.find((n) => n.id === id) ?? null) : null,
        [graph],
    );

    const handleSubmit = useCallback(
        (editingId: string | null, data: Omit<Node, "id">) => {
            if (editingId) {
                updateNode(editingId, data);
            } else {
                addNode(data);
            }
        },
        [updateNode, addNode],
    );

    return { getNode, handleSubmit, remove: removeNode };
}
