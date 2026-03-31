"use client";

import { useState, useCallback } from "react";
import type { KnowledgeGraph, Node, Triple, Rule, PropertyDef } from "@knowledgeview/kg-core";
import {
    addNode,
    removeNode,
    updateNode,
    addTriple,
    removeTriple,
    updateTriple,
    addRule,
    removeRule,
    addPropertyDef,
    removePropertyDef,
    updatePropertyDef,
    generateId,
} from "@knowledgeview/kg-core";

export function useGraph(initial: KnowledgeGraph | null) {
    const [graph, setGraph] = useState<KnowledgeGraph | null>(initial);
    const [filename, setFilename] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    const load = useCallback(async (file: string) => {
        const res = await fetch(`/api/graphs/${file}`);
        if (!res.ok) throw new Error("Failed to load graph");
        const data: KnowledgeGraph = await res.json();
        setGraph(data);
        setFilename(file);
        setIsDirty(false);
    }, []);

    const save = useCallback(async () => {
        if (!graph || !filename) return;
        await fetch(`/api/graphs/${filename}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(graph),
        });
        setIsDirty(false);
    }, [graph, filename]);

    const modify = useCallback((fn: (g: KnowledgeGraph) => KnowledgeGraph) => {
        setGraph((prev) => {
            if (!prev) return prev;
            setIsDirty(true);
            return fn(prev);
        });
    }, []);

    return {
        graph,
        filename,
        isDirty,
        load,
        save,
        setGraph,
        setFilename,
        addNode: (node: Omit<Node, "id">) =>
            modify((g) => addNode(g, { ...node, id: generateId() })),
        removeNode: (id: string) => modify((g) => removeNode(g, id)),
        updateNode: (id: string, updates: Partial<Omit<Node, "id">>) =>
            modify((g) => updateNode(g, id, updates)),
        addTriple: (triple: Omit<Triple, "id">) =>
            modify((g) => addTriple(g, { ...triple, id: generateId() })),
        removeTriple: (id: string) => modify((g) => removeTriple(g, id)),
        updateTriple: (id: string, updates: Partial<Omit<Triple, "id">>) =>
            modify((g) => updateTriple(g, id, updates)),
        addRule: (rule: Omit<Rule, "id">) =>
            modify((g) => addRule(g, { ...rule, id: generateId() })),
        removeRule: (id: string) => modify((g) => removeRule(g, id)),
        updateSystemPrompt: (prompt: string) =>
            modify((g) => ({
                ...g,
                metadata: {
                    ...g.metadata,
                    updated: new Date().toISOString().split("T")[0],
                    systemPrompt: prompt || undefined,
                },
            })),
        addPropertyDef: (nodeType: string, prop: PropertyDef) =>
            modify((g) => addPropertyDef(g, nodeType, prop)),
        removePropertyDef: (nodeType: string, propertyKey: string) =>
            modify((g) => removePropertyDef(g, nodeType, propertyKey)),
        updatePropertyDef: (nodeType: string, propertyKey: string, updates: Partial<Omit<PropertyDef, "key">>) =>
            modify((g) => updatePropertyDef(g, nodeType, propertyKey, updates)),
    };
}
