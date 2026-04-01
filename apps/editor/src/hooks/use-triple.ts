import { useCallback, useMemo } from "react";
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
    const triples = graph?.triples ?? [];

    const getTriple = useCallback(
        (id: string | null) =>
            id ? (triples.find((t) => t.id === id) ?? null) : null,
        [triples],
    );

    /** 고유 predicate 목록 (RuleForm용) */
    const predicates = useMemo(
        () => Array.from(new Set(triples.map((t) => t.predicate).filter(Boolean))),
        [triples],
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

    return { triples, getTriple, predicates, handleSubmit, remove: removeTriple };
}
