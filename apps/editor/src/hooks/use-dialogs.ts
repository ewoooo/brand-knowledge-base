import { useState, useCallback } from "react";
import type { Node, Triple, Rule, KnowledgeGraph } from "@knowledgeview/kg-core";

interface UseDialogsOptions {
    graph: KnowledgeGraph | null;
    addNode: (data: { label: string; type?: string }) => void;
    updateNode: (id: string, updates: Partial<Omit<Node, "id">>) => void;
    addTriple: (data: { subject: string; predicate: string; object: string }) => void;
    updateTriple: (id: string, updates: Partial<Omit<Triple, "id">>) => void;
    addRule: (data: Omit<Rule, "id">) => void;
}

export function useDialogs({
    graph,
    addNode,
    updateNode,
    addTriple,
    updateTriple,
    addRule,
}: UseDialogsOptions) {
    const [nodeFormOpen, setNodeFormOpen] = useState(false);
    const [tripleFormOpen, setTripleFormOpen] = useState(false);
    const [ruleFormOpen, setRuleFormOpen] = useState(false);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editingTripleId, setEditingTripleId] = useState<string | null>(null);

    // Derived
    const editingNode = editingNodeId
        ? (graph?.nodes.find((n) => n.id === editingNodeId) ?? null)
        : null;

    const editingTriple = editingTripleId
        ? (graph?.triples.find((t) => t.id === editingTripleId) ?? null)
        : null;

    // Open
    const openNodeCreate = useCallback(() => {
        setEditingNodeId(null);
        setNodeFormOpen(true);
    }, []);

    const openNodeEdit = useCallback((nodeId: string) => {
        setEditingNodeId(nodeId);
        setNodeFormOpen(true);
    }, []);

    const openTripleCreate = useCallback(() => {
        setEditingTripleId(null);
        setTripleFormOpen(true);
    }, []);

    const openTripleEdit = useCallback((tripleId: string) => {
        setEditingTripleId(tripleId);
        setTripleFormOpen(true);
    }, []);

    const openRuleCreate = useCallback(() => {
        setRuleFormOpen(true);
    }, []);

    // Close
    const closeNodeForm = useCallback(() => {
        setNodeFormOpen(false);
        setEditingNodeId(null);
    }, []);

    const closeTripleForm = useCallback(() => {
        setTripleFormOpen(false);
        setEditingTripleId(null);
    }, []);

    const closeRuleForm = useCallback(() => {
        setRuleFormOpen(false);
    }, []);

    // Submit
    const handleNodeSubmit = useCallback(
        (data: { label: string; type?: string }) => {
            if (editingNodeId) {
                updateNode(editingNodeId, data);
            } else {
                addNode(data);
            }
        },
        [editingNodeId, updateNode, addNode],
    );

    const handleTripleSubmit = useCallback(
        (data: { subject: string; predicate: string; object: string }) => {
            if (editingTripleId) {
                updateTriple(editingTripleId, data);
            } else {
                addTriple(data);
            }
        },
        [editingTripleId, updateTriple, addTriple],
    );

    const handleRuleSubmit = useCallback(
        (data: Omit<Rule, "id">) => {
            addRule(data);
        },
        [addRule],
    );

    return {
        // Node form
        nodeFormOpen,
        editingNode,
        openNodeCreate,
        openNodeEdit,
        closeNodeForm,
        handleNodeSubmit,

        // Triple form
        tripleFormOpen,
        editingTriple,
        openTripleCreate,
        openTripleEdit,
        closeTripleForm,
        handleTripleSubmit,

        // Rule form
        ruleFormOpen,
        openRuleCreate,
        closeRuleForm,
        handleRuleSubmit,
    };
}
