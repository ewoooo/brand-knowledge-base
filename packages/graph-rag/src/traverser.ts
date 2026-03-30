import type { KnowledgeGraph, Triple } from "@knowledgeview/kg-core";
import type { SubGraph } from "./types";

interface TraverseOptions {
  depth?: number;
  maxNodes?: number;
  predicateHints?: string[];
}

export function traverse(
  graph: KnowledgeGraph,
  startNodeIds: string[],
  options: TraverseOptions = {}
): SubGraph {
  const { depth = 2, maxNodes = 50, predicateHints = [] } = options;

  const visitedNodeIds = new Set<string>();
  const collectedTripleIds = new Set<string>();
  const queue: { nodeId: string; currentDepth: number }[] = [];

  for (const nodeId of startNodeIds) {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (node) {
      visitedNodeIds.add(nodeId);
      queue.push({ nodeId, currentDepth: 0 });
    }
  }

  let maxHop = 0;

  while (queue.length > 0) {
    const { nodeId, currentDepth } = queue.shift()!;

    if (currentDepth >= depth) continue;
    if (visitedNodeIds.size >= maxNodes) break;

    const connectedTriples = graph.triples.filter(
      (t) => t.subject === nodeId || t.object === nodeId
    );

    const sorted = sortByPredicateHints(connectedTriples, predicateHints);

    for (const triple of sorted) {
      collectedTripleIds.add(triple.id);

      const neighborId =
        triple.subject === nodeId ? triple.object : triple.subject;

      if (!visitedNodeIds.has(neighborId) && visitedNodeIds.size < maxNodes) {
        visitedNodeIds.add(neighborId);
        const nextDepth = currentDepth + 1;
        if (nextDepth > maxHop) maxHop = nextDepth;
        queue.push({ nodeId: neighborId, currentDepth: nextDepth });
      }
    }
  }

  const nodes = graph.nodes.filter((n) => visitedNodeIds.has(n.id));
  const triples = graph.triples.filter((t) => collectedTripleIds.has(t.id));

  return {
    nodes,
    triples,
    metadata: {
      startNodes: startNodeIds.filter((id) => visitedNodeIds.has(id)),
      depth,
      totalHops: maxHop,
    },
  };
}

function sortByPredicateHints(triples: Triple[], hints: string[]): Triple[] {
  if (hints.length === 0) return triples;
  const hintSet = new Set(hints);
  return [...triples].sort((a, b) => {
    const aHint = hintSet.has(a.predicate) ? 0 : 1;
    const bHint = hintSet.has(b.predicate) ? 0 : 1;
    return aHint - bHint;
  });
}
