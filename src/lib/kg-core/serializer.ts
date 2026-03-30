import type { KnowledgeGraph } from "./types";

export function toJSON(graph: KnowledgeGraph): string {
  return JSON.stringify(graph, null, 2);
}

export function fromJSON(json: string): KnowledgeGraph {
  const parsed = JSON.parse(json);

  if (!parsed.metadata || !parsed.nodes || !parsed.triples) {
    throw new Error("Invalid KnowledgeGraph format");
  }

  return {
    metadata: parsed.metadata,
    nodes: parsed.nodes,
    triples: parsed.triples,
    rules: parsed.rules ?? [],
  };
}

export function generateId(): string {
  return crypto.randomUUID();
}
