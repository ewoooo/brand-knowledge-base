import type { GraphState } from "../graph-store";

export const selectTriples = (state: GraphState) =>
  state.graph?.triples ?? [];

export const selectGetTriple = (state: GraphState) => (id: string | null) =>
  id ? (state.graph?.triples.find((t) => t.id === id) ?? null) : null;

export const selectPredicates = (state: GraphState): string[] =>
  Array.from(
    new Set(
      (state.graph?.triples ?? []).map((t) => t.predicate).filter(Boolean),
    ),
  );
