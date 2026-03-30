import type { KnowledgeGraph } from "@knowledgeview/kg-core";
import { extractEntities } from "./extractor";
import { traverse } from "./traverser";
import { buildContext } from "./context-builder";
import type { PipelineOptions, PipelineResult } from "./types";

export function runPipeline(
  graph: KnowledgeGraph,
  question: string,
  options: PipelineOptions = {}
): PipelineResult {
  const { depth = 2, maxNodes = 50 } = options;

  const extraction = extractEntities(graph, question);

  const startNodeIds = extraction.entities.map((e) => e.nodeId);
  const subgraph = traverse(graph, startNodeIds, {
    depth,
    maxNodes,
    predicateHints: extraction.predicateHints,
  });

  const context = buildContext(subgraph, { rules: graph.rules });

  return { context, subgraph, extraction };
}

export { extractEntities } from "./extractor";
export { traverse } from "./traverser";
export { buildContext } from "./context-builder";
export type {
  ExtractionResult,
  SubGraph,
  PipelineOptions,
  PipelineResult,
} from "./types";
