"use client";

import { useState } from "react";
import type { KnowledgeGraph, Node, Triple, Rule, PropertyDef } from "@knowledgeview/kg-core";
import {
    addNode,
    removeNode,
    updateNode,
    addTriple,
    removeTriple,
    updateTriple,
    addRule,
    updateRule,
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

    const load = async (file: string) => {
        const res = await fetch(`/api/graphs/${file}`);
        if (!res.ok) throw new Error("Failed to load graph");
        const data: KnowledgeGraph = await res.json();
        setGraph(data);
        setFilename(file);
        setIsDirty(false);
    };

    const save = async () => {
        if (!graph || !filename) return;
        await fetch(`/api/graphs/${filename}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(graph),
        });
        setIsDirty(false);
    };

    const modify = (fn: (g: KnowledgeGraph) => KnowledgeGraph) => {
        setGraph((prev) => {
            if (!prev) return prev;
            setIsDirty(true);
            return fn(prev);
        });
    };

    // 파생 데이터
    const stats = {
        nodeCount: graph?.nodes.length ?? 0,
        tripleCount: graph?.triples.length ?? 0,
        ruleCount: graph?.rules.length ?? 0,
    };
    const systemPrompt = graph?.metadata.systemPrompt ?? "";
    const linkTypes = graph?.schema?.linkTypes;

    return {
        graph,
        filename,
        isDirty,
        stats,
        systemPrompt,
        linkTypes,
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
        updateRule: (id: string, updates: Partial<Omit<Rule, "id">>) =>
            modify((g) => updateRule(g, id, updates)),
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
