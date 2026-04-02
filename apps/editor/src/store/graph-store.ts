import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import type {
  KnowledgeGraph,
  Node,
  Triple,
  Rule,
  PropertyDef,
} from "@knowledgeview/kg-core";
import {
  addNode as kgAddNode,
  removeNode as kgRemoveNode,
  updateNode as kgUpdateNode,
  addTriple as kgAddTriple,
  removeTriple as kgRemoveTriple,
  updateTriple as kgUpdateTriple,
  addRule as kgAddRule,
  updateRule as kgUpdateRule,
  removeRule as kgRemoveRule,
  addPropertyDef as kgAddPropertyDef,
  removePropertyDef as kgRemovePropertyDef,
  updatePropertyDef as kgUpdatePropertyDef,
  generateId,
} from "@knowledgeview/kg-core";

export interface GraphState {
  graph: KnowledgeGraph | null;
  filename: string | null;
  isDirty: boolean;

  modify: (fn: (g: KnowledgeGraph) => KnowledgeGraph) => void;
  load: (file: string) => Promise<void>;
  save: () => Promise<void>;

  addNode: (node: Omit<Node, "id">) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<Omit<Node, "id">>) => void;

  addTriple: (triple: Omit<Triple, "id">) => void;
  removeTriple: (id: string) => void;
  updateTriple: (id: string, updates: Partial<Omit<Triple, "id">>) => void;

  addRule: (rule: Omit<Rule, "id">) => void;
  updateRule: (id: string, updates: Partial<Omit<Rule, "id">>) => void;
  removeRule: (id: string) => void;

  updateSystemPrompt: (prompt: string) => void;

  addPropertyDef: (nodeType: string, prop: PropertyDef) => void;
  removePropertyDef: (nodeType: string, propertyKey: string) => void;
  updatePropertyDef: (
    nodeType: string,
    propertyKey: string,
    updates: Partial<Omit<PropertyDef, "key">>,
  ) => void;
}

export const useGraphStore = create<GraphState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      graph: null,
      filename: null,
      isDirty: false,

      modify: (fn) => {
        const prev = get().graph;
        if (!prev) return;
        set({ graph: fn(prev), isDirty: true }, undefined, "graph/modify");
      },

      load: async (file) => {
        const res = await fetch(`/api/graphs/${file}`);
        if (!res.ok) throw new Error("Failed to load graph");
        const data: KnowledgeGraph = await res.json();
        set(
          { graph: data, filename: file, isDirty: false },
          undefined,
          "graph/load",
        );
      },

      save: async () => {
        const { graph, filename } = get();
        if (!graph || !filename) return;
        const res = await fetch(`/api/graphs/${filename}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(graph),
        });
        if (!res.ok) throw new Error("Failed to save graph");
        set({ isDirty: false }, undefined, "graph/save");
      },

      addNode: (node) =>
        get().modify((g) => kgAddNode(g, { ...node, id: generateId() })),
      removeNode: (id) => get().modify((g) => kgRemoveNode(g, id)),
      updateNode: (id, updates) =>
        get().modify((g) => kgUpdateNode(g, id, updates)),

      addTriple: (triple) =>
        get().modify((g) => kgAddTriple(g, { ...triple, id: generateId() })),
      removeTriple: (id) => get().modify((g) => kgRemoveTriple(g, id)),
      updateTriple: (id, updates) =>
        get().modify((g) => kgUpdateTriple(g, id, updates)),

      addRule: (rule) =>
        get().modify((g) => kgAddRule(g, { ...rule, id: generateId() })),
      updateRule: (id, updates) =>
        get().modify((g) => kgUpdateRule(g, id, updates)),
      removeRule: (id) => get().modify((g) => kgRemoveRule(g, id)),

      updateSystemPrompt: (prompt) =>
        get().modify((g) => ({
          ...g,
          metadata: {
            ...g.metadata,
            updated: new Date().toISOString().split("T")[0],
            systemPrompt: prompt || undefined,
          },
        })),

      addPropertyDef: (nodeType, prop) =>
        get().modify((g) => kgAddPropertyDef(g, nodeType, prop)),
      removePropertyDef: (nodeType, propertyKey) =>
        get().modify((g) => kgRemovePropertyDef(g, nodeType, propertyKey)),
      updatePropertyDef: (nodeType, propertyKey, updates) =>
        get().modify((g) =>
          kgUpdatePropertyDef(g, nodeType, propertyKey, updates),
        ),
    })),
    { name: "graph-store" },
  ),
);
