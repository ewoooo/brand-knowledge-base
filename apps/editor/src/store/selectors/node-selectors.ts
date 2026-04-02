import type { GraphState } from "../graph-store";
import { getNodeTypeDisplayName } from "@/lib/resolve-schema-display";

export interface NodeTypeInfo {
  type: string;
  displayName: string;
  count: number;
}

export const selectNodes = (state: GraphState) => state.graph?.nodes ?? [];

export const selectSchema = (state: GraphState) => state.graph?.schema;

export const selectGetNode = (state: GraphState) => (id: string | null) =>
  id ? (state.graph?.nodes.find((n) => n.id === id) ?? null) : null;

export const selectGetNodeLabel = (state: GraphState) => (id: string) =>
  state.graph?.nodes.find((n) => n.id === id)?.label ?? id;

export const selectNodeTypes = (state: GraphState): NodeTypeInfo[] => {
  const nodes = state.graph?.nodes ?? [];
  const schema = state.graph?.schema;
  const typeSet = new Set(nodes.map((n) => n.type).filter(Boolean));
  return Array.from(typeSet).map((type) => ({
    type,
    displayName: getNodeTypeDisplayName(schema, type),
    count: nodes.filter((n) => n.type === type).length,
  }));
};

export const selectExistingTypes = (state: GraphState): string[] => [
  ...new Set((state.graph?.nodes ?? []).map((n) => n.type)),
];

export const selectGetRelations = (state: GraphState) => (nodeId: string) => {
  const triples = state.graph?.triples ?? [];
  return {
    outgoing: triples.filter((t) => t.subject === nodeId),
    incoming: triples.filter((t) => t.object === nodeId),
  };
};
