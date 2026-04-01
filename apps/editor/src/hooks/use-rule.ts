import { useCallback, useMemo } from "react";
import type { Rule, KnowledgeGraph, ValidationResult } from "@knowledgeview/kg-core";

interface UseRuleOptions {
    graph: KnowledgeGraph | null;
    addRule: (data: Omit<Rule, "id">) => void;
    updateRule: (id: string, updates: Partial<Omit<Rule, "id">>) => void;
    removeRule: (id: string) => void;
    validationResults: ValidationResult[];
}

export function useRule({
    graph,
    addRule,
    updateRule,
    removeRule,
    validationResults,
}: UseRuleOptions) {
    const getRule = useCallback(
        (id: string | null) =>
            id ? (graph?.rules.find((r) => r.id === id) ?? null) : null,
        [graph],
    );

    const results = useMemo(
        () => validationResults.filter((r) => !r.ruleId.startsWith("schema:")),
        [validationResults],
    );

    const handleSubmit = useCallback(
        (editingId: string | null, data: Omit<Rule, "id">) => {
            if (editingId) {
                updateRule(editingId, data);
            } else {
                addRule(data);
            }
        },
        [updateRule, addRule],
    );

    return { getRule, results, handleSubmit, remove: removeRule };
}
