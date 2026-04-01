import { useCallback } from "react";
import type { Triple, KnowledgeGraph } from "@knowledgeview/kg-core";

interface UseTripleOptions {
    graph: KnowledgeGraph | null;
    addTriple: (data: { subject: string; predicate: string; object: string }) => void;
    updateTriple: (id: string, updates: Partial<Omit<Triple, "id">>) => void;
    removeTriple: (id: string) => void;
}

export function useTriple({
    graph,
    addTriple,
    updateTriple,
    removeTriple,
}: UseTripleOptions) {
    const getTriple = useCallback(
        (id: string | null) =>
            id ? (graph?.triples.find((t) => t.id === id) ?? null) : null,
        [graph],
    );

    const handleSubmit = useCallback(
        (editingId: string | null, data: { subject: string; predicate: string; object: string }) => {
            if (editingId) {
                updateTriple(editingId, data);
            } else {
                addTriple(data);
            }
        },
        [updateTriple, addTriple],
    );

    return { getTriple, handleSubmit, remove: removeTriple };
}
